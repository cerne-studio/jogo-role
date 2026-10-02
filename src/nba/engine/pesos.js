// Quanto vale cada efeito de um evento, numa escala comum. Usado pra equilibrar escolhas e pra escolher a manchete do ano.
export const PESOS_EFEITO = {
  arremesso: 6, infiltracao: 6, passe: 6, defesa: 6, fisico: 6, qi: 6, potencial: 6,
  moral: 1, fama: 1.2, tecnico: 1, vestiario: 1, imagem: 1, desgaste: -0.8,
  dinheiro: 12, patrocinio: 25, gasto: -40, salarioPct: 0.8, risco: -60, foraTemporada: -25, minutosBonus: 3, minutosPenalidade: -4,
}

export function utilidade(efeitos) {
  return Object.entries(efeitos ?? {}).reduce((t, [k, v]) => (typeof v === 'number' ? t + (PESOS_EFEITO[k] ?? 0) * v : t), 0)
}

// Utilidade esperada de uma escolha (considera o sorteio, se houver).
export function utilidadeEscolha(c) {
  if (c.alea) return c.alea.p * utilidade(c.alea.sucesso.efeitos) + (1 - c.alea.p) * utilidade(c.alea.falha.efeitos)
  return utilidade(c.efeitos)
}
