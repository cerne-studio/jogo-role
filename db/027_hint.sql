-- HINT (jogo de equipes com roda de cartas, 4 modalidades e quadro de desenho em tempo real). Rode depois de
-- db/026_respostas_18mais.sql e depois db/028_seed_hint.sql.
--
-- Segredos (a carta completa do responsável, o baralho e a fila) ficam em tabelas SEM leitura pelo cliente ou com
-- RLS "só o dono". salas.estado (público, vai por realtime pra todo mundo) só guarda o que todo mundo pode ver:
-- placar, roda (tema + modalidade de cada carta), de quem é a vez, prazos e a contagem de acertos. A lista de
-- respostas só vai pro celular do responsável (tabela hint_privado) e só vira pública no resultado do turno.
-- Todo o placar é calculado aqui; o cliente nunca manda pontos.
--
-- Fases: selecao -> revelacao -> jogando -> palpite -> resultado -> rotacao -> (selecao | fim)
--   selecao   : escolhe uma das 3 cartas da roda (60 s; sem escolha, o servidor escolhe)
--   revelacao : só o responsável vê a carta; ele aperta COMEÇAR (45 s; senão começa sozinho)
--   jogando   : cronômetro do servidor; responsável marca acertos / proibida; quadro de desenho
--   palpite   : equipe adversária tem UMA tentativa (15 s)
--   resultado : mostra a carta inteira e o saldo do turno (10 s); confere vitória
--   rotacao   : a roda avança uma posição e entra carta nova
-- Qualquer celular chama hint_avancar() quando o prazo vence (idempotente, trava a sala).

alter table salas drop constraint if exists salas_jogo_check;
alter table salas add constraint salas_jogo_check check (jogo in ('manada', 'themind', 'pdf', 'draft', 'respostas', 'hint'));

-- ---------------------------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------------------------

create table if not exists hint_cartas (
  id text primary key,
  tema text not null,
  modalidade text not null check (modalidade in ('falar', 'desenhar', 'mimica', 'cantarolar')),
  respostas jsonb not null,   -- [{"t": "Elefante", "a": ["Elefante africano"]}, ... x5]
  proibida jsonb not null,    -- {"t": "Girafa", "a": []}
  dificuldade text not null default 'media' check (dificuldade in ('facil', 'media', 'dificil')),
  ativo boolean not null default true,
  check (jsonb_typeof(respostas) = 'array' and jsonb_array_length(respostas) = 5)
);

-- Estado interno da partida (nenhuma policy: só as funções security definer leem).
create table if not exists hint_sala (
  sala_id uuid primary key references salas(id) on delete cascade,
  fila text[] not null default '{}',
  ptr int not null default 0,
  atual text
);

-- A carta do turno, só pro responsável (policy de leitura = dono). Acertos e "proibida dita" ficam aqui.
create table if not exists hint_privado (
  sala_id uuid primary key references salas(id) on delete cascade,
  user_id uuid not null,
  turno int not null,
  carta jsonb not null,
  acertos int[] not null default '{}',
  proibida_dita boolean not null default false
);

-- Quadro de desenho: cada linha é um lote de operações do desenhista, na ordem do id.
create table if not exists hint_tracos (
  id bigserial primary key,
  sala_id uuid not null references salas(id) on delete cascade,
  turno int not null,
  ops jsonb not null,
  criado_em timestamptz not null default now()
);
create index if not exists hint_tracos_sala_idx on hint_tracos (sala_id, id);

-- Presença (batimento a cada ~15 s): usada pra saber se o host sumiu e alguém pode assumir.
create table if not exists hint_presenca (
  sala_id uuid not null references salas(id) on delete cascade,
  user_id uuid not null,
  visto timestamptz not null default now(),
  primary key (sala_id, user_id)
);

alter table hint_cartas enable row level security;
alter table hint_sala enable row level security;
alter table hint_privado enable row level security;
alter table hint_tracos enable row level security;
alter table hint_presenca enable row level security;

drop policy if exists "so o responsavel ve a carta" on hint_privado;
create policy "so o responsavel ve a carta" on hint_privado for select using (user_id = auth.uid());

drop policy if exists "jogadores da sala veem o quadro" on hint_tracos;
create policy "jogadores da sala veem o quadro" on hint_tracos for select
  using (exists (select 1 from sala_jogadores sj where sj.sala_id = hint_tracos.sala_id and sj.user_id = auth.uid()));

drop policy if exists "jogadores da sala veem a presenca" on hint_presenca;
create policy "jogadores da sala veem a presenca" on hint_presenca for select
  using (exists (select 1 from sala_jogadores sj where sj.sala_id = hint_presenca.sala_id and sj.user_id = auth.uid()));

do $$
begin
  alter publication supabase_realtime add table hint_tracos;
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------------------------
-- criar_sala (acrescenta 'hint' e a configuração padrão)
-- ---------------------------------------------------------------------------------------------

create or replace function hint_config_padrao()
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'tempo', 90,
    'meta', 20,
    'modalidades', jsonb_build_array('falar', 'desenhar', 'mimica', 'cantarolar'),
    'equipes_modo', 'sorteio',
    'personalizado', false,
    'reta_pct', 25,
    'regras', jsonb_build_object('bonus', true, 'obrigatoria', true, 'reta_final', true, 'proibida', true, 'adversario', true)
  )
$$;

