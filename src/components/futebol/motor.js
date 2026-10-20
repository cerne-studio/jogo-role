// Motor da partida. Puro (sem tela, sem rede): recebe dois times e uma semente e devolve a partida
// inteira já decidida — lances, cartões, estatísticas e notas. A tela só reproduz esse resultado.
//
// Time: { id, nome, formacao, tatica, jogadores: [11 jogadores na ordem das vagas da formação] }
// Jogador: { id, nome, num, ovr, atq, pas, def, fis, agr, gol, penal }   (todos 0–99)
//
// A tática muda o jogo de verdade: a defensiva cede posse e chances, mas comprime a vantagem do
// adversário e ganha bônus no contra-ataque (ajuda time fraco); a ofensiva amplia a vantagem de
// quem é melhor. A agressividade do jogador (atributo real do FIFA) manda em faltas e cartões.

import { criarRng, limitar } from './rng.js'
import { FORMACOES } from './formacoes.js'

export const TATICAS = {
  // atk/def: multiplicam a força de ataque e de defesa. posse: só muda a posse exibida (não dá chance extra).
  // ampliar: aumenta o peso da diferença de qualidade (quem é melhor aproveita mais, quem é pior sofre mais).
  // comprimir: o adversário aproveita MENOS a própria superioridade contra esse time (retranca).
  // contra: bônus de conversão nos contra-ataques.
  ofensiva: { rotulo: 'ofensiva', atk: 1.1, def: 0.88, posse: 0.05, faltas: 0.97, contra: 0, ampliar: 1.12, comprimir: 1 },
  equilibrada: { rotulo: 'equilibrada', atk: 1, def: 1, posse: 0, faltas: 1, contra: 0, ampliar: 1, comprimir: 1 },
  defensiva: { rotulo: 'defensiva', atk: 0.9, def: 1.12, posse: -0.06, faltas: 1.12, contra: 0.16, ampliar: 1, comprimir: 0.22 },
}

const PESO_ATK = { F: 1, M: 0.45, D: 0.05, G: 0 }
const PESO_MEIO = { M: 1, F: 0.3, D: 0.3, G: 0 }
const PESO_DEF = { D: 1, M: 0.4, F: 0.05, G: 0 }

const BASE_ATAQUE = 0.112
const BASE_FALTA = 0.115
const NOMES_TEMPO = { T1: '1º tempo', T2: '2º tempo', P1: 'Prorrogação', P2: 'Prorrogação' }

export function rotuloMinuto(min, acr) {
  return acr > 0 ? `${min}+${acr}'` : `${min}'`
}

function criarTime(lado, cfg) {
  const slots = FORMACOES[cfg.formacao]
  if (!slots) throw new Error(`formacao desconhecida: ${cfg.formacao}`)
  if (cfg.jogadores.length !== 11) throw new Error('o time precisa de 11 jogadores')
  const tatica = TATICAS[cfg.tatica]
  if (!tatica) throw new Error(`tatica desconhecida: ${cfg.tatica}`)
  const linhas = slots.map((slot, i) => ({ j: cfg.jogadores[i], slot, ativo: true, amarelos: 0 }))
  const cheio = { atk: 0, mid: 0, def: 0 }
  for (const l of linhas) {
    cheio.atk += PESO_ATK[l.slot.papel]
    cheio.mid += PESO_MEIO[l.slot.papel]
    cheio.def += PESO_DEF[l.slot.papel]
  }
  return { lado, id: cfg.id, nome: cfg.nome, tatica, nomeTatica: cfg.tatica, linhas, cheio, reservas: 0 }
}

function forcas(t) {
  let atk = 0
  let mid = 0
  let def = 0
  let gk = 35
  for (const l of t.linhas) {
    if (!l.ativo) continue
    const p = l.slot.papel
    atk += PESO_ATK[p] * l.j.atq
    mid += PESO_MEIO[p] * (l.j.pas * 0.6 + l.j.ovr * 0.4)
    def += PESO_DEF[p] * l.j.def
    if (p === 'G') gk = l.j.gol
  }
  return { atk: atk / t.cheio.atk, mid: mid / t.cheio.mid, def: def / t.cheio.def, gk }
}

