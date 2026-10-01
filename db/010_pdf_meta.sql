-- Meta de pontos do P.D.F escolhida no lobby (3, 5 ou 7; padrão 5). Rode depois de db/009_seed_pdf.sql.
-- Só o host define, só antes de começar. iniciar_partida_pdf passa a respeitar a meta já gravada em salas.estado.

create or replace function pdf_definir_meta(p_sala_id uuid, p_meta int)
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
    raise exception 'so o host define a meta';
  end if;
  if v_sala.status <> 'lobby' then
    raise exception 'a partida ja comecou';
  end if;
  if p_meta not in (3, 5, 7) then
    raise exception 'meta invalida';
  end if;

  update salas
    set estado = estado || jsonb_build_object('meta', p_meta),
        atualizada_em = now()
    where id = p_sala_id;

  return (select estado from salas where id = p_sala_id);
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
  v_ordem jsonb;
  v_pontos jsonb;
begin
  if p_total_jogadores > 10 then
    raise exception 'o maximo e 10 jogadores';
  end if;

  select host_id, coalesce((estado->>'meta')::int, 5) into v_host, v_meta from salas where id = p_sala_id;
  if v_meta not in (3, 5, 7) then
    v_meta := 5;
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

revoke all on function iniciar_partida_pdf(uuid, int) from public, anon, authenticated;
revoke all on function pdf_definir_meta(uuid, int) from public, anon;
grant execute on function pdf_definir_meta(uuid, int) to authenticated;
