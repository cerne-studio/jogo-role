// Campeonato do Draft FC: sorteio dos grupos, calendário, simulação de cada etapa e avanço pro mata-mata.
// Puro e serializável (vai e volta do banco como JSON). Os resultados são decididos por UM celular e publicados;
// os outros só leem, então nenhum resultado depende de dois motores darem o mesmo número.
//
// times:   [{ id, nome, sigla, tipo: 'humano'|'bot', user_id?, formacao, tatica, picks[11] }]
// torneio: { tamanho, times, grupos, etapas, cursor, resultados, est, estRevelado, campeaoId, semente }
//   etapa:   { id, fase: 'grupos'|'quartas'|'semi'|'final', nome, jogos: [{ id, grupo?, A, B }] }
//   resultado de um jogo: { golsA, golsB, vencedor: 'A'|'B'|null, decididoPor, penaltis, prorrogou, gols[], cartoes[], melhor }

import { montarEscalacao, simularPartida } from './motor.js'
import { timeParaMotor } from './adaptador.js'
import { classificacao, criarEstatisticas, indisponiveis, premios, registrarPartida, zerarAmarelosAcumulados } from './campeonatoStats.js'
import { criarRng } from './rng.js'

export const FORMATOS = {
  8: { grupos: 2, porGrupo: 4 },
  16: { grupos: 4, porGrupo: 4 },
  20: { grupos: 4, porGrupo: 5 },
}
export const LETRAS_GRUPO = 'ABCD'

function hash(texto) {
  let h = 2166136261
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619)
  return h >>> 0
}

