import { TIMES_POR_ID } from '../data/times.js'
import { criarEstado, adicionarLinha } from './estado.js'
import { clamp } from './rng.js'
import { executarDraft, projetarDraft, ofertasSemDraft, descreverPick } from './draft.js'
import { gerarPropostas, aplicarContrato, SALARIO_DUAS_VIAS, salarioExterior } from './contrato.js'
import { simularTemporadaBase, simularTemporadaNba, simularTemporadaExterior, sortearClubeExterior, avancarAno } from './temporada.js'
import { classificarCarreira } from './legado.js'
import { selecionarEventos, resolverEscolha, aplicarEfeitos, registrarVisto } from './eventos.js'
import { recomendarTreino, aplicarTreino } from './treino.js'

export const IDADE_MAX_BASE = 22

export function iniciarCarreira(config, rng) {
  return criarEstado(config, rng)
}

export function ehBase(estado) {
  return estado.nivel === 'college' || estado.nivel === 'pro_exterior'
}

// Pode declarar pro draft? (a partir dos 19; obrigatório aos 22)
export function podeDeclarar(estado) {
  return ehBase(estado) && estado.idade >= 19
}
export function draftObrigatorio(estado) {
  return ehBase(estado) && estado.idade >= IDADE_MAX_BASE
}

export { projetarDraft }

// Efeito do draft no estado. Retorna { estado, draft }.
export function realizarDraft(estado, rng) {
  const draft = executarDraft(estado, rng)
  let e = { ...estado, draft }
  if (draft.fora) {
    return { estado: adicionarLinha(e, 'Passou batido no draft.', 'draft'), draft }
  }
  const t = TIMES_POR_ID[draft.time]
  e = {
    ...e,
    nivel: draft.contrato.tipo === 'duas_vias' ? 'gleague' : 'nba',
    time: draft.time,
    equipe: t.nome,
    contrato: draft.contrato,
    fama: clamp(e.fama + Math.max(0, 14 - Math.floor(draft.pick / 2)), 0, 100),
    ultimaTemporadaNba: 0,
  }
  e = adicionarLinha(e, `Escolhido no draft pelo ${t.nome}: ${descreverPick(draft.pick)}.`, 'draft')
  return { estado: e, draft }
}

export function opcoesSemDraft(estado, rng) {
  return ofertasSemDraft(estado, rng)
}

export function aceitarDuasVias(estado, oferta) {
  const t = TIMES_POR_ID[oferta.time]
  const e = {
    ...estado,
    nivel: 'gleague',
    time: oferta.time,
    equipe: `${t.nome} (G League)`,
    contrato: { ...oferta.contrato, salario: SALARIO_DUAS_VIAS },
    ultimaTemporadaNba: 0,
  }
  return adicionarLinha(e, `Assinou contrato de duas vias com o ${t.nome}.`, 'contrato')
}

// Rodar mais um ano na base em vez de se inscrever (ou depois de passar batido).
export function ficarNaBase(estado) {
  return estado
}

export function temContratoVencendo(estado) {
  return (estado.nivel === 'nba' || estado.nivel === 'gleague') && estado.contrato && estado.contrato.anosRestantes <= 0
}

export function propostasDeContrato(estado, rng) {
  return gerarPropostas(estado, rng)
}

export function assinarProposta(estado, proposta) {
  const t = TIMES_POR_ID[proposta.time]
  let e = aplicarContrato(estado, proposta)
  e = { ...e, nivel: 'nba', equipe: t.nome }
  return adicionarLinha(e, `Assinou com o ${t.nome}: US$ ${proposta.salario.toFixed(1)} mi por ano, ${proposta.anos} ${proposta.anos > 1 ? 'anos' : 'ano'}.`, 'contrato')
}

export function ehExterior(estado) {
  return estado.nivel === 'exterior'
}

// Não rolou na NBA (ou o jogador prefere): segue carreira num clube estrangeiro até a hora de parar.
export function irParaExterior(estado, rng) {
  const c = sortearClubeExterior(estado.jogador.pais, rng)
  const e = {
    ...estado,
    nivel: 'exterior',
    time: null,
    equipe: c.clube,
    ligaExterior: c.liga,
    contrato: { tipo: 'exterior', salario: salarioExterior(estado.media), anos: 1, anosRestantes: 1 },
  }
  return adicionarLinha(e, `Foi jogar no exterior: ${c.clube} (${c.liga}).`, 'contrato')
}