function agressividade(t) {
  let soma = 0
  let peso = 0
  for (const l of t.linhas) {
    if (!l.ativo) continue
    const w = { D: 1.2, M: 1, F: 0.5, G: 0 }[l.slot.papel]
    soma += w * l.j.agr
    peso += w
  }
  return peso ? soma / peso : 55
}

function reserva(t, ctx, papel) {
  const ativos = t.linhas.filter((l) => l.ativo)
  const media = ativos.reduce((s, l) => s + l.j.ovr, 0) / Math.max(1, ativos.length)
  const nivel = Math.round(media - 7)
  t.reservas += 1
  const j = {
    id: `res-${t.lado}-${t.reservas}`,
    nome: 'Reserva',
    num: 12 + t.reservas,
    ovr: nivel, atq: nivel, pas: nivel, def: nivel, fis: nivel, agr: 55, gol: nivel, penal: 60,
    generico: true,
  }
  ctx.jog[j.id] = novoJog(j, t.lado)
  ctx.papelDe[j.id] = papel
  return j
}

function novoJog(j, lado) {
  return {
    id: j.id, nome: j.nome, time: lado, num: j.num,
    gols: 0, assistencias: 0, finalizacoes: 0, noAlvo: 0, faltas: 0, faltasSofridas: 0,
    amarelos: 0, vermelhos: 0, defesas: 0, golsSofridos: 0, penaltisMarcados: 0, penaltisPerdidos: 0, golsContra: 0,
    minutos: 0, nota: 6, desde: 0, ate: null,
  }
}

function emitir(ctx, ev) {
  const e = { ordem: ctx.eventos.length, ...ev, min: ctx.min, acr: ctx.acr, rotulo: rotuloMinuto(ctx.min, ctx.acr), tempo: ctx.tempo, placar: { ...ctx.placar } }
  ctx.eventos.push(e)
  ctx.periodo.relevantes += ['gol', 'gol_penalti', 'gol_contra', 'amarelo', 'vermelho', 'lesao', 'penalti_defendido', 'penalti_fora'].includes(ev.tipo) ? 1 : 0
  return e
}

function ativosDe(t, papeis) {
  return t.linhas.filter((l) => l.ativo && (!papeis || papeis.includes(l.slot.papel)))
}

function cadeiaDePasses(ctx, time, chutador, assistente) {
  const rng = ctx.rng
  const ativos = ativosDe(time)
  const [minimo, maximo] = time.nomeTatica === 'equilibrada' ? [3, 4] : [2, 3]
  const n = rng.inteiro(minimo, maximo)
  const inicio = rng.ponderado(ativos, ativos.map((l) => ({ G: 0.15, D: 0.5, M: 0.35, F: 0 }[l.slot.papel])))
  const ids = [inicio.j.id]
  let guarda = 0
  while (ids.length < n && guarda++ < 12) {
    const prox = rng.ponderado(ativos, ativos.map((l) => ({ G: 0, D: 0.25, M: 1, F: 0.6 }[l.slot.papel])))
    if (prox.j.id !== ids[ids.length - 1]) ids.push(prox.j.id)
  }
  if (assistente && ids[ids.length - 1] !== assistente.j.id) ids.push(assistente.j.id)
  if (ids[ids.length - 1] !== chutador.j.id) ids.push(chutador.j.id)
  return ids
}

function escolherAssistente(ctx, time, chutador) {
  const cand = ativosDe(time).filter((l) => l !== chutador && l.slot.papel !== 'G')
  if (!cand.length) return null
  return ctx.rng.ponderado(cand, cand.map((l) => ({ M: 1, F: 0.8, D: 0.25 }[l.slot.papel] * Math.pow(l.j.pas / 70, 2))))
}

function registrarChute(ctx, chutador, noAlvo) {
  const s = ctx.jog[chutador.j.id]
  s.finalizacoes += 1
  if (noAlvo) s.noAlvo += 1
  const e = ctx.stats[chutador.lado ?? ctx.ladoDe[chutador.j.id]]
  e.finalizacoes += 1
  if (noAlvo) e.noAlvo += 1
}

