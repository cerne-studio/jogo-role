-- P.D.F — jogo de cartas de humor ácido (18+). Rode depois de db/007_hardening.sql.
--
-- Segredos (mão de cada um e jogadas antes da revelação) vivem em tabelas com RLS "só o dono lê".
-- O baralho (`pdf_cartas`) e o controle de cartas já usadas (`pdf_usadas`) NÃO têm policy de
-- select: o cliente nunca lê o baralho, só recebe a própria mão e o estado público da rodada.
-- Toda escrita passa por RPC security definer que trava a sala (`for update`) antes de validar.
-- Estado público em salas.estado (jogo 'pdf'):
--   meta, ordem[user_id], pontuacoes{user_id:int}, rodada, juiz_id, fase ('jogando'|'julgando'|'resultado'),
--   fase_desde, preta{texto,lacunas}, total_a_jogar, jogadas_feitas, ja_jogaram[user_id],
--   respostas[{idx,textos[]}] (anônimas, embaralhadas), resultado{vencedor_id,vencedor_nome,idx,todas[]}, vencedor

alter table salas drop constraint if exists salas_jogo_check;
alter table salas add constraint salas_jogo_check check (jogo in ('manada', 'themind', 'pdf'));

create table if not exists pdf_cartas (
  id serial primary key,
  tipo char(1) not null check (tipo in ('P', 'B')),
  lacunas smallint not null default 0 check (lacunas between 0 and 2),
  tema text not null default 'vida',
  texto text not null,
  pacote text not null default 'pesado',
  status text not null default 'ativa' check (status in ('ativa', 'pendente', 'desativada')),
  criada_em timestamptz not null default now(),
  unique (tipo, texto)
);
alter table pdf_cartas enable row level security;

create table if not exists pdf_maos (
  sala_id uuid not null references salas(id) on delete cascade,
  user_id uuid not null,
  carta_id int not null references pdf_cartas(id),
  texto text not null,
  primary key (sala_id, user_id, carta_id)
);
create unique index if not exists pdf_maos_sala_carta on pdf_maos (sala_id, carta_id);
alter table pdf_maos enable row level security;
drop policy if exists "so o dono ve a propria mao pdf" on pdf_maos;
create policy "so o dono ve a propria mao pdf" on pdf_maos for select using (user_id = auth.uid());

create table if not exists pdf_jogadas (
  sala_id uuid not null references salas(id) on delete cascade,
  rodada int not null,
  user_id uuid not null,
  cartas jsonb not null,
  ordem int,
  primary key (sala_id, rodada, user_id)
);
alter table pdf_jogadas enable row level security;
drop policy if exists "so o dono ve a propria jogada pdf" on pdf_jogadas;
create policy "so o dono ve a propria jogada pdf" on pdf_jogadas for select using (user_id = auth.uid());

create table if not exists pdf_usadas (
  sala_id uuid not null references salas(id) on delete cascade,
  carta_id int not null references pdf_cartas(id),
  primary key (sala_id, carta_id)
);
alter table pdf_usadas enable row level security;

-- ---------------------------------------------------------------------------------------------
-- Internas (nunca chamadas pelo cliente)
-- ---------------------------------------------------------------------------------------------

