// Testes do motor de futebol e das estatísticas do campeonato.  Rodar:  npm run test:futebol
import test from 'node:test'
import assert from 'node:assert/strict'
import { simularPartida, montarEscalacao, TATICAS } from './motor.js'
import { gerarTime } from './amostras.js'
import { FORMACOES, LISTA_FORMACOES, podeJogarNoSlot } from './formacoes.js'
import { criarEstatisticas, registrarPartida, indisponiveis, premios, rankings, classificacao } from './campeonatoStats.js'

const A = (extra = {}) => gerarTime({ id: 'a', nome: 'Alfa', nivel: 78, semente: 1, ...extra })
const B = (extra = {}) => gerarTime({ id: 'b', nome: 'Beta', nivel: 78, semente: 2, ...extra })
const GOLS = ['gol', 'gol_penalti', 'gol_contra']

function lote(n, cfgA, cfgB, opts = {}) {
  const out = []
  for (let i = 0; i < n; i++) {
    out.push(simularPartida(gerarTime({ ...cfgA, semente: i + 1 }), gerarTime({ ...cfgB, semente: i + 100001 }), { semente: i * 17 + 3, ...opts }))
  }
  return out
}
const media = (lista, f) => lista.reduce((s, x) => s + f(x), 0) / lista.length
const pontos = (sims, lado) =>
  media(sims, (s) => {
    const m = lado === 'A' ? s.resultado.golsA : s.resultado.golsB
    const o = lado === 'A' ? s.resultado.golsB : s.resultado.golsA
    return m > o ? 3 : m === o ? 1 : 0
  })

test('formações: 11 vagas, 1 goleiro e linhas batendo com o nome', () => {
  for (const id of LISTA_FORMACOES) {
    const slots = FORMACOES[id]
    assert.equal(slots.length, 11, id)
    assert.equal(slots.filter((s) => s.papel === 'G').length, 1, id)
    const [d, ...resto] = id.split('-').map(Number)
    const f = resto[resto.length - 1]
    const m = resto.slice(0, -1).reduce((s, x) => s + x, 0)
    assert.equal(slots.filter((s) => s.papel === 'D').length, d, `${id} defesa`)
    assert.equal(slots.filter((s) => s.papel === 'F').length, f, `${id} ataque`)
    assert.equal(slots.filter((s) => s.papel === 'M').length, m, `${id} meio`)
    for (const s of slots) assert.ok(s.x >= 0 && s.x <= 1 && s.y >= 0 && s.y <= 1)
  }
})

test('draft: jogador só encaixa na posição compatível', () => {
  const zag = FORMACOES['4-3-3'].find((s) => s.rotulo === 'ZAG')
  assert.ok(podeJogarNoSlot(['CB'], zag))
  assert.ok(!podeJogarNoSlot(['ST'], zag))
  const ata = FORMACOES['4-3-3'].find((s) => s.rotulo === 'ATA')
  assert.ok(podeJogarNoSlot(['CF', 'CAM'], ata))
})

test('mesma semente = mesma partida (determinismo)', () => {
  const x = simularPartida(A(), B(), { semente: 42 })
  const y = simularPartida(A(), B(), { semente: 42 })
  assert.deepEqual(x.eventos, y.eventos)
  assert.deepEqual(x.stats, y.stats)
  const z = simularPartida(A(), B(), { semente: 43 })
  assert.notDeepEqual(x.eventos, z.eventos)
})

test('coerência: gols dos eventos = placar = estatísticas dos jogadores', () => {
  for (const s of lote(200, { id: 'a', nome: 'A' }, { id: 'b', nome: 'B', agressividade: 70 })) {
    const gA = s.eventos.filter((e) => GOLS.includes(e.tipo) && e.time === 'A').length
    const gB = s.eventos.filter((e) => GOLS.includes(e.tipo) && e.time === 'B').length
    assert.equal(gA, s.resultado.golsA)
    assert.equal(gB, s.resultado.golsB)
    const js = Object.values(s.jogadores)
    const golsJog = js.reduce((acc, j) => acc + j.gols + j.golsContra, 0)
    assert.equal(golsJog, gA + gB)
    for (const j of js) {
      assert.ok(j.noAlvo <= j.finalizacoes)
      assert.ok(j.nota >= 3 && j.nota <= 10)
    }
    assert.ok(js.reduce((a, j) => a + j.assistencias, 0) <= gA + gB)
    for (const e of s.eventos) {
      assert.ok(e.placar.A >= 0 && e.placar.B >= 0)
    }
    const ordem = s.eventos.map((e) => e.ordem)
    assert.deepEqual(ordem, [...ordem].sort((a, b) => a - b))
  }
})