function golEm(ctx, lado, tipoEvento, linhaGol, assistente, extra = {}) {
  ctx.placar[lado] += 1
  const s = ctx.jog[linhaGol.j.id]
  if (tipoEvento === 'gol_contra') s.golsContra += 1
  else s.gols += 1
  if (assistente) ctx.jog[assistente.j.id].assistencias += 1
  const outro = lado === 'A' ? 'B' : 'A'
  const gk = ctx.times[outro].linhas.find((l) => l.slot.papel === 'G' && l.ativo)
  if (gk) ctx.jog[gk.j.id].golsSofridos += 1
  return emitir(ctx, {
    tipo: tipoEvento, time: lado, jogadorId: linhaGol.j.id, jogadorNome: linhaGol.j.nome,
    assistenciaId: assistente?.j.id ?? null, assistenciaNome: assistente?.j.nome ?? null, ...extra,
  })
}

function golAnulado(ctx, lado, chutador, extra) {
  const motivo = ctx.rng.chance(0.6) ? 'impedimento' : 'falta no lance'
  return emitir(ctx, { tipo: 'gol_anulado', time: lado, jogadorId: chutador.j.id, jogadorNome: chutador.j.nome, motivo, ...extra })
}

function chutarNoAlvo(ctx, atacante, defensor, chutador, assistente, cadeia, tipoJogada, bonus = 0) {
  const lado = atacante.lado
  const fd = forcas(defensor)
  const pGol = limitar(0.27 * Math.pow(chutador.j.atq / Math.max(40, fd.gk), 1.6) * (1 + bonus + atacante.tatica.contra), 0.05, 0.6)
  const gk = defensor.linhas.find((l) => l.slot.papel === 'G' && l.ativo)
  if (ctx.rng.chance(pGol)) {
    if (ctx.rng.chance(0.06)) return golAnulado(ctx, lado, chutador, { cadeia, tipoJogada })
    return golEm(ctx, lado, 'gol', chutador, assistente, { cadeia, tipoJogada })
  }
  if (gk) {
    ctx.jog[gk.j.id].defesas += 1
    ctx.stats[defensor.lado].defesas += 1
  }
  const ev = emitir(ctx, {
    tipo: 'chute_defendido', time: lado, jogadorId: chutador.j.id, jogadorNome: chutador.j.nome,
    goleiroId: gk?.j.id ?? null, goleiroNome: gk?.j.nome ?? null, cadeia, tipoJogada,
  })
  if (ctx.rng.chance(0.28)) cobrarEscanteio(ctx, atacante, defensor)
  return ev
}

function gerarAtaque(ctx, atacante, defensor) {
  const rng = ctx.rng
  const lado = atacante.lado
  const cand = ativosDe(atacante, ['F', 'M', 'D'])
  const chutador = rng.ponderado(cand, cand.map((l) => ({ F: 1, M: 0.32, D: 0.07 }[l.slot.papel] * Math.pow(l.j.atq / 70, 3))))
  ctx.ladoDe[chutador.j.id] = lado

  if (rng.chance(0.006)) {
    const zag = rng.escolher(ativosDe(defensor, ['D']))
    if (zag) {
      ctx.ladoDe[zag.j.id] = defensor.lado
      return golEm(ctx, lado, 'gol_contra', zag, null, { cadeia: cadeiaDePasses(ctx, atacante, chutador, null), tipoJogada: 'jogada' })
    }
  }

  const assistente = rng.chance(0.74) ? escolherAssistente(ctx, atacante, chutador) : null
  const cadeia = cadeiaDePasses(ctx, atacante, chutador, assistente)
  const fd = forcas(defensor)
  const pAlvo = limitar(0.35 * Math.pow(chutador.j.atq / Math.max(40, fd.def), 0.55), 0.22, 0.5)
  const r = rng.proximo()
  const tipoJogada = 'jogada'

  if (r < 0.22) {
    registrarChute(ctx, chutador, false)
    emitir(ctx, { tipo: 'chute_bloqueado', time: lado, jogadorId: chutador.j.id, jogadorNome: chutador.j.nome, cadeia, tipoJogada })
    if (rng.chance(0.22)) cobrarEscanteio(ctx, atacante, defensor)
    return
  }
  if (r < 1 - pAlvo) {
    registrarChute(ctx, chutador, false)
    const trave = rng.chance(0.09)
    emitir(ctx, { tipo: trave ? 'chute_trave' : 'chute_fora', time: lado, jogadorId: chutador.j.id, jogadorNome: chutador.j.nome, cadeia, tipoJogada })
    return
  }
  registrarChute(ctx, chutador, true)
  chutarNoAlvo(ctx, atacante, defensor, chutador, assistente, cadeia, tipoJogada)
}

