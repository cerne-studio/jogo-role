import test from 'node:test'
import assert from 'node:assert/strict'
import { FORMACOES } from './formacoes.js'
import { criarRng } from './rng.js'
import {
  FORMATOS, avancarEtapa, criarTorneio, etapaAtual, foiEliminado, gruposTerminaram, humanosAtivos, premiosDoTorneio,
  rodadasDoGrupo, simularEtapaAtual, sortearGrupos, tabelaDoGrupo,
} from './torneio.js'

function picksFalsos(formacao, nivel, semente) {
  const rng = criarRng(semente)
  return FORMACOES[formacao].map((slot, i) => {
    const ovr = Math.round(nivel + (rng.proximo() - 0.5) * 8)
    return {
      slot: i + 1, pid: semente * 100 + i, nome: `J${semente}-${i + 1}`, posicoes: [slot.papel === 'G' ? 'GK' : 'CM'], overall: ovr,
      ritmo: ovr - 5, chute: slot.papel === 'F' ? ovr : ovr - 15, passe: ovr - 3, drible: ovr - 8, defesa: slot.papel === 'D' ? ovr : ovr - 20,
      fisico: ovr - 6, agressividade: 30 + Math.round(rng.proximo() * 55), penaltis: ovr - 10, goleiro: slot.papel === 'G' ? ovr : null,
    }
  })
}

function times(n, humanos = 2) {
  const forms = Object.keys(FORMACOES)
  return Array.from({ length: n }, (_, i) => ({
    id: `t${i + 1}`, nome: i < humanos ? `Humano ${i + 1} FC` : `Bot ${i + 1}`, sigla: `T${i + 1}`, tipo: i < humanos ? 'humano' : 'bot',
    user_id: i < humanos ? `u${i + 1}` : undefined, formacao: forms[i % forms.length],
    tatica: ['equilibrada', 'ofensiva', 'defensiva'][i % 3], picks: picksFalsos(forms[i % forms.length], 70 + (i % 12), i + 1),
  }))
}

function jogarTudo(torneio) {
  let t = torneio
  const partidas = {}
  let guarda = 0
  while (etapaAtual(t) && guarda++ < 20) {
    const r = simularEtapaAtual(t)
    Object.assign(partidas, r.partidas)
    t = avancarEtapa(r.torneio)
  }
  return { t, partidas }
}

test('rodadas do grupo: todos contra todos, cada um joga no máximo 1x por rodada', () => {
  for (const n of [4, 5]) {
    const ids = Array.from({ length: n }, (_, i) => `x${i}`)
    const rodadas = rodadasDoGrupo(ids)
    assert.equal(rodadas.length, n % 2 ? n : n - 1)
    const confrontos = new Set()
    for (const r of rodadas) {
      const naRodada = r.flat()
      assert.equal(new Set(naRodada).size, naRodada.length)
      for (const [a, b] of r) confrontos.add([a, b].sort().join('|'))
    }
    assert.equal(confrontos.size, (n * (n - 1)) / 2)
  }
})

test('sorteio: espalha os humanos pelos grupos e respeita o tamanho de cada formato', () => {
  for (const n of [8, 16, 20]) {
    const ts = times(n, 4)
    const grupos = sortearGrupos(ts, n, 'sala-1')
    assert.equal(grupos.length, FORMATOS[n].grupos)
    assert.ok(grupos.every((g) => g.length === FORMATOS[n].porGrupo))
    assert.equal(new Set(grupos.flat()).size, n)
    const humanosPorGrupo = grupos.map((g) => g.filter((id) => ts.find((t) => t.id === id).tipo === 'humano').length)
    assert.ok(Math.max(...humanosPorGrupo) <= 2, `humanos por grupo: ${humanosPorGrupo}`)
    assert.deepEqual(sortearGrupos(ts, n, 'sala-1'), grupos)
  }
  assert.throws(() => sortearGrupos(times(7), 8, 's'), /esperava 8/)
})

test('campeonato de 8: 2 grupos, semis e final com campeão', () => {
  const { t, partidas } = jogarTudo(criarTorneio({ times: times(8), tamanho: 8, semente: 'a' }))
  assert.deepEqual(t.etapas.map((e) => e.id), ['g1', 'g2', 'g3', 'semi', 'final'])
  assert.ok(t.campeaoId)
  assert.equal(Object.keys(t.resultados).length, 12 + 2 + 1)
  for (const e of t.etapas.filter((x) => x.fase !== 'grupos')) for (const j of e.jogos) assert.ok(t.resultados[j.id].vencedor)
  assert.ok(Object.keys(partidas).length > 0)
  assert.ok(Object.values(partidas).every((p) => p.sim.eventos.length > 20))
})

