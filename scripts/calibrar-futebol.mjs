// Mede o comportamento do motor de futebol em milhares de partidas simuladas.
//   node scripts/calibrar-futebol.mjs [partidas]
import { simularPartida } from '../src/components/futebol/motor.js'
import { gerarTime } from '../src/components/futebol/amostras.js'

const N = Number(process.argv[2] ?? 3000)

function rodar(cfgA, cfgB, n, opts = {}) {
  const r = { n, golsA: 0, golsB: 0, ptsA: 0, ptsB: 0, faltasA: 0, faltasB: 0, amA: 0, amB: 0, vmA: 0, vmB: 0, chutesA: 0, chutesB: 0, posseA: 0, pen: 0, empates: 0, lesoes: 0, anulados: 0, penaltis: 0 }
  for (let i = 0; i < n; i++) {
    const A = gerarTime({ ...cfgA, semente: i + 1 })
    const B = gerarTime({ ...cfgB, semente: i + 100001 })
    const s = simularPartida(A, B, { semente: i * 17 + 3, ...opts })
    const { golsA, golsB } = s.resultado
    r.golsA += golsA; r.golsB += golsB
    if (golsA > golsB) r.ptsA += 3
    else if (golsB > golsA) r.ptsB += 3
    else { r.ptsA += 1; r.ptsB += 1; r.empates += 1 }
    r.faltasA += s.stats.A.faltas; r.faltasB += s.stats.B.faltas
    r.amA += s.stats.A.amarelos; r.amB += s.stats.B.amarelos
    r.vmA += s.stats.A.vermelhos; r.vmB += s.stats.B.vermelhos
    r.chutesA += s.stats.A.finalizacoes; r.chutesB += s.stats.B.finalizacoes
    r.posseA += s.stats.A.posse
    r.lesoes += s.eventos.filter((e) => e.tipo === 'lesao').length
    r.anulados += s.eventos.filter((e) => e.tipo === 'gol_anulado').length
    r.penaltis += s.eventos.filter((e) => e.tipo === 'penalti').length
  }
  return r
}
const f = (v, n) => (v / n).toFixed(2)
function linha(nome, r) {
  console.log(
    `${nome.padEnd(34)} gols ${f(r.golsA, r.n)}x${f(r.golsB, r.n)} | pts ${f(r.ptsA, r.n)}x${f(r.ptsB, r.n)} | emp ${(r.empates / r.n * 100).toFixed(0)}% | ` +
      `chutes ${f(r.chutesA, r.n)}x${f(r.chutesB, r.n)} | posse ${(r.posseA / r.n).toFixed(0)}% | faltas ${f(r.faltasA, r.n)}x${f(r.faltasB, r.n)} | ` +
      `amar ${f(r.amA, r.n)}x${f(r.amB, r.n)} | verm ${f(r.vmA, r.n)}x${f(r.vmB, r.n)}`,
  )
}

console.log(`\n== partidas: ${N} cada ==\n`)
const igual = { id: 'a', nome: 'A', nivel: 78 }
linha('iguais (78 x 78) equilibradas', rodar({ ...igual, id: 'a', nome: 'A' }, { ...igual, id: 'b', nome: 'B' }, N))

console.log('\n-- tática: time FRACO (70) contra FORTE (84) --')
for (const t of ['ofensiva', 'equilibrada', 'defensiva']) {
  linha(`fraco ${t.padEnd(11)} x forte equil.`, rodar({ id: 'f', nome: 'F', nivel: 70, tatica: t }, { id: 's', nome: 'S', nivel: 84 }, N))
}
console.log('\n-- tática: time FORTE (84) contra FRACO (70) --')
for (const t of ['ofensiva', 'equilibrada', 'defensiva']) {
  linha(`forte ${t.padEnd(11)} x fraco equil.`, rodar({ id: 's', nome: 'S', nivel: 84, tatica: t }, { id: 'f', nome: 'F', nivel: 70 }, N))
}
console.log('\n-- agressividade: times iguais, A agressivo (85) x B calmo (35) --')
linha('A agr 85 x B agr 35', rodar({ id: 'a', nome: 'A', nivel: 78, agressividade: 85 }, { id: 'b', nome: 'B', nivel: 78, agressividade: 35 }, N))
console.log('\n-- mata-mata (prorrogação + pênaltis), iguais --')
const mm = rodar({ id: 'a', nome: 'A', nivel: 78 }, { id: 'b', nome: 'B', nivel: 78 }, N, { mataMata: true })
linha('mata-mata iguais', mm)
console.log(`\neventos raros por jogo: lesões ${f(mm.lesoes, N)} | gols anulados (VAR) ${f(mm.anulados, N)} | pênaltis ${f(mm.penaltis, N)}`)
