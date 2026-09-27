-- Funções RPC do Efeito Manada. Rode depois de db/002_manada.sql e db/003_rpc_salas.sql.

create or replace function normalizar_resposta(p_texto text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select trim(
    regexp_replace(
      regexp_replace(lower(extensions.unaccent(coalesce(p_texto, ''))), '[^a-z0-9]+', ' ', 'g'),
      '\s+', ' ', 'g'
    )
  )
$$;

-- Chamada por iniciar_partida() (db/003_rpc_salas.sql) depois que ela já validou host,
-- status e mínimo de jogadores. Sorteia a primeira pergunta e monta o estado inicial
-- do Efeito Manada. NÃO chame esta função diretamente pelo cliente — ela não
-- revalida nada, só grant execute pro dispatcher genérico usar internamente.
create or replace function iniciar_partida_manada(p_sala_id uuid, p_total_jogadores int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pergunta text;
begin
  select texto into v_pergunta from manada_perguntas order by random() limit 1;

  update salas
    set status = 'em_andamento',
        estado = jsonb_build_object(
          'rodada', 1,
          'pergunta', v_pergunta,
          'jogadores_confirmados', 0,
          'total_jogadores', p_total_jogadores,
          'revelado', false,
          'resultado_rodada', null,
          'pontuacoes', '{}'::jsonb,
          'vaca_rosa', null,
          'vencedor', null
        ),
        atualizada_em = now()
    where id = p_sala_id;

  return (select estado from salas where id = p_sala_id);
end;
$$;

-- Calcula o resultado de uma rodada já com todas as respostas confirmadas:
-- agrupa respostas equivalentes, acha a manada (grupo majoritário único), identifica
-- se existe exatamente um jogador isolado (pra transferir a Vaca Rosa), soma pontos
-- e verifica condição de vitória. É chamada de dentro de confirmar_resposta, na mesma
-- transação que fecha a rodada — nunca em separado.
create or replace function calcular_resultado_manada(p_sala_id uuid, p_rodada int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sala salas%rowtype;
  v_grupos jsonb;
  v_max_tamanho int;
  v_qtd_grupos_no_max int;
  v_qtd_grupos_isolados int;
  v_manada_normalizada text;
  v_pontuacoes jsonb;
  v_vaca_rosa uuid;
  v_vencedor uuid;
  v_user_id uuid;
begin
  select * into v_sala from salas where id = p_sala_id;

  select jsonb_agg(jsonb_build_object(
           'normalizada', resposta_normalizada,
           'tamanho', tamanho,
           'membros', membros
         ) order by tamanho desc)
    into v_grupos
  from (
    select r.resposta_normalizada,
           count(*) as tamanho,
           jsonb_agg(jsonb_build_object(
             'user_id', r.user_id, 'nome', sj.nome, 'resposta_texto', r.resposta_texto
           )) as membros
    from manada_respostas r
    join sala_jogadores sj on sj.sala_id = r.sala_id and sj.user_id = r.user_id
    where r.sala_id = p_sala_id and r.rodada = p_rodada
    group by r.resposta_normalizada
  ) g;

  select max(tamanho) into v_max_tamanho
  from (
    select count(*) as tamanho from manada_respostas
    where sala_id = p_sala_id and rodada = p_rodada
    group by resposta_normalizada
  ) g;

  select count(*) into v_qtd_grupos_no_max
  from (
    select count(*) as tamanho from manada_respostas
    where sala_id = p_sala_id and rodada = p_rodada
    group by resposta_normalizada
  ) g
  where tamanho = v_max_tamanho;

  select count(*) into v_qtd_grupos_isolados
  from (
    select count(*) as tamanho from manada_respostas
    where sala_id = p_sala_id and rodada = p_rodada
    group by resposta_normalizada
  ) g
  where tamanho = 1;

  -- Manada = único grupo com o maior tamanho. Se houver empate no topo, ninguém
  -- pontua nessa rodada (regra 13 da especificação).
  if v_qtd_grupos_no_max = 1 then
    select resposta_normalizada into v_manada_normalizada
    from (
      select resposta_normalizada, count(*) as tamanho from manada_respostas
      where sala_id = p_sala_id and rodada = p_rodada
      group by resposta_normalizada
    ) g
    where tamanho = v_max_tamanho;
  else
    v_manada_normalizada := null;
  end if;

  v_pontuacoes := coalesce(v_sala.estado->'pontuacoes', '{}'::jsonb);
  if v_manada_normalizada is not null then
    for v_user_id in
      select user_id from manada_respostas
      where sala_id = p_sala_id and rodada = p_rodada
        and resposta_normalizada = v_manada_normalizada
    loop
      v_pontuacoes := jsonb_set(
        v_pontuacoes,
        array[v_user_id::text],
        to_jsonb(coalesce((v_pontuacoes->>(v_user_id::text))::int, 0) + 1)
      );
    end loop;
  end if;

  -- Vaca Rosa só transfere quando EXATAMENTE um jogador ficou isolado (regras 10/14).
  -- Se zero ou mais de um ficarem isolados, quem já tinha a Vaca Rosa continua com ela.
  if v_qtd_grupos_isolados = 1 then
    select r.user_id into v_vaca_rosa
    from manada_respostas r
    where r.sala_id = p_sala_id and r.rodada = p_rodada
      and r.resposta_normalizada in (
        select resposta_normalizada from manada_respostas
        where sala_id = p_sala_id and rodada = p_rodada
        group by resposta_normalizada
        having count(*) = 1
      );
  else
    v_vaca_rosa := nullif(v_sala.estado->>'vaca_rosa', '')::uuid;
  end if;

  -- Vitória: primeiro jogador com >= 8 vacas que NÃO esteja com a Vaca Rosa.
  select key::uuid into v_vencedor
  from jsonb_each_text(v_pontuacoes)
  where value::int >= 8 and key::uuid is distinct from v_vaca_rosa
  limit 1;

  return jsonb_build_object(
    'resultado_rodada', jsonb_build_object(
      'rodada', p_rodada,
      'grupos', v_grupos,
      'manada_normalizada', v_manada_normalizada,
      'vaca_rosa_transferida', (v_qtd_grupos_isolados = 1)
    ),
    'pontuacoes', v_pontuacoes,
    'vaca_rosa', v_vaca_rosa,
    'vencedor', v_vencedor
  );
end;
$$;

-- Um jogador confirma sua resposta da rodada. Quando o último jogador confirma,
-- a própria chamada já calcula e grava o resultado da rodada (revelação) — evita
-- qualquer corrida entre "todo mundo confirmou" e "revelar".
create or replace function confirmar_resposta(p_sala_id uuid, p_texto text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
  v_rodada int;
  v_normalizada text;
  v_total_jogadores int;
  v_confirmados int;
  v_resultado jsonb;
  v_novo_status text;
begin
  if v_uid is null then
    raise exception 'sessao anonima ausente';
  end if;
  if coalesce(trim(p_texto), '') = '' then
    raise exception 'resposta nao pode ser vazia';
  end if;

  select * into v_sala from salas where id = p_sala_id for update;
  if not found then
    raise exception 'sala nao encontrada';
  end if;
  if v_sala.status <> 'em_andamento' then
    raise exception 'partida nao esta em andamento';
  end if;
  if coalesce((v_sala.estado->>'revelado')::boolean, false) then
    raise exception 'a rodada atual ja foi revelada';
  end if;

  v_rodada := (v_sala.estado->>'rodada')::int;
  v_normalizada := normalizar_resposta(p_texto);

  insert into manada_respostas (sala_id, rodada, user_id, resposta_texto, resposta_normalizada, confirmada)
  values (p_sala_id, v_rodada, v_uid, trim(p_texto), v_normalizada, true)
  on conflict (sala_id, rodada, user_id)
  do update set resposta_texto = excluded.resposta_texto,
                resposta_normalizada = excluded.resposta_normalizada,
                confirmada = true;

  select count(*) into v_total_jogadores from sala_jogadores where sala_id = p_sala_id;
  select count(*) into v_confirmados from manada_respostas
    where sala_id = p_sala_id and rodada = v_rodada and confirmada;

  if v_confirmados >= v_total_jogadores then
    v_resultado := calcular_resultado_manada(p_sala_id, v_rodada);
    v_novo_status := case when v_resultado->>'vencedor' is not null then 'finalizado' else v_sala.status end;

    update salas
      set status = v_novo_status,
          estado = estado || jsonb_build_object(
            'jogadores_confirmados', v_confirmados,
            'total_jogadores', v_total_jogadores,
            'revelado', true,
            'resultado_rodada', v_resultado->'resultado_rodada',
            'pontuacoes', v_resultado->'pontuacoes',
            'vaca_rosa', v_resultado->'vaca_rosa',
            'vencedor', v_resultado->'vencedor'
          ),
          atualizada_em = now()
      where id = p_sala_id;
  else
    update salas
      set estado = estado || jsonb_build_object(
            'jogadores_confirmados', v_confirmados,
            'total_jogadores', v_total_jogadores
          ),
          atualizada_em = now()
      where id = p_sala_id;
  end if;

  return (select estado from salas where id = p_sala_id);
end;
$$;

-- Host avança pra próxima pergunta depois de ver o resultado revelado.
create or replace function proxima_rodada(p_sala_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sala salas%rowtype;
  v_pergunta text;
  v_nova_rodada int;
begin
  select * into v_sala from salas where id = p_sala_id for update;
  if not found then
    raise exception 'sala nao encontrada';
  end if;
  if v_sala.host_id <> v_uid then
    raise exception 'so o host pode avancar a rodada';
  end if;
  if v_sala.status <> 'em_andamento' then
    raise exception 'partida nao esta em andamento';
  end if;
  if not coalesce((v_sala.estado->>'revelado')::boolean, false) then
    raise exception 'a rodada atual ainda nao foi revelada';
  end if;

  v_nova_rodada := coalesce((v_sala.estado->>'rodada')::int, 0) + 1;
  select texto into v_pergunta from manada_perguntas order by random() limit 1;

  update salas
    set estado = estado || jsonb_build_object(
          'rodada', v_nova_rodada,
          'pergunta', v_pergunta,
          'jogadores_confirmados', 0,
          'revelado', false,
          'resultado_rodada', null
        ),
        atualizada_em = now()
    where id = p_sala_id;

  return (select estado from salas where id = p_sala_id);
end;
$$;

grant execute on function normalizar_resposta(text) to anon, authenticated;
grant execute on function iniciar_partida_manada(uuid, int) to anon, authenticated;
grant execute on function calcular_resultado_manada(uuid, int) to anon, authenticated;
grant execute on function confirmar_resposta(uuid, text) to anon, authenticated;
grant execute on function proxima_rodada(uuid) to anon, authenticated;