test('cartões: segundo amarelo vira vermelho, ninguém joga depois de expulso', () => {
  let segundos = 0
  let diretos = 0
  for (const s of lote(400, { id: 'a', nome: 'A', agressividade: 80 }, { id: 'b', nome: 'B', agressividade: 80 })) {
    const expulsos = new Map()
    for (const e of s.eventos) {
      if (e.tipo === 'vermelho') {
        assert.ok(!expulsos.has(e.jogadorId), 'expulso duas vezes')
        expulsos.set(e.jogadorId, e.ordem)
        if (e.motivo === 'segundo amarelo') {
          segundos += 1
          const amarelos = s.eventos.filter((x) => x.tipo === 'amarelo' && x.jogadorId === e.jogadorId && x.ordem < e.ordem)
          assert.equal(amarelos.length, 2, 'segundo amarelo precisa de dois amarelos')
        } else diretos += 1
      } else if (expulsos.has(e.jogadorId) && e.ordem > expulsos.get(e.jogadorId) && ['falta', 'amarelo', 'vermelho', 'chute_fora', 'chute_defendido', 'chute_bloqueado', 'gol', 'escanteio', 'impedimento'].includes(e.tipo)) {
        assert.fail(`jogador expulso voltou a agir: ${e.tipo}`)
      }
    }
    for (const j of Object.values(s.jogadores)) {
      assert.ok(j.amarelos <= 2)
      assert.ok(j.vermelhos <= 1)
    }
  }
  assert.ok(segundos > 0 && diretos > 0, 'deveria ver os dois tipos de vermelho em 400 jogos agressivos')
})

test('minutos jogados somam certo e o expulso/machucado sai de campo', () => {
  let comLesao = 0
  for (const s of lote(300, { id: 'a', nome: 'A' }, { id: 'b', nome: 'B' })) {
    const fim = s.eventos[s.eventos.length - 1]
    const total = fim.min + fim.acr
    const temVermelho = s.eventos.some((e) => e.tipo === 'vermelho')
    for (const lado of ['A', 'B']) {
      const soma = Object.values(s.jogadores).filter((j) => j.time === lado).reduce((a, j) => a + j.minutos, 0)
      if (!temVermelho) assert.equal(soma, 11 * total, `minutos do time ${lado}`)
      else assert.ok(soma <= 11 * total)
    }
    for (const e of s.eventos.filter((x) => x.tipo === 'lesao')) {
      comLesao += 1
      assert.ok(s.jogadores[e.jogadorId].minutos < total)
      assert.ok(s.jogadores[e.entraId].minutos > 0 || e.min >= total)
    }
  }
  assert.ok(comLesao > 0)
})

test('distribuição realista (gols, faltas, cartões, pênaltis)', () => {
  const sims = lote(500, { id: 'a', nome: 'A' }, { id: 'b', nome: 'B' })
  const gols = media(sims, (s) => s.resultado.golsA + s.resultado.golsB)
  const faltas = media(sims, (s) => s.stats.A.faltas + s.stats.B.faltas) / 2
  const amarelos = media(sims, (s) => s.stats.A.amarelos + s.stats.B.amarelos) / 2
  const vermelhos = media(sims, (s) => s.stats.A.vermelhos + s.stats.B.vermelhos)
  const penaltis = media(sims, (s) => s.eventos.filter((e) => e.tipo === 'penalti').length)
  const chutes = media(sims, (s) => s.stats.A.finalizacoes + s.stats.B.finalizacoes) / 2
  assert.ok(gols > 2.1 && gols < 3.2, `gols/jogo ${gols}`)
  assert.ok(faltas > 8 && faltas < 15, `faltas/time ${faltas}`)
  assert.ok(amarelos > 1.1 && amarelos < 2.6, `amarelos/time ${amarelos}`)
  assert.ok(vermelhos < 0.4, `vermelhos/jogo ${vermelhos}`)
  assert.ok(penaltis > 0.1 && penaltis < 0.6, `penaltis/jogo ${penaltis}`)
  assert.ok(chutes > 9 && chutes < 15, `chutes/time ${chutes}`)
})