test('campeonato de 16: 4 grupos, quartas, semis e final', () => {
  const { t } = jogarTudo(criarTorneio({ times: times(16), tamanho: 16, semente: 'b' }))
  assert.deepEqual(t.etapas.map((e) => e.id), ['g1', 'g2', 'g3', 'quartas', 'semi', 'final'])
  assert.equal(Object.keys(t.resultados).length, 24 + 4 + 2 + 1)
  assert.ok(t.campeaoId)
})

test('campeonato de 20: grupos de 5 (5 rodadas), quartas, semis e final', () => {
  const { t } = jogarTudo(criarTorneio({ times: times(20), tamanho: 20, semente: 'c' }))
  assert.deepEqual(t.etapas.map((e) => e.id), ['g1', 'g2', 'g3', 'g4', 'g5', 'quartas', 'semi', 'final'])
  assert.equal(Object.keys(t.resultados).length, 40 + 4 + 2 + 1)
  for (let gi = 0; gi < 4; gi++) assert.equal(tabelaDoGrupo(t, gi).reduce((s, l) => s + l.j, 0), 20)
})

test('mesma semente = mesmo campeonato; tabela fecha com os resultados', () => {
  const a = jogarTudo(criarTorneio({ times: times(8), tamanho: 8, semente: 'z' })).t
  const b = jogarTudo(criarTorneio({ times: times(8), tamanho: 8, semente: 'z' })).t
  assert.equal(a.campeaoId, b.campeaoId)
  assert.deepEqual(a.resultados, b.resultados)
  for (let gi = 0; gi < 2; gi++) {
    const tab = tabelaDoGrupo(a, gi)
    const gols = tab.reduce((s, l) => s + l.gp, 0)
    assert.equal(gols, tab.reduce((s, l) => s + l.gc, 0))
    assert.ok(tab.every((l) => l.j === 3 && l.v + l.e + l.d === 3 && l.pts === l.v * 3 + l.e))
  }
})

test('só os resultados revelados aparecem na tabela (sem spoiler da etapa em andamento)', () => {
  let t = criarTorneio({ times: times(8), tamanho: 8, semente: 'k' })
  const r = simularEtapaAtual(t)
  t = r.torneio
  assert.ok(tabelaDoGrupo(t, 0).every((l) => l.j === 0))
  assert.equal(t.estRevelado.partidas.length, 0)
  t = avancarEtapa(t)
  assert.ok(tabelaDoGrupo(t, 0).every((l) => l.j === 1))
  assert.equal(t.estRevelado.partidas.length, 4)
})

test('não simula duas vezes nem avança sem simular', () => {
  const t = criarTorneio({ times: times(8), tamanho: 8, semente: 'q' })
  assert.throws(() => avancarEtapa(t), /ainda nao foi simulada/)
  const r = simularEtapaAtual(t)
  assert.throws(() => simularEtapaAtual(r.torneio), /ja foi simulada/)
})

test('humanos ativos e eliminação no mata-mata', () => {
  let t = criarTorneio({ times: times(8, 3), tamanho: 8, semente: 'h' })
  assert.deepEqual(humanosAtivos(t).sort(), ['u1', 'u2', 'u3'])
  while (!gruposTerminaram(t)) t = avancarEtapa(simularEtapaAtual(t).torneio)
  assert.equal(etapaAtual(t).fase, 'semi')
  const eliminadosGrupos = t.times.filter((x) => foiEliminado(t, x.id)).length
  assert.equal(eliminadosGrupos, 4)
  t = avancarEtapa(simularEtapaAtual(t).torneio)
  t = avancarEtapa(simularEtapaAtual(t).torneio)
  assert.ok(t.campeaoId)
  const perdedoresSemi = t.etapas[3].jogos.map((j) => (t.resultados[j.id].vencedor === 'A' ? j.B : j.A))
  for (const id of perdedoresSemi) assert.ok(foiEliminado(t, id))
  assert.equal(foiEliminado(t, t.campeaoId), false)
})

test('estatísticas e prêmios do campeonato inteiro batem com os gols dos jogos', () => {
  const { t } = jogarTudo(criarTorneio({ times: times(16, 4), tamanho: 16, semente: 'p' }))
  const totalGols = Object.values(t.resultados).reduce((s, r) => s + r.golsA + r.golsB, 0)
  const golsJog = Object.values(t.est.jogadores).reduce((s, p) => s + p.gols + p.golsContra, 0)
  assert.equal(golsJog, totalGols)
  const p = premiosDoTorneio(t)
  assert.ok(p.artilheiro && p.melhorJogador && p.melhorGoleiro)
  assert.equal(p.selecao.length, 11)
  assert.ok(JSON.stringify(t).length < 400_000, `torneio serializado: ${JSON.stringify(t).length} bytes`)
})
