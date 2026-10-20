// Converte um time montado no draft (picks vindos de fd_times) no formato que o motor da partida espera,
// e calcula a nota geral e os medidores de ataque/meio/defesa/goleiro.

import { FORMACOES } from './formacoes.js'

const v = (x, padrao = 30) => (x == null ? padrao : x)

export function jogadorParaMotor(p, indiceSlot, timeId = 't') {
  const goleiro = p.posicoes?.[0] === 'GK'
  return {
    id: `${timeId}:${p.pid ?? `s${p.slot}`}`,
    nome: p.nome,
    num: goleiro ? 1 : indiceSlot + 1,
    ovr: p.overall,
    atq: Math.round(v(p.chute) * 0.6 + v(p.drible) * 0.25 + v(p.ritmo) * 0.15),
    pas: v(p.passe),
    def: v(p.defesa),
    fis: v(p.fisico),
    agr: v(p.agressividade, 50),
    gol: goleiro ? v(p.goleiro, p.overall) : 12,
    penal: v(p.penaltis, 55),
  }
}

// picks: [{slot (1..11), ...}] em qualquer ordem; devolve os 11 em ordem de vaga, na formação.
export function timeParaMotor({ id, nome, formacao, tatica = 'equilibrada', picks }) {
  const ordenados = [...picks].sort((a, b) => a.slot - b.slot)
  if (ordenados.length !== 11) throw new Error(`time ${nome} tem ${ordenados.length} jogadores (precisa de 11)`)
  return { id, nome, formacao, tatica, jogadores: ordenados.map((p, i) => jogadorParaMotor(p, i, id)) }
}

const media = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0)

export function notaGeral(picks) {
  return Math.round(media(picks.map((p) => p.overall)) * 10) / 10
}

export function medidores(picks, formacao) {
  const slots = FORMACOES[formacao]
  const por = { G: [], D: [], M: [], F: [] }
  for (const p of picks) por[slots[p.slot - 1]?.papel]?.push(p.overall)
  return {
    ataque: Math.round(media(por.F)),
    meio: Math.round(media(por.M)),
    defesa: Math.round(media(por.D)),
    goleiro: Math.round(media(por.G)),
  }
}

export function iniciais(nome) {
  const palavras = String(nome).replace(/[^\p{L}\s.'-]/gu, '').split(/\s+/).filter(Boolean)
  if (palavras.length === 0) return '?'
  if (palavras.length === 1) return palavras[0].slice(0, 2).toUpperCase()
  return (palavras[0][0] + palavras[palavras.length - 1][0]).toUpperCase()
}