test('tática: time fraco rende mais com defensiva; ofensiva só compensa pra quem é melhor', () => {
  const fraco = { id: 'f', nome: 'F', nivel: 70 }
  const forte = { id: 's', nome: 'S', nivel: 84 }
  const N = 700
  const ptsFraco = (t) => pontos(lote(N, { ...fraco, tatica: t }, forte), 'A')
  const def = ptsFraco('defensiva')
  const equ = ptsFraco('equilibrada')
  const ofe = ptsFraco('ofensiva')
  assert.ok(def > equ + 0.04, `defensiva ${def} deveria superar equilibrada ${equ}`)
  assert.ok(equ > ofe - 0.01, `equilibrada ${equ} não deveria ficar atrás da ofensiva ${ofe}`)
  assert.ok(def > ofe + 0.08, `defensiva ${def} deveria superar bem a ofensiva ${ofe}`)

  const fortePts = (t) => pontos(lote(N, { ...forte, tatica: t }, fraco), 'A')
  assert.ok(fortePts('ofensiva') >= fortePts('defensiva') - 0.03)
  // em jogo parelho nenhuma tática é grátis
  const par = { id: 'p', nome: 'P', nivel: 78 }
  const rival = { id: 'q', nome: 'Q', nivel: 78 }
  assert.ok(Math.abs(pontos(lote(N, { ...par, tatica: 'ofensiva' }, rival), 'A') - pontos(lote(N, { ...par, tatica: 'ofensiva' }, rival), 'B')) < 0.3)
  assert.ok(pontos(lote(N, { ...par, tatica: 'defensiva' }, rival), 'A') < 1.75)
  assert.ok(Object.keys(TATICAS).length === 3)
})

test('agressividade: time agressivo faz mais faltas e leva mais cartões', () => {
  const sims = lote(500, { id: 'a', nome: 'A', agressividade: 85 }, { id: 'b', nome: 'B', agressividade: 35 })
  const f = (l, c) => media(sims, (s) => s.stats[l][c])
  assert.ok(f('A', 'faltas') > f('B', 'faltas') * 1.4, `faltas ${f('A', 'faltas')} x ${f('B', 'faltas')}`)
  assert.ok(f('A', 'amarelos') > f('B', 'amarelos') * 2.5, `amarelos ${f('A', 'amarelos')} x ${f('B', 'amarelos')}`)
  assert.ok(f('A', 'vermelhos') > f('B', 'vermelhos') * 3)
})

test('mata-mata: nunca termina empatado; prorrogação e pênaltis coerentes', () => {
  let pen = 0
  let prorr = 0
  for (const s of lote(500, { id: 'a', nome: 'A' }, { id: 'b', nome: 'B' }, { mataMata: true })) {
    assert.ok(s.resultado.vencedor === 'A' || s.resultado.vencedor === 'B')
    const fim90 = s.eventos.find((e) => e.tipo === 'fim_tempo_normal')
    const empatouEm90 = fim90.placar.A === fim90.placar.B
    assert.equal(s.resultado.prorrogou, empatouEm90)
    if (s.resultado.prorrogou) prorr += 1
    if (s.resultado.penaltis) {
      pen += 1
      const p = s.resultado.penaltis
      assert.notEqual(p.A, p.B)
      assert.equal(p.vencedor, p.A > p.B ? 'A' : 'B')
      assert.equal(s.resultado.vencedor, p.vencedor)
      assert.equal(s.resultado.golsA, s.resultado.golsB)
      assert.ok(p.cobrancas.length >= 6 && p.cobrancas.length <= 30)
      const ult = p.cobrancas[p.cobrancas.length - 1]
      assert.deepEqual(ult.parcial, { A: p.A, B: p.B })
    }
  }
  assert.ok(prorr > 0 && pen > 0)
})

test('suspensão: troca por reserva e mantém a formação', () => {
  const t = A()
  const fora = [t.jogadores[3].id, t.jogadores[9].id]
  const t2 = montarEscalacao(t, fora)
  assert.equal(t2.jogadores.length, 11)
  assert.ok(t2.jogadores[3].generico && t2.jogadores[9].generico)
  assert.ok(!t2.jogadores[0].generico)
  const s = simularPartida(t2, B(), { semente: 5 })
  assert.ok(s.jogadores[t2.jogadores[3].id])
})

