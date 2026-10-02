// Confere a rota "não rolou na NBA → exterior": idade final, % que passou pelo exterior e quantos voltam.
import { criarRng } from '../src/nba/engine/rng.js'
import { iniciarCarreira, autoJogar } from '../src/nba/engine/carreira.js'

const rng = criarRng(7)
const N = 1500
const res = { total: 0, ext: 0, volta: 0, idades: [], anosExt: [] }
for (const caminho of ['sem_recrutamento', 'college', 'internacional']) {
  for (let i = 0; i < N; i++) {
    const e = iniciarCarreira({ sobrenome: 'Bot', numero: '1', posicao: rng.pick(['armador', 'ala', 'pivo', 'ala_pivo', 'ala_armador']), pais: 'brasil', caminho }, rng)
    const { estado } = autoJogar(e, rng)
    res.total++
    const h = estado.historico
    const passou = h.some((x) => x.nivel === 'exterior')
    if (passou) {
      res.ext++
      res.anosExt.push(estado.carreiraExterior?.anos ?? 0)
      const primeira = h.findIndex((x) => x.nivel === 'exterior')
      if (h.slice(primeira).some((x) => x.nivel === 'nba' || x.nivel === 'gleague')) res.volta++
    }
    res.idades.push(estado.idade)
  }
  const idades = res.idades.sort((a, b) => a - b)
  console.log(caminho, '| passou pelo exterior:', ((res.ext / res.total) * 100).toFixed(1) + '%', '| voltaram à NBA:', res.volta, '| idade final p10/p50/p90:', idades[Math.floor(idades.length * 0.1)], idades[Math.floor(idades.length * 0.5)], idades[Math.floor(idades.length * 0.9)], '| anos fora (mediana):', res.anosExt.sort((a, b) => a - b)[Math.floor(res.anosExt.length / 2)])
  Object.assign(res, { total: 0, ext: 0, volta: 0, idades: [], anosExt: [] })
}
