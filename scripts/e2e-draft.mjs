// Teste ponta a ponta do draft contra o Supabase real: 3 sessões anônimas, formações, 11 rodadas com disputa
// pelo mesmo jogador ("Pego por X"), tempo esgotado (escolha automática), tática, RLS e uma sala solo.
//
//   node --env-file=.env scripts/e2e-draft.mjs
//
// Cria salas de teste e usuários anônimos; não apaga nada que não seja seu.
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
const dorme = (ms) => new Promise((r) => setTimeout(r, ms))

async function jogador(nome) {
  const c = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  let ultimo = ''
  for (let t = 1; t <= 4; t++) {
    try {
      const { data, error } = await c.auth.signInAnonymously()
      if (!error) return { c, id: data.user.id, nome }
      ultimo = error.message
    } catch (e) {
      ultimo = e.message
    }
    await dorme(800 * t)
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
async function estadoDe(j, salaId) {
  const { data } = await j.c.from('salas').select('estado,status').eq('id', salaId).single()
  return data
}
async function esperaAte(iso) {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms > 0) await dorme(ms + 900)
}

// Escolhe a primeira opção livre que encaixa em alguma vaga aberta; se alguém levar o jogador antes
// ("pego"), tenta o próximo. `pular` ignora esses pids.
async function escolhePrimeira(j, salaId, pular = new Set()) {
  for (let t = 0; t < 8; t++) {
    const { data: lista } = await j.c.rpc('fd_elegiveis', { p_sala_id: salaId })
    const opcao = (lista ?? []).find((o) => !o.pego_por && o.slots.length > 0 && !pular.has(o.pid))
    if (!opcao) return null
    const r = await rpc(j, 'fd_escolher', { p_sala_id: salaId, p_slot: opcao.slots[0], p_pid: opcao.pid })
    if (r.data?.motivo === 'pego') {
      pular.add(opcao.pid)
      continue
    }
    return { opcao, r }
  }
  return null
}

async function main() {
  const A = await jogador('Ana')
  const B = await jogador('Beto')
  const C = await jogador('Caio')

  // ---------- sala + lobby ----------
  const criada = await rpc(A, 'criar_sala', { p_jogo: 'draft', p_nome: A.nome })
  ok('host cria sala draft', !criada.error && criada.data?.codigo?.length === 6, criada.error)
  const salaId = criada.data.sala_id
  for (const j of [B, C]) {
    const r = await rpc(j, 'entrar_sala', { p_codigo: criada.data.codigo, p_nome: j.nome })
    ok(`${j.nome} entra na sala`, !r.error, r.error)
  }
  await esperaErro('nao-host nao configura', rpc(B, 'fd_configurar', { p_sala_id: salaId, p_modo: 'historico', p_liga: null, p_torneio: 8 }), 'so o host')
  await esperaErro('torneio invalido e recusado', rpc(A, 'fd_configurar', { p_sala_id: salaId, p_modo: 'historico', p_liga: null, p_torneio: 12 }), '8, 16 ou 20')
  const ligas = await rpc(A, 'fd_ligas', {})
  ok('lista ligas com 100+ jogadores', Array.isArray(ligas.data) && ligas.data.length >= 4, JSON.stringify(ligas.data)?.slice(0, 120))
  const cfg = await rpc(A, 'fd_configurar', { p_sala_id: salaId, p_modo: 'historico', p_liga: null, p_torneio: 8 })
  ok('host configura historico / 8 times', !cfg.error && cfg.data?.modo === 'historico', cfg.error)
  await esperaErro('nao-host nao inicia', rpc(B, 'iniciar_partida', { p_sala_id: salaId }), 'so o host')
  const ini = await rpc(A, 'iniciar_partida', { p_sala_id: salaId })
  ok('host inicia o draft', !ini.error && ini.data?.fase === 'formacao', ini.error)
  const D = await jogador('Duda')
  await esperaErro('ninguem novo entra depois de comecar', rpc(D, 'entrar_sala', { p_codigo: criada.data.codigo, p_nome: 'Duda' }), 'ja comecou')

  // ---------- RLS ----------
  const { data: pool } = await B.c.from('fd_jogadores').select('*').limit(3)
  ok('cliente nao le o pool (fd_jogadores)', (pool ?? []).length === 0)
  const interna = await rpc(B, 'fd_registrar_escolha', { p_sala_id: salaId, p_user: B.id, p_slot: 1, p_pid: 1, p_auto: false })
  ok('RPC interna bloqueada (fd_registrar_escolha)', !!interna.error)
  const anon = createClient(URL, KEY, { auth: { persistSession: false } })
  const semLogin = await anon.rpc('fd_elegiveis', { p_sala_id: salaId })
  ok('chamada sem login e bloqueada', !!semLogin.error)
  await esperaErro('quem nao e da sala nao ve os times', rpc(D, 'fd_times', { p_sala_id: salaId }), 'nao esta')

  // ---------- formação ----------
  await esperaErro('formacao invalida e recusada', rpc(A, 'fd_definir_formacao', { p_sala_id: salaId, p_formacao: '9-9-9' }), 'invalida')
  await rpc(A, 'fd_definir_formacao', { p_sala_id: salaId, p_formacao: '4-3-3' })
  await rpc(B, 'fd_definir_formacao', { p_sala_id: salaId, p_formacao: '4-4-2' })
  let est = (await estadoDe(A, salaId)).estado
  ok('draft ainda nao abriu com 2 de 3 formacoes', est.fase === 'formacao')
  await rpc(C, 'fd_definir_formacao', { p_sala_id: salaId, p_formacao: '3-5-2' })
  est = (await estadoDe(A, salaId)).estado
  ok('draft abre quando todos escolhem a formacao', est.fase === 'draft' && est.rodada === 1 && /^[A-Z]$/.test(est.letra), `fase=${est.fase} letra=${est.letra}`)

  // ---------- rodada 1: antes de abrir, disputa, escolha dupla ----------
  await esperaErro('nao escolhe antes da roleta acabar', rpc(A, 'fd_escolher', { p_sala_id: salaId, p_slot: 1, p_pid: 1 }), 'ainda nao abriu')
  await esperaAte(est.escolha_ini)
  const { data: listaA } = await A.c.rpc('fd_elegiveis', { p_sala_id: salaId })
  ok('lista tem so jogadores com a letra sorteada', listaA.length > 0 && listaA.every((o) => o.letras.includes(est.letra)), `letra=${est.letra}`)
  const { data: listaB0 } = await B.c.rpc('fd_elegiveis', { p_sala_id: salaId })
  const encaixaB = new Set(listaB0.filter((o) => o.slots.length > 0).map((o) => o.pid))
  const golA = listaA.find((o) => !o.pego_por && o.slots.length > 0 && encaixaB.has(o.pid)) ?? listaA.find((o) => !o.pego_por && o.slots.length > 0)
  const pa = await rpc(A, 'fd_escolher', { p_sala_id: salaId, p_slot: golA.slots[0], p_pid: golA.pid })
  ok('Ana escolhe um jogador', pa.data?.ok === true, pa.error ?? JSON.stringify(pa.data))
  await esperaErro('nao escolhe duas vezes na rodada', rpc(A, 'fd_escolher', { p_sala_id: salaId, p_slot: golA.slots[1] ?? golA.slots[0], p_pid: golA.pid }), 'ja escolheu')
  est = (await estadoDe(B, salaId)).estado
  ok('"Pego por" publicado pra todos', est.pegos?.[String(golA.pid)]?.n === 'Ana', JSON.stringify(est.pegos))
  const prazoAntes = new Date(est.prazos[B.id]).getTime()
  const { data: listaB } = await B.c.rpc('fd_elegiveis', { p_sala_id: salaId })
  const slotsB = listaB.find((o) => o.pid === golA.pid).slots
  const slotB = slotsB[0] ?? 1
  const pb = await rpc(B, 'fd_escolher', { p_sala_id: salaId, p_slot: slotB, p_pid: golA.pid })
  ok('Beto toma "pego" ao tentar o mesmo jogador', pb.data?.ok === false && pb.data?.motivo === 'pego' && pb.data?.por === 'Ana', pb.error ?? JSON.stringify(pb.data))
  est = (await estadoDe(B, salaId)).estado
  const prazoDepois = new Date(est.prazos[B.id]).getTime()
  ok('quem perdeu a disputa ganha +3 s', Math.round((prazoDepois - prazoAntes) / 1000) === 3, `delta=${prazoDepois - prazoAntes}ms`)
  // jogador de outra letra / posicao errada
  const { data: outras } = await B.c.rpc('fd_elegiveis', { p_sala_id: salaId })
  const naoEncaixa = outras.find((o) => !o.pego_por && o.slots.length > 0)
  const slotErrado = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].find((s) => !naoEncaixa.slots.includes(s))
  await esperaErro('posicao errada e recusada', rpc(B, 'fd_escolher', { p_sala_id: salaId, p_slot: slotErrado, p_pid: naoEncaixa.pid }), 'nao joga')
  const eb = await escolhePrimeira(B, salaId)
  ok('Beto escolhe outro jogador', eb?.r.data?.ok === true, eb?.r.error)

  // Caio nao escolhe: deixa o tempo estourar e qualquer um chama fd_avancar
  await esperaAte(new Date(new Date(est.prazos[C.id]).getTime() + 2100).toISOString())
  const av = await rpc(A, 'fd_avancar', { p_sala_id: salaId })
  ok('tempo esgotado: o jogo escolhe por quem nao escolheu', !av.error && av.data?.rodada === 2, av.error ?? `rodada=${av.data?.rodada}`)
  const tC = (await rpc(C, 'fd_times', { p_sala_id: salaId })).data.find((t) => t.user_id === C.id)
  ok('Caio recebeu um jogador automatico', tC.picks.length === 1 && tC.picks[0].auto === true, JSON.stringify(tC.picks.map((p) => p.nome)))

  // ---------- rodadas 2..11: todo mundo escolhe, sem repetir jogador ----------
  for (let r = 2; r <= 11; r++) {
    est = (await estadoDe(A, salaId)).estado
    if (est.rodada !== r) break
    await esperaAte(est.escolha_ini)
    const res = await Promise.all([A, B, C].map((j) => escolhePrimeira(j, salaId)))
    ok(`rodada ${r}: os 3 escolheram (letra ${est.letra})`, res.every((x) => x?.r.data?.ok === true), res.map((x) => x?.r.error ?? JSON.stringify(x?.r.data)).join(' | '))
  }
  est = (await estadoDe(A, salaId)).estado
  ok('draft termina na fase tatica', est.fase === 'tatica', `fase=${est.fase} rodada=${est.rodada}`)

  const times = (await rpc(A, 'fd_times', { p_sala_id: salaId })).data
  ok('3 times com 11 jogadores cada', times.length === 3 && times.every((t) => t.picks.length === 11), times.map((t) => t.picks.length).join(','))
  const pids = times.flatMap((t) => t.picks.map((p) => p.pid))
  ok('nenhum jogador repetido entre os humanos', new Set(pids).size === pids.length)
  const { ACEITA, FORMACOES } = await import('../src/components/futebol/formacoes.js')
  const encaixa = times.every((t) => t.picks.every((p) => {
    const rot = FORMACOES[t.formacao][p.slot - 1].rotulo
    return p.posicoes.some((pos) => ACEITA[rot].includes(pos))
  }))
  ok('todo jogador joga na posicao onde foi colocado', encaixa)
  ok('cada formacao tem 1 goleiro (GOL)', times.every((t) => t.picks[0].posicoes.includes('GK')))
  console.log(`      letras sorteadas: ${est.letras.join(' ')}`)
  console.log(`      times: ${times.map((t) => `${t.nome} ${t.formacao} (nota media ${(t.picks.reduce((s, p) => s + p.overall, 0) / 11).toFixed(1)})`).join(' | ')}`)

  // ---------- tática ----------
  await esperaErro('tatica invalida e recusada', rpc(A, 'fd_definir_tatica', { p_sala_id: salaId, p_tatica: 'kamikaze' }), 'invalida')
  await rpc(A, 'fd_definir_tatica', { p_sala_id: salaId, p_tatica: 'ofensiva' })
  await rpc(B, 'fd_definir_tatica', { p_sala_id: salaId, p_tatica: 'defensiva' })
  est = (await estadoDe(A, salaId)).estado
  ok('espera todos escolherem a tatica', est.fase === 'tatica')
  await esperaAte(est.tatica_ate)
  const fim = await rpc(C, 'fd_avancar', { p_sala_id: salaId })
  ok('tatica sem escolha vira equilibrada', fim.data?.fase === 'prontos' && fim.data?.taticas?.[C.id] === 'equilibrada' && fim.data?.taticas?.[A.id] === 'ofensiva', fim.error ?? JSON.stringify(fim.data?.taticas))

  // ---------- solo ----------
  const solo = await rpc(A, 'criar_sala', { p_jogo: 'draft', p_nome: 'Ana' })
  const sId = solo.data.sala_id
  const si = await rpc(A, 'iniciar_partida', { p_sala_id: sId })
  ok('modo solo inicia com 1 jogador', !si.error, si.error)
  await rpc(A, 'fd_definir_formacao', { p_sala_id: sId, p_formacao: '4-2-3-1' })
  let s = (await estadoDe(A, sId)).estado
  ok('solo: draft abre direto', s.fase === 'draft' && s.rodada === 1)
  for (let r = 1; r <= 11; r++) {
    s = (await estadoDe(A, sId)).estado
    await esperaAte(s.escolha_ini)
    const x = await escolhePrimeira(A, sId)
    if (!x?.r.data?.ok) { ok(`solo rodada ${r}`, false, x?.r.error); break }
  }
  s = (await estadoDe(A, sId)).estado
  ok('solo: 11 rodadas terminam na tatica', s.fase === 'tatica')

  console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo')
  process.exit(falhas ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
