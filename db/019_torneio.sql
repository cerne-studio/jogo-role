-- Campeonato do Draft FC (grupos + mata-mata, bots de clubes reais). Rode depois de db/018_draft_clubes.sql.
--
-- Quem decide os resultados é UM celular: o primeiro que chega com a versão certa publica (fd_torneio_publicar) e os
-- outros só leem. O servidor guarda o estado do campeonato (fd_torneio.dados), a simulação completa dos jogos com
-- humano (fd_partidas, pra eles assistirem) e controla quem já deu "continuar" antes da próxima etapa.
-- Estado público em salas.estado (fase 'torneio'): torneio_v, ativos[user_id], prontos[user_id], liberado, etapa_desde.

drop function if exists fd_configurar(uuid, text, text, int);

create table if not exists fd_torneio (
  sala_id uuid primary key references salas(id) on delete cascade,
  versao int not null default 1,
  dados jsonb not null,
  atualizado_em timestamptz not null default now()
);
alter table fd_torneio enable row level security;

create table if not exists fd_partidas (
  sala_id uuid not null references salas(id) on delete cascade,
  jogo_id text not null,
  sim jsonb not null,
  primary key (sala_id, jogo_id)
);
alter table fd_partidas enable row level security;

create or replace function fd_configurar(p_sala_id uuid, p_modo text, p_liga text, p_torneio int, p_dificuldade text default 'normal')
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
  if p_dificuldade not in ('facil', 'normal', 'dificil') then
    raise exception 'dificuldade invalida';
  end if;
  if p_modo = 'atual' and not exists (select 1 from fd_jogadores where pool = 'atual') then
    raise exception 'o modo atual ainda nao tem jogadores carregados';
  end if;
  if p_modo = 'liga' and (select count(*) from fd_jogadores where pool = 'hist' and liga = p_liga) < 150 then
    raise exception 'liga sem jogadores suficientes';
  end if;
  if p_modo = 'liga' and (select count(*) from fd_clubes where pool = 'hist' and liga = p_liga) < p_torneio - 1 then
    raise exception 'essa liga nao tem clubes suficientes pra um campeonato de % times', p_torneio;
  end if;

  v_config := jsonb_build_object('modo', p_modo, 'liga', case when p_modo = 'liga' then p_liga else null end,
                                 'torneio', p_torneio, 'dificuldade', p_dificuldade);
  perform fd_publicar(p_sala_id, jsonb_build_object('config', v_config));
  return v_config;
end;
$$;

-- Monta os times do campeonato (humanos do draft + clubes reais) e abre a fase 'torneio'. Qualquer jogador da sala chama.
create or replace function fd_torneio_preparar(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sala salas%rowtype;
  v_est jsonb;
  v_cfg jsonb;
  v_tam int;
  v_humanos jsonb;
  v_bots jsonb;
  v_n int;
  v_pool text;
  v_liga text;
  v_dif text;
  v_vies numeric;
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found or v_sala.jogo <> 'draft' then
    raise exception 'sala nao encontrada';
  end if;
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = auth.uid()) then
    raise exception 'voce nao esta nessa sala';
  end if;
  if exists (select 1 from fd_torneio where sala_id = p_sala_id) then
    return jsonb_build_object('versao', (select versao from fd_torneio where sala_id = p_sala_id));
  end if;
  v_est := v_sala.estado;
  if coalesce(v_est->>'fase', '') <> 'prontos' then
    raise exception 'o draft ainda nao terminou';
  end if;

  v_cfg := v_est->'config';
  v_tam := coalesce((v_cfg->>'torneio')::int, 8);
  v_pool := fd_pool(v_est);
  v_liga := fd_liga(v_est);
  v_dif := coalesce(v_cfg->>'dificuldade', 'normal');
  v_vies := case v_dif when 'facil' then -0.8 when 'dificil' then 0.8 else 0 end;

  select jsonb_agg(jsonb_build_object(
    'id', 'h' || substr(t->>'user_id', 1, 8),
    'nome', (t->>'nome') || ' FC',
    'sigla', upper(left(coalesce(nullif(regexp_replace(t->>'nome', '[^A-Za-z]', '', 'g'), ''), 'XXX') || 'XXX', 3)),
    'tipo', 'humano', 'user_id', t->>'user_id',
    'formacao', t->>'formacao', 'tatica', t->>'tatica', 'picks', t->'picks'
  )) into v_humanos
  from jsonb_array_elements(fd_times(p_sala_id)) t;

  v_n := v_tam - jsonb_array_length(v_humanos);
  if v_n < 0 then
    raise exception 'humanos demais pro campeonato';
  end if;

  select coalesce(jsonb_agg(b), '[]'::jsonb) into v_bots from (
    select jsonb_build_object(
      'id', 'b' || c.clube_id, 'nome', c.nome, 'sigla', c.sigla, 'tipo', 'bot', 'clube_id', c.clube_id, 'liga', c.liga,
      'versao', c.versao, 'formacao', c.formacao, 'overall', c.overall, 'picks', c.picks,
      'tatica', (array['equilibrada', 'equilibrada', 'ofensiva', 'defensiva'])[1 + floor(random() * 4)::int]
    ) as b
    from (
      select *, percent_rank() over (order by overall) as pct
      from fd_clubes where pool = v_pool and (v_liga is null or liga = v_liga)
    ) c
    order by (random() + v_vies * c.pct) desc
    limit v_n
  ) s;

  if jsonb_array_length(v_bots) < v_n then
    raise exception 'faltam clubes pra completar o campeonato (carregue fd_clubes)';
  end if;

  insert into fd_torneio (sala_id, versao, dados)
  values (p_sala_id, 1, jsonb_build_object('times', v_humanos || v_bots, 'tamanho', v_tam, 'semente', p_sala_id::text));

  perform fd_publicar(p_sala_id, jsonb_build_object('fase', 'torneio', 'torneio_v', 1, 'prontos', '[]'::jsonb, 'ativos', '[]'::jsonb, 'liberado', false, 'etapa_desde', now()));
  return jsonb_build_object('versao', 1);
