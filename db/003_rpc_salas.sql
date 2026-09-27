-- Funções RPC genéricas de sala (criar, entrar, iniciar). Toda escrita nas tabelas de
-- db/001_salas.sql passa por aqui — são "security definer" pra poder escrever apesar de
-- não existir policy de insert/update direta, e travam a linha da sala (`for update`)
-- antes de validar, pra não corromper o estado se duas chamadas chegarem quase juntas.

create or replace function gerar_codigo_sala()
returns text
language plpgsql
as $$
declare
  v_codigo text;
  v_existe boolean;
begin
  loop
    v_codigo := lpad(floor(random() * 1000000)::text, 6, '0');
    select exists(
      select 1 from salas where codigo = v_codigo and status <> 'finalizado'
    ) into v_existe;
    exit when not v_existe;
  end loop;
  return v_codigo;
end;
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
  if p_jogo not in ('manada', 'themind') then
    raise exception 'jogo invalido: %', p_jogo;
  end if;
  if coalesce(trim(p_nome), '') = '' then
    raise exception 'nome obrigatorio';
  end if;

  v_codigo := gerar_codigo_sala();

  insert into salas (codigo, jogo, status, host_id, estado)
  values (v_codigo, p_jogo, 'lobby', v_uid, '{}'::jsonb)
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

  -- Depois que a partida comeca, so quem ja e jogador dessa sala pode "entrar"
  -- de novo (reconexao apos reload/celular travar) -- gente nova nao pode mais.
  if v_sala.status <> 'lobby' then
    if not exists(select 1 from sala_jogadores where sala_id = v_sala.id and user_id = v_uid) then
      raise exception 'essa partida ja comecou';
    end if;
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

-- Ponto de entrada único e ESTÁVEL pra iniciar qualquer partida: valida o que é comum
-- a todos os jogos (host, status, mínimo de jogadores) e despacha pra uma função
-- "iniciar_partida_<jogo>" específica, que prepara o estado inicial daquele jogo.
--
-- Importante: isso é despacho por CONTEÚDO (if/elsif), não CREATE OR REPLACE da mesma
-- função por outro arquivo — se cada jogo sobrescrevesse "iniciar_partida" inteira,
-- o último migration rodado apagaria a lógica do jogo anterior. Ao adicionar um novo
-- jogo (ex.: The Mind), edite este arquivo e acrescente mais um "elsif".
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
  if v_total_jogadores < 3 then
    raise exception 'precisa de pelo menos 3 jogadores';
  end if;

  if v_sala.jogo = 'manada' then
    return iniciar_partida_manada(p_sala_id, v_total_jogadores);
  end if;

  raise exception 'jogo % ainda nao tem iniciar_partida implementado', v_sala.jogo;
end;
$$;

grant execute on function gerar_codigo_sala() to anon, authenticated;
grant execute on function criar_sala(text, text) to anon, authenticated;
grant execute on function entrar_sala(text, text) to anon, authenticated;
grant execute on function iniciar_partida(uuid) to anon, authenticated;
