-- Respostas sem Perguntas (jogo de sala). Rode depois de db/023_escudos.sql, e depois rode db/025_seed_respostas.sql.
--
-- Segredo: a pergunta inteira e a resposta ficam em tabelas SEM policy (só funções security definer leem).
-- salas.estado (público, vai por realtime pra todo mundo) só guarda as palavras JÁ reveladas, a contagem
-- de palavras, de quem é a vez e os prazos. A pergunta completa só entra no estado no fim da rodada.
--
-- Fluxo (tudo validado aqui, nunca no navegador):
--   lobby -> iniciar_respostas -> escolha (15 s) -> respostas_revelar -> resposta (N s) -> respostas_responder
--     errou/tempo: próxima pessoa da ordem escolhe outra palavra (volta pra "escolha")
--     acertou ou todas reveladas: fase "resultado" (9 s) -> próxima pergunta ... -> fase "final"
-- Prazos: qualquer cliente chama avancar_respostas() quando o prazo vence (idempotente, trava a sala).

alter table salas drop constraint if exists salas_jogo_check;
alter table salas add constraint salas_jogo_check check (jogo in ('manada', 'themind', 'pdf', 'draft', 'respostas'));

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
  if p_jogo not in ('manada', 'themind', 'pdf', 'draft', 'respostas') then
    raise exception 'jogo invalido: %', p_jogo;
  end if;
  if coalesce(trim(p_nome), '') = '' then
    raise exception 'nome obrigatorio';
  end if;

  v_codigo := gerar_codigo_sala();

  insert into salas (codigo, jogo, status, host_id, estado)
  values (v_codigo, p_jogo, 'lobby', v_uid, case when p_jogo = 'draft'
    then jsonb_build_object('config', jsonb_build_object('modo', 'historico', 'torneio', 8)) else '{}'::jsonb end)
  returning id into v_sala_id;

  insert into sala_jogadores (sala_id, user_id, nome)
  values (v_sala_id, v_uid, trim(p_nome));

  return jsonb_build_object('sala_id', v_sala_id, 'codigo', v_codigo, 'jogo', p_jogo);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Tabelas (todas privadas: RLS ligada, nenhuma policy)
-- ---------------------------------------------------------------------------------------------

create table if not exists respostas_perguntas (
  id text primary key,
  categoria text not null,
  pergunta text not null,
  resposta text not null,
  aceitas text[] not null default '{}',
  dificuldade text not null check (dificuldade in ('facil', 'media', 'dificil')),
  ativo boolean not null default true
);

-- Estado secreto de cada partida: a fila de perguntas sorteada, a pergunta atual e as respostas erradas
-- (que só viram públicas no resultado da rodada).
create table if not exists respostas_sala (
  sala_id uuid primary key references salas(id) on delete cascade,
  fila text[] not null,
  atual text,
  tentativas jsonb not null default '[]'::jsonb
);

alter table respostas_perguntas enable row level security;
alter table respostas_sala enable row level security;

-- ---------------------------------------------------------------------------------------------
-- Validação de resposta (servidor): ignora maiúsculas, acento, pontuação, espaço duplicado e artigo
-- no começo; aceita a resposta oficial e as variações cadastradas. Só nomes longos toleram erro de
-- digitação (1 letra a partir de 7 caracteres, 2 a partir de 12). "Brasil e Argentina" não passa.
-- ---------------------------------------------------------------------------------------------

create or replace function respostas_norm(p_texto text)
returns text
language sql
immutable
as $$
  select trim(regexp_replace(
    regexp_replace(
      translate(lower(coalesce(p_texto, '')), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),
      '[^a-z0-9]+', ' ', 'g'),
    '\s+', ' ', 'g'))
$$;

create or replace function respostas_sem_artigo(p_norm text)
returns text
language sql
immutable
as $$
  select case when p_norm ~ '^(o|a|os|as|um|uma) .+' then regexp_replace(p_norm, '^(o|a|os|as|um|uma) ', '') else p_norm end
$$;

create or replace function respostas_dist(a text, b text)
returns int
language plpgsql
immutable
as $$
declare
  la int := length(a);
  lb int := length(b);
  prev int[];
  cur int[];
  i int;
  j int;
  custo int;
begin
  if abs(la - lb) > 2 then
    return 3;
  end if;
  prev := array(select generate_series(0, lb));
  for i in 1..la loop
    cur := array[i];
    for j in 1..lb loop
      custo := case when substr(a, i, 1) = substr(b, j, 1) then 0 else 1 end;
      cur := cur || least(prev[j + 1] + 1, cur[j] + 1, prev[j] + custo);
    end loop;
    prev := cur;
  end loop;
  return prev[lb + 1];