function cobrarEscanteio(ctx, atacante, defensor) {
  const rng = ctx.rng
  const lado = atacante.lado
  ctx.stats[lado].escanteios += 1
  const cobradores = ativosDe(atacante, ['M', 'F'])
  const cobrador = rng.ponderado(cobradores, cobradores.map((l) => Math.pow(l.j.pas / 70, 2)))
  emitir(ctx, { tipo: 'escanteio', time: lado, jogadorId: cobrador.j.id, jogadorNome: cobrador.j.nome })
  if (!rng.chance(0.3)) return
  const cand = ativosDe(atacante).filter((l) => l !== cobrador && l.slot.papel !== 'G')
  const cabeceador = rng.ponderado(cand, cand.map((l) => ({ F: 1, M: 0.4, D: 0.9 }[l.slot.papel] * Math.pow(l.j.fis / 70, 2))))
  ctx.ladoDe[cabeceador.j.id] = lado
  const cadeia = [cobrador.j.id, cabeceador.j.id]
  if (!rng.chance(0.42)) {
    registrarChute(ctx, cabeceador, false)
    emitir(ctx, { tipo: 'chute_fora', time: lado, jogadorId: cabeceador.j.id, jogadorNome: cabeceador.j.nome, cadeia, tipoJogada: 'escanteio' })
    return
  }
  registrarChute(ctx, cabeceador, true)
  chutarNoAlvo(ctx, atacante, defensor, cabeceador, cobrador, cadeia, 'escanteio', -0.35)
}

function cobrarFaltaDireta(ctx, atacante, defensor) {
  const rng = ctx.rng
  const cand = ativosDe(atacante, ['M', 'F'])
  const cobrador = rng.ponderado(cand, cand.map((l) => Math.pow(l.j.atq / 70, 3)))
  ctx.ladoDe[cobrador.j.id] = atacante.lado
  const cadeia = [cobrador.j.id]
  if (rng.chance(0.55)) {
    registrarChute(ctx, cobrador, false)
    emitir(ctx, { tipo: 'chute_fora', time: atacante.lado, jogadorId: cobrador.j.id, jogadorNome: cobrador.j.nome, cadeia, tipoJogada: 'falta' })
    return
  }
  registrarChute(ctx, cobrador, true)
  chutarNoAlvo(ctx, atacante, defensor, cobrador, null, cadeia, 'falta', -0.3)
}

function cobrarPenalti(ctx, atacante, defensor, viaVar) {
  const rng = ctx.rng
  const lado = atacante.lado
  const cand = ativosDe(atacante).filter((l) => l.slot.papel !== 'G')
  const cobrador = [...cand].sort((a, b) => b.j.penal + b.j.atq * 0.3 - (a.j.penal + a.j.atq * 0.3))[0]
  ctx.ladoDe[cobrador.j.id] = lado
  const gk = defensor.linhas.find((l) => l.slot.papel === 'G' && l.ativo)
  const gkNivel = gk ? gk.j.gol : 40
  emitir(ctx, { tipo: 'penalti', time: lado, jogadorId: cobrador.j.id, jogadorNome: cobrador.j.nome, viaVar })
  registrarChute(ctx, cobrador, true)
  const pGol = limitar(0.78 + (cobrador.j.penal - 70) / 250 - (gkNivel - 70) / 400, 0.55, 0.92)
  if (rng.chance(pGol)) {
    ctx.jog[cobrador.j.id].penaltisMarcados += 1
    golEm(ctx, lado, 'gol_penalti', cobrador, null, { tipoJogada: 'penalti', cadeia: [cobrador.j.id] })
    return
  }
  ctx.jog[cobrador.j.id].penaltisPerdidos += 1
  if (rng.chance(0.2)) {
    emitir(ctx, { tipo: 'penalti_fora', time: lado, jogadorId: cobrador.j.id, jogadorNome: cobrador.j.nome, cadeia: [cobrador.j.id] })
  } else {
    if (gk) {
      ctx.jog[gk.j.id].defesas += 1
      ctx.stats[defensor.lado].defesas += 1
    }
    emitir(ctx, {
      tipo: 'penalti_defendido', time: lado, jogadorId: cobrador.j.id, jogadorNome: cobrador.j.nome,
      goleiroId: gk?.j.id ?? null, goleiroNome: gk?.j.nome ?? null, cadeia: [cobrador.j.id],
    })
  }
}

