// Estatísticas acumuladas de um campeonato + suspensões + premiação.
// Alimentado partida a partida com o resultado do motor (simularPartida).

import { FORMACOES } from './formacoes.js'

export function criarEstatisticas() {
  return { jogadores: {}, times: {}, partidas: [] }
}

function obterTime(est, info) {
  if (!est.times[info.id]) {
    est.times[info.id] = {
      id: info.id, nome: info.nome, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, pts: 0,
      faltas: 0, amarelos: 0, vermelhos: 0, finalizacoes: 0, jogosTotais: 0,
    }
  }
  return est.times[info.id]
}

function obterJogador(est, id, base) {
  if (!est.jogadores[id]) {
    est.jogadores[id] = {
      id, nome: base.nome, timeId: base.timeId, timeNome: base.timeNome, papel: base.papel ?? 'M', num: base.num ?? null, generico: !!base.generico,
      jogos: 0, minutos: 0, gols: 0, assistencias: 0, finalizacoes: 0, noAlvo: 0, faltas: 0, faltasSofridas: 0,
      amarelos: 0, vermelhos: 0, defesas: 0, golsSofridos: 0, golsContra: 0, penaltisMarcados: 0, penaltisPerdidos: 0,
      jogosSemSofrer: 0, somaNotas: 0, melhorEmCampo: 0, suspensoJogos: 0, amarelosAcum: 0,
    }
  }
  return est.jogadores[id]
}

// Jogadores que não podem jogar a próxima partida do time (cartão vermelho ou 3 amarelos).
export function indisponiveis(est, timeId) {
  return Object.values(est.jogadores).filter((j) => !j.generico && j.timeId === timeId && j.suspensoJogos > 0).map((j) => j.id)
}

// dados: { fase: 'grupos'|'mata-mata', timeA: {id,nome}, timeB: {id,nome}, indisponiveis?: { A: [...], B: [...] } }
export function registrarPartida(est, dados, sim) {
  const { golsA, golsB } = sim.resultado
  const infoLado = { A: dados.timeA, B: dados.timeB }
  const papelDe = {}
  for (const lado of ['A', 'B']) for (const e of sim.escalacoes[lado]) papelDe[e.id] = e.papel

  for (const lado of ['A', 'B']) {
    const info = infoLado[lado]
    const t = obterTime(est, info)
    const gp = lado === 'A' ? golsA : golsB
    const gc = lado === 'A' ? golsB : golsA
    const s = sim.stats[lado]
    t.jogosTotais += 1
    t.gp += gp
    t.gc += gc
    t.faltas += s.faltas
    t.amarelos += s.amarelos
    t.vermelhos += s.vermelhos
    t.finalizacoes += s.finalizacoes
    if (dados.fase === 'grupos') {
      t.j += 1
      if (gp > gc) { t.v += 1; t.pts += 3 }
      else if (gp < gc) t.d += 1
      else { t.e += 1; t.pts += 1 }
    }

    for (const id of dados.indisponiveis?.[lado] ?? []) {
      const p = est.jogadores[id]
      if (p) p.suspensoJogos = Math.max(0, p.suspensoJogos - 1)
    }

    for (const jg of Object.values(sim.jogadores)) {
      if (jg.time !== lado) continue
      // Reservas genéricos (entram por lesão ou suspensão) somam num único registro por time: os gols deles
      // contam no total do time, mas eles nunca disputam prêmio.
      const generico = String(jg.id).startsWith('res-')
      const p = obterJogador(est, generico ? `reserva-${info.id}` : jg.id, {
        nome: generico ? 'Reservas' : jg.nome, timeId: info.id, timeNome: info.nome, papel: generico ? 'M' : papelDe[jg.id], num: jg.num, generico,
      })
      if (jg.minutos > 0) p.jogos += 1
      p.minutos += jg.minutos
      p.gols += jg.gols
      p.assistencias += jg.assistencias
      p.finalizacoes += jg.finalizacoes
      p.noAlvo += jg.noAlvo
      p.faltas += jg.faltas
      p.faltasSofridas += jg.faltasSofridas
      p.amarelos += jg.amarelos
      p.vermelhos += jg.vermelhos
      p.defesas += jg.defesas
      p.golsSofridos += jg.golsSofridos
      p.golsContra += jg.golsContra
      p.penaltisMarcados += jg.penaltisMarcados
      p.penaltisPerdidos += jg.penaltisPerdidos
      p.somaNotas += jg.minutos > 0 ? jg.nota : 0
      if (p.papel === 'G' && jg.golsSofridos === 0 && jg.minutos >= 60) p.jogosSemSofrer += 1
      if (generico) continue
      if (jg.vermelhos > 0) p.suspensoJogos += 1
      else {
        p.amarelosAcum += jg.amarelos
        if (p.amarelosAcum >= 3) {
          p.amarelosAcum -= 3
          p.suspensoJogos += 1
        }
      }
    }
  }
  if (sim.melhorEmCampo && est.jogadores[sim.melhorEmCampo.id]) est.jogadores[sim.melhorEmCampo.id].melhorEmCampo += 1

  est.partidas.push({
    fase: dados.fase, A: dados.timeA, B: dados.timeB, golsA, golsB,
    vencedor: sim.resultado.vencedor, decididoPor: sim.resultado.decididoPor,
    penaltis: sim.resultado.penaltis ? { A: sim.resultado.penaltis.A, B: sim.resultado.penaltis.B } : null,
  })
}

