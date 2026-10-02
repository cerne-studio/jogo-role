// Nota de legado: soma estatística + troféus. Define o nível da carreira e o Hall da Fama.

// Carreira fora da NBA vale menos, mas conta: pontos, títulos de liga e MVPs locais.
function exteriorScore(e) {
  const x = e.carreiraExterior
  if (!x) return 0
  const p = e.premios
  return x.pontos / 450 + x.titulos * 7 + (p.mvp_liga ?? 0) * 8 + (p.selecao_liga ?? 0) * 2
}

export function pontuarLegado(e) {
  const c = e.carreira
  const p = e.premios
  const allnba = (p.allnba1 ?? 0) * 20 + (p.allnba2 ?? 0) * 12 + (p.allnba3 ?? 0) * 8
  const score =
    c.pontos / 110 +
    c.rebotes / 130 +
    c.assistencias / 90 +
    e.titulos.length * 45 +
    (p.mvp ?? 0) * 55 +
    (p.fmvp ?? 0) * 30 +
    (p.allstar ?? 0) * 9 +
    allnba +
    (p.dpoy ?? 0) * 20 +
    (p.ptsleader ?? 0) * 8 +
    (p.roy ?? 0) * 6 +
    c.tripleDuplas * 0.8 +
    e.marcos.length * 1.5 +
    exteriorScore(e)
  return Math.round(score)
}

export const NIVEIS_LEGADO = [
  { min: 1250, id: 'goat', titulo: 'Entre os maiores de todos os tempos', hof: true },
  { min: 850, id: 'lenda', titulo: 'Lenda da NBA', hof: true },
  { min: 560, id: 'hof', titulo: 'Hall da Fama', hof: true },
  { min: 280, id: 'estrela', titulo: 'Estrela da liga', hof: false },
  { min: 120, id: 'titular', titulo: 'Titular respeitado', hof: false },
  { min: 50, id: 'rotacao', titulo: 'Jogador de rotação', hof: false },
  { min: 0, id: 'passagem', titulo: 'Passagem rápida pela liga', hof: false },
]

export function classificarCarreira(e) {
  const score = pontuarLegado(e)
  let nivel = NIVEIS_LEGADO.find((n) => score >= n.min)
  const anosFora = e.carreiraExterior?.anos ?? 0
  if (nivel.id === 'passagem' && anosFora >= 4) nivel = { ...nivel, id: 'mundo', titulo: 'Carreira rodando o mundo' }
  else if (nivel.id === 'rotacao' && anosFora >= 6) nivel = { ...nivel, id: 'mundo_rotacao', titulo: 'Veterano de várias ligas' }
  return { score, ...nivel }
}

// Camisa aposentada: lenda no time onde passou mais anos
export function timeMaisAnos(e) {
  const cont = {}
  for (const h of e.historico) if (h.time) cont[h.time] = (cont[h.time] ?? 0) + 1
  const [melhor] = Object.entries(cont).sort((a, b) => b[1] - a[1])
  return melhor ? { id: melhor[0], anos: melhor[1] } : null
}
