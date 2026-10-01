// Teste ponta a ponta do P.D.F contra um projeto Supabase real: 4 sessões anônimas independentes
// (host + 3), partida completa até alguém chegar a 5 pontos, casos negativos e RLS.
//
//   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/e2e-pdf.mjs
//
// Cria salas de teste (finalizadas no fim) e usuários anônimos; não apaga nada que não seja seu.
import { createClient } from '@supabase/supabase-js'

const URL = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_ANON_KEY
if (!URL || !KEY) {
  console.error('Faltam VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
  process.exit(2)
}

let falhas = 0
function ok(nome, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${nome}${!cond && extra ? `  -> ${extra}` : ''}`)
  if (!cond) falhas++
}

async function jogador(nome) {
  const c = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  let ultimo = ''
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    try {
      const { data, error } = await c.auth.signInAnonymously()
      if (!error) return { c, id: data.user.id, nome, session: data.session }
      ultimo = error.message
    } catch (e) {
      ultimo = `${e.message} (${e.cause?.code ?? e.cause?.message ?? ''})`
    }
    await new Promise((r) => setTimeout(r, 800 * tentativa))
  }
  throw new Error(`login anonimo falhou: ${ultimo}`)
}

async function rpc(j, fn, args) {
  const { data, error } = await j.c.rpc(fn, args)
  return { data, error: error?.message ?? null }
}

async function esperaErro(nome, promessa, trecho) {
  const { error } = await promessa
  ok(nome, !!error && error.toLowerCase().includes(trecho.toLowerCase()), `erro recebido: ${error}`)
}

async function maoDe(j) {
  const { data } = await j.c.from('pdf_maos').select('carta_id,texto').eq('user_id', j.id)
  return data ?? []
}

async function estadoDe(j, salaId) {
  const { data } = await j.c.from('salas').select('*').eq('id', salaId).single()
  return data
}

async function main() {
  const A = await jogador('Ana')
  const B = await jogador('Beto')
  const C = await jogador('Caio')
  const D = await jogador('Duda')
  const todos = [A, B, C, D]
  const porId = Object.fromEntries(todos.map((j) => [j.id, j]))

  // ---------- sala + lobby ----------
  const criada = await rpc(A, 'criar_sala', { p_jogo: 'pdf', p_nome: A.nome })
  ok('host cria sala pdf', !criada.error && criada.data?.codigo?.length === 6, criada.error)
  const salaId = criada.data.sala_id
  const codigo = criada.data.codigo
  for (const j of [B, C]) {
    const r = await rpc(j, 'entrar_sala', { p_codigo: codigo, p_nome: j.nome })
    ok(`${j.nome} entra na sala`, !r.error, r.error)
  }

  await esperaErro('nao-host nao muda a meta', rpc(B, 'pdf_definir_meta', { p_sala_id: salaId, p_meta: 3 }), 'so o host')
  await esperaErro('meta invalida e recusada', rpc(A, 'pdf_definir_meta', { p_sala_id: salaId, p_meta: 4 }), 'invalida')
  const m = await rpc(A, 'pdf_definir_meta', { p_sala_id: salaId, p_meta: 3 })
  ok('host define meta 3 no lobby', !m.error && m.data?.meta === 3, m.error)
  await esperaErro('nao-host nao inicia', rpc(B, 'iniciar_partida', { p_sala_id: salaId }), 'so o host')
  const d = await rpc(D, 'entrar_sala', { p_codigo: codigo, p_nome: D.nome })
  ok('Duda entra na sala', !d.error, d.error)

  // sala com 2 jogadores nao inicia
  const mini = await rpc(A, 'criar_sala', { p_jogo: 'pdf', p_nome: 'Solo' })
  await esperaErro('menos de 3 jogadores nao inicia', rpc(A, 'iniciar_partida', { p_sala_id: mini.data.sala_id }), '3 jogadores')

  const ini = await rpc(A, 'iniciar_partida', { p_sala_id: salaId })
  ok('host inicia a partida', !ini.error, ini.error)
  await esperaErro('nao inicia duas vezes', rpc(A, 'iniciar_partida', { p_sala_id: salaId }), 'ja comecou')

  const E = await jogador('Eva')
  await esperaErro('ninguem novo entra depois de comecar', rpc(E, 'entrar_sala', { p_codigo: codigo, p_nome: E.nome }), 'ja comecou')

  // ---------- RLS ----------
  for (const j of todos) {
    const mao = await maoDe(j)
    ok(`${j.nome} ve so a propria mao (10 cartas)`, mao.length === 10, `viu ${mao.length}`)
  }
  const { data: maoDeOutro } = await B.c.from('pdf_maos').select('*').eq('user_id', A.id)
  ok('Beto nao le a mao da Ana', (maoDeOutro ?? []).length === 0)
  const { data: cartasAll } = await B.c.from('pdf_cartas').select('*').limit(5)
  ok('cliente nao le o baralho (pdf_cartas)', (cartasAll ?? []).length === 0)
  const { data: usadas } = await B.c.from('pdf_usadas').select('*').limit(5)
  ok('cliente nao le pdf_usadas', (usadas ?? []).length === 0)
  const interna = await rpc(B, 'pdf_comprar_brancas', { p_sala_id: salaId, p_user_id: B.id, p_qtd: 5 })
  ok('RPC interna bloqueada (pdf_comprar_brancas)', !!interna.error, 'chamou sem erro')
  const interna2 = await rpc(B, 'iniciar_partida_pdf', { p_sala_id: salaId, p_total_jogadores: 4 })
  ok('RPC interna bloqueada (iniciar_partida_pdf)', !!interna2.error, 'chamou sem erro')
  const anon = createClient(URL, KEY, { auth: { persistSession: false } })
  const anonCall = await anon.rpc('pdf_jogar', { p_sala_id: salaId, p_cartas: [1] })
  ok('chamada sem login e bloqueada', !!anonCall.error, 'chamou sem erro')

  // ---------- rodadas ----------
  const meta = (await estadoDe(A, salaId)).estado.meta
  ok('partida comeca com a meta escolhida (3)', meta === 3, `meta=${meta}`)
  await esperaErro('meta nao muda depois de comecar', rpc(A, 'pdf_definir_meta', { p_sala_id: salaId, p_meta: 7 }), 'ja comecou')
  let sala = await estadoDe(A, salaId)
  let primeiraRodadaVerificada = false
  let reconectou = false

  for (let guarda = 0; guarda < 80 && sala.status === 'em_andamento'; guarda++) {
    const est = sala.estado
    const juiz = porId[est.juiz_id]
    const jogadores = todos.filter((j) => j.id !== juiz.id)
    const precisa = Math.max(est.preta.lacunas, 1)

    if (!primeiraRodadaVerificada) {
      ok('rodada 1: juiz e o host', est.rodada === 1 && juiz.id === A.id)
      ok('rodada 1: fase jogando', est.fase === 'jogando')
      ok('preta sem {JOGADOR} sobrando', !est.preta.texto.includes('{JOGADOR}'))
      await esperaErro('juiz nao joga carta', rpc(juiz, 'pdf_jogar', { p_sala_id: salaId, p_cartas: [1] }), 'juiz nao joga')
      const alvo = jogadores[0]
      await esperaErro('carta que nao e minha e recusada', rpc(alvo, 'pdf_jogar', { p_sala_id: salaId, p_cartas: Array(precisa).fill(0).map((_, i) => 900000 + i) }), 'nao esta na sua mao')
      const minha = await maoDe(alvo)
      await esperaErro('quantidade errada de cartas e recusada', rpc(alvo, 'pdf_jogar', { p_sala_id: salaId, p_cartas: Array(precisa + 1).fill(0).map((_, i) => minha[i].carta_id) }), 'pede')
      await esperaErro('host nao pula antes do tempo', rpc(A, 'pdf_pular', { p_sala_id: salaId }), 'espere')
    }

    // todos os nao-juizes jogam
    for (const j of jogadores) {
      const mao = await maoDe(j)
      const escolhidas = mao.slice(0, precisa).map((m) => m.carta_id)
      const r = await rpc(j, 'pdf_jogar', { p_sala_id: salaId, p_cartas: escolhidas })
      if (r.error) ok(`${j.nome} joga (rodada ${est.rodada})`, false, r.error)
      if (!primeiraRodadaVerificada && j === jogadores[0]) {
        await esperaErro('nao joga duas vezes', rpc(j, 'pdf_jogar', { p_sala_id: salaId, p_cartas: escolhidas }), 'ja jogou')
      }
    }

    sala = await estadoDe(A, salaId)
    if (!primeiraRodadaVerificada) {
      ok('apos todos jogarem: fase julgando', sala.estado.fase === 'julgando', sala.estado.fase)
      ok('respostas publicadas: uma por jogador', sala.estado.respostas?.length === 3, JSON.stringify(sala.estado.respostas))
      const json = JSON.stringify(sala.estado.respostas)
      ok('respostas anonimas (nenhum user_id vazou)', !todos.some((j) => json.includes(j.id)))
      const naoJuiz = jogadores[0]
      await esperaErro('nao-juiz nao escolhe', rpc(naoJuiz, 'pdf_escolher', { p_sala_id: salaId, p_idx: 0 }), 'so o juiz')
      await esperaErro('juiz nao escolhe indice invalido', rpc(juiz, 'pdf_escolher', { p_sala_id: salaId, p_idx: 99 }), 'invalida')
    }

    const idx = Math.floor(Math.random() * sala.estado.respostas.length)
    const esc = await rpc(juiz, 'pdf_escolher', { p_sala_id: salaId, p_idx: idx })
    if (esc.error) ok(`juiz escolhe (rodada ${est.rodada})`, false, esc.error)
    sala = await estadoDe(A, salaId)

    if (!primeiraRodadaVerificada) {
      ok('resultado revela os donos', sala.estado.fase === 'resultado' && sala.estado.resultado?.todas?.length === 3)
      const soma = Object.values(sala.estado.pontuacoes).reduce((a, b) => a + b, 0)
      ok('exatamente 1 ponto distribuido', soma === 1, `soma=${soma}`)
      await esperaErro('jogador comum nao avanca rodada', rpc(jogadores[0], 'pdf_proxima', { p_sala_id: salaId }), 'juiz ou o host')
      primeiraRodadaVerificada = true
    }

    if (sala.status === 'finalizado') break

    const prox = await rpc(A, 'pdf_proxima', { p_sala_id: salaId })
    if (prox.error) {
      ok(`avanca rodada ${est.rodada}`, false, prox.error)
      break
    }
    sala = await estadoDe(A, salaId)

    if (est.rodada === 1) {
      ok('rodada 2: juiz rotaciona pro proximo', sala.estado.juiz_id === est.ordem[1], `juiz ${sala.estado.juiz_id}`)
      for (const j of todos) {
        const mao = await maoDe(j)
        ok(`${j.nome} tem 10 cartas apos reposicao`, mao.length === 10, `tem ${mao.length}`)
      }
    }

    if (!reconectou && est.rodada === 1) {
      // reconexao: novo cliente com a mesma sessao do Beto enxerga a mesma mao
      const c2 = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })
      await c2.auth.setSession({ access_token: B.session.access_token, refresh_token: B.session.refresh_token })
      const { data } = await c2.from('pdf_maos').select('carta_id').eq('user_id', B.id)
      ok('reconexao: mesma sessao ve a mesma mao', (data ?? []).length === 10, `viu ${(data ?? []).length}`)
      reconectou = true
    }
  }

  ok(`partida termina com vencedor (meta ${meta})`, sala.status === 'finalizado' && !!sala.estado.vencedor, `status=${sala.status}`)
  const maxPontos = Math.max(...Object.values(sala.estado.pontuacoes))
  ok('vencedor tem pelo menos a meta de pontos', maxPontos >= meta, `max=${maxPontos}`)
  await esperaErro('nao joga depois de finalizada', rpc(A, 'pdf_proxima', { p_sala_id: salaId }), 'nao esta em andamento')

  console.log(falhas === 0 ? '\nTUDO OK' : `\n${falhas} FALHA(S)`)
  process.exit(falhas === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('ERRO NO TESTE:', e)
  process.exit(2)
})
