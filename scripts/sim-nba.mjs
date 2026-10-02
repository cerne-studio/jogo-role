// Balanceamento da Carreira NBA: simula N carreiras no piloto automático e imprime a distribuição.
//   node scripts/sim-nba.mjs [N=3000] [semente=1]
import { criarRng } from '../src/nba/engine/rng.js'
import { iniciarCarreira, autoJogar } from '../src/nba/engine/carreira.js'
import { classificarCarreira } from '../src/nba/engine/legado.js'

const N = Number(process.argv[2] ?? 3000)
const semente = Number(process.argv[3] ?? 1)
const rng = criarRng(semente)
const POSICOES = ['armador', 'ala_armador', 'ala', 'ala_pivo', 'pivo']
const CAMINHOS = ['college', 'internacional', 'sem_recrutamento']

const pct = (n) => `${((100 * n) / N).toFixed(1)}%`
const media = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0)
const quant = (a, q) => {
  const s = [...a].sort((x, y) => x - y)
  return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : 0
}

const res = []
const t0 = Date.now()
for (let i = 0; i < N; i++) {
  const config = {
    sobrenome: 'Teste',
    numero: '7',
    posicao: POSICOES[i % 5],
    pais: 'eua',
    caminho: CAMINHOS[i % 3],
  }
  const { estado, relatorios } = autoJogar(iniciarCarreira(config, rng), rng)
  const nba = relatorios.filter((r) => r.kind === 'nba')
  const picoOvr = Math.max(...estado.historico.map((h) => h.ovr))
  const melhorPpg = nba.length ? Math.max(...nba.map((r) => r.stats.ppg)) : 0
  res.push({
    caminho: config.caminho,
    pick: estado.draft?.pick ?? null,
    fora: estado.draft?.fora ?? false,
    temporadasNba: nba.length,
    picoOvr,
    melhorPpg,
    pontos: estado.carreira.pontos,
    jogos: estado.carreira.jogos,
    titulos: estado.titulos.length,
    mvp: estado.premios.mvp ?? 0,
    fmvp: estado.premios.fmvp ?? 0,
    allstar: estado.premios.allstar ?? 0,
    allnba: (estado.premios.allnba1 ?? 0) + (estado.premios.allnba2 ?? 0) + (estado.premios.allnba3 ?? 0),
    dpoy: estado.premios.dpoy ?? 0,
    roy: estado.premios.roy ?? 0,
    ptsleader: estado.premios.ptsleader ?? 0,
    lesoes: estado.lesoes.length,
    patrimonio: estado.dinheiro.patrimonio,
    salMax: Math.max(0, ...estado.historico.map((h) => h.salario ?? 0)),
    legado: classificarCarreira(estado),
    idadeFim: estado.idade,
    maxJogo: estado.carreira.maxPontos,
  })
}
const seg = ((Date.now() - t0) / 1000).toFixed(1)