// Quem joga fora às vezes recebe proposta de volta pra NBA. [] = sem proposta neste ano.
export function propostasDeVolta(estado, rng) {
  if (!ehExterior(estado) || estado.idade > 36) return []
  const folga = estado.media - (55.5 + Math.max(0, estado.idade - 21) * 1.5)
  if (folga < 0 || !rng.chance(clamp(0.2 + folga * 0.04, 0.2, 0.7))) return []
  return gerarPropostas(estado, rng)
}

// Dá pra aposentar por conta própria a partir daqui.
export const IDADE_APOSENTAR = 30

export function simularAno(estado, rng, pend = {}) {
  if (ehExterior(estado)) return simularTemporadaExterior(estado, rng)
  return ehBase(estado) ? simularTemporadaBase(estado, rng) : simularTemporadaNba(estado, rng, pend)
}

export function aposentar(estado) {
  const e = { ...estado, aposentado: true }
  return { estado: e, legado: classificarCarreira(e) }
}

// Quando deve acabar de qualquer jeito (idade ou declínio).
export function fimForcado(estado) {
  if (estado.idade >= 40) return true
  if (estado.idade >= 36 && estado.media < 48) return true
  return false
}

export { avancarAno }

// ── piloto automático (usado pelos testes de balanceamento) ──
export function autoJogar(estado, rng, { ficarNaBaseAteSeguro = true } = {}) {
  let e = estado
  const relatorios = []
  let guarda = 0
  while (!e.aposentado && guarda++ < 40) {
    // 1) base: decidir draft
    if (ehBase(e)) {
      const decl = draftObrigatorio(e) || (podeDeclarar(e) && (!ficarNaBaseAteSeguro || projetarDraft(e, rng).central <= 40 + rng.int(0, 8)))
      if (decl) {
        const r = realizarDraft(e, rng)
        e = r.estado
        if (r.draft.fora) {
          const ofertas = opcoesSemDraft(e, rng)
          e = ofertas.length ? aceitarDuasVias(e, ofertas[0]) : irParaExterior(e, rng)
        }
        continue
      }
    }

    // 2) contrato vencendo
    if (temContratoVencendo(e)) {
      const propostas = propostasDeContrato(e, rng)
      if (fimForcado(e)) {
        e = aposentar(e).estado
        break
      }
      if (!propostas.length) e = irParaExterior(e, rng)
      else e = assinarProposta(e, [...propostas].sort((a, b) => b.salario - a.salario)[0])
    } else if (ehExterior(e)) {
      const volta = propostasDeVolta(e, rng)
      if (volta.length) e = assinarProposta(e, [...volta].sort((a, b) => b.salario - a.salario)[0])
    }

    // 3) treino (o piloto automático segue o técnico em 70% das vezes) e eventos da pré-temporada (escolha aleatória)
    const rec = recomendarTreino(e, rng)
    e = aplicarTreino(e, rng.chance(0.7) ? rec.recomendado : rng.pick(rec.opcoes).id, rec)
    let pend = {}
    const qtdEv = ehBase(e) ? 1 : 2
    for (const ev of selecionarEventos(e, rng, qtdEv, 'pre')) {
      const esc = rng.pick(ev.escolhas)
      const r = resolverEscolha(esc, rng)
      const ap = aplicarEfeitos(registrarVisto(e, ev), r.efeitos, pend)
      e = ap.estado
      pend = ap.pend
    }

    // 4) temporada
    const { estado: e2, relatorio } = simularAno(e, rng, pend)
    relatorios.push(relatorio)
    e = e2

    if (fimForcado(e) || (e.idade >= 33 && e.media < 62 && rng.chance(0.4))) {
      e = aposentar(e).estado
      break
    }
    e = avancarAno(e, rng, { campeaoId: relatorio.kind === 'nba' ? relatorio.playoffs?.campeao : null })
  }
  if (!e.aposentado) e = aposentar(e).estado
  return { estado: e, relatorios }
}
