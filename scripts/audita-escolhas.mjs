// Mede quantos eventos ainda têm uma escolha claramente melhor que as outras (depois do equilíbrio).
import { EVENTOS } from '../src/nba/data/eventos.js'
import { utilidadeEscolha } from '../src/nba/engine/pesos.js'

const gaps = []
const ruins = []
for (const ev of EVENTOS) {
  if (ev.escolhas.length < 2) continue
  const u = ev.escolhas.map(utilidadeEscolha).sort((a, b) => b - a)
  const gap = u[0] - u[1]
  gaps.push(gap)
  if (gap > 8) ruins.push(`${ev.id} (vantagem ${gap.toFixed(0)})`)
}
gaps.sort((a, b) => a - b)
const q = (p) => gaps[Math.floor(gaps.length * p)].toFixed(1)
console.log(`${gaps.length} eventos | vantagem da melhor escolha: mediana ${q(0.5)} · p90 ${q(0.9)} · máx ${gaps[gaps.length - 1].toFixed(1)}`)
console.log(`ainda óbvios (>8): ${ruins.length}`)
if (ruins.length) console.log(ruins.join('\n'))
