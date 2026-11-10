-- Testes do HINT que dependem de relógio/estado forçado (prazos, carta obrigatória, empates, host ausente).
-- Rodar no SQL editor do Supabase (ou execute_sql). Tudo é desfeito no fim: o bloco termina com
-- "raise exception 'RESULTADO: ...'" e o texto do erro traz as linhas PASS/FAIL.
do $$
declare
  h uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid();
  d uuid := gen_random_uuid(); e uuid := gen_random_uuid(); f uuid := gen_random_uuid();
  out text := '';
  sid uuid; sid2 uuid; s jsonb; v jsonb; resp uuid; ids text[]; n int; r record;
begin
  -- ===== sala de teste: h,b,c azul x d,e,f vermelha =====
  perform set_config('request.jwt.claim.sub', h::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', h, 'role', 'authenticated')::text, true);
  sid := (criar_sala('hint', 'H')->>'sala_id')::uuid;
  insert into sala_jogadores (sala_id, user_id, nome) values (sid, b, 'B'), (sid, c, 'C'), (sid, d, 'D'), (sid, e, 'E'), (sid, f, 'F');
  perform hint_config(sid, '{"modalidades":["falar"],"tempo":60,"meta":10,"reta_pct":30,"equipes_modo":"manual"}'::jsonb);
  perform hint_equipes(sid, jsonb_build_object(h::text,'azul', b::text,'azul', c::text,'azul', d::text,'vermelha', e::text,'vermelha', f::text,'vermelha'));
  s := hint_iniciar(sid);
  out := out || case when s->>'fase' = 'selecao' and s->>'turno' = '1' then 'PASS ' else 'FAIL ' end || 'S01 partida inicia em selecao turno 1' || E'\n';

  -- ===== prazos: cada fase vencida avança sozinha, chamada por QUALQUER jogador =====
  perform set_config('request.jwt.claim.sub', b::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  update salas set estado = jsonb_set(estado, '{fim}', to_jsonb(now() - interval '1 second')) where id = sid;
  s := hint_avancar(sid);
  out := out || case when s->>'fase' = 'revelacao' and s->'carta'->>'id' is not null then 'PASS ' else 'FAIL ' end || 'S02 selecao vencida: servidor escolhe a carta sozinho -> revelacao' || E'\n';
  update salas set estado = jsonb_set(estado, '{fim}', to_jsonb(now() - interval '1 second')) where id = sid;
  s := hint_avancar(sid);
  out := out || case when s->>'fase' = 'jogando' then 'PASS ' else 'FAIL ' end || 'S03 revelacao vencida: rodada comeca sozinha' || E'\n';
  resp := (s->>'responsavel')::uuid;

  -- modalidade falar: não existe quadro
  perform set_config('request.jwt.claim.sub', resp::text, true);
  begin
    perform hint_desenhar(sid, '[{"t":"s","id":"a","c":0,"w":2,"e":false,"p":[[0.1,0.1],[0.2,0.2]]}]'::jsonb);
    out := out || 'FAIL S04 desenhar em carta falar deveria dar erro' || E'\n';
  exception when others then
    out := out || case when sqlerrm like '%nao e de desenhar%' then 'PASS ' else 'FAIL ' end || 'S04 quadro só abre em carta de Desenhar [' || sqlerrm || ']' || E'\n';
  end;

  -- prazo acabou (passou a tolerância de 2s): responsável não marca mais nada
  update salas set estado = jsonb_set(estado, '{fim}', to_jsonb(now() - interval '5 seconds')) where id = sid;
  begin
    perform hint_acertar(sid, 0, true);
    out := out || 'FAIL S05 acerto depois do tempo deveria dar erro' || E'\n';
  exception when others then
    out := out || case when sqlerrm like '%tempo acabou%' then 'PASS ' else 'FAIL ' end || 'S05 acerto depois do fim do tempo é recusado [' || sqlerrm || ']' || E'\n';
  end;
  perform set_config('request.jwt.claim.sub', b::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  s := hint_avancar(sid);
  out := out || case when s->>'fase' = 'palpite' then 'PASS ' else 'FAIL ' end || 'S06 tempo da rodada acabou: vai pro palpite do adversário' || E'\n';
  v := s->'placar';
  update salas set estado = jsonb_set(estado, '{fim}', to_jsonb(now() - interval '1 second')) where id = sid;
  s := hint_avancar(sid);
  out := out || case when s->>'fase' = 'resultado' and (s->'resultado'->'palpite'->>'feito') = 'false' and s->'placar' = v then 'PASS ' else 'FAIL ' end || 'S07 palpite vencido sem tentativa: ninguém perde nem ganha ponto' || E'\n';
  update salas set estado = jsonb_set(estado, '{fim}', to_jsonb(now() - interval '1 second')) where id = sid;
  s := hint_avancar(sid);
  out := out || case when s->>'fase' = 'rotacao' and jsonb_array_length(s->'roda') = 3 then 'PASS ' else 'FAIL ' end || 'S08 resultado vencido: roda gira e segue com 3 cartas' || E'\n';
  update salas set estado = jsonb_set(estado, '{fim}', to_jsonb(now() - interval '1 second')) where id = sid;
  s := hint_avancar(sid);
  out := out || case when s->>'fase' = 'selecao' and s->>'turno' = '2' then 'PASS ' else 'FAIL ' end || 'S09 rotacao vencida: turno 2 abre' || E'\n';

  -- chamada repetida / simultânea não pula fase (o prazo novo ainda não venceu)
  s := hint_avancar(sid);
  v := hint_avancar(sid);
  out := out || case when s->>'fase' = 'selecao' and v->>'fase' = 'selecao' and s->>'turno' = '2' then 'PASS ' else 'FAIL ' end || 'S10 chamadas repetidas de avancar não pulam fase' || E'\n';

  begin
    perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
    perform hint_avancar(sid);
    out := out || 'FAIL S11 quem não está na sala não avança' || E'\n';
  exception when others then
    out := out || case when sqlerrm like '%nao esta nessa sala%' then 'PASS ' else 'FAIL ' end || 'S11 estranho não avança o jogo [' || sqlerrm || ']' || E'\n';
  end;

  -- ===== carta obrigatória (posição 4) e reta final =====
  select array_agg(id) into ids from (select id from hint_cartas where modalidade = 'falar' order by random() limit 6) x;
  update salas set estado = jsonb_set(estado, '{roda}', jsonb_build_array(
      jsonb_build_object('pos', 0, 'id', ids[1], 'tema', 't', 'modalidade', 'falar'),
      jsonb_build_object('pos', 2, 'id', ids[2], 'tema', 't', 'modalidade', 'falar'),
      jsonb_build_object('pos', 4, 'id', ids[3], 'tema', 't', 'modalidade', 'falar'))) where id = sid;
  -- quem jogar o próximo turno está na reta final (9 de 10; reta de 3)
  update salas set estado = jsonb_set(jsonb_set(estado, '{placar,azul}', '9'), '{placar,vermelha}', '9') where id = sid;
  perform hint_abrir_turno(sid, false);
  select estado into s from salas where id = sid;
  out := out || case when s->>'obrigatoria_id' = ids[3] then 'PASS ' else 'FAIL ' end || 'S12 carta na posição 4 vira obrigatória' || E'\n';
  out := out || case when (s->>'reta_ativa')::boolean and s->>'escolhe' = s->>'vez' then 'PASS ' else 'FAIL ' end || 'S13 reta final + obrigatória: a obrigatória tem prioridade (quem joga escolhe, não o adversário)' || E'\n';
  resp := (s->>'responsavel')::uuid;
  perform set_config('request.jwt.claim.sub', resp::text, true);
  begin
    perform hint_escolher(sid, ids[1]);
    out := out || 'FAIL S14 trocar a obrigatória deveria dar erro' || E'\n';
  exception when others then
    out := out || case when sqlerrm like '%obrigatoria%' then 'PASS ' else 'FAIL ' end || 'S14 não dá pra trocar a carta obrigatória [' || sqlerrm || ']' || E'\n';
  end;
  v := s->'placar';
  s := hint_escolher(sid, ids[3]);
  out := out || case when s->'carta'->>'forcada' = 'true' and (s->'carta'->>'bonus') = '1' and (s->'placar'->>(s->>'vez'))::int = (v->>(s->>'vez'))::int + 1 then 'PASS ' else 'FAIL ' end || 'S15 jogar a obrigatória rende +1' || E'\n';

  -- sem obrigatória, na reta final: o ADVERSÁRIO escolhe
  update salas set estado = jsonb_set(estado, '{roda}', jsonb_build_array(
      jsonb_build_object('pos', 0, 'id', ids[4], 'tema', 't', 'modalidade', 'falar'),
      jsonb_build_object('pos', 1, 'id', ids[5], 'tema', 't', 'modalidade', 'falar'),
      jsonb_build_object('pos', 2, 'id', ids[6], 'tema', 't', 'modalidade', 'falar'))) where id = sid;
  perform hint_abrir_turno(sid, false);
  select estado into s from salas where id = sid;
  out := out || case when (s->>'reta_ativa')::boolean and s->>'obrigatoria_id' is null and s->>'escolhe' = hint_outra(s->>'vez') then 'PASS ' else 'FAIL ' end || 'S16 reta final sem obrigatória: a equipe adversária escolhe a carta' || E'\n';
  update salas set estado = jsonb_set(jsonb_set(estado, '{placar,azul}', '0'), '{placar,vermelha}', '0') where id = sid;
  perform hint_abrir_turno(sid, false);
  select estado into s from salas where id = sid;
  out := out || case when not (s->>'reta_ativa')::boolean and s->>'escolhe' = s->>'vez' then 'PASS ' else 'FAIL ' end || 'S17 fora da reta final quem joga escolhe' || E'\n';

  -- seleção vencida na reta final/obrigatória: o servidor escolhe a obrigatória
  update salas set estado = jsonb_set(estado, '{roda}', jsonb_build_array(
      jsonb_build_object('pos', 1, 'id', ids[4], 'tema', 't', 'modalidade', 'falar'),
      jsonb_build_object('pos', 3, 'id', ids[5], 'tema', 't', 'modalidade', 'falar'),
      jsonb_build_object('pos', 4, 'id', ids[6], 'tema', 't', 'modalidade', 'falar'))) where id = sid;
  perform hint_abrir_turno(sid, false);
  perform set_config('request.jwt.claim.sub', b::text, true);
  update salas set estado = jsonb_set(estado, '{fim}', to_jsonb(now() - interval '1 second')) where id = sid;
  s := hint_avancar(sid);
  out := out || case when s->'carta'->>'id' = ids[6] then 'PASS ' else 'FAIL ' end || 'S18 tempo de escolha vencido com obrigatória: o servidor joga a obrigatória' || E'\n';

  -- ===== vitória e desempate (função pura) =====
  v := hint_vitoria('{"placar":{"azul":20,"vermelha":18},"meta":20,"vez":"vermelha","desempate":null}'::jsonb);
  out := out || case when v->>'vencedor' = 'azul' then 'PASS ' else 'FAIL ' end || 'S19 chegou na meta com adversário atrás: vence' || E'\n';
  v := hint_vitoria('{"placar":{"azul":20,"vermelha":20},"meta":20,"vez":"vermelha","desempate":null}'::jsonb);
  out := out || case when v->>'vencedor' is null and jsonb_typeof(v->'desempate') = 'object' then 'PASS ' else 'FAIL ' end || 'S20 empate na meta: abre turnos extras' || E'\n';
  v := hint_vitoria('{"placar":{"azul":22,"vermelha":21},"meta":20,"vez":"azul","desempate":{"jogou":[]}}'::jsonb);
  out := out || case when v->>'vencedor' is null and v->'desempate'->'jogou' = '["azul"]'::jsonb then 'PASS ' else 'FAIL ' end || 'S21 desempate: um turno só não decide, a outra equipe ainda joga' || E'\n';
  v := hint_vitoria('{"placar":{"azul":22,"vermelha":24},"meta":20,"vez":"vermelha","desempate":{"jogou":["azul"]}}'::jsonb);
  out := out || case when v->>'vencedor' = 'vermelha' then 'PASS ' else 'FAIL ' end || 'S22 desempate: depois dos dois turnos quem está na frente vence' || E'\n';
  v := hint_vitoria('{"placar":{"azul":23,"vermelha":23},"meta":20,"vez":"vermelha","desempate":{"jogou":["azul"]}}'::jsonb);
  out := out || case when v->>'vencedor' is null and v->'desempate'->'jogou' = '[]'::jsonb then 'PASS ' else 'FAIL ' end || 'S23 desempate: segue empatado -> novo ciclo' || E'\n';
  v := hint_vitoria('{"placar":{"azul":21,"vermelha":21},"meta":20,"vez":"azul","desempate":null}'::jsonb);
  out := out || case when v->>'vencedor' is null and jsonb_typeof(v->'desempate') = 'object' then 'PASS ' else 'FAIL ' end || 'S24 as duas passam da meta empatadas: desempate' || E'\n';
  v := hint_vitoria('{"placar":{"azul":25,"vermelha":22},"meta":20,"vez":"azul","desempate":null}'::jsonb);
  out := out || case when v->>'vencedor' = 'azul' then 'PASS ' else 'FAIL ' end || 'S25 as duas passam da meta: maior placar vence' || E'\n';
  v := hint_vitoria('{"placar":{"azul":5,"vermelha":7},"meta":20,"vez":"azul","desempate":null}'::jsonb);
  out := out || case when v->>'vencedor' is null and v->'desempate' = 'null'::jsonb then 'PASS ' else 'FAIL ' end || 'S26 ninguém na meta: a partida continua' || E'\n';

  -- ===== regras personalizadas: bônus desligado =====
  perform set_config('request.jwt.claim.sub', h::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', h, 'role', 'authenticated')::text, true);
  sid2 := (criar_sala('hint', 'H')->>'sala_id')::uuid;
  insert into sala_jogadores (sala_id, user_id, nome) values (sid2, b, 'B'), (sid2, c, 'C'), (sid2, d, 'D');
  perform hint_config(sid2, '{"personalizado":true,"equipes_modo":"sorteio","regras":{"bonus":false,"obrigatoria":false,"reta_final":false,"proibida":false,"adversario":false}}'::jsonb);
  perform hint_sortear(sid2);
  s := hint_iniciar(sid2);
  resp := (s->>'responsavel')::uuid;
  perform set_config('request.jwt.claim.sub', resp::text, true);
  s := hint_escolher(sid2, (select c2->>'id' from jsonb_array_elements(s->'roda') c2 where (c2->>'pos')::int = 1));
  out := out || case when (s->'carta'->>'bonus') = '0' then 'PASS ' else 'FAIL ' end || 'S27 regra de bônus desligada: posição 1 não dá ponto extra' || E'\n';
  perform hint_comecar(sid2);
  begin
    perform hint_proibida(sid2, true);
    out := out || 'FAIL S28 proibida desligada deveria dar erro' || E'\n';
  exception when others then
    out := out || case when sqlerrm like '%desligada%' then 'PASS ' else 'FAIL ' end || 'S28 regra da proibida desligada é respeitada [' || sqlerrm || ']' || E'\n';
  end;
  s := hint_encerrar(sid2);
  out := out || case when s->>'fase' = 'resultado' then 'PASS ' else 'FAIL ' end || 'S29 sem tentativa do adversário: vai direto pro resultado' || E'\n';

  -- ===== host ausente: outro jogador assume =====
  perform set_config('request.jwt.claim.sub', b::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  insert into hint_presenca (sala_id, user_id, visto) values (sid, h, now()) on conflict (sala_id, user_id) do update set visto = now();
  begin
    perform hint_assumir_host(sid);
    out := out || 'FAIL S30 host ativo não pode ser tomado' || E'\n';
  exception when others then
    out := out || case when sqlerrm like '%ainda esta%' then 'PASS ' else 'FAIL ' end || 'S30 host com batimento recente não é substituído [' || sqlerrm || ']' || E'\n';
  end;
  update hint_presenca set visto = now() - interval '2 minutes' where sala_id = sid and user_id = h;
  perform hint_assumir_host(sid);
  out := out || case when (select host_id from salas where id = sid) = b then 'PASS ' else 'FAIL ' end || 'S31 host sumiu (sem batimento há 45s+): outro jogador assume o comando' || E'\n';

  -- ===== não quebrou as outras salas =====
  perform set_config('request.jwt.claim.sub', h::text, true);
  n := 0;
  for r in select unnest(array['manada','themind','pdf','draft','respostas']) j loop
    perform criar_sala(r.j, 'H');
    n := n + 1;
  end loop;
  out := out || case when n = 5 then 'PASS ' else 'FAIL ' end || 'S32 criar_sala continua funcionando para os outros 5 jogos' || E'\n';
  begin
    perform criar_sala('xadrez', 'H');
    out := out || 'FAIL S33 jogo inexistente deveria dar erro' || E'\n';
  exception when others then
    out := out || case when sqlerrm like '%jogo invalido%' then 'PASS ' else 'FAIL ' end || 'S33 jogo inexistente é recusado' || E'\n';
  end;

  raise exception 'RESULTADO:%', E'\n' || out;
end $$;