end;
$$;

create or replace function respostas_confere(p_texto text, p_resposta text, p_aceitas text[])
returns boolean
language plpgsql
immutable
as $$
declare
  v_t text := respostas_sem_artigo(respostas_norm(p_texto));
  v_raw text := lower(trim(coalesce(p_texto, '')));
  c text;
  cn text;
  lim int;
begin
  foreach c in array (array[p_resposta] || coalesce(p_aceitas, '{}'::text[])) loop
    cn := respostas_sem_artigo(respostas_norm(c));
    if cn = '' then
      -- resposta feita só de símbolo (ex.: @): compara o texto cru
      if v_raw = lower(trim(c)) then
        return true;
      end if;
    elsif v_t = cn then
      return true;
    elsif length(cn) >= 7 and v_t <> '' then
      lim := case when length(cn) >= 12 then 2 else 1 end;
      if respostas_dist(v_t, cn) <= lim then
        return true;
      end if;
    end if;
  end loop;
  return false;
end;
$$;

create or replace function respostas_ordem(p_estado jsonb)
returns uuid[]
language sql
immutable
as $$
  select coalesce(array_agg(x::uuid order by o), '{}'::uuid[])
  from jsonb_array_elements_text(p_estado->'ordem') with ordinality t(x, o)
$$;

-- Sorteia a fila da partida: 60% fáceis, 35% médias, 5% difíceis, sem repetir, e puxando sempre
-- a categoria menos usada até ali (com "todas" as categorias ficam misturadas).
create or replace function respostas_sortear(p_categorias text[], p_total int)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fila text[] := '{}';
  v_cats text[] := '{}';
  v_id text;
  v_cat text;
  v_roll float;
  v_dif text;
  i int;
begin
  for i in 1..p_total loop
    v_roll := random();
    v_dif := case when v_roll < 0.60 then 'facil' when v_roll < 0.95 then 'media' else 'dificil' end;
    v_id := null;
    select q.id, q.categoria into v_id, v_cat
    from respostas_perguntas q
    where q.ativo and q.categoria = any(p_categorias) and q.dificuldade = v_dif and q.id <> all(v_fila)
    order by (select count(*) from unnest(v_cats) c where c = q.categoria), random()
    limit 1;
    if v_id is null then
      select q.id, q.categoria into v_id, v_cat
      from respostas_perguntas q
      where q.ativo and q.categoria = any(p_categorias) and q.id <> all(v_fila)
      order by (select count(*) from unnest(v_cats) c where c = q.categoria), random()
      limit 1;
    end if;
    if v_id is null then
      raise exception 'o banco so tem % perguntas nessas categorias', i - 1;
    end if;
    v_fila := v_fila || v_id;
    v_cats := v_cats || v_cat;
  end loop;
  return v_fila;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Internas (só chamadas por outras funções, com a sala já travada)
-- ---------------------------------------------------------------------------------------------

