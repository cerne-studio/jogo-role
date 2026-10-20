-- DRAFT FC — regras do draft no servidor. Rode depois de db/014_draft_schema.sql.
--
-- Toda escrita passa por RPC security definer que trava a sala (`for update`) antes de validar,
-- então duas escolhas do mesmo jogador chegando juntas nunca passam as duas ("Pego por X").
--
-- Estado público em salas.estado (jogo 'draft'):
--   config{modo:'historico'|'atual'|'liga', liga, torneio:8|16|20}
--   fase: 'formacao' → 'draft' → 'tatica' → 'prontos'
--   formacoes{user_id:nome}, taticas{user_id:nome}
--   rodada (1..11), letra ('*' = sem restrição, só se nada serviu), letras[] já sorteadas,
--   escolha_ini (a roleta dura até aqui), prazos{user_id:timestamptz}, ja_escolheu[user_id], ext[user_id] (já ganhou +3 s)
--   pegos{pid:{u:user_id,n:nome}}, feed[{r,u,n,j,auto}] (últimas 12), formacao_ate, tatica_ate, agora (hora do servidor na escrita)
-- Quem passou do prazo é resolvido por fd_avancar(), que qualquer jogador da sala chama quando o relógio dele zera
-- (não depende do host nem de cron).

create or replace function fd_max_jogadores() returns int language sql immutable as $$ select 8 $$;
create or replace function fd_rodadas() returns int language sql immutable as $$ select 11 $$;
create or replace function fd_segundos_escolha() returns int language sql immutable as $$ select 7 $$;

-- ---------------------------------------------------------------------------------------------
-- Internas (nunca chamadas pelo cliente)
-- ---------------------------------------------------------------------------------------------

create or replace function fd_publicar(p_sala_id uuid, p_patch jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  update salas
    set estado = estado || p_patch || jsonb_build_object('agora', to_jsonb(now())),
        atualizada_em = now()
    where id = p_sala_id;
$$;

create or replace function fd_pool(p_estado jsonb)
returns text
language sql
immutable
as $$ select case when p_estado->'config'->>'modo' = 'atual' then 'atual' else 'hist' end $$;

create or replace function fd_liga(p_estado jsonb)
returns text
language sql
immutable
as $$ select case when p_estado->'config'->>'modo' = 'liga' then p_estado->'config'->>'liga' else null end $$;

create or replace function fd_casa_letra(p_letras text, p_letra text)
returns boolean
language sql
immutable
as $$ select p_letra = '*' or position(p_letra in p_letras) > 0 $$;

create or replace function fd_pode_algum(p_pos text[], p_rotulos text[])
returns boolean
language sql
immutable
as $$ select exists (select 1 from unnest(p_rotulos) r where p_pos && fd_aceita(r)) $$;

create or replace function fd_rotulos_livres(p_sala_id uuid, p_user uuid, p_estado jsonb)
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(f.slots[i]), '{}')
  from fd_formacoes f, generate_series(1, 11) i
  where f.nome = coalesce(p_estado->'formacoes'->>(p_user::text), '4-3-3')
    and not exists (select 1 from fd_escolhas e where e.sala_id = p_sala_id and e.user_id = p_user and e.slot = i)
$$;