-- Dá p_qtd brancas novas ao jogador. Se o baralho da sala acabar, reembaralha o descarte.
create or replace function pdf_comprar_brancas(p_sala_id uuid, p_user_id uuid, p_qtd int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids int[];
begin
  if p_qtd <= 0 then
    return;
  end if;

  select array_agg(id) into v_ids from (
    select c.id from pdf_cartas c
    where c.tipo = 'B' and c.status = 'ativa'
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
      where c.tipo = 'B' and c.status = 'ativa'
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

-- Sorteia uma preta ainda não usada na sala; troca {JOGADOR} por um jogador que não é o juiz.
create or replace function pdf_sortear_preta(p_sala_id uuid, p_juiz uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_carta pdf_cartas%rowtype;
  v_nome text;
begin
  select * into v_carta from pdf_cartas c
  where c.tipo = 'P' and c.status = 'ativa'
    and not exists (select 1 from pdf_usadas u where u.sala_id = p_sala_id and u.carta_id = c.id)
  order by random() limit 1;

  if not found then
    delete from pdf_usadas u
    where u.sala_id = p_sala_id and u.carta_id in (select id from pdf_cartas where tipo = 'P');
    select * into v_carta from pdf_cartas c
    where c.tipo = 'P' and c.status = 'ativa' order by random() limit 1;
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

-- Abre uma rodada: sorteia preta, completa a mão de todo mundo até 10 e publica o estado.
create or replace function pdf_iniciar_rodada(p_sala_id uuid, p_rodada int, p_juiz uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jogador record;
  v_total int;
  v_preta jsonb;
begin
  select count(*) into v_total from sala_jogadores where sala_id = p_sala_id;
  v_preta := pdf_sortear_preta(p_sala_id, p_juiz);

  for v_jogador in select user_id from sala_jogadores where sala_id = p_sala_id loop
    perform pdf_comprar_brancas(
      p_sala_id,
      v_jogador.user_id,
      10 - (select count(*) from pdf_maos where sala_id = p_sala_id and user_id = v_jogador.user_id)::int
    );
  end loop;

  delete from pdf_jogadas where sala_id = p_sala_id and rodada < p_rodada;

  update salas
    set estado = estado || jsonb_build_object(
          'rodada', p_rodada,
          'juiz_id', p_juiz,
          'fase', 'jogando',
          'fase_desde', now(),
          'preta', v_preta,
          'total_a_jogar', v_total - 1,
          'jogadas_feitas', 0,
          'ja_jogaram', '[]'::jsonb,
          'respostas', null,
          'resultado', null
        ),
        atualizada_em = now()
    where id = p_sala_id;
end;
$$;

-- Fecha a fase de jogadas: embaralha as respostas e publica só os textos (sem dono).
create or replace function pdf_publicar(p_sala_id uuid, p_rodada int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_respostas jsonb;
begin
  update pdf_jogadas j
    set ordem = s.rn - 1
  from (
    select user_id, row_number() over (order by random()) as rn
    from pdf_jogadas where sala_id = p_sala_id and rodada = p_rodada
  ) s
  where j.sala_id = p_sala_id and j.rodada = p_rodada and j.user_id = s.user_id;

  select jsonb_agg(
           jsonb_build_object('idx', j.ordem, 'textos', (select jsonb_agg(c->>'texto') from jsonb_array_elements(j.cartas) c))
           order by j.ordem
         )
    into v_respostas
  from pdf_jogadas j where j.sala_id = p_sala_id and j.rodada = p_rodada;

  update salas
    set estado = estado || jsonb_build_object(
          'fase', 'julgando',
          'fase_desde', now(),
          'respostas', coalesce(v_respostas, '[]'::jsonb)
        ),
        atualizada_em = now()
    where id = p_sala_id;
end;
$$;

-- Despachada por iniciar_partida(): monta o estado inicial e abre a rodada 1 (host é o primeiro juiz).
create or replace function iniciar_partida_pdf(p_sala_id uuid, p_total_jogadores int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid;
  v_ordem jsonb;
  v_pontos jsonb;
begin
  if p_total_jogadores > 10 then
    raise exception 'o maximo e 10 jogadores';
  end if;

  select host_id into v_host from salas where id = p_sala_id;

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
          'meta', 5,
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

-- ---------------------------------------------------------------------------------------------
-- Ponto de entrada genérico: recria iniciar_partida acrescentando o jogo 'pdf'
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
  if p_jogo not in ('manada', 'themind', 'pdf') then
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

  if v_sala.jogo = 'themind' then
    return iniciar_partida_themind(p_sala_id, v_total_jogadores);
  end if;

  if v_sala.jogo = 'pdf' then
    return iniciar_partida_pdf(p_sala_id, v_total_jogadores);
  end if;

  raise exception 'jogo % ainda nao tem iniciar_partida implementado', v_sala.jogo;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- RPCs do cliente
-- ---------------------------------------------------------------------------------------------

-- Jogador (não-juiz) entrega 1 carta (ou 2, na ordem, se a preta tem 2 lacunas).
create or replace function pdf_jogar(p_sala_id uuid, p_cartas int[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
  v_rodada int;
  v_precisa int;
  v_cartas jsonb;
  v_feitas int;
  v_total int;
begin
  if v_uid is null then
    raise exception 'sessao anonima ausente';
  end if;

  select * into v_sala from salas where id = p_sala_id for update;
  if not found then
    raise exception 'sala nao encontrada';
  end if;
  if v_sala.jogo <> 'pdf' or v_sala.status <> 'em_andamento' then
    raise exception 'partida nao esta em andamento';
  end if;
  if v_sala.estado->>'fase' <> 'jogando' then
    raise exception 'essa rodada ja fechou';
  end if;
  if not exists (select 1 from sala_jogadores where sala_id = p_sala_id and user_id = v_uid) then
    raise exception 'voce nao esta nessa sala';
  end if;
  if (v_sala.estado->>'juiz_id')::uuid = v_uid then
    raise exception 'o juiz nao joga carta';
  end if;

  v_rodada := (v_sala.estado->>'rodada')::int;
  if exists (select 1 from pdf_jogadas where sala_id = p_sala_id and rodada = v_rodada and user_id = v_uid) then
    raise exception 'voce ja jogou nessa rodada';
  end if;

  v_precisa := greatest((v_sala.estado->'preta'->>'lacunas')::int, 1);
  if p_cartas is null or coalesce(array_length(p_cartas, 1), 0) <> v_precisa then
    raise exception 'essa pergunta pede % carta(s)', v_precisa;
  end if;
  if (select count(distinct x) from unnest(p_cartas) x) <> v_precisa then
    raise exception 'carta repetida';
  end if;
  if (select count(*) from pdf_maos where sala_id = p_sala_id and user_id = v_uid and carta_id = any(p_cartas)) <> v_precisa then
    raise exception 'essa carta nao esta na sua mao';
  end if;

  select jsonb_agg(jsonb_build_object('id', m.carta_id, 'texto', m.texto) order by array_position(p_cartas, m.carta_id))
    into v_cartas
  from pdf_maos m where m.sala_id = p_sala_id and m.user_id = v_uid and m.carta_id = any(p_cartas);

  insert into pdf_jogadas (sala_id, rodada, user_id, cartas) values (p_sala_id, v_rodada, v_uid, v_cartas);
  delete from pdf_maos where sala_id = p_sala_id and user_id = v_uid and carta_id = any(p_cartas);

  select count(*) into v_feitas from pdf_jogadas where sala_id = p_sala_id and rodada = v_rodada;
  v_total := (v_sala.estado->>'total_a_jogar')::int;

  update salas
    set estado = estado || jsonb_build_object(
          'jogadas_feitas', v_feitas,
          'ja_jogaram', (select jsonb_agg(user_id) from pdf_jogadas where sala_id = p_sala_id and rodada = v_rodada)
        ),
        atualizada_em = now()
    where id = p_sala_id;

  if v_feitas >= v_total then
    perform pdf_publicar(p_sala_id, v_rodada);
  end if;

  return (select estado from salas where id = p_sala_id);
end;
$$;

-- O juiz escolhe a melhor resposta (pelo índice anônimo). Revela os donos e pontua.
create or replace function pdf_escolher(p_sala_id uuid, p_idx int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
  v_rodada int;
  v_vencedor uuid;
  v_pontos jsonb;
  v_novo int;
  v_todas jsonb;
  v_nome text;
  v_meta int;
begin
  if v_uid is null then
    raise exception 'sessao anonima ausente';
  end if;

  select * into v_sala from salas where id = p_sala_id for update;
  if not found then
    raise exception 'sala nao encontrada';
  end if;
  if v_sala.jogo <> 'pdf' or v_sala.status <> 'em_andamento' then
    raise exception 'partida nao esta em andamento';
  end if;
  if (v_sala.estado->>'juiz_id')::uuid <> v_uid then
    raise exception 'so o juiz escolhe';
  end if;
  if v_sala.estado->>'fase' <> 'julgando' then
    raise exception 'ainda nao da pra julgar';
  end if;

  v_rodada := (v_sala.estado->>'rodada')::int;
  select user_id into v_vencedor from pdf_jogadas where sala_id = p_sala_id and rodada = v_rodada and ordem = p_idx;
  if v_vencedor is null then
    raise exception 'resposta invalida';
  end if;

  v_pontos := v_sala.estado->'pontuacoes';
  v_novo := coalesce((v_pontos->>(v_vencedor::text))::int, 0) + 1;
  v_pontos := jsonb_set(v_pontos, array[v_vencedor::text], to_jsonb(v_novo));
  v_meta := (v_sala.estado->>'meta')::int;
  select nome into v_nome from sala_jogadores where sala_id = p_sala_id and user_id = v_vencedor;

  select jsonb_agg(jsonb_build_object(
           'idx', j.ordem,
           'nome', sj.nome,
           'user_id', j.user_id,
           'textos', (select jsonb_agg(c->>'texto') from jsonb_array_elements(j.cartas) c)
         ) order by j.ordem)
    into v_todas
  from pdf_jogadas j
  join sala_jogadores sj on sj.sala_id = j.sala_id and sj.user_id = j.user_id
  where j.sala_id = p_sala_id and j.rodada = v_rodada;

  update salas
    set status = case when v_novo >= v_meta then 'finalizado' else status end,
        estado = estado || jsonb_build_object(
          'fase', 'resultado',
          'fase_desde', now(),
          'pontuacoes', v_pontos,
          'resultado', jsonb_build_object('vencedor_id', v_vencedor, 'vencedor_nome', v_nome, 'idx', p_idx, 'todas', v_todas),
          'vencedor', case when v_novo >= v_meta then to_jsonb(v_vencedor) else 'null'::jsonb end
        ),
        atualizada_em = now()
    where id = p_sala_id;

  return (select estado from salas where id = p_sala_id);
end;
$$;

-- Próxima rodada: o juiz passa pro próximo da ordem. Quem aciona: juiz ou host.
create or replace function pdf_proxima(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
  v_ordem jsonb;
  v_atual int;
  v_proximo uuid;
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found then
    raise exception 'sala nao encontrada';
  end if;
  if v_sala.jogo <> 'pdf' or v_sala.status <> 'em_andamento' then
    raise exception 'partida nao esta em andamento';
  end if;
  if v_sala.estado->>'fase' <> 'resultado' then
    raise exception 'a rodada ainda nao terminou';
  end if;
  if v_uid <> v_sala.host_id and v_uid <> (v_sala.estado->>'juiz_id')::uuid then
    raise exception 'so o juiz ou o host avancam a rodada';
  end if;

  v_ordem := v_sala.estado->'ordem';
  select (i - 1)::int into v_atual
  from jsonb_array_elements_text(v_ordem) with ordinality as t(uid, i)
  where uid = v_sala.estado->>'juiz_id';
  v_proximo := (v_ordem->>(((v_atual + 1) % jsonb_array_length(v_ordem))::int))::uuid;

  perform pdf_iniciar_rodada(p_sala_id, (v_sala.estado->>'rodada')::int + 1, v_proximo);

  return (select estado from salas where id = p_sala_id);
end;
$$;

-- Destrava a rodada quando alguém sumiu. Só o host. Espera 45s (jogando) ou 60s (julgando).
-- jogando: fecha com quem já jogou (se ninguém jogou, pula a rodada). julgando: pula a rodada sem ponto.
create or replace function pdf_pular(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
  v_rodada int;
  v_fase text;
  v_desde timestamptz;
  v_feitas int;
  v_ordem jsonb;
  v_atual int;
  v_proximo uuid;
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found then
    raise exception 'sala nao encontrada';
  end if;
  if v_sala.jogo <> 'pdf' or v_sala.status <> 'em_andamento' then
    raise exception 'partida nao esta em andamento';
  end if;
  if v_sala.host_id <> v_uid then
    raise exception 'so o host pode pular';
  end if;

  v_fase := v_sala.estado->>'fase';
  v_desde := (v_sala.estado->>'fase_desde')::timestamptz;
  v_rodada := (v_sala.estado->>'rodada')::int;

  if v_fase = 'jogando' then
    if now() - v_desde < interval '45 seconds' then
      raise exception 'espere mais um pouco antes de pular';
    end if;
    select count(*) into v_feitas from pdf_jogadas where sala_id = p_sala_id and rodada = v_rodada;
    if v_feitas >= 1 then
      update salas set estado = estado || jsonb_build_object('total_a_jogar', v_feitas) where id = p_sala_id;
      perform pdf_publicar(p_sala_id, v_rodada);
      return (select estado from salas where id = p_sala_id);
    end if;
  elsif v_fase = 'julgando' then
    if now() - v_desde < interval '60 seconds' then
      raise exception 'espere mais um pouco antes de pular';
    end if;
  else
    raise exception 'nada pra pular agora';
  end if;

  v_ordem := v_sala.estado->'ordem';
  select (i - 1)::int into v_atual
  from jsonb_array_elements_text(v_ordem) with ordinality as t(uid, i)
  where uid = v_sala.estado->>'juiz_id';
  v_proximo := (v_ordem->>(((v_atual + 1) % jsonb_array_length(v_ordem))::int))::uuid;

  perform pdf_iniciar_rodada(p_sala_id, v_rodada + 1, v_proximo);

  return (select estado from salas where id = p_sala_id);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Permissões
-- ---------------------------------------------------------------------------------------------
revoke all on function pdf_comprar_brancas(uuid, uuid, int) from public, anon, authenticated;
revoke all on function pdf_sortear_preta(uuid, uuid) from public, anon, authenticated;
revoke all on function pdf_iniciar_rodada(uuid, int, uuid) from public, anon, authenticated;
revoke all on function pdf_publicar(uuid, int) from public, anon, authenticated;
revoke all on function iniciar_partida_pdf(uuid, int) from public, anon, authenticated;

revoke all on function pdf_jogar(uuid, int[]) from public, anon;
revoke all on function pdf_escolher(uuid, int) from public, anon;
revoke all on function pdf_proxima(uuid) from public, anon;
revoke all on function pdf_pular(uuid) from public, anon;
grant execute on function pdf_jogar(uuid, int[]) to authenticated;
grant execute on function pdf_escolher(uuid, int) to authenticated;
grant execute on function pdf_proxima(uuid) to authenticated;
grant execute on function pdf_pular(uuid) to authenticated;
