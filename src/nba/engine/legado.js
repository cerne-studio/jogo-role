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
    exteriorScore(e) +
    Math.max(0, e.fama - 20) * 0.7 +
    Math.max(0, e.imagem - 40) * 0.3
  return Math.round(score)
}

// Níveis da carreira, do pior ao melhor. `min` é a nota de legado necessária.
export const NIVEIS_LEGADO = [
  { id: 'passagem', min: 0, titulo: 'Aspirante', hof: false },
  { id: 'role', min: 60, titulo: 'Role player', hof: false },
  { id: 'bom', min: 160, titulo: 'Bom jogador', hof: false },
  { id: 'allstar', min: 270, titulo: 'All-Star', hof: false },
  { id: 'superestrela', min: 430, titulo: 'Superestrela', hof: false },
  { id: 'hof', min: 640, titulo: 'Hall da Fama', hof: true },
  { id: 'lenda', min: 1050, titulo: 'Lenda da NBA', hof: true },
  { id: 'goat', min: 1400, titulo: 'Entre os maiores de todos os tempos', hof: true },
]

export function classificarCarreira(e) {
  const score = pontuarLegado(e)
  let nivel = NIVEIS_LEGADO[0]
  for (const n of NIVEIS_LEGADO) if (score >= n.min) nivel = n
  return { score, ...nivel }
}

// Nível agora, próximo nível e quanto falta (0 a 1) — pra mostrar a barra de progresso durante a carreira.
export function nivelAtual(e) {
  const score = pontuarLegado(e)
  let i = 0
  NIVEIS_LEGADO.forEach((n, idx) => { if (score >= n.min) i = idx })
  const atual = NIVEIS_LEGADO[i]
  const proximo = NIVEIS_LEGADO[i + 1] ?? null
  const progresso = proximo ? Math.min(1, (score - atual.min) / (proximo.min - atual.min)) : 1
  return { score, indice: i, atual, proximo, progresso }
}

// Camisa aposentada: lenda no time onde passou mais anos
export function timeMaisAnos(e) {
  const cont = {}
  for (const h of e.historico) if (h.time) cont[h.time] = (cont[h.time] ?? 0) + 1
  const [melhor] = Object.entries(cont).sort((a, b) => b[1] - a[1])
  return melhor ? { id: melhor[0], anos: melhor[1] } : null
}
