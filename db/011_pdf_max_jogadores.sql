-- Limite de jogadores do P.D.F num lugar só: pdf_max_jogadores() (hoje 20; era 10).
-- Rode depois de db/010_pdf_meta.sql. Pra mudar o limite de novo, é só recriar a função com outro número.
-- Cada jogador segura 10 brancas; com 20 jogadores são 200 das 400 cartas em mão, o resto do baralho
-- vira compra, e o descarte é reembaralhado quando acaba (pdf_comprar_brancas).
--
-- Também passa a barrar na ENTRADA (entrar_sala) em vez de só reclamar na hora de iniciar:
-- antes dava pra encher o lobby além do máximo e o host só descobria ao tocar em "Iniciar partida".

create or replace function pdf_max_jogadores()
returns int
language sql
immutable
as $$ select 20 $$;

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
  v_ja_na_sala boolean;
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

  select exists(select 1 from sala_jogadores where sala_id = v_sala.id and user_id = v_uid) into v_ja_na_sala;

  -- Depois que a partida comeca, so quem ja e jogador dessa sala pode "entrar"
  -- de novo (reconexao apos reload/celular travar) -- gente nova nao pode mais.
  if v_sala.status <> 'lobby' and not v_ja_na_sala then
    raise exception 'essa partida ja comecou';
  end if;

  if v_sala.jogo = 'pdf' and not v_ja_na_sala
     and (select count(*) from sala_jogadores where sala_id = v_sala.id) >= pdf_max_jogadores() then
    raise exception 'sala cheia (maximo de % jogadores)', pdf_max_jogadores();
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
  if p_total_jogadores > pdf_max_jogadores() then
    raise exception 'o maximo e % jogadores', pdf_max_jogadores();
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

revoke all on function pdf_max_jogadores() from public, anon, authenticated;
revoke all on function iniciar_partida_pdf(uuid, int) from public, anon, authenticated;
grant execute on function entrar_sala(text, text) to anon, authenticated;