create or replace function respostas_abrir(p_sala_id uuid, p_n int, p_idx int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_e jsonb;
  v_rs respostas_sala%rowtype;
  v_q respostas_perguntas%rowtype;
  v_ordem uuid[];
  v_pal int;
begin
  select estado into v_e from salas where id = p_sala_id;
  select * into v_rs from respostas_sala where sala_id = p_sala_id;
  select * into v_q from respostas_perguntas where id = v_rs.fila[p_n];
  v_ordem := respostas_ordem(v_e);
  v_pal := array_length(regexp_split_to_array(trim(v_q.pergunta), '\s+'), 1);

  update respostas_sala set atual = v_q.id, tentativas = '[]'::jsonb where sala_id = p_sala_id;
  update salas
    set estado = v_e || jsonb_build_object(
          'fase', 'escolha',
          'n', p_n,
          'categoria', v_q.categoria,
          'palavras', v_pal,
          'reveladas', '{}'::jsonb,
          'pontos', v_pal,
          'vez_idx', p_idx,
          'vez', v_ordem[p_idx + 1],
          'fim', to_jsonb(now() + interval '15 seconds'),
          'ultimo', null,
          'resultado', null
        ),
        atualizada_em = now()
    where id = p_sala_id;
end;
$$;

create or replace function respostas_revelar_interno(p_sala_id uuid, p_pos int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_e jsonb;
  v_q respostas_perguntas%rowtype;
  v_word text;
  v_rev jsonb;
  v_pontos int;
begin
  select estado into v_e from salas where id = p_sala_id;
  select q.* into v_q from respostas_perguntas q join respostas_sala rs on rs.atual = q.id where rs.sala_id = p_sala_id;
  v_word := (regexp_split_to_array(trim(v_q.pergunta), '\s+'))[p_pos];
  v_rev := (v_e->'reveladas') || jsonb_build_object(p_pos::text, v_word);
  v_pontos := (v_e->>'palavras')::int - (select count(*) from jsonb_object_keys(v_rev));

  update salas
    set estado = v_e || jsonb_build_object(
          'fase', 'resposta',
          'reveladas', v_rev,
          'pontos', v_pontos,
          'fim', to_jsonb(now() + make_interval(secs => (v_e->>'tempo')::int)),
          'ultimo', null
        ),
        atualizada_em = now()
    where id = p_sala_id;
end;
$$;

create or replace function respostas_registrar(p_sala_id uuid, p_uid uuid, p_texto text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qtd int;
begin
  select count(*) into v_qtd from salas s, jsonb_object_keys(s.estado->'reveladas') where s.id = p_sala_id;
  update respostas_sala
    set tentativas = tentativas || jsonb_build_object('uid', p_uid, 'texto', p_texto, 'palavras', v_qtd)
    where sala_id = p_sala_id;
end;
$$;

create or replace function respostas_encerrar(p_sala_id uuid, p_tipo text, p_uid uuid, p_pontos int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_e jsonb;
  v_rs respostas_sala%rowtype;
  v_q respostas_perguntas%rowtype;
  v_placar jsonb;
  v_acertos jsonb;
begin
  select estado into v_e from salas where id = p_sala_id;
  select * into v_rs from respostas_sala where sala_id = p_sala_id;
  select * into v_q from respostas_perguntas where id = v_rs.atual;
  v_placar := v_e->'placar';
  v_acertos := v_e->'acertos';
  if p_uid is not null then
    v_placar := v_placar || jsonb_build_object(p_uid::text, coalesce((v_placar->>p_uid::text)::int, 0) + p_pontos);
    v_acertos := v_acertos || jsonb_build_object(p_uid::text, coalesce((v_acertos->>p_uid::text)::int, 0) + 1);
  end if;

  update salas
    set estado = v_e || jsonb_build_object(
          'fase', 'resultado',
          'placar', v_placar,
          'acertos', v_acertos,
          'fim', to_jsonb(now() + interval '9 seconds'),
          'resultado', jsonb_build_object(
            'tipo', p_tipo,
            'uid', p_uid,
            'pontos', p_pontos,
            'pergunta', v_q.pergunta,
            'resposta', v_q.resposta,
            'tentativas', v_rs.tentativas
          )
        ),
        atualizada_em = now()
    where id = p_sala_id;
end;
$$;

-- Errou ou estourou o tempo: se ainda há palavra oculta passa a vez; senão encerra sem pontos.
create or replace function respostas_proximo_turno(p_sala_id uuid, p_tipo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_e jsonb;
  v_ordem uuid[];
  v_ocultas int;
  v_prox int;
begin
  select estado into v_e from salas where id = p_sala_id;
  v_ordem := respostas_ordem(v_e);
  v_ocultas := (v_e->>'palavras')::int - (select count(*) from jsonb_object_keys(v_e->'reveladas'));
  if v_ocultas <= 0 then
    perform respostas_encerrar(p_sala_id, 'ninguem', null, 0);
    return;
  end if;
  v_prox := ((v_e->>'vez_idx')::int + 1) % array_length(v_ordem, 1);
  update salas
    set estado = v_e || jsonb_build_object(
          'fase', 'escolha',
          'vez_idx', v_prox,
          'vez', v_ordem[v_prox + 1],
          'fim', to_jsonb(now() + interval '15 seconds'),
          'ultimo', jsonb_build_object('uid', v_e->>'vez', 'tipo', p_tipo)
        ),
        atualizada_em = now()
    where id = p_sala_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Funções chamadas pelo app
-- ---------------------------------------------------------------------------------------------

create or replace function respostas_agora()
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$ select now() $$;

-- Categorias disponíveis (só nome e quantidade; nada da pergunta).
create or replace function respostas_categorias()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('categoria', categoria, 'total', total) order by categoria), '[]'::jsonb)
  from (select categoria, count(*)::int as total from respostas_perguntas where ativo group by categoria) t
$$;

create or replace function iniciar_respostas(p_sala_id uuid, p_total int, p_tempo int, p_categorias text[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
  v_ids uuid[];
  v_cats text[];
  v_fila text[];
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found or v_sala.jogo <> 'respostas' then
    raise exception 'sala nao encontrada';
  end if;
  if v_sala.host_id <> v_uid then
    raise exception 'so o host pode iniciar a partida';
  end if;
  if v_sala.status <> 'lobby' then
    raise exception 'essa partida ja comecou';
  end if;
  if p_total < 1 or p_total > 50 then
    raise exception 'escolha de 1 a 50 perguntas';
  end if;
  if p_tempo < 10 or p_tempo > 120 then
    raise exception 'o tempo de resposta vai de 10 a 120 segundos';
  end if;

  select array_agg(user_id order by random()) into v_ids from sala_jogadores where sala_id = p_sala_id;
  if coalesce(array_length(v_ids, 1), 0) < 2 then
    raise exception 'precisa de pelo menos 2 jogadores';
  end if;

  if coalesce(array_length(p_categorias, 1), 0) = 0 then
    select array_agg(distinct categoria) into v_cats from respostas_perguntas where ativo;
  else
    v_cats := p_categorias;
  end if;
  v_fila := respostas_sortear(v_cats, p_total);

  insert into respostas_sala (sala_id, fila, atual, tentativas)
  values (p_sala_id, v_fila, null, '[]'::jsonb)
  on conflict (sala_id) do update set fila = excluded.fila, atual = null, tentativas = '[]'::jsonb;

  update salas
    set status = 'em_andamento',
        estado = jsonb_build_object(
          'fase', 'escolha',
          'n', 0,
          'total', p_total,
          'tempo', p_tempo,
          'ordem', to_jsonb(v_ids),
          'placar', (select jsonb_object_agg(x::text, 0) from unnest(v_ids) x),
          'acertos', (select jsonb_object_agg(x::text, 0) from unnest(v_ids) x)
        ),
        atualizada_em = now()
    where id = p_sala_id;

  perform respostas_abrir(p_sala_id, 1, 0);
  return (select estado from salas where id = p_sala_id);
end;
$$;

-- O jogador da vez escolhe uma palavra oculta; ela é revelada pra todos e o tempo de resposta começa.
create or replace function respostas_revelar(p_sala_id uuid, p_pos int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found or v_sala.jogo <> 'respostas' then
    raise exception 'sala nao encontrada';
  end if;
  if v_sala.status <> 'em_andamento' or v_sala.estado->>'fase' <> 'escolha' then
    raise exception 'agora nao e hora de escolher palavra';
  end if;
  if (v_sala.estado->>'vez')::uuid <> v_uid then
    raise exception 'nao e a sua vez';
  end if;
  if p_pos < 1 or p_pos > (v_sala.estado->>'palavras')::int then
    raise exception 'palavra invalida';
  end if;
  if v_sala.estado->'reveladas' ? p_pos::text then
    raise exception 'essa palavra ja foi revelada';
  end if;

  perform respostas_revelar_interno(p_sala_id, p_pos);
  return (select estado from salas where id = p_sala_id);
end;
$$;

-- Uma única tentativa por turno. Acertou: leva os pontos que sobraram e encerra a pergunta.
create or replace function respostas_responder(p_sala_id uuid, p_texto text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
  v_q respostas_perguntas%rowtype;
  v_txt text := left(trim(coalesce(p_texto, '')), 100);
  v_ok boolean;
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found or v_sala.jogo <> 'respostas' then
    raise exception 'sala nao encontrada';
  end if;
  if v_sala.status <> 'em_andamento' or v_sala.estado->>'fase' <> 'resposta' then
    raise exception 'agora nao e hora de responder';
  end if;
  if (v_sala.estado->>'vez')::uuid <> v_uid then
    raise exception 'nao e a sua vez';
  end if;

  -- passou do prazo (com 2 s de folga pro sinal de rede): conta como tempo esgotado
  if now() > (v_sala.estado->>'fim')::timestamptz + interval '2 seconds' then
    perform respostas_registrar(p_sala_id, v_uid, null);
    perform respostas_proximo_turno(p_sala_id, 'tempo');
    return jsonb_build_object('correto', false, 'tempo', true);
  end if;

  if v_txt = '' then
    raise exception 'digite uma resposta';
  end if;

  select q.* into v_q from respostas_perguntas q join respostas_sala rs on rs.atual = q.id where rs.sala_id = p_sala_id;
  v_ok := respostas_confere(v_txt, v_q.resposta, v_q.aceitas);

  if v_ok then
    perform respostas_encerrar(p_sala_id, 'acertou', v_uid, (v_sala.estado->>'pontos')::int);
  else
    perform respostas_registrar(p_sala_id, v_uid, v_txt);
    perform respostas_proximo_turno(p_sala_id, 'errou');
  end if;
  return jsonb_build_object('correto', v_ok);
end;
$$;

-- Qualquer cliente chama quando o prazo da fase vence. Idempotente.
create or replace function avancar_respostas(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sala salas%rowtype;
  v_e jsonb;
  v_fase text;
  v_ocultas int[];
  v_n int;
  v_total int;
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found then
    raise exception 'sala nao encontrada';
  end if;
  if v_sala.status <> 'em_andamento' or v_sala.jogo <> 'respostas' then
    return v_sala.estado;
  end if;
  v_e := v_sala.estado;
  v_fase := v_e->>'fase';
  if v_e->>'fim' is null or now() < (v_e->>'fim')::timestamptz then
    return v_e;
  end if;

  if v_fase = 'escolha' then
    -- ninguém escolheu em 15 s: revela uma palavra oculta aleatória
    select array_agg(g) into v_ocultas
      from generate_series(1, (v_e->>'palavras')::int) g
      where not (v_e->'reveladas' ? g::text);
    perform respostas_revelar_interno(p_sala_id, v_ocultas[1 + floor(random() * array_length(v_ocultas, 1))::int]);
  elsif v_fase = 'resposta' then
    perform respostas_registrar(p_sala_id, (v_e->>'vez')::uuid, null);
    perform respostas_proximo_turno(p_sala_id, 'tempo');
  elsif v_fase = 'resultado' then
    v_n := (v_e->>'n')::int;
    v_total := (v_e->>'total')::int;
    if v_n < v_total then
      -- a próxima pergunta começa por quem vem depois de quem teve o último turno
      perform respostas_abrir(p_sala_id, v_n + 1, ((v_e->>'vez_idx')::int + 1) % array_length(respostas_ordem(v_e), 1));
    else
      update salas
        set status = 'finalizado',
            estado = v_e || jsonb_build_object('fase', 'final', 'fim', null),
            atualizada_em = now()
        where id = p_sala_id;
    end if;
  end if;
  return (select estado from salas where id = p_sala_id);
end;
$$;

-- Volta pro lobby com os mesmos jogadores e placar zerado. O host faz; se o host sumiu (sala parada
-- há mais de 90 s no fim), qualquer jogador da sala assume e faz.
create or replace function respostas_nova_partida(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found or v_sala.jogo <> 'respostas' then
    raise exception 'sala nao encontrada';
  end if;
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = v_uid) then
    raise exception 'voce nao esta nessa sala';
  end if;
  if v_sala.status <> 'finalizado' then
    raise exception 'a partida ainda nao terminou';
  end if;
  if v_sala.host_id <> v_uid then
    if now() - v_sala.atualizada_em < interval '90 seconds' then
      raise exception 'so o host pode comecar uma nova partida';
    end if;
    update salas set host_id = v_uid where id = p_sala_id;
  end if;

  delete from respostas_sala where sala_id = p_sala_id;
  update salas set status = 'lobby', estado = '{}'::jsonb, atualizada_em = now() where id = p_sala_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Permissões: o app só chama as funções "de jogo". Todo o resto fica fechado pro cliente.
-- ---------------------------------------------------------------------------------------------

revoke all on function respostas_norm(text) from public, anon, authenticated;
revoke all on function respostas_sem_artigo(text) from public, anon, authenticated;
revoke all on function respostas_dist(text, text) from public, anon, authenticated;
revoke all on function respostas_confere(text, text, text[]) from public, anon, authenticated;
revoke all on function respostas_ordem(jsonb) from public, anon, authenticated;
revoke all on function respostas_sortear(text[], int) from public, anon, authenticated;
revoke all on function respostas_abrir(uuid, int, int) from public, anon, authenticated;
revoke all on function respostas_revelar_interno(uuid, int) from public, anon, authenticated;
revoke all on function respostas_registrar(uuid, uuid, text) from public, anon, authenticated;
revoke all on function respostas_encerrar(uuid, text, uuid, int) from public, anon, authenticated;
revoke all on function respostas_proximo_turno(uuid, text) from public, anon, authenticated;

grant execute on function respostas_agora() to anon, authenticated;
grant execute on function respostas_categorias() to anon, authenticated;
grant execute on function iniciar_respostas(uuid, int, int, text[]) to anon, authenticated;
grant execute on function respostas_revelar(uuid, int) to anon, authenticated;
grant execute on function respostas_responder(uuid, text) to anon, authenticated;
grant execute on function avancar_respostas(uuid) to anon, authenticated;
grant execute on function respostas_nova_partida(uuid) to anon, authenticated;