test('campeonato: tabela, suspensões e estatísticas por jogador', () => {
  const est = criarEstatisticas()
  const times = ['a', 'b', 'c', 'd'].map((id, i) => gerarTime({ id, nome: id.toUpperCase() + 'FC', nivel: 76 + i * 2, semente: i + 1, agressividade: 40 + i * 15 }))
  let n = 0
  for (let i = 0; i < times.length; i++) {
    for (let j = i + 1; j < times.length; j++) {
      const ta = montarEscalacao(times[i], indisponiveis(est, times[i].id))
      const tb = montarEscalacao(times[j], indisponiveis(est, times[j].id))
      const sim = simularPartida(ta, tb, { semente: 100 + n++ })
      registrarPartida(est, {
        fase: 'grupos', timeA: { id: ta.id, nome: ta.nome }, timeB: { id: tb.id, nome: tb.nome },
        indisponiveis: { A: times[i].jogadores.filter((x) => indisponiveis(est, ta.id).includes(x.id)).map((x) => x.id), B: [] },
      }, sim)
    }
  }
  assert.equal(est.partidas.length, 6)
  const gp = Object.values(est.times).reduce((s, t) => s + t.gp, 0)
  const gc = Object.values(est.times).reduce((s, t) => s + t.gc, 0)
  assert.equal(gp, gc)
  const golsJogadores = Object.values(est.jogadores).reduce((s, p) => s + p.gols, 0)
  const golsContra = Object.values(est.jogadores).reduce((s, p) => s + p.golsContra, 0)
  assert.equal(golsJogadores + golsContra, gp)
  for (const t of Object.values(est.times)) {
    assert.equal(t.j, 3)
    assert.equal(t.v + t.e + t.d, 3)
    assert.equal(t.pts, t.v * 3 + t.e)
  }
  const tab = classificacao(est, ['a', 'b', 'c', 'd'])
  for (let i = 1; i < tab.length; i++) assert.ok(tab[i - 1].pts >= tab[i].pts)

  const art = rankings.artilheiros(est, 3)
  for (let i = 1; i < art.length; i++) assert.ok(art[i - 1].gols >= art[i].gols)
  const pr = premios(est)
  assert.equal(pr.selecao.length, 11)
  if (art[0]) assert.equal(pr.artilheiro.valor, art[0].gols)
  assert.ok(pr.melhorAtaque && pr.melhorDefesa && pr.fairPlay)
  const maxFaltas = Math.max(...Object.values(est.jogadores).map((p) => p.faltas))
  assert.equal(pr.acougueiro.valor, maxFaltas)
})

test('suspensão: vermelho = 1 jogo fora; 3 amarelos = 1 jogo fora; cumprida depois do jogo', () => {
  const est = criarEstatisticas()
  const ta = A()
  const tb = B()
  const fake = (jogs) => ({
    resultado: { golsA: 0, golsB: 0, vencedor: null, decididoPor: 'tempo normal', penaltis: null },
    stats: { A: { faltas: 0, amarelos: 0, vermelhos: 0, finalizacoes: 0 }, B: { faltas: 0, amarelos: 0, vermelhos: 0, finalizacoes: 0 } },
    escalacoes: {
      A: ta.jogadores.map((j, i) => ({ id: j.id, rotulo: FORMACOES['4-3-3'][i].rotulo, papel: FORMACOES['4-3-3'][i].papel })),
      B: tb.jogadores.map((j, i) => ({ id: j.id, rotulo: FORMACOES['4-3-3'][i].rotulo, papel: FORMACOES['4-3-3'][i].papel })),
    },
    jogadores: jogs, melhorEmCampo: null,
  })
  const base = (j, lado, extra = {}) => ({ id: j.id, nome: j.nome, time: lado, num: j.num, gols: 0, assistencias: 0, finalizacoes: 0, noAlvo: 0, faltas: 0, faltasSofridas: 0, amarelos: 0, vermelhos: 0, defesas: 0, golsSofridos: 0, golsContra: 0, penaltisMarcados: 0, penaltisPerdidos: 0, minutos: 90, nota: 6, ...extra })
  const todos = (extraPorId = {}) => Object.fromEntries([...ta.jogadores.map((j) => [j.id, base(j, 'A', extraPorId[j.id])]), ...tb.jogadores.map((j) => [j.id, base(j, 'B', extraPorId[j.id])])])
  const dados = (ind = {}) => ({ fase: 'grupos', timeA: { id: 'a', nome: 'A' }, timeB: { id: 'b', nome: 'B' }, indisponiveis: ind })
  const zagueiro = ta.jogadores[2].id
  const volante = ta.jogadores[6].id

  registrarPartida(est, dados(), fake(todos({ [zagueiro]: { vermelhos: 1, amarelos: 2 }, [volante]: { amarelos: 1 } })))
  assert.deepEqual(indisponiveis(est, 'a'), [zagueiro])
  registrarPartida(est, dados({ A: [zagueiro] }), fake(todos({ [volante]: { amarelos: 1 } })))
  assert.deepEqual(indisponiveis(est, 'a'), [])
  registrarPartida(est, dados(), fake(todos({ [volante]: { amarelos: 1 } })))
  assert.deepEqual(indisponiveis(est, 'a'), [volante])
  assert.equal(est.jogadores[volante].amarelosAcum, 0)
})
