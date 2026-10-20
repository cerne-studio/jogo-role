-- fd_elegiveis passa a devolver os 6 atributos de linha (ritmo, chute, passe, drible, defesa, fisico) pra ficha do jogador.
-- Rode depois de db/015_draft_rpc.sql.

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
        'ritmo', j.ritmo, 'chute', j.chute, 'passe', j.passe, 'drible', j.drible, 'defesa', j.defesa, 'fisico', j.fisico, 'goleiro', j.goleiro,
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