end;
$$;

create or replace function fd_torneio_obter(p_sala_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = auth.uid()) then
    raise exception 'voce nao esta nessa sala';
  end if;
  return (select jsonb_build_object('versao', versao, 'dados', dados) from fd_torneio where sala_id = p_sala_id);
end;
$$;

-- Publica o novo estado do campeonato (e a simulação completa dos jogos com humano). Só vale se a versão ainda for a mesma.
create or replace function fd_torneio_publicar(p_sala_id uuid, p_versao int, p_dados jsonb, p_partidas jsonb, p_ativos jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sala salas%rowtype;
  v_atual int;
  v_jogo text;
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found or v_sala.jogo <> 'draft' then
    raise exception 'sala nao encontrada';
  end if;
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = auth.uid()) then
    raise exception 'voce nao esta nessa sala';
  end if;
  select versao into v_atual from fd_torneio where sala_id = p_sala_id;
  if v_atual is null or v_atual <> p_versao then
    return jsonb_build_object('ok', false, 'motivo', 'desatualizado');
  end if;

  update fd_torneio set dados = p_dados, versao = v_atual + 1, atualizado_em = now() where sala_id = p_sala_id;
  for v_jogo in select jsonb_object_keys(coalesce(p_partidas, '{}'::jsonb)) loop
    insert into fd_partidas (sala_id, jogo_id, sim) values (p_sala_id, v_jogo, p_partidas->v_jogo)
    on conflict (sala_id, jogo_id) do update set sim = excluded.sim;
  end loop;

  perform fd_publicar(p_sala_id, jsonb_build_object(
    'torneio_v', v_atual + 1, 'prontos', '[]'::jsonb, 'ativos', coalesce(p_ativos, '[]'::jsonb), 'liberado', false, 'etapa_desde', now()));
  return jsonb_build_object('ok', true, 'versao', v_atual + 1);
end;
$$;

create or replace function fd_partida_obter(p_sala_id uuid, p_jogo_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = auth.uid()) then
    raise exception 'voce nao esta nessa sala';
  end if;
  return (select sim from fd_partidas where sala_id = p_sala_id and jogo_id = p_jogo_id);
end;
$$;

-- "Continuar": o humano terminou de assistir. Quando todos que jogam nessa etapa deram continuar (ou ninguém joga),
-- a etapa é liberada e um celular publica a seguinte.
create or replace function fd_torneio_continuar(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
  v_prontos jsonb;
  v_ativos jsonb;
  v_todos boolean;
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found or v_sala.jogo <> 'draft' then
    raise exception 'sala nao encontrada';
  end if;
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = v_uid) then
    raise exception 'voce nao esta nessa sala';
  end if;
  if v_sala.estado->>'fase' <> 'torneio' then
    raise exception 'o campeonato nao esta rolando';
  end if;

  v_ativos := coalesce(v_sala.estado->'ativos', '[]'::jsonb);
  v_prontos := coalesce(v_sala.estado->'prontos', '[]'::jsonb);
  if not (v_prontos ? v_uid::text) then
    v_prontos := v_prontos || to_jsonb(v_uid::text);
  end if;
  v_todos := jsonb_array_length(v_ativos) = 0
    or not exists (select 1 from jsonb_array_elements_text(v_ativos) a where not (v_prontos ? a));

  perform fd_publicar(p_sala_id, jsonb_build_object('prontos', v_prontos, 'liberado', v_todos));
  return jsonb_build_object('liberado', v_todos);
end;
$$;

-- Passou muito tempo e alguém não deu "continuar": libera a etapa mesmo assim.
create or replace function fd_torneio_forcar(p_sala_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sala salas%rowtype;
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found or v_sala.jogo <> 'draft' then
    raise exception 'sala nao encontrada';
  end if;
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = auth.uid()) then
    raise exception 'voce nao esta nessa sala';
  end if;
  if v_sala.estado->>'fase' = 'torneio' and coalesce((v_sala.estado->>'liberado')::boolean, false) = false
     and now() > (v_sala.estado->>'etapa_desde')::timestamptz + interval '210 seconds' then
    perform fd_publicar(p_sala_id, jsonb_build_object('liberado', true));
  end if;
end;
$$;

revoke all on function fd_configurar(uuid, text, text, int, text) from public, anon;
revoke all on function fd_torneio_preparar(uuid) from public, anon;
revoke all on function fd_torneio_obter(uuid) from public, anon;
revoke all on function fd_torneio_publicar(uuid, int, jsonb, jsonb, jsonb) from public, anon;
revoke all on function fd_partida_obter(uuid, text) from public, anon;
revoke all on function fd_torneio_continuar(uuid) from public, anon;
revoke all on function fd_torneio_forcar(uuid) from public, anon;
grant execute on function fd_configurar(uuid, text, text, int, text) to authenticated;
grant execute on function fd_torneio_preparar(uuid) to authenticated;
grant execute on function fd_torneio_obter(uuid) to authenticated;
grant execute on function fd_torneio_publicar(uuid, int, jsonb, jsonb, jsonb) to authenticated;
grant execute on function fd_partida_obter(uuid, text) to authenticated;
grant execute on function fd_torneio_continuar(uuid) to authenticated;
grant execute on function fd_torneio_forcar(uuid) to authenticated;