function gerarFalta(ctx, infrator, vitimaTime) {
  const rng = ctx.rng
  const lado = infrator.lado
  const cand = ativosDe(infrator)
  const faltoso = rng.ponderado(cand, cand.map((l) => ({ D: 1.2, M: 1, F: 0.5, G: 0.03 }[l.slot.papel] * (l.j.agr + 45))))
  const vit = rng.escolher(ativosDe(vitimaTime, ['F', 'M']))
  ctx.ladoDe[faltoso.j.id] = lado
  const sf = ctx.jog[faltoso.j.id]
  sf.faltas += 1
  ctx.stats[lado].faltas += 1
  if (vit) {
    ctx.jog[vit.j.id].faltasSofridas += 1
    ctx.ladoDe[vit.j.id] = vitimaTime.lado
  }
  emitir(ctx, {
    tipo: 'falta', time: lado, jogadorId: faltoso.j.id, jogadorNome: faltoso.j.nome,
    vitimaId: vit?.j.id ?? null, vitimaNome: vit?.j.nome ?? null,
  })

  const fator = faltoso.j.agr / 55
  const jaAdvertido = faltoso.amarelos > 0 ? 0.35 : 1
  const pAmarelo = limitar(0.14 * Math.pow(fator, 1.3) * jaAdvertido, 0.02, 0.4)
  const pDireto = 0.0014 * Math.pow(fator, 1.5)
  let expulso = false
  if (rng.chance(pDireto)) {
    expulso = true
    expulsar(ctx, infrator, faltoso, 'vermelho direto')
  } else if (rng.chance(pAmarelo)) {
    faltoso.amarelos += 1
    sf.amarelos += 1
    ctx.stats[lado].amarelos += 1
    emitir(ctx, { tipo: 'amarelo', time: lado, jogadorId: faltoso.j.id, jogadorNome: faltoso.j.nome })
    if (faltoso.amarelos >= 2) {
      expulso = true
      expulsar(ctx, infrator, faltoso, 'segundo amarelo')
    }
  }
  void expulso

  const emArea = rng.chance(0.011 * ({ D: 1.4, M: 1, F: 0.3, G: 1 }[faltoso.slot.papel]))
  if (emArea) {
    const viaVar = rng.chance(0.25)
    cobrarPenalti(ctx, vitimaTime, infrator, viaVar)
  } else if (rng.chance(0.06)) {
    cobrarFaltaDireta(ctx, vitimaTime, infrator)
  }
}

function expulsar(ctx, time, linha, motivo) {
  linha.ativo = false
  ctx.jog[linha.j.id].ate = ctx.min
  ctx.jog[linha.j.id].vermelhos += 1
  ctx.stats[time.lado].vermelhos += 1
  emitir(ctx, { tipo: 'vermelho', time: time.lado, jogadorId: linha.j.id, jogadorNome: linha.j.nome, motivo })
}

