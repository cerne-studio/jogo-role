import { TIMES, TIMES_POR_ID } from '../data/times.js'
import { clamp, arred } from './rng.js'
import { contratoNovato } from './contrato.js'

// Nota de prospecto: o que os scouts enxergam (mistura de overall atual, teto e hype).
export function notaProspecto(estado, rng, ruido = 3) {
  const nota = estado.media * 0.35 + estado.potencial * 0.65 + (estado.fama - 10) * 0.05
  return nota + (rng ? rng.norm(0, ruido) : 0)
}

// Classe do draft: ~60 prospectos com notas em escada (os melhores muito acima do resto).
export function gerarClasse(rng, n = 60) {
  // curva convexa: poucos prospectos de elite no topo, muita gente parecida no meio, piso perto de 60
  return Array.from({ length: n }, (_, i) => 60 + 27 * (1 - i / n) ** 1.5 + rng.norm(0, 1.6)).sort((a, b) => b - a)
}

export function pickPorNota(nota, classe) {
  const acima = classe.filter((c) => c > nota).length
  return acima + 1
}

// "Mock draft" que o jogador vê antes de decidir: faixa em volta da projeção real.
export function projetarDraft(estado, rng) {
  const classe = gerarClasse(rng)
  const nota = notaProspecto(estado, null)
  const central = pickPorNota(nota, classe)
  const folga = Math.max(2, Math.round(central * 0.35))
  return {
    central: Math.min(central, 70),
    minimo: Math.max(1, central - folga),
    maximo: Math.min(70, central + folga),
    fora: central > 58,
  }
}

// Ordem da loteria: times piores escolhem primeiro (com sorte). 1ª rodada = 30 times; 2ª rodada inverte.
export function ordemDoDraft(estado, rng) {
  const forcas = estado.liga
  const ordem = TIMES.map((t) => ({ id: t.id, v: forcas[t.id] + rng.norm(0, 7) })).sort((a, b) => a.v - b.v).map((x) => x.id)
  return [...ordem, ...[...ordem].reverse()]
}

export function executarDraft(estado, rng) {
  const classe = gerarClasse(rng)
  const nota = notaProspecto(estado, rng)
  const pick = pickPorNota(nota, classe)
  const ordem = ordemDoDraft(estado, rng)
  const fora = pick > 58

  const resultado = { pick, ano: estado.ano, fora, notaTopo: arred(classe[0], 0) }
  if (fora) return { ...resultado, time: null, contrato: null }

  const timeId = ordem[Math.min(pick, 60) - 1]
  return { ...resultado, time: timeId, timeNome: TIMES_POR_ID[timeId].nome, contrato: contratoNovato(pick) }
}

export function descreverPick(pick) {
  if (pick === 1) return 'primeira escolha geral'
  if (pick <= 5) return `top 5 (escolha ${pick})`
  if (pick <= 14) return `loteria (escolha ${pick})`
  if (pick <= 30) return `primeira rodada (escolha ${pick})`
  return `segunda rodada (escolha ${pick})`
}

// Ofertas pra quem passou batido no draft.
export function ofertasSemDraft(estado, rng) {
  const times = rng.embaralhar(TIMES).slice(0, 3)
  return times.map((t) => ({
    time: t.id,
    nome: t.nome,
    contrato: { tipo: 'duas_vias', salario: 0.6, anos: 2, anosRestantes: 2 },
    // quanto mais fraco o time, mais minutos prometidos
    promessa: clamp(Math.round((75 - estado.liga[t.id]) * 1.2), 0, 30),
  }))
}