-- Sorteia a letra da rodada (só letras com jogador livre pra vaga aberta de CADA humano) e abre os prazos.
create or replace function fd_abrir_rodada(p_sala_id uuid, p_rodada int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_est jsonb;
  v_pool text;
  v_liga text;
  v_usadas text[];
  v_humanos int;
  v_letra text;
  v_cand text;
  v_ok boolean;
  v_h uuid;
  v_ini timestamptz := now() + interval '2.5 seconds';
begin
  select estado into v_est from salas where id = p_sala_id;
  v_pool := fd_pool(v_est);
  v_liga := fd_liga(v_est);
  v_usadas := array(select jsonb_array_elements_text(coalesce(v_est->'letras', '[]'::jsonb)));
  select count(*) into v_humanos from sala_jogadores where sala_id = p_sala_id;

  for v_cand in
    select chr(64 + g) from generate_series(1, 26) g order by (chr(64 + g) = any (v_usadas)), random()
  loop
    v_ok := true;
    for v_h in select user_id from sala_jogadores where sala_id = p_sala_id loop
      if not exists (
        select 1 from fd_jogadores j
        where j.pool = v_pool and (v_liga is null or j.liga = v_liga)
          and position(v_cand in j.letras) > 0
          and not exists (select 1 from fd_escolhas e where e.sala_id = p_sala_id and e.jogador_pid = j.pid)
          and fd_pode_algum(j.posicoes, fd_rotulos_livres(p_sala_id, v_h, v_est))
      ) then
        v_ok := false;
        exit;
      end if;
    end loop;
    if v_ok and (
      select count(*) from fd_jogadores j
      where j.pool = v_pool and (v_liga is null or j.liga = v_liga)
        and position(v_cand in j.letras) > 0
        and not exists (select 1 from fd_escolhas e where e.sala_id = p_sala_id and e.jogador_pid = j.pid)
    ) < 2 * v_humanos then
      v_ok := false;
    end if;
    if v_ok then
      v_letra := v_cand;
      exit;
    end if;
  end loop;

  v_letra := coalesce(v_letra, '*');

  perform fd_publicar(p_sala_id, jsonb_build_object(
    'fase', 'draft',
    'rodada', p_rodada,
    'letra', v_letra,
    'letras', coalesce(v_est->'letras', '[]'::jsonb) || to_jsonb(v_letra),
    'escolha_ini', v_ini,
    'prazos', (select jsonb_object_agg(user_id::text, to_jsonb(v_ini + make_interval(secs => fd_segundos_escolha())))
               from sala_jogadores where sala_id = p_sala_id),
    'ja_escolheu', '[]'::jsonb,
    'ext', '[]'::jsonb
  ));
end;
$$;

-- Grava a escolha e publica ("Pego por X" + feed). Não valida nada: quem chama já validou.
create or replace function fd_registrar_escolha(p_sala_id uuid, p_user uuid, p_slot int, p_pid int, p_auto boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_est jsonb;
  v_nome text;
  v_jogador text;
  v_rodada int;
  v_item jsonb;
begin
  select estado into v_est from salas where id = p_sala_id;
  select nome into v_nome from sala_jogadores where sala_id = p_sala_id and user_id = p_user;
  select nome into v_jogador from fd_jogadores where pid = p_pid;
  v_rodada := (v_est->>'rodada')::int;

  insert into fd_escolhas (sala_id, user_id, slot, jogador_pid, rodada, auto)
  values (p_sala_id, p_user, p_slot, p_pid, v_rodada, p_auto);

  v_item := jsonb_build_object('r', v_rodada, 'u', p_user, 'n', v_nome, 'j', v_jogador, 'auto', p_auto);

  perform fd_publicar(p_sala_id, jsonb_build_object(
    'pegos', coalesce(v_est->'pegos', '{}'::jsonb) || jsonb_build_object(p_pid::text, jsonb_build_object('u', p_user, 'n', v_nome)),
    'ja_escolheu', coalesce(v_est->'ja_escolheu', '[]'::jsonb) || to_jsonb(p_user),
    'feed', (select coalesce(jsonb_agg(e order by ord), '[]'::jsonb) from (
               select e, ord from jsonb_array_elements(jsonb_build_array(v_item) || coalesce(v_est->'feed', '[]'::jsonb)) with ordinality t(e, ord)
               order by ord limit 12) s)
  ));
end;
$$;

-- Se todos os humanos já escolheram, abre a próxima rodada (ou encerra o draft).
create or replace function fd_checar_fim_rodada(p_sala_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_est jsonb;
  v_humanos int;
begin
  select estado into v_est from salas where id = p_sala_id;
  select count(*) into v_humanos from sala_jogadores where sala_id = p_sala_id;
  if jsonb_array_length(coalesce(v_est->'ja_escolheu', '[]'::jsonb)) < v_humanos then
    return;
  end if;
  if (v_est->>'rodada')::int >= fd_rodadas() then
    perform fd_publicar(p_sala_id, jsonb_build_object('fase', 'tatica', 'tatica_ate', now() + interval '25 seconds', 'taticas', '{}'::jsonb));
  else
    perform fd_abrir_rodada(p_sala_id, (v_est->>'rodada')::int + 1);
  end if;
end;
$$;

-- Escolha automática (tempo esgotado): melhor jogador livre da letra que encaixa numa vaga aberta.
create or replace function fd_autoescolher(p_sala_id uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_est jsonb;
  v_pool text;
  v_liga text;
  v_letra text;
  v_form text;
  v_pid int;
  v_slot int;
  v_tentativa int;
begin
  select estado into v_est from salas where id = p_sala_id;
  v_pool := fd_pool(v_est);
  v_liga := fd_liga(v_est);
  v_letra := v_est->>'letra';
  v_form := coalesce(v_est->'formacoes'->>(p_user::text), '4-3-3');

  for v_tentativa in 1..2 loop
    select j.pid, l.i into v_pid, v_slot
    from fd_jogadores j
    join (
      select i, f.slots[i] as r
      from fd_formacoes f, generate_series(1, 11) i
      where f.nome = v_form
        and not exists (select 1 from fd_escolhas e where e.sala_id = p_sala_id and e.user_id = p_user and e.slot = i)
    ) l on j.posicoes && fd_aceita(l.r)
    where j.pool = v_pool and (v_liga is null or j.liga = v_liga)
      and (v_tentativa = 2 or fd_casa_letra(j.letras, v_letra))
      and not exists (select 1 from fd_escolhas e where e.sala_id = p_sala_id and e.jogador_pid = j.pid)
    order by j.overall desc, l.i
    limit 1;
    exit when v_pid is not null;
  end loop;

  if v_pid is null then
    -- pool esgotado pra esse jogador: só marca como "já escolheu" pra não travar a rodada
    perform fd_publicar(p_sala_id, jsonb_build_object(
      'ja_escolheu', coalesce(v_est->'ja_escolheu', '[]'::jsonb) || to_jsonb(p_user)));
    return;
  end if;
  perform fd_registrar_escolha(p_sala_id, p_user, v_slot, v_pid, true);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Entrada de sala / início (substituem as versões anteriores pra incluir o 'draft')
-- ---------------------------------------------------------------------------------------------

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
  if p_jogo not in ('manada', 'themind', 'pdf', 'draft') then
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

create or replace function entrar_sala(p_codigo text, p_nome text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
  v_nome_existe boolean;
  v_ja_na_sala boolean;
begin
  if v_uid is null then
    raise exception 'sessao anonima ausente';
  end if;
  if coalesce(trim(p_nome), '') = '' then
    raise exception 'nome obrigatorio';
  end if;

  select * into v_sala from salas where codigo = p_codigo for update;
  if not found then
    raise exception 'sala nao encontrada';
  end if;

  select exists(select 1 from sala_jogadores where sala_id = v_sala.id and user_id = v_uid) into v_ja_na_sala;

  if v_sala.status <> 'lobby' and not v_ja_na_sala then
    raise exception 'essa partida ja comecou';
  end if;

  if v_sala.jogo = 'pdf' and not v_ja_na_sala
     and (select count(*) from sala_jogadores where sala_id = v_sala.id) >= pdf_max_jogadores() then
    raise exception 'sala cheia (maximo de % jogadores)', pdf_max_jogadores();
  end if;

  if v_sala.jogo = 'draft' and not v_ja_na_sala
     and (select count(*) from sala_jogadores where sala_id = v_sala.id) >= fd_max_jogadores() then
    raise exception 'sala cheia (maximo de % jogadores)', fd_max_jogadores();
  end if;

  select exists(
    select 1 from sala_jogadores
    where sala_id = v_sala.id
      and lower(nome) = lower(trim(p_nome))
      and user_id <> v_uid
  ) into v_nome_existe;
  if v_nome_existe then
    raise exception 'ja existe alguem com esse nome nessa sala';
  end if;

  insert into sala_jogadores (sala_id, user_id, nome)
  values (v_sala.id, v_uid, trim(p_nome))
  on conflict (sala_id, user_id) do update set nome = excluded.nome;

  return jsonb_build_object(
    'sala_id', v_sala.id,
    'codigo', v_sala.codigo,
    'jogo', v_sala.jogo,
    'host_id', v_sala.host_id
  );
end;
$$;

create or replace function iniciar_partida_draft(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_config jsonb;
begin
  select coalesce(estado->'config', jsonb_build_object('modo', 'historico', 'torneio', 8)) into v_config
  from salas where id = p_sala_id;

  delete from fd_escolhas where sala_id = p_sala_id;

  update salas
    set status = 'em_andamento',
        estado = jsonb_build_object(
          'config', v_config,
          'fase', 'formacao',
          'formacoes', '{}'::jsonb,
          'formacao_ate', now() + interval '25 seconds',
          'rodada', 0,
          'letras', '[]'::jsonb,
          'pegos', '{}'::jsonb,
          'feed', '[]'::jsonb,
          'agora', now()
        ),
        atualizada_em = now()
    where id = p_sala_id;

  return (select estado from salas where id = p_sala_id);
end;
$$;

create or replace function iniciar_partida(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
  v_total_jogadores int;
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found then
    raise exception 'sala nao encontrada';
  end if;
  if v_sala.host_id <> v_uid then
    raise exception 'so o host pode iniciar a partida';
  end if;
  if v_sala.status <> 'lobby' then
    raise exception 'essa partida ja comecou';
  end if;

  select count(*) into v_total_jogadores from sala_jogadores where sala_id = p_sala_id;
  if v_total_jogadores < (case when v_sala.jogo = 'draft' then 1 else 3 end) then
    raise exception 'precisa de pelo menos % jogadores', (case when v_sala.jogo = 'draft' then 1 else 3 end);
  end if;

  if v_sala.jogo = 'manada' then
    return iniciar_partida_manada(p_sala_id, v_total_jogadores);
  end if;

  if v_sala.jogo = 'themind' then
    return iniciar_partida_themind(p_sala_id, v_total_jogadores);
  end if;

  if v_sala.jogo = 'pdf' then
    return iniciar_partida_pdf(p_sala_id, v_total_jogadores);
  end if;

  if v_sala.jogo = 'draft' then
    return iniciar_partida_draft(p_sala_id);
  end if;

  raise exception 'jogo % ainda nao tem iniciar_partida implementado', v_sala.jogo;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Chamadas pelo cliente
-- ---------------------------------------------------------------------------------------------

-- Host escolhe modo (historico | atual | liga), liga (quando modo = liga) e tamanho do campeonato.
create or replace function fd_configurar(p_sala_id uuid, p_modo text, p_liga text, p_torneio int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sala salas%rowtype;
  v_config jsonb;
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found or v_sala.jogo <> 'draft' then
    raise exception 'sala nao encontrada';
  end if;
  if v_sala.host_id <> auth.uid() then
    raise exception 'so o host configura a partida';
  end if;
  if v_sala.status <> 'lobby' then
    raise exception 'essa partida ja comecou';
  end if;
  if p_modo not in ('historico', 'atual', 'liga') then
    raise exception 'modo invalido';
  end if;
  if p_torneio not in (8, 16, 20) then
    raise exception 'campeonato de 8, 16 ou 20 times';
  end if;
  if p_modo = 'atual' and not exists (select 1 from fd_jogadores where pool = 'atual') then
    raise exception 'o modo atual ainda nao tem jogadores carregados';
  end if;
  if p_modo = 'liga' and (select count(*) from fd_jogadores where pool = 'hist' and liga = p_liga) < 150 then
    raise exception 'liga sem jogadores suficientes';
  end if;

  v_config := jsonb_build_object('modo', p_modo, 'liga', case when p_modo = 'liga' then p_liga else null end, 'torneio', p_torneio);
  perform fd_publicar(p_sala_id, jsonb_build_object('config', v_config));
  return v_config;
end;
$$;

-- Ligas que dão draft decente (100+ jogadores no pool histórico).
create or replace function fd_ligas()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('liga', liga, 'total', n) order by n desc), '[]'::jsonb)
  from (select liga, count(*) n from fd_jogadores where pool = 'hist' and coalesce(liga, '') <> '' group by liga having count(*) >= 150) s
$$;

create or replace function fd_definir_formacao(p_sala_id uuid, p_formacao text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
  v_humanos int;
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found or v_sala.jogo <> 'draft' then
    raise exception 'sala nao encontrada';
  end if;
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = v_uid) then
    raise exception 'voce nao esta nessa sala';
  end if;
  if v_sala.estado->>'fase' <> 'formacao' then
    raise exception 'a formacao ja foi fechada';
  end if;
  if not exists (select 1 from fd_formacoes where nome = p_formacao) then
    raise exception 'formacao invalida';
  end if;

  perform fd_publicar(p_sala_id, jsonb_build_object(
    'formacoes', coalesce(v_sala.estado->'formacoes', '{}'::jsonb) || jsonb_build_object(v_uid::text, p_formacao)));

  select count(*) into v_humanos from sala_jogadores where sala_id = p_sala_id;
  if (select count(*) from jsonb_object_keys((select estado->'formacoes' from salas where id = p_sala_id))) >= v_humanos then
    perform fd_abrir_rodada(p_sala_id, 1);
  end if;
end;
$$;

create or replace function fd_escolher(p_sala_id uuid, p_slot int, p_pid int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
  v_est jsonb;
  v_prazo timestamptz;
  v_rotulo text;
  v_j fd_jogadores%rowtype;
  v_por text;
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found or v_sala.jogo <> 'draft' then
    raise exception 'sala nao encontrada';
  end if;
  v_est := v_sala.estado;
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = v_uid) then
    raise exception 'voce nao esta nessa sala';
  end if;
  if v_est->>'fase' <> 'draft' then
    raise exception 'o draft nao esta aberto';
  end if;
  if now() < (v_est->>'escolha_ini')::timestamptz - interval '0.5 seconds' then
    raise exception 'a rodada ainda nao abriu';
  end if;
  if (v_est->'ja_escolheu') ? v_uid::text then
    raise exception 'voce ja escolheu nessa rodada';
  end if;

  v_prazo := (v_est->'prazos'->>(v_uid::text))::timestamptz;
  if now() > v_prazo + interval '1.8 seconds' then
    return jsonb_build_object('ok', false, 'motivo', 'tempo');
  end if;

  select f.slots[p_slot] into v_rotulo from fd_formacoes f
  where f.nome = coalesce(v_est->'formacoes'->>(v_uid::text), '4-3-3') and p_slot between 1 and 11;
  if v_rotulo is null then
    raise exception 'posicao invalida';
  end if;
  if exists (select 1 from fd_escolhas where sala_id = p_sala_id and user_id = v_uid and slot = p_slot) then
    raise exception 'essa posicao ja esta preenchida';
  end if;

  select * into v_j from fd_jogadores
  where pid = p_pid and pool = fd_pool(v_est) and (fd_liga(v_est) is null or liga = fd_liga(v_est));
  if not found then
    raise exception 'jogador fora do draft';
  end if;
  if not fd_casa_letra(v_j.letras, v_est->>'letra') then
    raise exception 'o nome desse jogador nao tem a letra sorteada';
  end if;
  if not (v_j.posicoes && fd_aceita(v_rotulo)) then
    raise exception 'esse jogador nao joga nessa posicao';
  end if;

  if exists (select 1 from fd_escolhas where sala_id = p_sala_id and jogador_pid = p_pid) then
    select sj.nome into v_por from fd_escolhas e join sala_jogadores sj on sj.sala_id = e.sala_id and sj.user_id = e.user_id
    where e.sala_id = p_sala_id and e.jogador_pid = p_pid;
    -- perdeu a disputa: ganha +3 s (uma vez por rodada)
    if not ((v_est->'ext') ? v_uid::text) then
      perform fd_publicar(p_sala_id, jsonb_build_object(
        'prazos', (v_est->'prazos') || jsonb_build_object(v_uid::text, to_jsonb(v_prazo + interval '3 seconds')),
        'ext', coalesce(v_est->'ext', '[]'::jsonb) || to_jsonb(v_uid)));
    end if;
    return jsonb_build_object('ok', false, 'motivo', 'pego', 'por', v_por);
  end if;

  perform fd_registrar_escolha(p_sala_id, v_uid, p_slot, p_pid, false);
  perform fd_checar_fim_rodada(p_sala_id);
  return jsonb_build_object('ok', true);
end;
$$;

-- Resolve o que estourou o prazo (formação, escolha, tática). Qualquer jogador da sala pode chamar; é idempotente.
create or replace function fd_avancar(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sala salas%rowtype;
  v_est jsonb;
  v_h record;
  v_taticas jsonb;
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found or v_sala.jogo <> 'draft' then
    raise exception 'sala nao encontrada';
  end if;
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = auth.uid()) then
    raise exception 'voce nao esta nessa sala';
  end if;
  v_est := v_sala.estado;

  if v_est->>'fase' = 'formacao' and now() >= (v_est->>'formacao_ate')::timestamptz then
    perform fd_publicar(p_sala_id, jsonb_build_object('formacoes', (
      select coalesce(jsonb_object_agg(sj.user_id::text, coalesce(v_est->'formacoes'->>(sj.user_id::text), '4-3-3')), '{}'::jsonb)
      from sala_jogadores sj where sj.sala_id = p_sala_id)));
    perform fd_abrir_rodada(p_sala_id, 1);

  elsif v_est->>'fase' = 'draft' then
    for v_h in select user_id from sala_jogadores where sala_id = p_sala_id loop
      select estado into v_est from salas where id = p_sala_id;
      if not ((v_est->'ja_escolheu') ? v_h.user_id::text)
         and now() > (v_est->'prazos'->>(v_h.user_id::text))::timestamptz + interval '2 seconds' then
        perform fd_autoescolher(p_sala_id, v_h.user_id);
      end if;
    end loop;
    perform fd_checar_fim_rodada(p_sala_id);

  elsif v_est->>'fase' = 'tatica' and now() >= (v_est->>'tatica_ate')::timestamptz then
    select coalesce(jsonb_object_agg(sj.user_id::text, coalesce(v_est->'taticas'->>(sj.user_id::text), 'equilibrada')), '{}'::jsonb)
      into v_taticas from sala_jogadores sj where sj.sala_id = p_sala_id;
    perform fd_publicar(p_sala_id, jsonb_build_object('taticas', v_taticas, 'fase', 'prontos'));
  end if;

  return (select estado from salas where id = p_sala_id);
end;
$$;

create or replace function fd_definir_tatica(p_sala_id uuid, p_tatica text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
  v_humanos int;
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found or v_sala.jogo <> 'draft' then
    raise exception 'sala nao encontrada';
  end if;
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = v_uid) then
    raise exception 'voce nao esta nessa sala';
  end if;
  if v_sala.estado->>'fase' <> 'tatica' then
    raise exception 'a tatica ja foi fechada';
  end if;
  if p_tatica not in ('ofensiva', 'equilibrada', 'defensiva') then
    raise exception 'tatica invalida';
  end if;

  perform fd_publicar(p_sala_id, jsonb_build_object(
    'taticas', coalesce(v_sala.estado->'taticas', '{}'::jsonb) || jsonb_build_object(v_uid::text, p_tatica)));

  select count(*) into v_humanos from sala_jogadores where sala_id = p_sala_id;
  if (select count(*) from jsonb_object_keys((select estado->'taticas' from salas where id = p_sala_id))) >= v_humanos then
    perform fd_publicar(p_sala_id, jsonb_build_object('fase', 'prontos'));
  end if;
end;
$$;

-- Opções da rodada atual: jogadores com a letra sorteada (inclusive os já pegos, com "pego_por"),
-- e em quais das MINHAS vagas abertas cada um encaixa.
create or replace function fd_elegiveis(p_sala_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_est jsonb;
  v_form text;
begin
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = v_uid) then
    raise exception 'voce nao esta nessa sala';
  end if;
  select estado into v_est from salas where id = p_sala_id;
  if v_est->>'fase' <> 'draft' then
    return '[]'::jsonb;
  end if;
  v_form := coalesce(v_est->'formacoes'->>(v_uid::text), '4-3-3');

  return coalesce((
    select jsonb_agg(x order by (x->>'overall')::int desc, x->>'nome') from (
      select jsonb_build_object(
        'pid', j.pid, 'nome', j.nome, 'nome_completo', j.nome_completo, 'posicoes', to_jsonb(j.posicoes),
        'clube', j.clube, 'liga', j.liga, 'pais', j.pais, 'overall', j.overall, 'letras', j.letras,
        'pego_por', (select sj.nome from fd_escolhas e join sala_jogadores sj on sj.sala_id = e.sala_id and sj.user_id = e.user_id
                     where e.sala_id = p_sala_id and e.jogador_pid = j.pid),
        'slots', (select coalesce(jsonb_agg(l.i order by l.i), '[]'::jsonb) from (
                    select i, f.slots[i] as r from fd_formacoes f, generate_series(1, 11) i
                    where f.nome = v_form
                      and not exists (select 1 from fd_escolhas e where e.sala_id = p_sala_id and e.user_id = v_uid and e.slot = i)
                  ) l where j.posicoes && fd_aceita(l.r))
      ) as x
      from fd_jogadores j
      where j.pool = fd_pool(v_est) and (fd_liga(v_est) is null or j.liga = fd_liga(v_est))
        and fd_casa_letra(j.letras, v_est->>'letra')
      order by j.overall desc
      limit 200
    ) s
  ), '[]'::jsonb);
end;
$$;

-- Times de todos os humanos da sala (com os dados dos jogadores escolhidos).
create or replace function fd_times(p_sala_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_est jsonb;
begin
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = auth.uid()) then
    raise exception 'voce nao esta nessa sala';
  end if;
  select estado into v_est from salas where id = p_sala_id;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'user_id', sj.user_id,
      'nome', sj.nome,
      'formacao', coalesce(v_est->'formacoes'->>(sj.user_id::text), '4-3-3'),
      'tatica', coalesce(v_est->'taticas'->>(sj.user_id::text), 'equilibrada'),
      'picks', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'slot', e.slot, 'rodada', e.rodada, 'auto', e.auto, 'pid', j.pid, 'nome', j.nome, 'nome_completo', j.nome_completo,
          'posicoes', to_jsonb(j.posicoes), 'clube', j.clube, 'liga', j.liga, 'pais', j.pais, 'overall', j.overall,
          'ritmo', j.ritmo, 'chute', j.chute, 'passe', j.passe, 'drible', j.drible, 'defesa', j.defesa, 'fisico', j.fisico,
          'agressividade', j.agressividade, 'penaltis', j.penaltis, 'goleiro', j.goleiro
        ) order by e.slot), '[]'::jsonb)
        from fd_escolhas e join fd_jogadores j on j.pid = e.jogador_pid
        where e.sala_id = p_sala_id and e.user_id = sj.user_id
      )
    ) order by sj.entrou_em)
    from sala_jogadores sj where sj.sala_id = p_sala_id
  ), '[]'::jsonb);