create or replace function criar_sala(p_jogo text, p_nome text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala_id uuid;
  v_codigo text;
begin
  if v_uid is null then
    raise exception 'sessao anonima ausente';
  end if;
  if p_jogo not in ('manada', 'themind', 'pdf', 'draft', 'respostas', 'hint') then
    raise exception 'jogo invalido: %', p_jogo;
  end if;
  if coalesce(trim(p_nome), '') = '' then
    raise exception 'nome obrigatorio';
  end if;

  v_codigo := gerar_codigo_sala();

  insert into salas (codigo, jogo, status, host_id, estado)
  values (v_codigo, p_jogo, 'lobby', v_uid,
    case p_jogo
      when 'draft' then jsonb_build_object('config', jsonb_build_object('modo', 'historico', 'torneio', 8))
      when 'hint' then jsonb_build_object('config', hint_config_padrao(), 'equipes_manual', '{}'::jsonb)
      else '{}'::jsonb end)
  returning id into v_sala_id;

  insert into sala_jogadores (sala_id, user_id, nome)
  values (v_sala_id, v_uid, trim(p_nome));

  return jsonb_build_object('sala_id', v_sala_id, 'codigo', v_codigo, 'jogo', p_jogo);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Ajudantes internos (fechados pro cliente)
-- ---------------------------------------------------------------------------------------------

create or replace function hint_outra(p_eq text)
returns text
language sql
immutable
as $$ select case when p_eq = 'azul' then 'vermelha' else 'azul' end $$;

create or replace function hint_equipe_de(p_e jsonb, p_uid uuid)
returns text
language sql
immutable
as $$
  select case
    when p_e->'equipes'->'azul' ? p_uid::text then 'azul'
    when p_e->'equipes'->'vermelha' ? p_uid::text then 'vermelha'
    else null end
$$;

-- Soma pontos (e a estatística do turno) pra uma equipe.
create or replace function hint_somar(p_e jsonb, p_eq text, p_delta int, p_stat text default null, p_sd int default 0)
returns jsonb
language plpgsql
immutable
as $$
declare
  v jsonb := p_e;
begin
  v := jsonb_set(v, array['placar', p_eq], to_jsonb(coalesce((v->'placar'->>p_eq)::int, 0) + p_delta));
  if p_stat is not null then
    v := jsonb_set(v, array['stats', p_eq, p_stat], to_jsonb(coalesce((v->'stats'->p_eq->>p_stat)::int, 0) + p_sd));
  end if;
  return v;
end;
$$;

-- Próxima carta do baralho da partida (sem repetir). Se acabar, reembaralha tirando as que estão na roda.
create or replace function hint_sacar(p_sala_id uuid, p_excluir text[])
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_h hint_sala%rowtype;
  v_mods text[];
  v_id text;
begin
  select * into v_h from hint_sala where sala_id = p_sala_id for update;
  if v_h.ptr >= cardinality(v_h.fila) then
    select array(select jsonb_array_elements_text(estado->'config'->'modalidades')) into v_mods from salas where id = p_sala_id;
    v_h.fila := array(
      select id from hint_cartas
      where ativo and modalidade = any(v_mods) and id <> all(coalesce(p_excluir, '{}'))
      order by random());
    v_h.ptr := 0;
  end if;
  if cardinality(v_h.fila) = 0 then
    raise exception 'o baralho nao tem cartas nas modalidades escolhidas';
  end if;
  v_id := v_h.fila[v_h.ptr + 1];
  update hint_sala set fila = v_h.fila, ptr = v_h.ptr + 1 where sala_id = p_sala_id;
  return v_id;
end;
$$;

-- Vitória: confere o placar depois do turno completo (palpite incluído). Empate com as duas na chegada
-- abre turnos extras: só decide depois de um ciclo inteiro (as duas equipes jogando) com um lado na frente.
create or replace function hint_vitoria(p_e jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  a int := coalesce((p_e->'placar'->>'azul')::int, 0);
  b int := coalesce((p_e->'placar'->>'vermelha')::int, 0);
  m int := (p_e->>'meta')::int;
  v_vez text := p_e->>'vez';
  v_jogou text[];
begin
  if jsonb_typeof(p_e->'desempate') = 'object' then
    v_jogou := array(select jsonb_array_elements_text(p_e->'desempate'->'jogou'));
    if not (v_vez = any(v_jogou)) then
      v_jogou := v_jogou || v_vez;
    end if;
    if cardinality(v_jogou) < 2 then
      return jsonb_build_object('vencedor', null, 'desempate', jsonb_build_object('jogou', to_jsonb(v_jogou)));
    end if;
    if greatest(a, b) < m then
      return jsonb_build_object('vencedor', null, 'desempate', null);
    end if;
    if a <> b then
      return jsonb_build_object('vencedor', case when a > b then 'azul' else 'vermelha' end, 'desempate', null);
    end if;
    return jsonb_build_object('vencedor', null, 'desempate', jsonb_build_object('jogou', '[]'::jsonb));
  end if;

  if a >= m and b >= m then
    if a <> b then
      return jsonb_build_object('vencedor', case when a > b then 'azul' else 'vermelha' end, 'desempate', null);
    end if;
    return jsonb_build_object('vencedor', null, 'desempate', jsonb_build_object('jogou', '[]'::jsonb));
  end if;
  if a >= m then
    return jsonb_build_object('vencedor', 'azul', 'desempate', null);
  end if;
  if b >= m then
    return jsonb_build_object('vencedor', 'vermelha', 'desempate', null);
  end if;
  return jsonb_build_object('vencedor', null, 'desempate', null);
end;
$$;

-- Abre um turno: define de quem é a vez e quem é o responsável (rodízio dentro da equipe), vê se a roda tem
-- carta obrigatória e se a equipe está na reta final (aí a adversária escolhe a carta).
create or replace function hint_abrir_turno(p_sala_id uuid, p_primeiro boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_e jsonb;
  v_vez text;
  v_n int;
  v_idx int;
  v_resp uuid;
  v_obr text;
  v_reta boolean := false;
  v_escolhe text;
begin
  select estado into v_e from salas where id = p_sala_id;
  v_vez := case when p_primeiro then v_e->>'vez_inicial' else hint_outra(v_e->>'vez') end;
  v_n := coalesce((v_e->>'turno')::int, 0) + 1;
  v_idx := (v_e->'idx'->>v_vez)::int;
  v_resp := (v_e->'equipes'->v_vez->>(v_idx % jsonb_array_length(v_e->'equipes'->v_vez)))::uuid;
  v_e := jsonb_set(v_e, array['idx', v_vez], to_jsonb(v_idx + 1));

  if (v_e->'regras'->>'obrigatoria')::boolean then
    select c->>'id' into v_obr
    from jsonb_array_elements(v_e->'roda') c
    where (c->>'pos')::int = (v_e->'zonas'->>'obrigatoria')::int;
  end if;

  v_reta := (v_e->'regras'->>'reta_final')::boolean
            and coalesce((v_e->'placar'->>v_vez)::int, 0) >= (v_e->>'meta')::int - (v_e->>'reta')::int;
  v_escolhe := case when v_reta and v_obr is null then hint_outra(v_vez) else v_vez end;

  delete from hint_tracos where sala_id = p_sala_id;

  update salas
    set estado = v_e || jsonb_build_object(
          'fase', 'selecao',
          'fim', to_jsonb(now() + interval '60 seconds'),
          'turno', v_n,
          'vez', v_vez,
          'responsavel', v_resp,
          'escolhe', v_escolhe,
          'reta_ativa', v_reta,
          'obrigatoria_id', v_obr,
          'placar_turno', v_e->'placar',
          'carta', null,
          'acertos', 0,
          'proibida_dita', false,
          'palpite', null,
          'resultado', null
        ),
        atualizada_em = now()
    where id = p_sala_id;
end;
$$;

-- Aplica a escolha de uma carta da roda (chamada com a sala já travada).
create or replace function hint_aplicar_escolha(p_sala_id uuid, p_carta text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_e jsonb;
  v_c jsonb;
  v_pos int;
  v_forcada boolean;
  v_bonus int := 0;
  v_card hint_cartas%rowtype;
begin
  select estado into v_e from salas where id = p_sala_id;
  select c into v_c from jsonb_array_elements(v_e->'roda') c where c->>'id' = p_carta;
  if v_c is null then
    raise exception 'essa carta nao esta na roda';
  end if;
  v_pos := (v_c->>'pos')::int;
  v_forcada := (v_e->>'obrigatoria_id') is not null and (v_e->>'obrigatoria_id') = p_carta;
  if v_forcada then
    v_bonus := 1;
  elsif (v_e->'regras'->>'bonus')::boolean and (v_e->'zonas'->'bonus') @> to_jsonb(v_pos) then
    v_bonus := 1;
  end if;

  select * into v_card from hint_cartas where id = p_carta;

  insert into hint_privado (sala_id, user_id, turno, carta, acertos, proibida_dita)
  values (
    p_sala_id, (v_e->>'responsavel')::uuid, (v_e->>'turno')::int,
    jsonb_build_object(
      'id', v_card.id, 'tema', v_card.tema, 'modalidade', v_card.modalidade,
      'respostas', (select jsonb_agg(r->>'t') from jsonb_array_elements(v_card.respostas) r),
      'proibida', v_card.proibida->>'t'),
    '{}', false)
  on conflict (sala_id) do update
    set user_id = excluded.user_id, turno = excluded.turno, carta = excluded.carta,
        acertos = '{}', proibida_dita = false;
  update hint_sala set atual = p_carta where sala_id = p_sala_id;

  if v_bonus > 0 then
    v_e := hint_somar(v_e, v_e->>'vez', v_bonus, 'bonus', v_bonus);
  end if;

  update salas
    set estado = v_e || jsonb_build_object(
          'fase', 'revelacao',
          'fim', to_jsonb(now() + interval '45 seconds'),
          'carta', jsonb_build_object(
            'id', v_card.id, 'tema', v_card.tema, 'modalidade', v_card.modalidade,
            'pos', v_pos, 'bonus', v_bonus, 'forcada', v_forcada)
        ),
        atualizada_em = now()
    where id = p_sala_id;
end;
$$;

create or replace function hint_aplicar_comecar(p_sala_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_e jsonb;
begin
  select estado into v_e from salas where id = p_sala_id;
  update salas
    set estado = v_e || jsonb_build_object(
          'fase', 'jogando',
          'inicio', to_jsonb(now()),
          'fim', to_jsonb(now() + make_interval(secs => (v_e->>'tempo')::int))
        ),
        atualizada_em = now()
    where id = p_sala_id;
end;
$$;

-- Resultado do turno: revela a carta inteira, calcula o saldo e confere a vitória.
create or replace function hint_fase_resultado(p_sala_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_e jsonb;
  v_p hint_privado%rowtype;
  v_v jsonb;
  v_ini jsonb;
begin
  select estado into v_e from salas where id = p_sala_id;
  select * into v_p from hint_privado where sala_id = p_sala_id;
  v_ini := v_e->'placar_turno';

  v_e := v_e || jsonb_build_object(
    'resultado', jsonb_build_object(
      'equipe', v_e->>'vez',
      'acertos', cardinality(v_p.acertos),
      'bonus', coalesce((v_e->'carta'->>'bonus')::int, 0),
      'proibida_dita', v_p.proibida_dita,
      'palpite', v_e->'palpite',
      'delta', jsonb_build_object(
        'azul', (v_e->'placar'->>'azul')::int - (v_ini->>'azul')::int,
        'vermelha', (v_e->'placar'->>'vermelha')::int - (v_ini->>'vermelha')::int),
      'carta', jsonb_build_object(
        'tema', v_p.carta->>'tema', 'modalidade', v_p.carta->>'modalidade',
        'respostas', v_p.carta->'respostas', 'proibida', v_p.carta->>'proibida',
        'acertadas', to_jsonb(v_p.acertos))));

  v_v := hint_vitoria(v_e);

  update salas
    set estado = v_e || jsonb_build_object(
          'fase', 'resultado',
          'fim', to_jsonb(now() + interval '10 seconds'),
          'vencedor_pendente', v_v->'vencedor',
          'desempate', v_v->'desempate'
        ),
        atualizada_em = now()
    where id = p_sala_id;
end;
$$;

-- Fim da fase de dicas: a adversária ganha a tentativa (se a regra estiver ligada).
create or replace function hint_fase_palpite(p_sala_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_e jsonb;
begin
  select estado into v_e from salas where id = p_sala_id;
  if not (v_e->'regras'->>'adversario')::boolean then
    perform hint_fase_resultado(p_sala_id);
    return;
  end if;
  update salas
    set estado = v_e || jsonb_build_object(
          'fase', 'palpite',
          'fim', to_jsonb(now() + interval '15 seconds'),
          'palpite', jsonb_build_object('feito', false)
        ),
        atualizada_em = now()
    where id = p_sala_id;
end;
$$;

-- Avança a roda uma posição: a carta usada sai, as outras andam pra frente, entra carta nova.
create or replace function hint_rodar(p_sala_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_e jsonb;
  v_usada text;
  v_nova jsonb := '[]'::jsonb;
  c jsonb;
  v_pos int;
  v_id text;
  v_card hint_cartas%rowtype;
  v_ids text[];
begin
  select estado into v_e from salas where id = p_sala_id;
  v_usada := v_e->'carta'->>'id';
  v_ids := array[v_usada];

  for c in select x from jsonb_array_elements(v_e->'roda') x order by (x->>'pos')::int loop
    if c->>'id' = v_usada then
      continue;
    end if;
    v_ids := v_ids || (c->>'id');
    if (c->>'pos')::int + 1 <= 4 then
      v_nova := v_nova || jsonb_set(c, '{pos}', to_jsonb((c->>'pos')::int + 1));
    end if;
    -- (sem a regra obrigatória, uma carta que passa do último setor sai da roda sem ser usada)
  end loop;

  while jsonb_array_length(v_nova) < 3 loop
    select min(p) into v_pos from generate_series(0, 4) p
      where p not in (select (x->>'pos')::int from jsonb_array_elements(v_nova) x);
    v_id := hint_sacar(p_sala_id, v_ids);
    v_ids := v_ids || v_id;
    select * into v_card from hint_cartas where id = v_id;
    v_nova := v_nova || jsonb_build_object('pos', v_pos, 'id', v_card.id, 'tema', v_card.tema, 'modalidade', v_card.modalidade);
  end loop;

  select jsonb_agg(x order by (x->>'pos')::int) into v_nova from jsonb_array_elements(v_nova) x;

  update salas set estado = v_e || jsonb_build_object('roda', v_nova), atualizada_em = now() where id = p_sala_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Lobby: configuração, equipes, início
-- ---------------------------------------------------------------------------------------------

create or replace function hint_config(p_sala_id uuid, p_config jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s salas%rowtype;
  v_c jsonb;
  v_tempo int;
  v_meta int;
  v_pct int;
  v_mods jsonb;
begin
  select * into v_s from salas where id = p_sala_id for update;
  if not found or v_s.jogo <> 'hint' then
    raise exception 'sala nao encontrada';
  end if;
  if v_s.host_id <> v_uid then
    raise exception 'so o host muda a configuracao';
  end if;
  if v_s.status <> 'lobby' then
    raise exception 'a partida ja comecou';
  end if;

  v_c := coalesce(v_s.estado->'config', hint_config_padrao()) || coalesce(p_config, '{}'::jsonb);

  v_tempo := (v_c->>'tempo')::int;
  if v_tempo not in (60, 90, 120) then
    raise exception 'a rodada pode ter 60, 90 ou 120 segundos';
  end if;
  v_meta := (v_c->>'meta')::int;
  if v_meta < 5 or v_meta > 60 then
    raise exception 'a pontuacao-alvo vai de 5 a 60';
  end if;
  v_pct := (v_c->>'reta_pct')::int;
  if v_pct < 10 or v_pct > 50 then
    raise exception 'a reta final vai de 10 a 50 por cento da meta';
  end if;
  if (v_c->>'equipes_modo') not in ('sorteio', 'manual') then
    raise exception 'modo de equipes invalido';
  end if;
  v_mods := v_c->'modalidades';
  if jsonb_typeof(v_mods) <> 'array' or jsonb_array_length(v_mods) = 0
     or exists (select 1 from jsonb_array_elements_text(v_mods) m where m not in ('falar', 'desenhar', 'mimica', 'cantarolar')) then
    raise exception 'escolha pelo menos uma modalidade valida';
  end if;
  if not (v_c->>'personalizado')::boolean then
    v_c := jsonb_set(v_c, '{regras}', hint_config_padrao()->'regras');
  end if;

  update salas set estado = estado || jsonb_build_object('config', v_c), atualizada_em = now() where id = p_sala_id;
  return (select estado from salas where id = p_sala_id);
end;
$$;

-- Host define (ou muda) a equipe de cada jogador. p_mapa = {"<user_id>": "azul" | "vermelha"}
create or replace function hint_equipes(p_sala_id uuid, p_mapa jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s salas%rowtype;
  v_limpo jsonb := '{}'::jsonb;
  k text;
  v text;
begin
  select * into v_s from salas where id = p_sala_id for update;
  if not found or v_s.jogo <> 'hint' then
    raise exception 'sala nao encontrada';
  end if;
  if v_s.host_id <> v_uid then
    raise exception 'so o host monta as equipes';
  end if;
  if v_s.status <> 'lobby' then
    raise exception 'a partida ja comecou';
  end if;
  if jsonb_typeof(p_mapa) <> 'object' then
    raise exception 'mapa de equipes invalido';
  end if;

  for k, v in select key, value #>> '{}' from jsonb_each(p_mapa) loop
    if v in ('azul', 'vermelha')
       and exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id::text = k) then
      v_limpo := v_limpo || jsonb_build_object(k, v);
    end if;
  end loop;

  update salas set estado = estado || jsonb_build_object('equipes_manual', v_limpo), atualizada_em = now() where id = p_sala_id;
  return (select estado from salas where id = p_sala_id);
end;
$$;

-- Sorteia equipes equilibradas e grava no mapa (o host ainda pode ajustar).
create or replace function hint_sortear(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s salas%rowtype;
  v_ids uuid[];
  v_map jsonb := '{}'::jsonb;
  i int;
begin
  select * into v_s from salas where id = p_sala_id for update;
  if not found or v_s.jogo <> 'hint' then
    raise exception 'sala nao encontrada';
  end if;
  if v_s.host_id <> v_uid then
    raise exception 'so o host sorteia as equipes';
  end if;
  if v_s.status <> 'lobby' then
    raise exception 'a partida ja comecou';
  end if;

  select array_agg(user_id order by random()) into v_ids from sala_jogadores where sala_id = p_sala_id;
  for i in 1..cardinality(v_ids) loop
    v_map := v_map || jsonb_build_object(v_ids[i]::text, case when i % 2 = 1 then 'azul' else 'vermelha' end);
  end loop;

  update salas set estado = estado || jsonb_build_object('equipes_manual', v_map), atualizada_em = now() where id = p_sala_id;
  return (select estado from salas where id = p_sala_id);
end;
$$;

create or replace function hint_iniciar(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s salas%rowtype;
  v_cfg jsonb;
  v_ids uuid[];
  v_az uuid[] := '{}';
  v_ve uuid[] := '{}';
  v_map jsonb;
  v_mods text[];
  v_fila text[];
  v_regras jsonb;
  v_meta int;
  v_reta int;
  u uuid;
  i int;
  v_roda jsonb := '[]'::jsonb;
  v_id text;
  v_card hint_cartas%rowtype;
  v_n int;
begin
  select * into v_s from salas where id = p_sala_id for update;
  if not found or v_s.jogo <> 'hint' then
    raise exception 'sala nao encontrada';
  end if;
  if v_s.host_id <> v_uid then
    raise exception 'so o host pode iniciar a partida';
  end if;
  if v_s.status <> 'lobby' then
    raise exception 'essa partida ja comecou';
  end if;

  select array_agg(user_id order by random()) into v_ids from sala_jogadores where sala_id = p_sala_id;
  v_n := coalesce(cardinality(v_ids), 0);
  if v_n < 4 then
    raise exception 'precisa de pelo menos 4 jogadores';
  end if;
  if v_n > 12 then
    raise exception 'o maximo e 12 jogadores';
  end if;

  v_cfg := coalesce(v_s.estado->'config', hint_config_padrao());
  v_map := case when v_cfg->>'equipes_modo' = 'sorteio' then '{}'::jsonb else coalesce(v_s.estado->'equipes_manual', '{}'::jsonb) end;

  foreach u in array v_ids loop
    if (v_map->>u::text) = 'azul' then
      v_az := v_az || u;
    elsif (v_map->>u::text) = 'vermelha' then
      v_ve := v_ve || u;
    end if;
  end loop;
  -- quem ficou sem equipe (ou todo mundo, no sorteio) entra na menor
  foreach u in array v_ids loop
    if not (u = any(v_az)) and not (u = any(v_ve)) then
      if cardinality(v_az) <= cardinality(v_ve) then
        v_az := v_az || u;
      else
        v_ve := v_ve || u;
      end if;
    end if;
  end loop;
  if cardinality(v_az) < 2 or cardinality(v_ve) < 2 then
    raise exception 'cada equipe precisa de pelo menos 2 jogadores';
  end if;

  v_mods := array(select jsonb_array_elements_text(v_cfg->'modalidades'));
  v_fila := array(select id from hint_cartas where ativo and modalidade = any(v_mods) order by random());
  if cardinality(v_fila) < 12 then
    raise exception 'o baralho tem poucas cartas nessas modalidades';
  end if;

  insert into hint_sala (sala_id, fila, ptr, atual) values (p_sala_id, v_fila, 0, null)
  on conflict (sala_id) do update set fila = excluded.fila, ptr = 0, atual = null;
  delete from hint_privado where sala_id = p_sala_id;
  delete from hint_tracos where sala_id = p_sala_id;

  v_regras := case when (v_cfg->>'personalizado')::boolean then v_cfg->'regras' else hint_config_padrao()->'regras' end;
  v_meta := (v_cfg->>'meta')::int;
  v_reta := ceil(v_meta * (v_cfg->>'reta_pct')::int / 100.0)::int;

  update salas
    set status = 'em_andamento',
        estado = jsonb_build_object(
          'config', v_cfg,
          'regras', v_regras,
          'meta', v_meta,
          'reta', v_reta,
          'tempo', (v_cfg->>'tempo')::int,
          'equipes', jsonb_build_object('azul', to_jsonb(v_az), 'vermelha', to_jsonb(v_ve)),
          'idx', jsonb_build_object('azul', 0, 'vermelha', 0),
          'placar', jsonb_build_object('azul', 0, 'vermelha', 0),
          'stats', jsonb_build_object(
            'azul', jsonb_build_object('acertos', 0, 'bonus', 0, 'penalidades', 0, 'palpites_certos', 0, 'palpites_erros', 0, 'pontos_palpite', 0),
            'vermelha', jsonb_build_object('acertos', 0, 'bonus', 0, 'penalidades', 0, 'palpites_certos', 0, 'palpites_erros', 0, 'pontos_palpite', 0)),
          'zonas', jsonb_build_object('entrada', 0, 'bonus', jsonb_build_array(1, 3), 'obrigatoria', 4),
          'turno', 0,
          'vez_inicial', case when random() < 0.5 then 'azul' else 'vermelha' end,
          'roda', '[]'::jsonb,
          'vencedor', null,
          'vencedor_pendente', null,
          'desempate', null
        ),
        atualizada_em = now()
    where id = p_sala_id;

  for i in 0..2 loop
    v_id := hint_sacar(p_sala_id, '{}');
    select * into v_card from hint_cartas where id = v_id;
    v_roda := v_roda || jsonb_build_object('pos', i, 'id', v_card.id, 'tema', v_card.tema, 'modalidade', v_card.modalidade);
  end loop;
  update salas set estado = estado || jsonb_build_object('roda', v_roda) where id = p_sala_id;

  perform hint_abrir_turno(p_sala_id, true);
  return (select estado from salas where id = p_sala_id);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Turno
-- ---------------------------------------------------------------------------------------------

-- Escolhe a carta. Turno normal: o responsável da equipe da vez. Reta final: qualquer um da equipe adversária.
-- Se há carta obrigatória na roda, só ela pode ser escolhida.
create or replace function hint_escolher(p_sala_id uuid, p_carta text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s salas%rowtype;
  v_e jsonb;
begin
  select * into v_s from salas where id = p_sala_id for update;
  if not found or v_s.jogo <> 'hint' then
    raise exception 'sala nao encontrada';
  end if;
  v_e := v_s.estado;
  if v_s.status <> 'em_andamento' or v_e->>'fase' <> 'selecao' then
    raise exception 'agora nao e hora de escolher carta';
  end if;
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = v_uid) then
    raise exception 'voce nao esta nessa sala';
  end if;
  if v_e->>'escolhe' = v_e->>'vez' then
    if (v_e->>'responsavel')::uuid <> v_uid then
      raise exception 'so o responsavel da equipe escolhe a carta';
    end if;
  elsif hint_equipe_de(v_e, v_uid) is distinct from (v_e->>'escolhe') then
    raise exception 'quem escolhe agora e a outra equipe';
  end if;
  if (v_e->>'obrigatoria_id') is not null and (v_e->>'obrigatoria_id') <> p_carta then
    raise exception 'a carta obrigatoria precisa ser jogada';
  end if;

  perform hint_aplicar_escolha(p_sala_id, p_carta);
  return (select estado from salas where id = p_sala_id);
end;
$$;

create or replace function hint_comecar(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s salas%rowtype;
begin
  select * into v_s from salas where id = p_sala_id for update;
  if not found or v_s.jogo <> 'hint' then
    raise exception 'sala nao encontrada';
  end if;
  if v_s.status <> 'em_andamento' or v_s.estado->>'fase' <> 'revelacao' then
    raise exception 'agora nao da pra comecar a rodada';
  end if;
  if (v_s.estado->>'responsavel')::uuid <> v_uid then
    raise exception 'so o responsavel comeca a rodada';
  end if;
  perform hint_aplicar_comecar(p_sala_id);
  return (select estado from salas where id = p_sala_id);
end;
$$;

-- Responsável marca (ou desfaz) um acerto. Vale +1 por resposta; só durante a rodada.
create or replace function hint_acertar(p_sala_id uuid, p_idx int, p_valor boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s salas%rowtype;
  v_e jsonb;
  v_p hint_privado%rowtype;
  v_novos int[];
begin
  select * into v_s from salas where id = p_sala_id for update;
  if not found or v_s.jogo <> 'hint' then
    raise exception 'sala nao encontrada';
  end if;
  v_e := v_s.estado;
  if v_s.status <> 'em_andamento' or v_e->>'fase' <> 'jogando' then
    raise exception 'a rodada nao esta ativa';
  end if;
  if (v_e->>'responsavel')::uuid <> v_uid then
    raise exception 'so o responsavel marca acertos';
  end if;
  if now() > (v_e->>'fim')::timestamptz + interval '2 seconds' then
    raise exception 'o tempo acabou';
  end if;
  if p_idx < 0 or p_idx > 4 then
    raise exception 'resposta invalida';
  end if;

  select * into v_p from hint_privado where sala_id = p_sala_id for update;
  if p_valor then
    if p_idx = any(v_p.acertos) then
      raise exception 'essa resposta ja foi marcada';
    end if;
    v_novos := v_p.acertos || p_idx;
    v_e := hint_somar(v_e, v_e->>'vez', 1, 'acertos', 1);
  else
    if not (p_idx = any(v_p.acertos)) then
      raise exception 'essa resposta nao esta marcada';
    end if;
    v_novos := array_remove(v_p.acertos, p_idx);
    v_e := hint_somar(v_e, v_e->>'vez', -1, 'acertos', -1);
  end if;

  update hint_privado set acertos = v_novos where sala_id = p_sala_id;
  update salas set estado = v_e || jsonb_build_object('acertos', cardinality(v_novos)), atualizada_em = now() where id = p_sala_id;
  return (select estado from salas where id = p_sala_id);
end;
$$;

-- Responsável registra que a equipe disse a resposta proibida: -2, no máximo uma vez por rodada.
create or replace function hint_proibida(p_sala_id uuid, p_valor boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s salas%rowtype;
  v_e jsonb;
  v_p hint_privado%rowtype;
begin
  select * into v_s from salas where id = p_sala_id for update;
  if not found or v_s.jogo <> 'hint' then
    raise exception 'sala nao encontrada';
  end if;
  v_e := v_s.estado;
  if v_s.status <> 'em_andamento' or v_e->>'fase' <> 'jogando' then
    raise exception 'a rodada nao esta ativa';
  end if;
  if (v_e->>'responsavel')::uuid <> v_uid then
    raise exception 'so o responsavel registra a proibida';
  end if;
  if not (v_e->'regras'->>'proibida')::boolean then
    raise exception 'a resposta proibida esta desligada nessa partida';
  end if;
  if now() > (v_e->>'fim')::timestamptz + interval '2 seconds' then
    raise exception 'o tempo acabou';
  end if;

  select * into v_p from hint_privado where sala_id = p_sala_id for update;
  if p_valor then
    if v_p.proibida_dita then
      raise exception 'a proibida ja foi registrada nessa rodada';
    end if;
    v_e := hint_somar(v_e, v_e->>'vez', -2, 'penalidades', 1);
  else
    if not v_p.proibida_dita then
      raise exception 'a proibida nao estava registrada';
    end if;
    v_e := hint_somar(v_e, v_e->>'vez', 2, 'penalidades', -1);
  end if;

  update hint_privado set proibida_dita = p_valor where sala_id = p_sala_id;
  update salas set estado = v_e || jsonb_build_object('proibida_dita', p_valor), atualizada_em = now() where id = p_sala_id;
  return (select estado from salas where id = p_sala_id);
end;
$$;

-- Responsável encerra a fase de dicas antes do tempo (ex.: acertou as cinco).
create or replace function hint_encerrar(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s salas%rowtype;
begin
  select * into v_s from salas where id = p_sala_id for update;
  if not found or v_s.jogo <> 'hint' then
    raise exception 'sala nao encontrada';
  end if;
  if v_s.status <> 'em_andamento' or v_s.estado->>'fase' <> 'jogando' then
    raise exception 'a rodada nao esta ativa';
  end if;
  if (v_s.estado->>'responsavel')::uuid <> v_uid then
    raise exception 'so o responsavel encerra a rodada';
  end if;
  perform hint_fase_palpite(p_sala_id);
  return (select estado from salas where id = p_sala_id);
end;
$$;

-- A equipe adversária tem UMA tentativa: acertar uma pendente (+1), acertar a proibida (+2) ou errar (-1).
create or replace function hint_palpite(p_sala_id uuid, p_texto text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s salas%rowtype;
  v_e jsonb;
  v_p hint_privado%rowtype;
  v_c hint_cartas%rowtype;
  v_txt text := left(trim(coalesce(p_texto, '')), 100);
  v_tipo text := 'errou';
  v_alvo text;
  v_pts int;
  v_eq text;
  i int;
begin
  select * into v_s from salas where id = p_sala_id for update;
  if not found or v_s.jogo <> 'hint' then
    raise exception 'sala nao encontrada';
  end if;
  v_e := v_s.estado;
  if v_s.status <> 'em_andamento' or v_e->>'fase' <> 'palpite' then
    raise exception 'agora nao e hora de palpitar';
  end if;
  v_eq := hint_outra(v_e->>'vez');
  if hint_equipe_de(v_e, v_uid) is distinct from v_eq then
    raise exception 'so a equipe adversaria palpita';
  end if;
  if (v_e->'palpite'->>'feito')::boolean then
    raise exception 'a tentativa ja foi usada';
  end if;
  if now() > (v_e->>'fim')::timestamptz + interval '2 seconds' then
    raise exception 'o tempo acabou';
  end if;
  if v_txt = '' then
    raise exception 'digite um palpite';
  end if;

  select * into v_p from hint_privado where sala_id = p_sala_id;
  select * into v_c from hint_cartas where id = v_p.carta->>'id';

  for i in 0..4 loop
    if not (i = any(v_p.acertos))
       and respostas_confere(v_txt, v_c.respostas->i->>'t', array(select jsonb_array_elements_text(v_c.respostas->i->'a'))) then
      v_tipo := 'certo';
      v_alvo := v_c.respostas->i->>'t';
      exit;
    end if;
  end loop;
  if v_tipo = 'errou' and (v_e->'regras'->>'proibida')::boolean
     and respostas_confere(v_txt, v_c.proibida->>'t', array(select jsonb_array_elements_text(v_c.proibida->'a'))) then
    v_tipo := 'proibida';
    v_alvo := v_c.proibida->>'t';
  end if;

  v_pts := case v_tipo when 'certo' then 1 when 'proibida' then 2 else -1 end;
  v_e := hint_somar(v_e, v_eq, v_pts, case v_tipo when 'errou' then 'palpites_erros' else 'palpites_certos' end, 1);
  if v_tipo <> 'errou' then
    v_e := hint_somar(v_e, v_eq, 0, 'pontos_palpite', v_pts);
  end if;

  update salas
    set estado = v_e || jsonb_build_object('palpite', jsonb_build_object(
          'feito', true, 'tipo', v_tipo, 'texto', v_txt, 'alvo', v_alvo, 'equipe', v_eq, 'pontos', v_pts)),
        atualizada_em = now()
    where id = p_sala_id;
  perform hint_fase_resultado(p_sala_id);
  return (select estado from salas where id = p_sala_id);
end;
$$;

-- Quadro de desenho: só o responsável, só na modalidade Desenhar e só com a rodada ativa.
-- ops = [{"t":"s","id":"..","c":0,"w":2,"e":false,"p":[[x,y],...]}, {"t":"u"}, {"t":"c"}] (coordenadas 0..1).
create or replace function hint_desenhar(p_sala_id uuid, p_ops jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s salas%rowtype;
  v_e jsonb;
  op jsonb;
  pt jsonb;
begin
  select * into v_s from salas where id = p_sala_id;
  if not found or v_s.jogo <> 'hint' then
    raise exception 'sala nao encontrada';
  end if;
  v_e := v_s.estado;
  if v_s.status <> 'em_andamento' or v_e->>'fase' <> 'jogando' then
    raise exception 'o quadro esta fechado';
  end if;
  if (v_e->>'responsavel')::uuid <> v_uid then
    raise exception 'so o responsavel desenha';
  end if;
  if v_e->'carta'->>'modalidade' <> 'desenhar' then
    raise exception 'essa carta nao e de desenhar';
  end if;
  if now() > (v_e->>'fim')::timestamptz + interval '2 seconds' then
    raise exception 'o tempo acabou';
  end if;
  if jsonb_typeof(p_ops) <> 'array' or jsonb_array_length(p_ops) < 1 or jsonb_array_length(p_ops) > 60 then
    raise exception 'lote de desenho invalido';
  end if;
  if (select count(*) from hint_tracos where sala_id = p_sala_id and turno = (v_e->>'turno')::int) > 4000 then
    raise exception 'o quadro encheu, limpe e continue';
  end if;

  for op in select x from jsonb_array_elements(p_ops) x loop
    if op->>'t' not in ('s', 'u', 'c') then
      raise exception 'operacao de desenho invalida';
    end if;
    if op->>'t' = 's' then
      if jsonb_typeof(op->'p') <> 'array' or jsonb_array_length(op->'p') > 150 then
        raise exception 'traco invalido';
      end if;
      for pt in select y from jsonb_array_elements(op->'p') y loop
        if jsonb_typeof(pt) <> 'array' or jsonb_array_length(pt) <> 2
           or (pt->>0)::numeric not between -0.05 and 1.05 or (pt->>1)::numeric not between -0.05 and 1.05 then
          raise exception 'ponto fora do quadro';
        end if;
      end loop;
    end if;
  end loop;

  insert into hint_tracos (sala_id, turno, ops) values (p_sala_id, (v_e->>'turno')::int, p_ops);
end;
$$;

-- Qualquer celular chama quando o prazo da fase vence. Idempotente: só age se o prazo realmente passou.
create or replace function hint_avancar(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s salas%rowtype;
  v_e jsonb;
  v_fase text;
  v_id text;
begin
  select * into v_s from salas where id = p_sala_id for update;
  if not found or v_s.jogo <> 'hint' then
    raise exception 'sala nao encontrada';
  end if;
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = v_uid) then
    raise exception 'voce nao esta nessa sala';
  end if;
  v_e := v_s.estado;
  if v_s.status <> 'em_andamento' or v_e->>'fim' is null or now() < (v_e->>'fim')::timestamptz then
    return v_e;
  end if;

  v_fase := v_e->>'fase';
  if v_fase = 'selecao' then
    v_id := v_e->>'obrigatoria_id';
    if v_id is null then
      select c->>'id' into v_id from jsonb_array_elements(v_e->'roda') c order by random() limit 1;
    end if;
    perform hint_aplicar_escolha(p_sala_id, v_id);
  elsif v_fase = 'revelacao' then
    perform hint_aplicar_comecar(p_sala_id);
  elsif v_fase = 'jogando' then
    perform hint_fase_palpite(p_sala_id);
  elsif v_fase = 'palpite' then
    perform hint_fase_resultado(p_sala_id);
  elsif v_fase = 'resultado' then
    if jsonb_typeof(v_e->'vencedor_pendente') = 'string' then
      update salas
        set status = 'finalizado',
            estado = v_e || jsonb_build_object('fase', 'fim', 'fim', null, 'vencedor', v_e->'vencedor_pendente'),
            atualizada_em = now()
        where id = p_sala_id;
    else
      perform hint_rodar(p_sala_id);
      update salas
        set estado = estado || jsonb_build_object('fase', 'rotacao', 'fim', to_jsonb(now() + interval '2500 milliseconds')),
            atualizada_em = now()
        where id = p_sala_id;
    end if;
  elsif v_fase = 'rotacao' then
    perform hint_abrir_turno(p_sala_id, false);
  end if;
  return (select estado from salas where id = p_sala_id);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Presença e host (o host não é ponto único de falha)
-- ---------------------------------------------------------------------------------------------

create or replace function hint_ping(p_sala_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = v_uid) then
    return;
  end if;
  insert into hint_presenca (sala_id, user_id, visto) values (p_sala_id, v_uid, now())
  on conflict (sala_id, user_id) do update set visto = now();
end;
$$;

create or replace function hint_host_ausente(p_sala_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select now() - p.visto > interval '45 seconds' from hint_presenca p join salas s on s.id = p.sala_id and s.host_id = p.user_id where p.sala_id = p_sala_id),
    -- sem batimento do host ainda: usa a última atividade da sala
    (select now() - s.atualizada_em > interval '45 seconds' from salas s where s.id = p_sala_id),
    false)
$$;

create or replace function hint_transferir_host(p_sala_id uuid, p_novo uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s salas%rowtype;
begin
  select * into v_s from salas where id = p_sala_id for update;
  if not found or v_s.jogo <> 'hint' then
    raise exception 'sala nao encontrada';
  end if;
  if v_s.host_id <> v_uid then
    raise exception 'so o host transfere o comando';
  end if;
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = p_novo) then
    raise exception 'esse jogador nao esta na sala';
  end if;
  update salas set host_id = p_novo, atualizada_em = now() where id = p_sala_id;
  return jsonb_build_object('host_id', p_novo);
end;
$$;

-- Se o host sumiu (sem batimento há 45 s), qualquer jogador da sala assume.
create or replace function hint_assumir_host(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s salas%rowtype;
begin
  select * into v_s from salas where id = p_sala_id for update;
  if not found or v_s.jogo <> 'hint' then
    raise exception 'sala nao encontrada';
  end if;
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = v_uid) then
    raise exception 'voce nao esta nessa sala';
  end if;
  if v_s.host_id = v_uid then
    return jsonb_build_object('host_id', v_uid);
  end if;
  if not hint_host_ausente(p_sala_id) then
    raise exception 'o host ainda esta na sala';
  end if;
  update salas set host_id = v_uid, atualizada_em = now() where id = p_sala_id;
  return jsonb_build_object('host_id', v_uid);
end;
$$;

-- Volta pro lobby com os mesmos jogadores, as mesmas equipes e a mesma configuração.
create or replace function hint_nova_partida(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s salas%rowtype;
  v_map jsonb := '{}'::jsonb;
  u text;
begin
  select * into v_s from salas where id = p_sala_id for update;
  if not found or v_s.jogo <> 'hint' then
    raise exception 'sala nao encontrada';
  end if;
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = v_uid) then
    raise exception 'voce nao esta nessa sala';
  end if;
  if v_s.status <> 'finalizado' then
    raise exception 'a partida ainda nao terminou';
  end if;
  if v_s.host_id <> v_uid then
    if not hint_host_ausente(p_sala_id) then
      raise exception 'so o host comeca uma nova partida';
    end if;
    update salas set host_id = v_uid where id = p_sala_id;
  end if;

  for u in select jsonb_array_elements_text(v_s.estado->'equipes'->'azul') loop
    v_map := v_map || jsonb_build_object(u, 'azul');
  end loop;
  for u in select jsonb_array_elements_text(v_s.estado->'equipes'->'vermelha') loop
    v_map := v_map || jsonb_build_object(u, 'vermelha');
  end loop;

  delete from hint_privado where sala_id = p_sala_id;
  delete from hint_tracos where sala_id = p_sala_id;
  delete from hint_sala where sala_id = p_sala_id;
  update salas
    set status = 'lobby',
        estado = jsonb_build_object('config', coalesce(v_s.estado->'config', hint_config_padrao()), 'equipes_manual', v_map),
        atualizada_em = now()
    where id = p_sala_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Permissões: o app só chama as funções "de jogo". Todo o resto fica fechado pro cliente.
-- ---------------------------------------------------------------------------------------------

revoke all on function hint_config_padrao() from public, anon, authenticated;
revoke all on function hint_outra(text) from public, anon, authenticated;
revoke all on function hint_equipe_de(jsonb, uuid) from public, anon, authenticated;
revoke all on function hint_somar(jsonb, text, int, text, int) from public, anon, authenticated;
revoke all on function hint_sacar(uuid, text[]) from public, anon, authenticated;
revoke all on function hint_vitoria(jsonb) from public, anon, authenticated;
revoke all on function hint_abrir_turno(uuid, boolean) from public, anon, authenticated;
revoke all on function hint_aplicar_escolha(uuid, text) from public, anon, authenticated;
revoke all on function hint_aplicar_comecar(uuid) from public, anon, authenticated;
revoke all on function hint_fase_resultado(uuid) from public, anon, authenticated;
revoke all on function hint_fase_palpite(uuid) from public, anon, authenticated;
revoke all on function hint_rodar(uuid) from public, anon, authenticated;
revoke all on function hint_host_ausente(uuid) from public, anon, authenticated;

revoke all on function hint_config(uuid, jsonb) from public, anon;
revoke all on function hint_equipes(uuid, jsonb) from public, anon;
revoke all on function hint_sortear(uuid) from public, anon;
revoke all on function hint_iniciar(uuid) from public, anon;
revoke all on function hint_escolher(uuid, text) from public, anon;
revoke all on function hint_comecar(uuid) from public, anon;
revoke all on function hint_acertar(uuid, int, boolean) from public, anon;
revoke all on function hint_proibida(uuid, boolean) from public, anon;
revoke all on function hint_encerrar(uuid) from public, anon;
revoke all on function hint_palpite(uuid, text) from public, anon;
revoke all on function hint_desenhar(uuid, jsonb) from public, anon;
revoke all on function hint_avancar(uuid) from public, anon;
revoke all on function hint_ping(uuid) from public, anon;
revoke all on function hint_transferir_host(uuid, uuid) from public, anon;
revoke all on function hint_assumir_host(uuid) from public, anon;
revoke all on function hint_nova_partida(uuid) from public, anon;

grant execute on function hint_config(uuid, jsonb) to authenticated;
grant execute on function hint_equipes(uuid, jsonb) to authenticated;
grant execute on function hint_sortear(uuid) to authenticated;
grant execute on function hint_iniciar(uuid) to authenticated;
grant execute on function hint_escolher(uuid, text) to authenticated;
grant execute on function hint_comecar(uuid) to authenticated;
grant execute on function hint_acertar(uuid, int, boolean) to authenticated;
grant execute on function hint_proibida(uuid, boolean) to authenticated;
grant execute on function hint_encerrar(uuid) to authenticated;
grant execute on function hint_palpite(uuid, text) to authenticated;
grant execute on function hint_desenhar(uuid, jsonb) to authenticated;
grant execute on function hint_avancar(uuid) to authenticated;
grant execute on function hint_ping(uuid) to authenticated;
grant execute on function hint_transferir_host(uuid, uuid) to authenticated;
grant execute on function hint_assumir_host(uuid) to authenticated;
grant execute on function hint_nova_partida(uuid) to authenticated;
grant execute on function criar_sala(text, text) to anon, authenticated;
