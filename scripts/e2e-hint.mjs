// Teste ponta a ponta do HINT contra um projeto Supabase real: 6 sessões anônimas independentes
// (3 x 3), roda, bônus, reta final, privacidade da carta, palpite do adversário, vitória, nova partida,
// e o quadro de desenho em tempo real (realtime + reconstrução numa conexão nova do mesmo jogador).
//
//   node --env-file=.env scripts/e2e-hint.mjs
//
// Cria salas de teste e usuários anônimos; não apaga nada que não seja seu. Demora ~1 min (esperas reais
// de 10 s do resultado e 2,5 s da rotação). Prazos/empates/obrigatória: ver db/tests/hint-sql.md.
import { createClient } from '@supabase/supabase-js'

const URL = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_ANON_KEY
if (!URL || !KEY) {
  console.error('Faltam VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
  process.exit(2)
}

let falhas = 0
let total = 0
function ok(nome, cond, extra = '') {
  total++
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${nome}${!cond && extra ? `  -> ${extra}` : ''}`)
  if (!cond) falhas++
}
const espera = (ms) => new Promise((r) => setTimeout(r, ms))

async function jogador(nome) {
  const c = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  let ultimo = ''
  for (let t = 1; t <= 4; t++) {
    try {
      const { data, error } = await c.auth.signInAnonymously()
      if (!error) return { c, id: data.user.id, nome, session: data.session }
      ultimo = error.message
    } catch (e) {
      ultimo = `${e.message} (${e.cause?.code ?? ''})`
    }
    await espera(800 * t)
  }
  throw new Error(`login anonimo falhou: ${ultimo}`)
}

async function rpc(j, fn, args) {
  const { data, error } = await j.c.rpc(fn, args)
  return { data, error: error?.message ?? null }
}
async function erro(nome, promessa, trecho) {
  const { error } = await promessa
  ok(nome, !!error && error.toLowerCase().includes(trecho.toLowerCase()), `erro recebido: ${error}`)
}
async function sala(j, id) {
  const { data } = await j.c.from('salas').select('*').eq('id', id).single()
  return data
}

async function main() {
  const [A, B, C, D, E, F, Z] = await Promise.all(['Ana', 'Beto', 'Caio', 'Duda', 'Edu', 'Fabi', 'Intruso'].map(jogador).map((p) => p.catch((e) => e)))
  for (const j of [A, B, C, D, E, F, Z]) if (j instanceof Error) throw j
  const todos = [A, B, C, D, E, F]
  const porId = Object.fromEntries([...todos, Z].map((j) => [j.id, j]))

  // ---------- lobby ----------
  const pequena = await rpc(A, 'criar_sala', { p_jogo: 'hint', p_nome: A.nome })
  ok('01 host cria sala hint com config padrão', !pequena.error && pequena.data?.jogo === 'hint', pequena.error)
  const sPeq = await sala(A, pequena.data.sala_id)
  ok('02 config padrão: 90s, meta 20, 4 modalidades', sPeq.estado.config.tempo === 90 && sPeq.estado.config.meta === 20 && sPeq.estado.config.modalidades.length === 4)
  await rpc(B, 'entrar_sala', { p_codigo: pequena.data.codigo, p_nome: B.nome })
  await rpc(C, 'entrar_sala', { p_codigo: pequena.data.codigo, p_nome: C.nome })
  await erro('03 não inicia com 3 jogadores', rpc(A, 'hint_iniciar', { p_sala_id: pequena.data.sala_id }), '4 jogadores')

  const criada = await rpc(A, 'criar_sala', { p_jogo: 'hint', p_nome: A.nome })
  const salaId = criada.data.sala_id
  const codigo = criada.data.codigo
  for (const j of [B, C, D, E, F]) {
    const r = await rpc(j, 'entrar_sala', { p_codigo: codigo, p_nome: j.nome })
    if (r.error) throw new Error(`entrar_sala ${j.nome}: ${r.error}`)
  }
  await erro('04 só o host muda a config', rpc(B, 'hint_config', { p_sala_id: salaId, p_config: { meta: 7 } }), 'so o host')
  await erro('05 config valida o tempo (45s não existe)', rpc(A, 'hint_config', { p_sala_id: salaId, p_config: { tempo: 45 } }), '60, 90 ou 120')
  const cfg = await rpc(A, 'hint_config', {
    p_sala_id: salaId,
    p_config: { tempo: 60, meta: 5, reta_pct: 50, modalidades: ['desenhar'], equipes_modo: 'manual' },
  })
  ok('06 host configura partida (60s, meta 5, só Desenhar, equipes manuais)', !cfg.error && cfg.data?.config?.meta === 5, cfg.error)
  const mapa = Object.fromEntries([A, B, C].map((j) => [j.id, 'azul']).concat([D, E, F].map((j) => [j.id, 'vermelha'])))
  const eq = await rpc(A, 'hint_equipes', { p_sala_id: salaId, p_mapa: mapa })
  ok('07 host monta as equipes', !eq.error && Object.keys(eq.data?.equipes_manual ?? {}).length === 6, eq.error)
  await erro('08 não-host não inicia', rpc(B, 'hint_iniciar', { p_sala_id: salaId }), 'so o host')
  const ini = await rpc(A, 'hint_iniciar', { p_sala_id: salaId })
  ok('09 host inicia: 2 equipes de 3, roda com 3 cartas, fase seleção', !ini.error && ini.data?.fase === 'selecao' && ini.data?.roda?.length === 3 &&
    ini.data?.equipes?.azul?.length === 3 && ini.data?.equipes?.vermelha?.length === 3, ini.error)
  ok('10 equipes seguem o mapa do host', ini.data.equipes.azul.every((u) => mapa[u] === 'azul') && ini.data.equipes.vermelha.every((u) => mapa[u] === 'vermelha'))
  ok('11 roda: posições 0,1,2 e bônus nas zonas 1 e 3', ini.data.roda.map((c) => c.pos).join() === '0,1,2' && ini.data.zonas.bonus.join() === '1,3' && ini.data.zonas.obrigatoria === 4)

  // ---------- privacidade ----------
  const lido = await sala(C, salaId)
  const txtEstado = JSON.stringify(lido.estado)
  ok('12 estado público da sala não tem lista de respostas', !/"respostas"/.test(txtEstado) && !/proibida_texto/.test(txtEstado))
  const cartasTabela = await C.c.from('hint_cartas').select('*')
  ok('13 cliente não lê a tabela de cartas (sem policy)', (cartasTabela.data ?? []).length === 0)
  const filaTabela = await C.c.from('hint_sala').select('*')
  ok('14 cliente não lê o baralho/fila', (filaTabela.data ?? []).length === 0)

  // ---------- turno 1: azul ----------
  let est = ini.data
  const resp1 = porId[est.responsavel]
  const colega1 = todos.find((j) => est.equipes[est.vez].includes(j.id) && j.id !== resp1.id)
  const adv = todos.find((j) => est.equipes[est.vez === 'azul' ? 'vermelha' : 'azul'].includes(j.id))
  const vez1 = est.vez
  const outraEq = vez1 === 'azul' ? 'vermelha' : 'azul'
  ok('15 responsável é da equipe da vez', est.equipes[vez1].includes(resp1.id))
  const cartaBonus = est.roda.find((c) => c.pos === 1)
  const cartaZero = est.roda.find((c) => c.pos === 0)
  await erro('16 colega não escolhe a carta (só o responsável)', rpc(colega1, 'hint_escolher', { p_sala_id: salaId, p_carta: cartaBonus.id }), 'responsavel')
  await erro('17 carta fora da roda é recusada', rpc(resp1, 'hint_escolher', { p_sala_id: salaId, p_carta: 'zzz' }), 'roda')
  const esc = await rpc(resp1, 'hint_escolher', { p_sala_id: salaId, p_carta: cartaBonus.id })
  ok('18 responsável escolhe carta da zona bônus: +1 de bônus, fase revelação', !esc.error && esc.data?.fase === 'revelacao' && esc.data?.carta?.bonus === 1 && esc.data?.placar?.[vez1] === 1, esc.error)

  const priv = await resp1.c.from('hint_privado').select('*')
  const carta = priv.data?.[0]?.carta
  ok('19 só o responsável recebe a carta completa (5 respostas + proibida)', priv.data?.length === 1 && carta?.respostas?.length === 5 && !!carta?.proibida)
  const outros = await Promise.all([colega1, adv, Z].map((j) => j.c.from('hint_privado').select('*')))
  ok('20 colega, adversário e intruso não leem a carta (0 linhas)', outros.every((o) => (o.data ?? []).length === 0))
  const estRev = await sala(adv, salaId)
  const txtRev = JSON.stringify(estRev.estado)
  ok('21 na revelação o estado público só mostra tema e modalidade (nenhuma resposta nem a proibida vazam)', !!estRev.estado.carta.tema && estRev.estado.carta.modalidade === 'desenhar' &&
    ![...carta.respostas, carta.proibida].some((t) => txtRev.includes(`"${t}"`)))

  await erro('22 colega não começa a rodada', rpc(colega1, 'hint_comecar', { p_sala_id: salaId }), 'responsavel')
  const com = await rpc(resp1, 'hint_comecar', { p_sala_id: salaId })
  const segs = (new Date(com.data?.fim) - new Date(com.data?.inicio)) / 1000
  ok('23 rodada começa com cronômetro do servidor de 60s', !com.error && com.data?.fase === 'jogando' && Math.abs(segs - 60) < 1.5, `${com.error} ${segs}`)

  // ---------- quadro de desenho (multijogador) ----------
  const recebidos = []
  colega1.c.realtime.setAuth(colega1.session.access_token)
  const canal = colega1.c
    .channel(`tracos-${salaId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hint_tracos', filter: `sala_id=eq.${salaId}` }, (p) => recebidos.push(p.new))
  const inscrito = await new Promise((res) => {
    const t = setTimeout(() => res(false), 8000)
    canal.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(t)
        res(true)
      }
    })
  })
  ok('24 colega assina o quadro em tempo real', inscrito)
  const traco = { t: 's', id: 'a1', c: 0, w: 4, e: false, p: [[0.1, 0.1], [0.4, 0.5], [0.8, 0.9]] }
  const traco2 = { t: 's', id: 'a2', c: 2, w: 6, e: false, p: [[0.2, 0.8], [0.6, 0.3]] }
  await erro('25 colega não desenha (só o responsável)', rpc(colega1, 'hint_desenhar', { p_sala_id: salaId, p_ops: [traco] }), 'responsavel')
  await erro('26 ponto fora do quadro é recusado', rpc(resp1, 'hint_desenhar', { p_sala_id: salaId, p_ops: [{ t: 's', id: 'x', c: 0, w: 2, e: false, p: [[3, 3]] }] }), 'fora do quadro')
  await erro('27 operação inventada é recusada', rpc(resp1, 'hint_desenhar', { p_sala_id: salaId, p_ops: [{ t: 'x' }] }), 'invalida')
  const d1 = await rpc(resp1, 'hint_desenhar', { p_sala_id: salaId, p_ops: [traco] })
  const d2 = await rpc(resp1, 'hint_desenhar', { p_sala_id: salaId, p_ops: [traco2, { t: 'u' }] })
  ok('28 responsável desenha (2 lotes)', !d1.error && !d2.error, `${d1.error} ${d2.error}`)
  for (let i = 0; i < 20 && recebidos.length < 2; i++) await espera(250)
  ok('29 o celular do colega recebe os traços por realtime', recebidos.length === 2 && recebidos[0].ops[0].id === 'a1', `chegaram ${recebidos.length}`)
  const vistoAdv = await adv.c.from('hint_tracos').select('ops').eq('sala_id', salaId).order('id')
  ok('30 adversário também vê o quadro (leitura por jogador da sala)', (vistoAdv.data ?? []).length === 2)
  const vistoZ = await Z.c.from('hint_tracos').select('ops').eq('sala_id', salaId)
  ok('31 quem não está na sala não vê o quadro', (vistoZ.data ?? []).length === 0)
  await erro('32 intruso não desenha', rpc(Z, 'hint_desenhar', { p_sala_id: salaId, p_ops: [traco] }), 'responsavel')
  // reconexão: outra conexão do mesmo jogador (celular recarregou) reconstrói o quadro igual
  const conexaoNova = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  await conexaoNova.auth.setSession({ access_token: colega1.session.access_token, refresh_token: colega1.session.refresh_token })
  const refeito = await conexaoNova.from('hint_tracos').select('id,ops').eq('sala_id', salaId).order('id')
  const ops = (refeito.data ?? []).flatMap((r) => r.ops)
  ok('33 reconexão: nova conexão do colega reconstrói todos os traços na ordem', ops.length === 3 && ops[0].id === 'a1' && ops[1].id === 'a2' && ops[2].t === 'u' &&
    JSON.stringify(ops[0].p) === JSON.stringify(traco.p))
  await conexaoNova.removeAllChannels()
  await colega1.c.removeChannel(canal)

  // ---------- pontuação do turno ----------
  await erro('34 colega não marca acerto', rpc(colega1, 'hint_acertar', { p_sala_id: salaId, p_idx: 0, p_valor: true }), 'responsavel')
  await rpc(resp1, 'hint_acertar', { p_sala_id: salaId, p_idx: 0, p_valor: true })
  const ac1 = await rpc(resp1, 'hint_acertar', { p_sala_id: salaId, p_idx: 1, p_valor: true })
  ok('35 cada acerto vale +1 (bônus 1 + 2 acertos = 3)', ac1.data?.placar?.[vez1] === 3 && ac1.data?.acertos === 2, JSON.stringify(ac1.data?.placar))
  await erro('36 não marca a mesma resposta duas vezes', rpc(resp1, 'hint_acertar', { p_sala_id: salaId, p_idx: 1, p_valor: true }), 'ja foi marcada')
  const desf = await rpc(resp1, 'hint_acertar', { p_sala_id: salaId, p_idx: 1, p_valor: false })
  ok('37 desfazer um acerto tira o ponto', desf.data?.placar?.[vez1] === 2 && desf.data?.acertos === 1, JSON.stringify(desf.data?.placar))
  await rpc(resp1, 'hint_acertar', { p_sala_id: salaId, p_idx: 1, p_valor: true })
  const pr = await rpc(resp1, 'hint_proibida', { p_sala_id: salaId, p_valor: true })
  ok('38 dizer a proibida custa -2', pr.data?.placar?.[vez1] === 1 && pr.data?.proibida_dita === true, JSON.stringify(pr.data?.placar))
  await erro('39 a proibida só conta uma vez por rodada', rpc(resp1, 'hint_proibida', { p_sala_id: salaId, p_valor: true }), 'ja foi registrada')
  const enc = await rpc(resp1, 'hint_encerrar', { p_sala_id: salaId })
  ok('40 responsável encerra: fase palpite de 15s pro adversário', !enc.error && enc.data?.fase === 'palpite', enc.error)
  const antes = await rpc(adv, 'hint_avancar', { p_sala_id: salaId })
  ok('41 hint_avancar antes do prazo não muda nada (idempotente)', antes.data?.fase === 'palpite')

  // ---------- palpite do adversário ----------
  await erro('42 equipe da vez não palpita', rpc(colega1, 'hint_palpite', { p_sala_id: salaId, p_texto: 'qualquer' }), 'adversaria')
  const palp = await rpc(adv, 'hint_palpite', { p_sala_id: salaId, p_texto: 'palavra que nao existe na carta' })
  ok('43 palpite errado custa -1 e encerra a tentativa', !palp.error && palp.data?.palpite?.tipo === 'errou' && palp.data?.placar?.[outraEq] === -1 && palp.data?.fase === 'resultado', palp.error)
  const resultado = palp.data?.resultado
  ok('44 resultado revela a carta inteira (respostas, proibida, marcadas)', resultado?.carta?.respostas?.length === 5 && !!resultado?.carta?.proibida && resultado?.carta?.acertadas?.length === 2 && resultado?.proibida_dita === true)
  ok('45 saldo do turno: equipe da vez +1 (3 acertos/bônus - 2), adversária -1', resultado?.delta?.[vez1] === 1 && resultado?.delta?.[outraEq] === -1, JSON.stringify(resultado?.delta))
  await erro('46 só uma tentativa: segundo palpite é recusado', rpc(adv, 'hint_palpite', { p_sala_id: salaId, p_texto: 'outra' }), 'palpitar')

  // ---------- rotação e turno 2 ----------
  est = await avancarAte(adv, salaId, 'rotacao', 16000)
  ok('47 após o resultado a roda avança (fase rotação)', est?.fase === 'rotacao', est?.fase)
  const idsNovos = est.roda.map((c) => c.id)
  ok('48 carta usada saiu da roda e a roda segue com 3 cartas', !idsNovos.includes(cartaBonus.id) && idsNovos.length === 3 && new Set(idsNovos).size === 3)
  ok('49 a roda andou: a carta que estava na posição 0 foi pra posição 1', est.roda.find((c) => c.id === cartaZero.id)?.pos === 1)
  est = await avancarAte(adv, salaId, 'selecao', 5000)
  ok('50 próximo turno é da outra equipe, com outro responsável do rodízio', est?.vez === outraEq && est?.turno === 2 && est?.responsavel !== resp1.id)
  const vez2 = est.vez
  const resp2 = porId[est.responsavel]
  const adv2 = todos.find((j) => est.equipes[vez1].includes(j.id))
  const esc2 = await rpc(resp2, 'hint_escolher', { p_sala_id: salaId, p_carta: est.roda.find((c) => c.pos === 3).id })
  ok('51 carta na zona bônus 3 também dá +1 (bônus fica na posição, não na carta)', esc2.data?.carta?.bonus === 1 && esc2.data?.carta?.pos === 3, esc2.error)
  await rpc(resp2, 'hint_comecar', { p_sala_id: salaId })
  await rpc(resp2, 'hint_acertar', { p_sala_id: salaId, p_idx: 0, p_valor: true })
  await rpc(resp2, 'hint_encerrar', { p_sala_id: salaId })
  const priv2 = (await resp2.c.from('hint_privado').select('carta,acertos').single()).data
  const pendente = priv2.carta.respostas[3]
  const palp2 = await rpc(adv2, 'hint_palpite', { p_sala_id: salaId, p_texto: pendente.toLowerCase() })
  ok('52 adversário acerta uma resposta pendente: +1 (ignora maiúsculas)', palp2.data?.palpite?.tipo === 'certo' && palp2.data?.palpite?.pontos === 1, JSON.stringify(palp2.data?.palpite))
  est = await avancarAte(adv, salaId, 'selecao', 20000, 3)

  // ---------- turno 3: reta final ----------
  const vez3 = est.vez
  ok('53 turno 3 volta pra equipe que começou', vez3 === vez1 && est.turno === 3)
  ok('54 reta final: equipe com 2+ pontos (meta 5, reta 50%) deixa a adversária escolher', est.reta_ativa === true && est.escolhe === outraEq, JSON.stringify({ r: est.reta_ativa, e: est.escolhe, p: est.placar }))
  const resp3 = porId[est.responsavel]
  const escolhedor = todos.find((j) => est.equipes[outraEq].includes(j.id))
  const cartaR = est.roda[0]
  await erro('55 na reta final o responsável não escolhe a carta', rpc(resp3, 'hint_escolher', { p_sala_id: salaId, p_carta: cartaR.id }), 'outra equipe')
  const esc3 = await rpc(escolhedor, 'hint_escolher', { p_sala_id: salaId, p_carta: cartaR.id })
  ok('56 adversário escolhe a carta na reta final', !esc3.error && esc3.data?.fase === 'revelacao', esc3.error)
  const priv3 = (await resp3.c.from('hint_privado').select('carta').single()).data
  ok('57 a carta escolhida vai pro responsável (não pro adversário que escolheu)', priv3.carta.id === cartaR.id &&
    ((await escolhedor.c.from('hint_privado').select('*')).data ?? []).length === 0)
  await rpc(resp3, 'hint_comecar', { p_sala_id: salaId })
  for (let i = 0; i < 5; i++) await rpc(resp3, 'hint_acertar', { p_sala_id: salaId, p_idx: i, p_valor: true })
  await rpc(resp3, 'hint_encerrar', { p_sala_id: salaId })
  const proibidaTxt = priv3.carta.proibida
  const palp3 = await rpc(escolhedor, 'hint_palpite', { p_sala_id: salaId, p_texto: proibidaTxt })
  ok('58 adversário diz a proibida no palpite: +2', palp3.data?.palpite?.tipo === 'proibida' && palp3.data?.palpite?.pontos === 2, JSON.stringify(palp3.data?.palpite))

  // ---------- vitória ----------
  ok('59 resultado já anuncia o vencedor pendente (alvo 5 atingido)', palp3.data?.vencedor_pendente === vez3, JSON.stringify([palp3.data?.vencedor_pendente, palp3.data?.placar]))
  const fim = await avancarAte(adv, salaId, 'fim', 16000)
  ok('60 partida termina: fase fim, status finalizado, vencedor definido', fim?.fase === 'fim' && fim?.vencedor === vez3 && (await sala(adv, salaId)).status === 'finalizado')
  ok('61 estatísticas finais guardadas (acertos, penalidades, palpites)', fim?.stats?.[vez3]?.acertos >= 5 && fim?.stats?.[vez1]?.penalidades >= 1)

  // ---------- nova partida na mesma sala ----------
  await erro('62 jogador comum não reinicia enquanto o host está presente', rpc(B, 'hint_nova_partida', { p_sala_id: salaId }), 'host')
  const nova = await rpc(A, 'hint_nova_partida', { p_sala_id: salaId })
  const lobby = await sala(A, salaId)
  ok('63 nova partida: volta pro lobby mantendo equipes e config', !nova.error && lobby.status === 'lobby' && lobby.estado.config.meta === 5 &&
    Object.keys(lobby.estado.equipes_manual).length === 6, nova.error)
  const privDepois = await resp3.c.from('hint_privado').select('*')
  ok('64 nova partida apaga a carta secreta da anterior', (privDepois.data ?? []).length === 0)
  const reini = await rpc(A, 'hint_iniciar', { p_sala_id: salaId })
  ok('65 nova partida inicia com placar zerado', !reini.error && reini.data?.placar?.azul === 0 && reini.data?.placar?.vermelha === 0 && reini.data?.turno === 1, reini.error)

  // ---------- host sumiu ----------
  await rpc(A, 'hint_ping', { p_sala_id: salaId })
  await erro('66 jogador não assume enquanto o host está ativo', rpc(B, 'hint_assumir_host', { p_sala_id: salaId }), 'ainda esta')
  const tr = await rpc(A, 'hint_transferir_host', { p_sala_id: salaId, p_novo: B.id })
  ok('67 host passa o comando pra outro jogador', !tr.error && (await sala(B, salaId)).host_id === B.id, tr.error)

  console.log(`\n${total - falhas}/${total} testes passaram`)
  if (falhas) process.exitCode = 1
}

async function avancarAte(j, salaId, fase, limiteMs, turno) {
  const t0 = Date.now()
  let est
  while (Date.now() - t0 < limiteMs) {
    const r = await rpc(j, 'hint_avancar', { p_sala_id: salaId })
    est = r.data
    if (est?.fase === fase && (!turno || est.turno === turno)) return est
    await espera(700)
  }
  return est
}

main().catch((e) => {
  console.error('ERRO FATAL', e)
  process.exit(1)
})