function embaralhar(lista, rng) {
  const a = [...lista]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng.proximo() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Humanos primeiro, um por grupo em sequência (espalha os amigos); depois os bots preenchem.
export function sortearGrupos(times, tamanho, semente) {
  const fmt = FORMATOS[tamanho]
  if (!fmt) throw new Error(`campeonato de ${tamanho} times nao existe`)
  if (times.length !== tamanho) throw new Error(`esperava ${tamanho} times, recebi ${times.length}`)
  const rng = criarRng(hash(`grupos:${semente}`))
  const humanos = embaralhar(times.filter((t) => t.tipo === 'humano'), rng)
  const bots = embaralhar(times.filter((t) => t.tipo !== 'humano'), rng)
  const grupos = Array.from({ length: fmt.grupos }, () => [])
  let g = 0
  for (const t of [...humanos, ...bots]) {
    let tentativas = 0
    while (grupos[g % fmt.grupos].length >= fmt.porGrupo && tentativas++ < fmt.grupos) g++
    grupos[g % fmt.grupos].push(t.id)
    g++
  }
  return grupos
}

// Todos contra todos (método do círculo). Com número ímpar entra um "folga" (null).
export function rodadasDoGrupo(ids) {
  const lista = ids.length % 2 ? [...ids, null] : [...ids]
  const n = lista.length
  const rodadas = []
  for (let r = 0; r < n - 1; r++) {
    const jogos = []
    for (let i = 0; i < n / 2; i++) {
      const a = lista[i]
      const b = lista[n - 1 - i]
      if (a != null && b != null) jogos.push(r % 2 ? [b, a] : [a, b])
    }
    rodadas.push(jogos)
    lista.splice(1, 0, lista.pop())
  }
  return rodadas
}

function etapasDeGrupos(grupos) {
  const rodadas = grupos.map((g) => rodadasDoGrupo(g))
  const total = Math.max(...rodadas.map((r) => r.length))
  const etapas = []
  for (let r = 0; r < total; r++) {
    const jogos = []
    grupos.forEach((_, gi) => {
      ;(rodadas[gi][r] ?? []).forEach(([A, B], k) => jogos.push({ id: `g${r + 1}-${LETRAS_GRUPO[gi]}${k + 1}`, grupo: LETRAS_GRUPO[gi], A, B }))
    })
    etapas.push({ id: `g${r + 1}`, fase: 'grupos', nome: `Rodada ${r + 1}`, jogos })
  }
  return etapas
}

export function criarTorneio({ times, tamanho, semente }) {
  const grupos = sortearGrupos(times, tamanho, semente)
  return {
    tamanho,
    semente,
    times,
    grupos,
    etapas: etapasDeGrupos(grupos),
    cursor: 0,
    resultados: {},
    est: criarEstatisticas(),
    estRevelado: criarEstatisticas(),
    campeaoId: null,
  }
}

export const timePorId = (torneio, id) => torneio.times.find((t) => t.id === id)
export const etapaAtual = (torneio) => torneio.etapas[torneio.cursor] ?? null
export const etapaTemResultado = (torneio, etapa) => etapa.jogos.every((j) => torneio.resultados[j.id])

function resumirPartida(sim) {
  const r = sim.resultado
  const gols = sim.eventos
    .filter((e) => e.tipo === 'gol' || e.tipo === 'gol_penalti' || e.tipo === 'gol_contra')
    .map((e) => ({ rotulo: e.rotulo, time: e.time, jogadorNome: e.jogadorNome, assistenciaNome: e.assistenciaNome ?? null, tipo: e.tipo }))
  const cartoes = sim.eventos
    .filter((e) => e.tipo === 'amarelo' || e.tipo === 'vermelho')
    .map((e) => ({ rotulo: e.rotulo, time: e.time, jogadorNome: e.jogadorNome, tipo: e.tipo }))
  return {
    golsA: r.golsA, golsB: r.golsB, vencedor: r.vencedor, decididoPor: r.decididoPor, prorrogou: !!r.prorrogou,
    penaltis: r.penaltis ? { A: r.penaltis.A, B: r.penaltis.B } : null,
    gols, cartoes, melhor: sim.melhorEmCampo ? { nome: sim.melhorEmCampo.nome, nota: sim.melhorEmCampo.nota, time: sim.melhorEmCampo.time } : null,
    stats: sim.stats,
  }
}

// Simula todos os jogos da etapa atual. Devolve { torneio (cópia com resultados e est novos), partidas } onde
// `partidas` guarda a simulação COMPLETA (lances) só dos jogos com humano, pra eles assistirem.
export function simularEtapaAtual(torneio) {
  const etapa = etapaAtual(torneio)
  if (!etapa) throw new Error('campeonato acabou')
  if (etapaTemResultado(torneio, etapa)) throw new Error('essa etapa ja foi simulada')
  const est = JSON.parse(JSON.stringify(torneio.est))
  if (etapa.fase !== 'grupos' && torneio.cursor > 0 && torneio.etapas[torneio.cursor - 1].fase === 'grupos') zerarAmarelosAcumulados(est)
  const resultados = { ...torneio.resultados }
  const partidas = {}
  for (const jogo of etapa.jogos) {
    const tA = timePorId(torneio, jogo.A)
    const tB = timePorId(torneio, jogo.B)
    const indA = indisponiveis(est, tA.id)
    const indB = indisponiveis(est, tB.id)
    const cfgA = montarEscalacao(timeParaMotor(tA), indA)
    const cfgB = montarEscalacao(timeParaMotor(tB), indB)
    const mataMata = etapa.fase !== 'grupos'
    const sim = simularPartida(cfgA, cfgB, { semente: hash(`${torneio.semente}:${jogo.id}`), mataMata })
    registrarPartida(est, { fase: etapa.fase === 'grupos' ? 'grupos' : 'mata-mata', timeA: { id: tA.id, nome: tA.nome }, timeB: { id: tB.id, nome: tB.nome }, indisponiveis: { A: indA, B: indB } }, sim)
    resultados[jogo.id] = { ...resumirPartida(sim), suspensos: { A: indA.length, B: indB.length } }
    if (tA.tipo === 'humano' || tB.tipo === 'humano') partidas[jogo.id] = { sim, cfg: { A: cfgA, B: cfgB } }
  }
  return { torneio: { ...torneio, resultados, est }, partidas }
}

// Tabela de um grupo usando só os resultados das etapas já reveladas (índice < `ate`).
export function tabelaDoGrupo(torneio, grupoIdx, ate = torneio.cursor) {
  const ids = torneio.grupos[grupoIdx]
  const linhas = Object.fromEntries(ids.map((id) => [id, { id, nome: timePorId(torneio, id).nome, sigla: timePorId(torneio, id).sigla, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, pts: 0 }]))
  for (const etapa of torneio.etapas.slice(0, ate)) {
    if (etapa.fase !== 'grupos') continue
    for (const jogo of etapa.jogos) {
      const r = torneio.resultados[jogo.id]
      if (!r || !linhas[jogo.A] || !linhas[jogo.B]) continue
      const a = linhas[jogo.A]
      const b = linhas[jogo.B]
      a.j++; b.j++
      a.gp += r.golsA; a.gc += r.golsB; b.gp += r.golsB; b.gc += r.golsA
      if (r.golsA > r.golsB) { a.v++; a.pts += 3; b.d++ }
      else if (r.golsA < r.golsB) { b.v++; b.pts += 3; a.d++ }
      else { a.e++; b.e++; a.pts++; b.pts++ }
    }
  }
  return Object.values(linhas)
    .map((l) => ({ ...l, sg: l.gp - l.gc }))
    .sort((x, y) => y.pts - x.pts || y.sg - x.sg || y.gp - x.gp || y.v - x.v || x.nome.localeCompare(y.nome))
}

export const gruposTerminaram = (torneio) => torneio.etapas.filter((e) => e.fase === 'grupos').every((e) => etapaTemResultado(torneio, e))

function vencedorDe(torneio, jogo) {
  const r = torneio.resultados[jogo.id]
  return r.vencedor === 'A' ? jogo.A : jogo.B
}

// Passa pra próxima etapa (revela a atual). Quando os grupos acabam, monta o mata-mata; quando a final acaba, define o campeão.
export function avancarEtapa(torneio) {
  const etapa = etapaAtual(torneio)
  if (!etapa || !etapaTemResultado(torneio, etapa)) throw new Error('a etapa atual ainda nao foi simulada')
  const t = { ...torneio, etapas: [...torneio.etapas], estRevelado: torneio.est }
  t.cursor = torneio.cursor + 1

  if (etapa.fase === 'final') {
    t.campeaoId = vencedorDe(torneio, etapa.jogos[0])
    return t
  }
  if (t.cursor < t.etapas.length) return t

  if (etapa.fase === 'grupos') {
    const tabelas = torneio.grupos.map((_, gi) => tabelaDoGrupo(torneio, gi, t.cursor))
    const p = (g, pos) => tabelas[g][pos].id
    const cruzamentos = tabelas.length === 2
      ? [[p(0, 0), p(1, 1)], [p(1, 0), p(0, 1)]]
      : [[p(0, 0), p(1, 1)], [p(2, 0), p(3, 1)], [p(1, 0), p(0, 1)], [p(3, 0), p(2, 1)]]
    const fase = tabelas.length === 2 ? 'semi' : 'quartas'
    t.etapas.push({ id: fase, fase, nome: fase === 'semi' ? 'Semifinal' : 'Quartas de final', jogos: cruzamentos.map(([A, B], i) => ({ id: `${fase}-${i + 1}`, A, B })) })
  } else if (etapa.fase === 'quartas') {
    const v = etapa.jogos.map((j) => vencedorDe(torneio, j))
    t.etapas.push({ id: 'semi', fase: 'semi', nome: 'Semifinal', jogos: [{ id: 'semi-1', A: v[0], B: v[1] }, { id: 'semi-2', A: v[2], B: v[3] }] })
  } else if (etapa.fase === 'semi') {
    const v = etapa.jogos.map((j) => vencedorDe(torneio, j))
    t.etapas.push({ id: 'final', fase: 'final', nome: 'Final', jogos: [{ id: 'final-1', A: v[0], B: v[1] }] })
  }
  return t
}

// Quem ainda está vivo na etapa atual (times que jogam nela).
export function timesDaEtapa(torneio, etapa = etapaAtual(torneio)) {
  return etapa ? etapa.jogos.flatMap((j) => [j.A, j.B]) : []
}

export function jogoDoTime(torneio, timeId, etapa = etapaAtual(torneio)) {
  return etapa?.jogos.find((j) => j.A === timeId || j.B === timeId) ?? null
}

// user_ids dos humanos que têm jogo na etapa atual (todo mundo precisa dar "continuar" antes de avançar).
export function humanosAtivos(torneio, etapa = etapaAtual(torneio)) {
  const ids = new Set(timesDaEtapa(torneio, etapa))
  return torneio.times.filter((t) => t.tipo === 'humano' && ids.has(t.id)).map((t) => t.user_id)
}

// Time humano eliminado no mata-mata? (jogou uma etapa de mata-mata já revelada e perdeu)
export function foiEliminado(torneio, timeId) {
  for (const etapa of torneio.etapas.slice(0, torneio.cursor)) {
    if (etapa.fase === 'grupos') continue
    const jogo = jogoDoTime(torneio, timeId, etapa)
    if (jogo && vencedorDe(torneio, jogo) !== timeId) return true
  }
  const gr = torneio.etapas.filter((e) => e.fase === 'grupos')
  const gruposRevelados = gr.length > 0 && gr.every((e) => torneio.etapas.indexOf(e) < torneio.cursor)
  if (gruposRevelados) {
    const gi = torneio.grupos.findIndex((g) => g.includes(timeId))
    const pos = tabelaDoGrupo(torneio, gi).findIndex((l) => l.id === timeId)
    if (pos >= 2) return true
  }
  return false
}

export function premiosDoTorneio(torneio) {
  return premios(torneio.est)
}

export { classificacao }