end;
$$;

-- Permissões: tudo interno fechado; só as RPCs do cliente liberadas pra sessões (anônimas incluídas).
revoke all on function fd_max_jogadores() from public, anon, authenticated;
revoke all on function fd_rodadas() from public, anon, authenticated;
revoke all on function fd_segundos_escolha() from public, anon, authenticated;
revoke all on function fd_publicar(uuid, jsonb) from public, anon, authenticated;
revoke all on function fd_pool(jsonb) from public, anon, authenticated;
revoke all on function fd_liga(jsonb) from public, anon, authenticated;
revoke all on function fd_casa_letra(text, text) from public, anon, authenticated;
revoke all on function fd_pode_algum(text[], text[]) from public, anon, authenticated;
revoke all on function fd_aceita(text) from public, anon, authenticated;
revoke all on function fd_rotulos_livres(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function fd_abrir_rodada(uuid, int) from public, anon, authenticated;
revoke all on function fd_registrar_escolha(uuid, uuid, int, int, boolean) from public, anon, authenticated;
revoke all on function fd_checar_fim_rodada(uuid) from public, anon, authenticated;
revoke all on function fd_autoescolher(uuid, uuid) from public, anon, authenticated;
revoke all on function iniciar_partida_draft(uuid) from public, anon, authenticated;

grant execute on function fd_configurar(uuid, text, text, int) to authenticated;
grant execute on function fd_ligas() to authenticated;
grant execute on function fd_definir_formacao(uuid, text) to authenticated;
grant execute on function fd_escolher(uuid, int, int) to authenticated;
grant execute on function fd_avancar(uuid) to authenticated;
grant execute on function fd_definir_tatica(uuid, text) to authenticated;
grant execute on function fd_elegiveis(uuid) to authenticated;
grant execute on function fd_times(uuid) to authenticated;
revoke all on function fd_configurar(uuid, text, text, int) from public, anon;
revoke all on function fd_ligas() from public, anon;
revoke all on function fd_definir_formacao(uuid, text) from public, anon;
revoke all on function fd_escolher(uuid, int, int) from public, anon;
revoke all on function fd_avancar(uuid) from public, anon;
revoke all on function fd_definir_tatica(uuid, text) from public, anon;
revoke all on function fd_elegiveis(uuid) from public, anon;
revoke all on function fd_times(uuid) from public, anon;