function gerarLesao(ctx, time) {
  const rng = ctx.rng
  const cand = ativosDe(time)
  const linha = rng.ponderado(cand, cand.map((l) => 120 - l.j.fis))
  const saiu = linha.j
  ctx.jog[saiu.id].ate = ctx.min
  const entrou = reserva(time, ctx, linha.slot.papel)
  ctx.jog[entrou.id].desde = ctx.min
  ctx.ladoDe[entrou.id] = time.lado
  linha.j = entrou
  linha.amarelos = 0
  emitir(ctx, { tipo: 'lesao', time: time.lado, jogadorId: saiu.id, jogadorNome: saiu.nome, entraId: entrou.id, entraNome: entrou.nome })
}

function minutoSimulado(ctx, fadiga) {
  const rng = ctx.rng
  const A = ctx.times.A
  const B = ctx.times.B
  const fA = forcas(A)
  const fB = forcas(B)
  const posseBase = limitar(0.5 + ((fA.mid - fB.mid) / (fA.mid + fB.mid)) * 1.0, 0.28, 0.72)
  const posseA = limitar(posseBase + (A.tatica.posse - B.tatica.posse), 0.25, 0.75)
  const dono = rng.chance(posseA) ? 'A' : 'B'
  ctx.posseMin.push({ min: ctx.min, acr: ctx.acr, dono })
  ctx.stats[dono].minutosPosse += 1

  const lados = [['A', A, B, fA, fB, posseBase], ['B', B, A, fB, fA, 1 - posseBase]]
  for (const [, att, def, fAtt, fDef, posse] of lados) {
    const razao = (fAtt.atk * att.tatica.atk) / (fDef.def * def.tatica.def)
    const expo = 1.05 * def.tatica.comprimir * att.tatica.ampliar
    const p = BASE_ATAQUE * posse * 2 * Math.pow(razao, expo) * fadiga
    if (rng.chance(p)) gerarAtaque(ctx, att, def)
    if (rng.chance(0.028 * posse * 2)) {
      const cand = ativosDe(att, ['F'])
      const j = rng.escolher(cand.length ? cand : ativosDe(att))
      ctx.stats[att.lado].impedimentos += 1
      emitir(ctx, { tipo: 'impedimento', time: att.lado, jogadorId: j.j.id, jogadorNome: j.j.nome })
    }
  }
  for (const [, att, def, , , posse] of lados) {
    const pFalta = BASE_FALTA * Math.pow(agressividade(att) / 55, 0.7) * att.tatica.faltas * (1.3 - posse * 0.6) * fadiga
    if (rng.chance(pFalta)) gerarFalta(ctx, att, def)
    if (rng.chance(0.001)) gerarLesao(ctx, att)
  }
}

function jogarPeriodo(ctx, tempo, de, ate, fadiga, minAcr) {
  ctx.tempo = tempo
  ctx.periodo = { relevantes: 0 }
  for (let m = de; m <= ate; m++) {
    ctx.min = m
    ctx.acr = 0
    minutoSimulado(ctx, fadiga)
  }
  const acr = limitar(minAcr + Math.floor(ctx.periodo.relevantes / 2) + (ctx.rng.chance(0.4) ? 1 : 0), 1, 7)
  for (let k = 1; k <= acr; k++) {
    ctx.min = ate
    ctx.acr = k
    minutoSimulado(ctx, fadiga)
  }
  return acr
}