// Zera os amarelos acumulados (regra comum: a contagem recomeça no mata-mata).
export function zerarAmarelosAcumulados(est) {
  for (const p of Object.values(est.jogadores)) p.amarelosAcum = 0
}

const media = (p) => (p.jogos ? p.somaNotas / p.jogos : 0)

function top(est, comparador, n = 5, filtro = () => true) {
  return Object.values(est.jogadores).filter((p) => !p.generico && filtro(p)).sort(comparador).slice(0, n)
}

export const rankings = {
  artilheiros: (est, n = 5) => top(est, (a, b) => b.gols - a.gols || b.assistencias - a.assistencias || a.jogos - b.jogos || media(b) - media(a), n, (p) => p.gols > 0),
  assistentes: (est, n = 5) => top(est, (a, b) => b.assistencias - a.assistencias || b.gols - a.gols || a.jogos - b.jogos, n, (p) => p.assistencias > 0),
  faltosos: (est, n = 5) => top(est, (a, b) => b.faltas - a.faltas || a.jogos - b.jogos, n, (p) => p.faltas > 0),
  amarelos: (est, n = 5) => top(est, (a, b) => b.amarelos - a.amarelos || b.faltas - a.faltas || a.jogos - b.jogos, n, (p) => p.amarelos > 0),
  vermelhos: (est, n = 5) => top(est, (a, b) => b.vermelhos - a.vermelhos || b.amarelos - a.amarelos || a.jogos - b.jogos, n, (p) => p.vermelhos > 0),
  goleiros: (est, n = 5) => top(est, (a, b) => b.defesas - a.defesas || a.golsSofridos - b.golsSofridos, n, (p) => p.papel === 'G' && p.jogos > 0),
}

// Tabela de um grupo: pontos, saldo, gols pró, vitórias, depois nome (desempate estável).
export function classificacao(est, timeIds) {
  return timeIds
    .map((id) => est.times[id])
    .filter(Boolean)
    .map((t) => ({ ...t, sg: t.gp - t.gc }))
    .sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp || b.v - a.v || a.nome.localeCompare(b.nome))
}

function resumo(p, valor, unidade) {
  return p ? { jogadorId: p.id, nome: p.nome, timeNome: p.timeNome, valor, unidade } : null
}

