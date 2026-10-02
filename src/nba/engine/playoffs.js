import { TIMES_POR_ID } from '../data/times.js'
import { clamp, sigmoide } from './rng.js'

// Probabilidade de o time A vencer um jogo contra o B.
export function probJogo(fa, fb, mandoA) {
  return clamp(sigmoide((fa - fb) / 9) + (mandoA ? 0.03 : -0.03), 0.06, 0.94)
}

const MANDO = [true, true, false, false, true, false, true] // 2-2-1-1-1 (true = melhor campanha em casa)

function placarJogo(vencedorCasa, rng) {
  const base = rng.int(96, 118)
  const margem = rng.int(1, 16)
  const venc = base + margem
  return vencedorCasa ? { casa: venc, fora: base } : { casa: base, fora: venc }
}

// Simula uma série melhor-de-7 entre `a` (melhor campanha) e `b`. Retorna os jogos.
export function simularSerie(a, b, rng) {
  let wa = 0
  let wb = 0
  const jogos = []
  let n = 0
  while (wa < 4 && wb < 4) {
    const mandoA = MANDO[n]
    const aVence = rng.chance(probJogo(a.forca, b.forca, mandoA))
    if (aVence) wa++
    else wb++
    const venceuCasa = (mandoA && aVence) || (!mandoA && !aVence)
    const p = placarJogo(venceuCasa, rng)
    jogos.push({
      n: n + 1,
      casa: mandoA ? a.id : b.id,
      fora: mandoA ? b.id : a.id,
      pontosCasa: p.casa,
      pontosFora: p.fora,
      vencedor: aVence ? a.id : b.id,
      placarSerie: `${wa}-${wb}`,
    })
    n++
  }
  return { a: a.id, b: b.id, vencedor: wa === 4 ? a.id : b.id, perdedor: wa === 4 ? b.id : a.id, placar: `${Math.max(wa, wb)}-${Math.min(wa, wb)}`, jogos }
}

// Play-in: seeds 7-10. 7v8 (vencedor = seed 7), 9v10 (perdedor sai); perdedor de 7v8 enfrenta vencedor de 9v10 (= seed 8).
function playIn(tab, rng) {
  const s = (n) => tab.find((x) => x.seed === n)
  const jogo = (x, y) => {
    const xVence = rng.chance(probJogo(x.forca, y.forca, true))
    return { vencedor: xVence ? x : y, perdedor: xVence ? y : x }
  }
  const j78 = jogo(s(7), s(8))
  const j910 = jogo(s(9), s(10))
  const jFinal = jogo(j78.perdedor, j910.vencedor)
  const eliminados = [j910.perdedor, jFinal.perdedor].map((x) => x.id)
  return { seed7: j78.vencedor, seed8: jFinal.vencedor, eliminados }
}

function chaveConferencia(tab, rng, usuarioId, meta) {
  const top = tab.filter((x) => x.seed <= 6)
  const pi = playIn(tab, rng)
  const seeds = { 1: top[0], 2: top[1], 3: top[2], 4: top[3], 5: top[4], 6: top[5], 7: pi.seed7, 8: pi.seed8 }
  const seedDe = (id) => Number(Object.entries(seeds).find(([, t]) => t.id === id)[0])
  const porId = (id) => Object.values(seeds).find((t) => t.id === id)
  const melhorSeedPrimeiro = (x, y) => (seedDe(x.id) <= seedDe(y.id) ? [x, y] : [y, x])

  const minhaLinha = tab.find((x) => x.id === usuarioId)
  if (minhaLinha && minhaLinha.seed >= 7) {
    meta.playIn = { chegou: pi.seed7.id === usuarioId || pi.seed8.id === usuarioId, eliminado: pi.eliminados.includes(usuarioId) }
  }

  const rodada1 = [[1, 8], [4, 5], [3, 6], [2, 7]].map(([x, y]) => simularSerie(seeds[x], seeds[y], rng))
  const rodada2 = [[0, 1], [2, 3]].map(([i, j]) => {
    const [x, y] = melhorSeedPrimeiro(porId(rodada1[i].vencedor), porId(rodada1[j].vencedor))
    return simularSerie(x, y, rng)
  })
  const [f1, f2] = melhorSeedPrimeiro(porId(rodada2[0].vencedor), porId(rodada2[1].vencedor))
  const finalConf = simularSerie(f1, f2, rng)
  return {
    rodada1,
    rodada2,
    finalConf,
    campeao: porId(finalConf.vencedor),
    todosPlayoffs: Object.values(seeds).map((t) => t.id),
  }
}

// Resultado completo da pós-temporada. Retorna as séries em que o usuário jogou e o campeão.
export function simularPlayoffs(tabelas, rng, usuarioId) {
  const meta = {}
  const leste = chaveConferencia(tabelas.Leste, rng, usuarioId, meta)
  const oeste = chaveConferencia(tabelas.Oeste, rng, usuarioId, meta)

  // Final da NBA: melhor campanha tem mando
  const [fa, fb] = [leste.campeao, oeste.campeao].sort((x, y) => {
    const wx = [...tabelas.Leste, ...tabelas.Oeste].find((t) => t.id === x.id).vitorias
    const wy = [...tabelas.Leste, ...tabelas.Oeste].find((t) => t.id === y.id).vitorias
    return wy - wx
  })
  const finais = simularSerie(fa, fb, rng)

  const todas = [
    ...leste.rodada1.map((s) => ({ ...s, fase: 'Primeira rodada', conf: 'Leste' })),
    ...oeste.rodada1.map((s) => ({ ...s, fase: 'Primeira rodada', conf: 'Oeste' })),
    ...leste.rodada2.map((s) => ({ ...s, fase: 'Semifinal de conferência', conf: 'Leste' })),
    ...oeste.rodada2.map((s) => ({ ...s, fase: 'Semifinal de conferência', conf: 'Oeste' })),
    { ...leste.finalConf, fase: 'Final do Leste', conf: 'Leste' },
    { ...oeste.finalConf, fase: 'Final do Oeste', conf: 'Oeste' },
    { ...finais, fase: 'Finais da NBA', conf: null },
  ]

  const minhasSeries = todas.filter((s) => s.a === usuarioId || s.b === usuarioId)
  const classificados = new Set([...leste.todosPlayoffs, ...oeste.todosPlayoffs])
  return {
    campeao: finais.vencedor,
    vice: finais.perdedor,
    finalistas: [fa.id, fb.id],
    series: todas,
    minhasSeries,
    classificado: classificados.has(usuarioId),
    playIn: meta.playIn ?? null,
    nomeCampeao: TIMES_POR_ID[finais.vencedor].nome,
  }
}

// Nome da fase em que o usuário caiu (ou 'Campeão').
export function faseAlcancada(resultado, usuarioId) {
  if (!resultado.classificado) return resultado.playIn ? 'Eliminado no play-in' : 'Fora dos playoffs'
  if (resultado.campeao === usuarioId) return 'Campeão da NBA'
  const ultima = resultado.minhasSeries[resultado.minhasSeries.length - 1]
  if (!ultima) return 'Fora dos playoffs'
  return `Eliminado: ${ultima.fase}`
}
