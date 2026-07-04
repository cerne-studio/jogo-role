// Tabela padrão de composição da Resistência (regras clássicas).
// missoes: tamanho da equipe por missão (5 missões fixas)
// falhasNecessarias: quantas sabotagens fecham a missão como fracasso
export const composicaoPorJogadores = {
  5: { traidores: 2, missoes: [2, 3, 2, 3, 3], falhasNecessarias: [1, 1, 1, 1, 1] },
  6: { traidores: 2, missoes: [2, 3, 4, 3, 4], falhasNecessarias: [1, 1, 1, 1, 1] },
  7: { traidores: 3, missoes: [2, 3, 3, 4, 4], falhasNecessarias: [1, 1, 1, 2, 1] },
  8: { traidores: 3, missoes: [3, 4, 4, 5, 5], falhasNecessarias: [1, 1, 1, 2, 1] },
  9: { traidores: 3, missoes: [3, 4, 4, 5, 5], falhasNecessarias: [1, 1, 1, 2, 1] },
  10: { traidores: 4, missoes: [3, 4, 4, 5, 5], falhasNecessarias: [1, 1, 1, 2, 1] },
}

export function getComposicao(numJogadores) {
  const clamped = Math.min(10, Math.max(5, numJogadores))
  return composicaoPorJogadores[clamped]
}
