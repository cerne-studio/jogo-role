-- Respostas sem Perguntas: a categoria "Rolê 18+" (bebida, sexo, vícios) existe no banco, mas NÃO entra em
-- "Todas": só aparece na partida se o host marcar essa categoria no lobby. Sem isso, qualquer partida
-- com a escolha padrão (todas as categorias) sortearia perguntas adultas pra mesa inteira.
-- Rode depois de db/025_seed_respostas.sql. Só muda iniciar_respostas (o resto é igual ao da 024).

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
    -- "Todas" = tudo, menos o conteúdo adulto
    select array_agg(distinct categoria) into v_cats
      from respostas_perguntas where ativo and categoria <> 'Rolê 18+';
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

grant execute on function iniciar_respostas(uuid, int, int, text[]) to anon, authenticated;