// Premiação final. Só considera quem jogou pelo menos metade dos jogos do próprio time (exceto artilharia/assistências).
export function premios(est, { formacaoSelecao = '4-3-3' } = {}) {
  const jogosDoTime = (p) => est.times[p.timeId]?.jogosTotais ?? 0
  const regular = (p) => p.jogos >= Math.max(1, Math.ceil(jogosDoTime(p) / 2))

  const art = rankings.artilheiros(est, 1)[0]
  const ass = rankings.assistentes(est, 1)[0]
  const falt = rankings.faltosos(est, 1)[0]
  const am = rankings.amarelos(est, 1)[0]
  const vm = rankings.vermelhos(est, 1)[0]

  const melhor = top(est, (a, b) => media(b) + b.gols * 0.04 + b.assistencias * 0.03 - (media(a) + a.gols * 0.04 + a.assistencias * 0.03) || b.gols - a.gols, 1, (p) => regular(p) && p.papel !== undefined)[0]
  const goleiro = top(est, (a, b) => media(b) + b.jogosSemSofrer * 0.08 - (media(a) + a.jogosSemSofrer * 0.08) || b.defesas - a.defesas, 1, (p) => p.papel === 'G' && regular(p))[0]
  const melhorEmCampo = top(est, (a, b) => b.melhorEmCampo - a.melhorEmCampo || media(b) - media(a), 1, (p) => p.melhorEmCampo > 0)[0]

  const times = Object.values(est.times).filter((t) => t.jogosTotais > 0)
  const fair = [...times].sort(
    (a, b) => (a.amarelos + a.vermelhos * 3 + a.faltas * 0.1) / a.jogosTotais - (b.amarelos + b.vermelhos * 3 + b.faltas * 0.1) / b.jogosTotais,
  )[0]
  const ataque = [...times].sort((a, b) => b.gp / b.jogosTotais - a.gp / a.jogosTotais || b.gp - a.gp)[0]
  const defesa = [...times].sort((a, b) => a.gc / a.jogosTotais - b.gc / b.jogosTotais || a.gc - b.gc)[0]

  const slots = FORMACOES[formacaoSelecao]
  const usados = new Set()
  const selecao = slots.map((slot) => {
    const cand = Object.values(est.jogadores)
      .filter((p) => !p.generico && p.papel === slot.papel && regular(p) && !usados.has(p.id))
      .sort((a, b) => media(b) + b.gols * 0.04 - (media(a) + a.gols * 0.04))
    const escolhido = cand[0]
    if (escolhido) usados.add(escolhido.id)
    return { rotulo: slot.rotulo, papel: slot.papel, x: slot.x, y: slot.y, jogador: escolhido ? { id: escolhido.id, nome: escolhido.nome, timeNome: escolhido.timeNome, nota: Math.round(media(escolhido) * 10) / 10 } : null }
  })

  return {
    artilheiro: resumo(art, art?.gols, 'gols'),
    garcom: resumo(ass, ass?.assistencias, 'assistências'),
    melhorJogador: resumo(melhor, melhor && Math.round(media(melhor) * 10) / 10, 'nota média'),
    melhorGoleiro: resumo(goleiro, goleiro?.defesas, 'defesas'),
    craqueDasPartidas: resumo(melhorEmCampo, melhorEmCampo?.melhorEmCampo, 'vezes melhor em campo'),
    acougueiro: resumo(falt, falt?.faltas, 'faltas'),
    maisAmarelos: resumo(am, am?.amarelos, 'amarelos'),
    maisVermelhos: resumo(vm, vm?.vermelhos, 'vermelhos'),
    fairPlay: fair ? { timeId: fair.id, nome: fair.nome, amarelos: fair.amarelos, vermelhos: fair.vermelhos, faltas: fair.faltas } : null,
    melhorAtaque: ataque ? { timeId: ataque.id, nome: ataque.nome, gols: ataque.gp } : null,
    melhorDefesa: defesa ? { timeId: defesa.id, nome: defesa.nome, golsSofridos: defesa.gc } : null,
    selecao,
  }
}