function penaltis(ctx) {
  const rng = ctx.rng
  const ordem = (t) =>
    [...t.linhas.filter((l) => l.ativo)].sort((a, b) => b.j.penal + b.j.atq * 0.3 - (a.j.penal + a.j.atq * 0.3))
  const lista = { A: ordem(ctx.times.A), B: ordem(ctx.times.B) }
  const gols = { A: 0, B: 0 }
  const cobrancas = []
  let vencedor = null
  const goleiro = (t) => t.linhas.find((l) => l.slot.papel === 'G' && l.ativo)
  for (let rodada = 0; rodada < 30 && !vencedor; rodada++) {
    for (const lado of ['A', 'B']) {
      const t = ctx.times[lado]
      const adv = ctx.times[lado === 'A' ? 'B' : 'A']
      const cobrador = lista[lado][rodada % lista[lado].length]
      const gk = goleiro(adv)
      const gkNivel = gk ? gk.j.gol : 40
      const p = limitar(0.76 + (cobrador.j.penal - 70) / 250 - (gkNivel - 70) / 400, 0.5, 0.9)
      const marcou = rng.chance(p)
      const resultado = marcou ? 'gol' : rng.chance(0.25) ? 'fora' : 'defendido'
      if (marcou) gols[lado] += 1
      cobrancas.push({
        time: lado, jogadorId: cobrador.j.id, jogadorNome: cobrador.j.nome, num: cobrador.j.num,
        goleiroId: gk?.j.id ?? null, goleiroNome: gk?.j.nome ?? null, goleiroNum: gk?.j.num ?? null,
        resultado, parcial: { A: gols.A, B: gols.B }, rodada: rodada + 1,
      })
      const feitosA = cobrancas.filter((c) => c.time === 'A').length
      const feitosB = cobrancas.filter((c) => c.time === 'B').length
      const restA = Math.max(0, 5 - feitosA)
      const restB = Math.max(0, 5 - feitosB)
      if (rodada < 5) {
        if (gols.A > gols.B + restB) vencedor = 'A'
        else if (gols.B > gols.A + restA) vencedor = 'B'
      } else if (lado === 'B' && gols.A !== gols.B) {
        vencedor = gols.A > gols.B ? 'A' : 'B'
      }
      if (vencedor) break
    }
  }
  return { A: gols.A, B: gols.B, cobrancas, vencedor }
}

function fecharNotas(ctx, vencedorTempo) {
  const rng = ctx.rng
  const sofreu = { A: ctx.placar.B, B: ctx.placar.A }
  for (const id of Object.keys(ctx.jog)) {
    const s = ctx.jog[id]
    const papel = ctx.papelDe[id] ?? 'M'
    let nota = 6 + s.gols * 1.1 + s.assistencias * 0.7 + s.noAlvo * 0.12
    nota += s.defesas * 0.28 - (papel === 'G' ? s.golsSofridos * 0.3 : 0)
    if ((papel === 'G' || papel === 'D') && sofreu[s.time] === 0 && s.minutos >= 60) nota += 0.6
    nota -= s.amarelos * 0.3 + s.vermelhos * 2 + s.faltas * 0.05 + s.penaltisPerdidos * 0.8 + s.golsContra * 1.2
    if (vencedorTempo === s.time) nota += 0.3
    else if (vencedorTempo) nota -= 0.2
    nota += (rng.proximo() - 0.5) * 0.5
    s.nota = Math.round(limitar(nota, 3, 10) * 10) / 10
  }
}

