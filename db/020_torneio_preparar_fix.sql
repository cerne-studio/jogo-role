-- Corrige fd_torneio_preparar: antes aceitava preparar no lobby (fase nula passava na comparação). Rode depois de db/019_torneio.sql.

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

