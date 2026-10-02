import { PESOS_POSICAO, POSICOES } from '../data/times.js'
import { clamp } from './rng.js'

export function calcMedia(atrs, posicao) {
  const pesos = PESOS_POSICAO[posicao]
  return Math.round(Object.keys(pesos).reduce((acc, k) => acc + atrs[k] * pesos[k], 0))
}

export function gerarAtributosIniciais(posicao, rng, caminho) {
  const base = {
    arremesso: rng.int(48, 64),
    infiltracao: rng.int(48, 64),
    passe: rng.int(46, 62),
    defesa: rng.int(46, 62),
    fisico: rng.int(48, 64),
    qi: rng.int(50, 66),
  }
  if (posicao === 'armador') { base.passe += 6; base.qi += 4 }
  if (posicao === 'ala_armador') { base.arremesso += 6; base.infiltracao += 3 }
  if (posicao === 'ala') { base.defesa += 4; base.infiltracao += 4 }
  if (posicao === 'ala_pivo') { base.fisico += 6; base.defesa += 4 }
  if (posicao === 'pivo') { base.fisico += 8; base.infiltracao += 4 }
  // Sem recrutamento = modo difícil: parte mais baixo
  const ajuste = caminho === 'sem_recrutamento' ? -3 : 0
  return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, clamp(v + ajuste, 38, 76)]))
}

// Potencial: o teto de overall. Distribuição enviesada pra baixo (poucos viram superastros).
export function gerarPotencial(media, rng, caminho) {
  const sorte = rng.r() ** 2.7
  const bonus = caminho === 'sem_recrutamento' ? -2 : 0
  return clamp(Math.round(media + 8 + sorte * 27 + bonus), 62, 99)
}

export function alturaSorteada(posicao, rng) {
  const p = POSICOES.find((x) => x.id === posicao)
  return rng.int(p.alturaMin, p.alturaMax)
}

// Curva de desenvolvimento por idade (ganho médio de overall por temporada).
export function ganhoPorIdade(idade, rng) {
  if (idade <= 19) return rng.int(4, 8)
  if (idade <= 21) return rng.int(3, 6)
  if (idade <= 23) return rng.int(2, 5)
  if (idade <= 25) return rng.int(1, 3)
  if (idade <= 27) return rng.int(0, 2)
  if (idade <= 29) return rng.int(-1, 1)
  if (idade <= 31) return rng.int(-2, 0)
  if (idade <= 33) return rng.int(-3, -1)
  if (idade <= 35) return rng.int(-4, -1)
  return rng.int(-5, -2)
}

// Evolução de atributos de uma temporada. `foco` = programa de treino escolhido ({atributo: bônus}).
export function evoluirAtributos(estado, rng, foco = {}) {
  const { atrs, potencial, idade, desgaste } = estado
  const ganho = ganhoPorIdade(idade, rng)
  const penDesgaste = desgaste > 65 ? -rng.int(1, 2) : 0
  // cabeça e confiança do técnico também desenvolvem (ou travam) o jogador
  let bonusStatus = 0
  if (estado.moral >= 75 && rng.chance(0.5)) bonusStatus += 1
  else if (estado.moral <= 25 && rng.chance(0.5)) bonusStatus -= 1
  if (idade <= 27 && estado.tecnico >= 70 && rng.chance(0.5)) bonusStatus += 1
  const novos = { ...atrs }
  for (const k of Object.keys(novos)) {
    let delta = ganho + penDesgaste + bonusStatus + (foco[k] ?? 0) + rng.int(-1, 1) * (idade < 27 ? 1 : 0)
    if (k === 'fisico' && idade >= 30) delta -= 1
    if (k === 'qi' && idade <= 32) delta += 1
    if (k === 'arremesso' && idade >= 30 && delta < 0) delta += 1 // arremesso envelhece melhor
    novos[k] = clamp(novos[k] + delta, 1, potencial)
  }
  return novos
}

export function papelTexto(papel) {
  return { estrela: 'Estrela do time', titular: 'Titular', rotacao: 'Rotação', banco: 'Reserva', g_league: 'G League' }[papel] ?? papel
}