export function simularPartida(cfgA, cfgB, { semente = 1, mataMata = false } = {}) {
  const rng = criarRng(semente)
  const A = criarTime('A', cfgA)
  const B = criarTime('B', cfgB)
  const ctx = {
    rng, times: { A, B }, eventos: [], posseMin: [], placar: { A: 0, B: 0 }, min: 0, acr: 0, tempo: 'T1',
    periodo: { relevantes: 0 }, jog: {}, ladoDe: {}, papelDe: {},
    stats: {
      A: { finalizacoes: 0, noAlvo: 0, escanteios: 0, faltas: 0, amarelos: 0, vermelhos: 0, impedimentos: 0, defesas: 0, minutosPosse: 0 },
      B: { finalizacoes: 0, noAlvo: 0, escanteios: 0, faltas: 0, amarelos: 0, vermelhos: 0, impedimentos: 0, defesas: 0, minutosPosse: 0 },
    },
  }
  for (const t of [A, B]) {
    for (const l of t.linhas) {
      if (ctx.jog[l.j.id]) throw new Error(`jogador repetido na partida: ${l.j.id}`)
      ctx.jog[l.j.id] = novoJog(l.j, t.lado)
      ctx.ladoDe[l.j.id] = t.lado
      ctx.papelDe[l.j.id] = l.slot.papel
    }
  }

  emitir(ctx, { tipo: 'inicio' })
  const acr1 = jogarPeriodo(ctx, 'T1', 1, 45, 1, 1)
  ctx.tempo = 'T1'
  ctx.min = 45
  ctx.acr = acr1
  emitir(ctx, { tipo: 'intervalo' })
  const acr2 = jogarPeriodo(ctx, 'T2', 46, 90, 0.97, 1)
  ctx.min = 90
  ctx.acr = acr2
  emitir(ctx, { tipo: 'fim_tempo_normal' })

  let fimMin = 90
  let fimAcr = acr2
  let prorrogou = false
  let decididoPor = 'tempo normal'
  let pen = null
  if (mataMata && ctx.placar.A === ctx.placar.B) {
    prorrogou = true
    ctx.tempo = 'P1'
    ctx.min = 90
    ctx.acr = 0
    emitir(ctx, { tipo: 'prorrogacao' })
    const a1 = jogarPeriodo(ctx, 'P1', 91, 105, 0.9, 1)
    const a2 = jogarPeriodo(ctx, 'P2', 106, 120, 0.88, 1)
    fimMin = 120
    fimAcr = a2
    void a1
    ctx.min = 120
    ctx.acr = a2
    decididoPor = 'prorrogação'
    emitir(ctx, { tipo: 'fim_prorrogacao' })
    if (ctx.placar.A === ctx.placar.B) {
      pen = penaltis(ctx)
      decididoPor = 'pênaltis'
      emitir(ctx, { tipo: 'penaltis', parcial: { A: pen.A, B: pen.B }, vencedor: pen.vencedor })
    }
  }

  const vencedor = ctx.placar.A > ctx.placar.B ? 'A' : ctx.placar.B > ctx.placar.A ? 'B' : pen ? pen.vencedor : null
  ctx.min = fimMin
  ctx.acr = fimAcr
  emitir(ctx, { tipo: 'fim' })

  const fimTotal = fimMin + fimAcr
  for (const sj of Object.values(ctx.jog)) sj.minutos = Math.max(0, (sj.ate ?? fimTotal) - sj.desde)
  fecharNotas(ctx, ctx.placar.A === ctx.placar.B ? (pen?.vencedor ?? null) : vencedor)

  const totalPosse = ctx.posseMin.length || 1
  const stats = {}
  for (const lado of ['A', 'B']) {
    const s = ctx.stats[lado]
    stats[lado] = { ...s, posse: Math.round((s.minutosPosse / totalPosse) * 100) }
  }
  stats.B.posse = 100 - stats.A.posse

  const todos = Object.values(ctx.jog).filter((j) => j.minutos > 0 || j.gols > 0)
  const melhor = [...todos].sort((a, b) => b.nota - a.nota || b.gols - a.gols)[0] ?? null

  return {
    resultado: {
      golsA: ctx.placar.A, golsB: ctx.placar.B, vencedor, decididoPor, prorrogou,
      penaltis: pen,
      nomes: { A: cfgA.nome, B: cfgB.nome },
    },
    eventos: ctx.eventos,
    posseMin: ctx.posseMin,
    stats,
    jogadores: ctx.jog,
    melhorEmCampo: melhor,
    escalacoes: {
      A: A.linhas.map((l) => ({ id: l.j.id, rotulo: l.slot.rotulo, papel: l.slot.papel })),
      B: B.linhas.map((l) => ({ id: l.j.id, rotulo: l.slot.rotulo, papel: l.slot.papel })),
    },
    tempos: NOMES_TEMPO,
  }
}

// Troca por reservas genéricos os jogadores indisponíveis (suspensos). Mantém a posição na formação.
export function montarEscalacao(cfg, indisponiveis = []) {
  const bloqueados = new Set(indisponiveis)
  const ativos = cfg.jogadores.filter((j) => !bloqueados.has(j.id))
  const media = ativos.reduce((s, j) => s + j.ovr, 0) / Math.max(1, ativos.length)
  const nivel = Math.round(media - 8)
  let n = 0
  const jogadores = cfg.jogadores.map((j) => {
    if (!bloqueados.has(j.id)) return j
    n += 1
    return {
      id: `res-${cfg.id}-${j.id}`, nome: 'Reserva', num: 20 + n, ovr: nivel, atq: nivel, pas: nivel, def: nivel,
      fis: nivel, agr: 55, gol: nivel, penal: 60, generico: true,
    }
  })
  return { ...cfg, jogadores }
}
