-- Funções RPC do The Mind. Rode depois de db/005_themind.sql e db/003_rpc_salas.sql.
--
-- O núcleo delicado aqui é jogar_carta: qualquer jogador pode jogar a qualquer
-- momento (sem turno), e se dois jogadores jogarem quase ao mesmo tempo, a
-- ordem de validação importa. Por isso toda função trava a linha da sala
-- (`for update`) antes de mexer em qualquer mão — quem chegar depois espera
-- a transação anterior terminar e enxerga o estado já atualizado.

-- Distribui uma rodada nova: baralho de 1 a 100 embaralhado, sem repetição,
-- "rodada" cartas pra cada jogador. Chamada por iniciar_partida_themind e,
-- internamente, sempre que uma rodada é concluída.
create or replace function distribuir_rodada_themind(p_sala_id uuid, p_rodada int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jogador record;
  v_baralho int[];
  v_offset int := 0;
begin
  select array_agg(n order by random()) into v_baralho from generate_series(1, 100) as n;

  delete from themind_maos where sala_id = p_sala_id and rodada = p_rodada;

  for v_jogador in select user_id from sala_jogadores where sala_id = p_sala_id order by entrou_em loop
    insert into themind_maos (sala_id, rodada, user_id, cartas)
    values (
      p_sala_id, p_rodada, v_jogador.user_id,
      (select array_agg(v_baralho[i]) from generate_series(v_offset + 1, v_offset + p_rodada) as i)
    );
    v_offset := v_offset + p_rodada;
  end loop;
end;
$$;

-- Chamada por iniciar_partida() (db/003_rpc_salas.sql). Monta o estado
-- inicial: 5 vidas, 2 shurikens, rodada 1.
create or replace function iniciar_partida_themind(p_sala_id uuid, p_total_jogadores int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cartas_restantes jsonb;
begin
  perform distribuir_rodada_themind(p_sala_id, 1);

  select jsonb_object_agg(user_id::text, 1) into v_cartas_restantes
  from sala_jogadores where sala_id = p_sala_id;

  update salas
    set status = 'em_andamento',
        estado = jsonb_build_object(
          'rodada', 1,
          'vidas', 5,
          'shurikens', 2,
          'cartas_restantes', v_cartas_restantes,
          'historico', '[]'::jsonb,
          'vencedor', null
        ),
        atualizada_em = now()
    where id = p_sala_id;

  return (select estado from salas where id = p_sala_id);
end;
$$;

-- Um jogador joga uma carta (sempre a menor da própria mão — não existe
-- motivo estratégico pra jogar outra). Verifica TODAS as mãos da rodada
-- atrás de cartas menores; se existir alguma, descarta todas elas (de
-- qualquer dono) revelando, e custa exatamente 1 vida pelo evento inteiro,
-- não por carta. Se a rodada esvaziar, avança pra próxima (ou declara
-- vitória na 7ª); se as vidas zerarem, encerra em derrota.
create or replace function jogar_carta(p_sala_id uuid, p_carta int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
  v_rodada int;
  v_minha_mao int[];
  v_registro record;
  v_menores int[] := '{}';
  v_perdeu_vida boolean := false;
  v_historico jsonb;
  v_cartas_restantes jsonb;
  v_todas_vazias boolean;
  v_nome text;
  v_nova_vida int;
  v_shurikens int;
begin
  if v_uid is null then
    raise exception 'sessao anonima ausente';
  end if;

  select * into v_sala from salas where id = p_sala_id for update;
  if not found then
    raise exception 'sala nao encontrada';
  end if;
  if v_sala.status <> 'em_andamento' then
    raise exception 'partida nao esta em andamento';
  end if;

  v_rodada := (v_sala.estado->>'rodada')::int;

  select cartas into v_minha_mao from themind_maos
    where sala_id = p_sala_id and rodada = v_rodada and user_id = v_uid;
  if v_minha_mao is null or not (p_carta = any(v_minha_mao)) then
    raise exception 'essa carta nao esta na sua mao';
  end if;

  update themind_maos set cartas = array_remove(cartas, p_carta)
    where sala_id = p_sala_id and rodada = v_rodada and user_id = v_uid;

  select nome into v_nome from sala_jogadores where sala_id = p_sala_id and user_id = v_uid;

  for v_registro in
    select cartas from themind_maos where sala_id = p_sala_id and rodada = v_rodada
  loop
    v_menores := v_menores || coalesce(
      (select array_agg(c) from unnest(v_registro.cartas) as c where c < p_carta),
      '{}'::int[]
    );
  end loop;

  v_historico := coalesce(v_sala.estado->'historico', '[]'::jsonb);

  if array_length(v_menores, 1) > 0 then
    update themind_maos
      set cartas = (select coalesce(array_agg(c), '{}') from unnest(cartas) as c where c >= p_carta)
      where sala_id = p_sala_id and rodada = v_rodada;
    v_perdeu_vida := true;
    v_historico := v_historico || jsonb_build_object(
      'valor', p_carta, 'nome', v_nome, 'tipo', 'descarte', 'descartadas', to_jsonb(v_menores)
    );
  else
    v_historico := v_historico || jsonb_build_object('valor', p_carta, 'nome', v_nome, 'tipo', 'jogada');
  end if;

  select jsonb_object_agg(user_id::text, coalesce(array_length(cartas, 1), 0))
    into v_cartas_restantes
  from themind_maos
  where sala_id = p_sala_id and rodada = v_rodada;

  v_nova_vida := (v_sala.estado->>'vidas')::int - (case when v_perdeu_vida then 1 else 0 end);

  if v_nova_vida <= 0 then
    update salas set status = 'finalizado',
      estado = estado || jsonb_build_object(
        'vidas', 0, 'historico', v_historico, 'cartas_restantes', v_cartas_restantes, 'vencedor', false
      ),
      atualizada_em = now()
      where id = p_sala_id;
    return (select estado from salas where id = p_sala_id);
  end if;

  select not exists(
    select 1 from themind_maos
    where sala_id = p_sala_id and rodada = v_rodada and array_length(cartas, 1) > 0
  ) into v_todas_vazias;

  if v_todas_vazias then
    if v_rodada >= 7 then
      update salas set status = 'finalizado',
        estado = estado || jsonb_build_object(
          'vidas', v_nova_vida, 'historico', v_historico, 'cartas_restantes', v_cartas_restantes, 'vencedor', true
        ),
        atualizada_em = now()
        where id = p_sala_id;
      return (select estado from salas where id = p_sala_id);
    end if;

    perform distribuir_rodada_themind(p_sala_id, v_rodada + 1);
    select jsonb_object_agg(user_id::text, v_rodada + 1) into v_cartas_restantes
      from sala_jogadores where sala_id = p_sala_id;
    v_shurikens := (v_sala.estado->>'shurikens')::int;

    update salas set estado = jsonb_build_object(
        'rodada', v_rodada + 1,
        'vidas', v_nova_vida + 1,
        'shurikens', v_shurikens,
        'cartas_restantes', v_cartas_restantes,
        'historico', '[]'::jsonb,
        'vencedor', null
      ),
      atualizada_em = now()
      where id = p_sala_id;
    return (select estado from salas where id = p_sala_id);
  end if;

  update salas set estado = estado || jsonb_build_object(
      'vidas', v_nova_vida, 'historico', v_historico, 'cartas_restantes', v_cartas_restantes
    ),
    atualizada_em = now()
    where id = p_sala_id;

  return (select estado from salas where id = p_sala_id);
end;
$$;

-- Qualquer jogador pode acionar (é um jogo cooperativo de confiança, como o
-- resto do jogo-role). Cada jogador que ainda tem cartas descarta a própria
-- menor, reveladas pra todos, sem custar vida. Só 2 shurikens pra partida
-- inteira, nunca renovados entre rodadas.
create or replace function usar_shuriken(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
  v_rodada int;
  v_shurikens int;
  v_registro record;
  v_menor int;
  v_historico jsonb;
  v_cartas_restantes jsonb;
  v_todas_vazias boolean;
begin
  if v_uid is null then
    raise exception 'sessao anonima ausente';
  end if;

  select * into v_sala from salas where id = p_sala_id for update;
  if not found then
    raise exception 'sala nao encontrada';
  end if;
  if v_sala.status <> 'em_andamento' then
    raise exception 'partida nao esta em andamento';
  end if;

  v_shurikens := (v_sala.estado->>'shurikens')::int;
  if v_shurikens <= 0 then
    raise exception 'nao ha mais shurikens';
  end if;

  v_rodada := (v_sala.estado->>'rodada')::int;
  v_historico := coalesce(v_sala.estado->'historico', '[]'::jsonb);

  for v_registro in
    select tm.user_id, tm.cartas, sj.nome
    from themind_maos tm
    join sala_jogadores sj on sj.sala_id = tm.sala_id and sj.user_id = tm.user_id
    where tm.sala_id = p_sala_id and tm.rodada = v_rodada and array_length(tm.cartas, 1) > 0
  loop
    select min(c) into v_menor from unnest(v_registro.cartas) as c;
    update themind_maos set cartas = array_remove(cartas, v_menor)
      where sala_id = p_sala_id and rodada = v_rodada and user_id = v_registro.user_id;
    v_historico := v_historico || jsonb_build_object('valor', v_menor, 'nome', v_registro.nome, 'tipo', 'shuriken');
  end loop;

  select jsonb_object_agg(user_id::text, coalesce(array_length(cartas, 1), 0))
    into v_cartas_restantes
  from themind_maos
  where sala_id = p_sala_id and rodada = v_rodada;

  select not exists(
    select 1 from themind_maos
    where sala_id = p_sala_id and rodada = v_rodada and array_length(cartas, 1) > 0
  ) into v_todas_vazias;

  if v_todas_vazias then
    if v_rodada >= 7 then
      update salas set status = 'finalizado',
        estado = estado || jsonb_build_object(
          'shurikens', v_shurikens - 1, 'historico', v_historico,
          'cartas_restantes', v_cartas_restantes, 'vencedor', true
        ),
        atualizada_em = now()
        where id = p_sala_id;
      return (select estado from salas where id = p_sala_id);
    end if;

    perform distribuir_rodada_themind(p_sala_id, v_rodada + 1);
    select jsonb_object_agg(user_id::text, v_rodada + 1) into v_cartas_restantes
      from sala_jogadores where sala_id = p_sala_id;

    update salas set estado = jsonb_build_object(
        'rodada', v_rodada + 1,
        'vidas', (v_sala.estado->>'vidas')::int + 1,
        'shurikens', v_shurikens - 1,
        'cartas_restantes', v_cartas_restantes,
        'historico', '[]'::jsonb,
        'vencedor', null
      ),
      atualizada_em = now()
      where id = p_sala_id;
    return (select estado from salas where id = p_sala_id);
  end if;

  update salas set estado = estado || jsonb_build_object(
      'shurikens', v_shurikens - 1, 'historico', v_historico, 'cartas_restantes', v_cartas_restantes
    ),
    atualizada_em = now()
    where id = p_sala_id;

  return (select estado from salas where id = p_sala_id);
end;
$$;

grant execute on function distribuir_rodada_themind(uuid, int) to anon, authenticated;
grant execute on function iniciar_partida_themind(uuid, int) to anon, authenticated;
grant execute on function jogar_carta(uuid, int) to anon, authenticated;
grant execute on function usar_shuriken(uuid) to anon, authenticated;
