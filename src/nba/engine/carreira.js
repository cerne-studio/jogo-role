import { TIMES_POR_ID } from '../data/times.js'
import { criarEstado, adicionarLinha } from './estado.js'
import { clamp } from './rng.js'
import { executarDraft, projetarDraft, ofertasSemDraft, descreverPick } from './draft.js'
import { gerarPropostas, aplicarContrato, SALARIO_DUAS_VIAS } from './contrato.js'
import { simularTemporadaBase, simularTemporadaNba, avancarAno } from './temporada.js'
import { classificarCarreira } from './legado.js'
import { selecionarEventos, resolverEscolha, aplicarEfeitos, registrarVisto } from './eventos.js'

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

export function simularAno(estado, rng, pend = {}) {
  return ehBase(estado) ? simularTemporadaBase(estado, rng) : simularTemporadaNba(estado, rng, pend)
}

export function aposentar(estado) {
  const e = { ...estado, aposentado: true }
  return { estado: e, legado: classificarCarreira(e) }
}

// Quando deve acabar de qualquer jeito (idade ou declínio).
export function fimForcado(estado) {
  if (estado.idade >= 42) return true
  if (estado.idade >= 34 && estado.media < 55) return true
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
          e = aceitarDuasVias(e, ofertas[0])
        }
        continue
      }
    }

    // 2) contrato vencendo
    if (temContratoVencendo(e)) {
      const propostas = propostasDeContrato(e, rng)
      if (!propostas.length || fimForcado(e)) {
        e = aposentar(e).estado
        break
      }
      const melhor = [...propostas].sort((a, b) => b.salario - a.salario)[0]
      e = assinarProposta(e, melhor)
    }

    // 3) eventos da pré-temporada (escolha aleatória no piloto automático)
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
