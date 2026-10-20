// Simula um campeonato pequeno de ponta a ponta (2 grupos de 4 + semifinais + final) usando o motor,
// as suspensões e as estatísticas. Serve pra demonstração e pra testar a integração das peças.

import { simularPartida, montarEscalacao } from './motor.js'
import { gerarTime } from './amostras.js'
import { criarEstatisticas, registrarPartida, indisponiveis, classificacao, premios, zerarAmarelosAcumulados } from './campeonatoStats.js'
import { criarRng } from './rng.js'

const NOMES_TIMES = ['Meu FC', 'Ana FC', 'Beto FC', 'Lucas FC', 'Tigres', 'Águias', 'Leões', 'Falcões']
const FORMACOES_TIMES = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '4-5-1', '5-3-2', '3-4-3', '4-4-2']
const TATICAS_TIMES = ['equilibrada', 'ofensiva', 'defensiva', 'equilibrada', 'defensiva', 'ofensiva', 'equilibrada', 'defensiva']

export function simularCampeonatoDemo({ semente = 1 } = {}) {
  const rng = criarRng(semente * 31 + 7)
  const times = NOMES_TIMES.map((nome, i) =>
    gerarTime({
      id: `t${i + 1}`, nome, nivel: 70 + Math.round(rng.proximo() * 16), formacao: FORMACOES_TIMES[i], tatica: TATICAS_TIMES[i],
      agressividade: 35 + Math.round(rng.proximo() * 50), semente: semente + i,
    }),
  )
  const est = criarEstatisticas()
  const jogos = []
  let n = 0

  function jogar(tA, tB, fase, rotulo) {
    const indA = indisponiveis(est, tA.id)
    const indB = indisponiveis(est, tB.id)
    const sim = simularPartida(montarEscalacao(tA, indA), montarEscalacao(tB, indB), { semente: semente * 1000 + n++, mataMata: fase !== 'grupos' })
    registrarPartida(est, { fase, timeA: { id: tA.id, nome: tA.nome }, timeB: { id: tB.id, nome: tB.nome }, indisponiveis: { A: indA, B: indB } }, sim)
    const j = { fase, rotulo, A: tA, B: tB, resultado: sim.resultado, suspensosA: indA.length, suspensosB: indB.length, melhor: sim.melhorEmCampo }
    jogos.push(j)
    return j
  }

  const grupos = [[times[0], times[3], times[4], times[7]], [times[1], times[2], times[5], times[6]]]
  const rodadas = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]]
  rodadas.forEach((rodada, r) => {
    for (const [gi, g] of grupos.entries()) {
      for (const [i, j] of rodada) jogar(g[i], g[j], 'grupos', `Grupo ${'AB'[gi]} · Rodada ${r + 1}`)
    }
  })
  const tabela = grupos.map((g) => classificacao(est, g.map((t) => t.id)))
  const porId = Object.fromEntries(times.map((t) => [t.id, t]))

  zerarAmarelosAcumulados(est)
  const s1 = jogar(porId[tabela[0][0].id], porId[tabela[1][1].id], 'mata-mata', 'Semifinal 1')
  const s2 = jogar(porId[tabela[1][0].id], porId[tabela[0][1].id], 'mata-mata', 'Semifinal 2')
  const vencedorDe = (j) => (j.resultado.vencedor === 'A' ? j.A : j.B)
  const perdedorDe = (j) => (j.resultado.vencedor === 'A' ? j.B : j.A)
  const final = jogar(vencedorDe(s1), vencedorDe(s2), 'mata-mata', 'Final')
  const campeao = vencedorDe(final)
  const vice = perdedorDe(final)

  return { times, est, grupos: grupos.map((g) => g.map((t) => t.id)), tabela, jogos, campeao, vice, premios: premios(est) }
}