const naNba = res.filter((r) => r.jogos >= 40)
console.log(`\n=== ${N} carreiras (semente ${semente}) em ${seg}s ===`)
console.log(`jogaram ≥40 jogos na NBA: ${pct(naNba.length)} | ficaram na G League/exterior: ${pct(N - naNba.length)}`)
for (const c of CAMINHOS) {
  const g = res.filter((r) => r.caminho === c)
  console.log(`  ${c.padEnd(18)} NBA: ${((100 * g.filter((r) => r.jogos >= 40).length) / g.length).toFixed(0)}% | longevidade média ${media(g.map((r) => r.temporadasNba)).toFixed(1)} anos | pico ovr méd ${media(g.map((r) => r.picoOvr)).toFixed(1)}`)
}
const picks = res.filter((r) => r.pick)
console.log(`draft: pick 1-5 ${pct(picks.filter((r) => r.pick <= 5).length)} | 6-14 ${pct(picks.filter((r) => r.pick > 5 && r.pick <= 14).length)} | 15-30 ${pct(picks.filter((r) => r.pick > 14 && r.pick <= 30).length)} | 2ª rodada ${pct(picks.filter((r) => r.pick > 30 && !r.fora).length)} | sem draft ${pct(res.filter((r) => r.fora).length)}`)
const lon = naNba.map((r) => r.temporadasNba)
console.log(`longevidade NBA: média ${media(lon).toFixed(1)} | p25 ${quant(lon, 0.25)} p50 ${quant(lon, 0.5)} p90 ${quant(lon, 0.9)} máx ${Math.max(...lon)}`)
const pico = res.map((r) => r.picoOvr)
console.log(`pico de overall: p10 ${quant(pico, 0.1)} p50 ${quant(pico, 0.5)} p90 ${quant(pico, 0.9)} p99 ${quant(pico, 0.99)} máx ${Math.max(...pico)}`)
console.log(`≥85: ${pct(res.filter((r) => r.picoOvr >= 85).length)} | ≥90: ${pct(res.filter((r) => r.picoOvr >= 90).length)} | ≥95: ${pct(res.filter((r) => r.picoOvr >= 95).length)}`)
console.log(`melhor ppg de uma temporada: p50 ${quant(naNba.map((r) => r.melhorPpg), 0.5).toFixed(1)} p90 ${quant(naNba.map((r) => r.melhorPpg), 0.9).toFixed(1)} p99 ${quant(naNba.map((r) => r.melhorPpg), 0.99).toFixed(1)} máx ${Math.max(...naNba.map((r) => r.melhorPpg)).toFixed(1)}`)
const pts = naNba.map((r) => r.pontos)
console.log(`pontos na carreira: p50 ${quant(pts, 0.5)} p90 ${quant(pts, 0.9)} p99 ${quant(pts, 0.99)} máx ${Math.max(...pts)}`)
console.log(`≥10k pts: ${pct(res.filter((r) => r.pontos >= 10000).length)} | ≥20k: ${pct(res.filter((r) => r.pontos >= 20000).length)} | ≥30k: ${pct(res.filter((r) => r.pontos >= 30000).length)} | ≥38.4k (passa Kareem): ${pct(res.filter((r) => r.pontos > 38387).length)}`)
console.log(`títulos: 0 ${pct(res.filter((r) => r.titulos === 0).length)} | ≥1 ${pct(res.filter((r) => r.titulos >= 1).length)} | ≥3 ${pct(res.filter((r) => r.titulos >= 3).length)} | ≥6 ${pct(res.filter((r) => r.titulos >= 6).length)} | máx ${Math.max(...res.map((r) => r.titulos))}`)
console.log(`MVP ≥1: ${pct(res.filter((r) => r.mvp >= 1).length)} | ≥3: ${pct(res.filter((r) => r.mvp >= 3).length)} | máx ${Math.max(...res.map((r) => r.mvp))}`)
console.log(`All-Star ≥1: ${pct(res.filter((r) => r.allstar >= 1).length)} | ≥5: ${pct(res.filter((r) => r.allstar >= 5).length)} | ≥10: ${pct(res.filter((r) => r.allstar >= 10).length)}`)
console.log(`All-NBA ≥1: ${pct(res.filter((r) => r.allnba >= 1).length)} | DPOY ≥1: ${pct(res.filter((r) => r.dpoy >= 1).length)} | ROY: ${pct(res.filter((r) => r.roy >= 1).length)} | cestinha ≥1: ${pct(res.filter((r) => r.ptsleader >= 1).length)}`)
console.log(`lesões por carreira: média ${media(res.map((r) => r.lesoes)).toFixed(1)}`)
console.log(`salário máximo: p50 ${quant(naNba.map((r) => r.salMax), 0.5).toFixed(1)} p90 ${quant(naNba.map((r) => r.salMax), 0.9).toFixed(1)} máx ${Math.max(...naNba.map((r) => r.salMax)).toFixed(1)} | patrimônio p50 ${quant(naNba.map((r) => r.patrimonio), 0.5).toFixed(0)} p90 ${quant(naNba.map((r) => r.patrimonio), 0.9).toFixed(0)} máx ${Math.max(...naNba.map((r) => r.patrimonio)).toFixed(0)} (US$ mi)`)
const niveis = {}
for (const r of res) niveis[r.legado.titulo] = (niveis[r.legado.titulo] ?? 0) + 1
console.log('legado:')
for (const [k, v] of Object.entries(niveis).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(40)} ${pct(v)}`)
console.log(`HOF: ${pct(res.filter((r) => r.legado.hof).length)} (real: ~1% dos jogadores que passam pela NBA, mas aqui só simulamos quem tem chance)`)
const scores = res.map((r) => r.legado.score)
console.log('cortes de nota de legado por quantil (alvo 5/35/63/81/90/97/99,5%):', [0.05, 0.35, 0.63, 0.81, 0.9, 0.97, 0.995].map((q) => quant(scores, q)).join(' · '))
