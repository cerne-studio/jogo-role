-- Pacotes de cartas do P.D.F: 'pesado' (o baralho original) e 'extremo' (sem censura, explícito).
-- Rode depois de db/011_pdf_max_jogadores.sql. O host escolhe no lobby (padrão: 'extremo' = tudo ligado).
--   'pesado'  -> só cartas com pacote 'pesado'
--   'extremo' -> cartas 'pesado' + 'extremo'
-- O sorteio de pretas e brancas filtra pelo pacote gravado em salas.estado->>'pacote'.

create or replace function pdf_pacotes_da_sala(p_sala_id uuid)
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select case
    when coalesce((select estado->>'pacote' from salas where id = p_sala_id), 'extremo') = 'pesado'
      then array['pesado']
    else array['pesado', 'extremo']
  end
$$;

create or replace function pdf_definir_pacote(p_sala_id uuid, p_pacote text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
begin
  if v_uid is null then
    raise exception 'sessao anonima ausente';
  end if;

  select * into v_sala from salas where id = p_sala_id for update;
  if not found then
    raise exception 'sala nao encontrada';
  end if;
  if v_sala.jogo <> 'pdf' then
    raise exception 'jogo invalido';
  end if;
  if v_sala.host_id <> v_uid then
    raise exception 'so o host escolhe o pacote';
  end if;
  if v_sala.status <> 'lobby' then
    raise exception 'a partida ja comecou';
  end if;
  if p_pacote not in ('pesado', 'extremo') then
    raise exception 'pacote invalido';
  end if;

  update salas
    set estado = estado || jsonb_build_object('pacote', p_pacote),
        atualizada_em = now()
    where id = p_sala_id;

  return (select estado from salas where id = p_sala_id);
end;
$$;

create or replace function pdf_comprar_brancas(p_sala_id uuid, p_user_id uuid, p_qtd int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids int[];
  v_pacotes text[] := pdf_pacotes_da_sala(p_sala_id);
begin
  if p_qtd <= 0 then
    return;
  end if;

  select array_agg(id) into v_ids from (
    select c.id from pdf_cartas c
    where c.tipo = 'B' and c.status = 'ativa' and c.pacote = any(v_pacotes)
      and not exists (select 1 from pdf_usadas u where u.sala_id = p_sala_id and u.carta_id = c.id)
    order by random() limit p_qtd
  ) s;

  if coalesce(array_length(v_ids, 1), 0) < p_qtd then
    delete from pdf_usadas u
    where u.sala_id = p_sala_id
      and u.carta_id in (select id from pdf_cartas where tipo = 'B')
      and not exists (select 1 from pdf_maos m where m.sala_id = p_sala_id and m.carta_id = u.carta_id);

    select array_agg(id) into v_ids from (
      select c.id from pdf_cartas c
      where c.tipo = 'B' and c.status = 'ativa' and c.pacote = any(v_pacotes)
        and not exists (select 1 from pdf_usadas u where u.sala_id = p_sala_id and u.carta_id = c.id)
      order by random() limit p_qtd
    ) s;
  end if;

  insert into pdf_maos (sala_id, user_id, carta_id, texto)
  select p_sala_id, p_user_id, c.id, c.texto from pdf_cartas c where c.id = any(coalesce(v_ids, '{}'));

  insert into pdf_usadas (sala_id, carta_id)
  select p_sala_id, unnest(coalesce(v_ids, '{}')) on conflict do nothing;
end;
$$;

create or replace function pdf_sortear_preta(p_sala_id uuid, p_juiz uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_carta pdf_cartas%rowtype;
  v_nome text;
  v_pacotes text[] := pdf_pacotes_da_sala(p_sala_id);
begin
  select * into v_carta from pdf_cartas c
  where c.tipo = 'P' and c.status = 'ativa' and c.pacote = any(v_pacotes)
    and not exists (select 1 from pdf_usadas u where u.sala_id = p_sala_id and u.carta_id = c.id)
  order by random() limit 1;

  if not found then
    delete from pdf_usadas u
    where u.sala_id = p_sala_id and u.carta_id in (select id from pdf_cartas where tipo = 'P');
    select * into v_carta from pdf_cartas c
    where c.tipo = 'P' and c.status = 'ativa' and c.pacote = any(v_pacotes) order by random() limit 1;
  end if;

  if not found then
    raise exception 'baralho sem cartas pretas';
  end if;

  insert into pdf_usadas (sala_id, carta_id) values (p_sala_id, v_carta.id) on conflict do nothing;

  select nome into v_nome from sala_jogadores
  where sala_id = p_sala_id and user_id <> p_juiz order by random() limit 1;

  return jsonb_build_object(
    'texto', replace(v_carta.texto, '{JOGADOR}', coalesce(v_nome, 'alguem')),
    'lacunas', v_carta.lacunas
  );
end;
$$;

create or replace function iniciar_partida_pdf(p_sala_id uuid, p_total_jogadores int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid;
  v_meta int;
  v_pacote text;
  v_ordem jsonb;
  v_pontos jsonb;
begin
  if p_total_jogadores > pdf_max_jogadores() then
    raise exception 'o maximo e % jogadores', pdf_max_jogadores();
  end if;

  select host_id, coalesce((estado->>'meta')::int, 5), coalesce(estado->>'pacote', 'extremo')
    into v_host, v_meta, v_pacote
  from salas where id = p_sala_id;
  if v_meta not in (3, 5, 7) then
    v_meta := 5;
  end if;
  if v_pacote not in ('pesado', 'extremo') then
    v_pacote := 'extremo';
  end if;

  select jsonb_agg(user_id order by (user_id = v_host) desc, entrou_em),
         jsonb_object_agg(user_id::text, 0)
    into v_ordem, v_pontos
  from sala_jogadores where sala_id = p_sala_id;

  delete from pdf_maos where sala_id = p_sala_id;
  delete from pdf_jogadas where sala_id = p_sala_id;
  delete from pdf_usadas where sala_id = p_sala_id;

  update salas
    set status = 'em_andamento',
        estado = jsonb_build_object(
          'meta', v_meta,
          'pacote', v_pacote,
          'ordem', v_ordem,
          'pontuacoes', v_pontos,
          'vencedor', null
        ),
        atualizada_em = now()
    where id = p_sala_id;

  perform pdf_iniciar_rodada(p_sala_id, 1, v_host);

  return (select estado from salas where id = p_sala_id);
end;
$$;

revoke all on function pdf_pacotes_da_sala(uuid) from public, anon, authenticated;
revoke all on function pdf_comprar_brancas(uuid, uuid, int) from public, anon, authenticated;
revoke all on function pdf_sortear_preta(uuid, uuid) from public, anon, authenticated;
revoke all on function iniciar_partida_pdf(uuid, int) from public, anon, authenticated;
revoke all on function pdf_definir_pacote(uuid, text) from public, anon;
grant execute on function pdf_definir_pacote(uuid, text) to authenticated;
