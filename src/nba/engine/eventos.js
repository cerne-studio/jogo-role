import { EVENTOS } from '../data/eventos.js'
import { clamp } from './rng.js'
import { calcMedia } from './jogador.js'
import { adicionarLinha } from './estado.js'

// Como um evento aparece no jogo:
//   { id, titulo, texto, quando: 'pre'|'meio', peso, unico, cond: {...}, escolhas: [...] }
// escolha: { rotulo, resultado, efeitos, alea?: { p, sucesso: {resultado, efeitos}, falha: {resultado, efeitos} } }
// efeitos: atributos (arremesso...), moral, fama, tecnico, vestiario, imagem, desgaste, potencial,
//   dinheiro (US$ mi, soma no patrimônio), patrocinio (US$ mi/ano permanente), salarioPct (% no salário atual),
//   flag: 'nome' | ['a','b'], semFlag: 'nome', risco, foraTemporada, minutosBonus, minutosPenalidade, linha: 'texto da linha do tempo'

const ATRS = ['arremesso', 'infiltracao', 'passe', 'defesa', 'fisico', 'qi']

// Eventos da fase 'nba' que só fazem sentido dentro da liga americana (rivais, G League, título...).
const SO_NBA = /NBA|G League|franquia|All-Star|draft|Finais|MVP|Jokić|Curry|Wembanyama|Giannis|Dončić|Durant|LeBron|Embiid|Tatum|Edwards|Gilgeous|Booker|Jordan|anel|playoffs|camisa aposentada/i
const cacheSoNba = new Map()
function soNba(ev) {
  if (!cacheSoNba.has(ev.id)) {
    cacheSoNba.set(ev.id, SO_NBA.test(`${ev.titulo} ${ev.texto} ${ev.escolhas.map((c) => c.rotulo).join(' ')}`))
  }
  return cacheSoNba.get(ev.id)
}

function condOk(ev, e) {
  const c = ev.cond ?? {}
  const nbaTemps = e.ultimaTemporadaNba
  const naBase = e.nivel === 'college' || e.nivel === 'pro_exterior'
  const ultimo = e.historico[e.historico.length - 1]
  const exterior = e.nivel === 'exterior'
  if (ev.fase === 'base' && !naBase) return false
  if (ev.fase === 'exterior' && !exterior) return false
  if (ev.fase === 'nba' && (naBase || (exterior && soNba(ev)))) return false
  if (c.idadeMin != null && e.idade < c.idadeMin) return false
  if (c.idadeMax != null && e.idade > c.idadeMax) return false
  if (c.mediaMin != null && e.media < c.mediaMin) return false
  if (c.mediaMax != null && e.media > c.mediaMax) return false
  if (c.famaMin != null && e.fama < c.famaMin) return false
  if (c.famaMax != null && e.fama > c.famaMax) return false
  if (c.moralMin != null && e.moral < c.moralMin) return false
  if (c.moralMax != null && e.moral > c.moralMax) return false
  if (c.desgasteMin != null && e.desgaste < c.desgasteMin) return false
  if (c.tecnicoMin != null && e.tecnico < c.tecnicoMin) return false
  if (c.tecnicoMax != null && e.tecnico > c.tecnicoMax) return false
  if (c.vestiarioMax != null && e.vestiario > c.vestiarioMax) return false
  if (c.temporadaNbaMin != null && nbaTemps < c.temporadaNbaMin) return false
  if (c.temporadaNbaMax != null && nbaTemps > c.temporadaNbaMax) return false
  if (c.titulosMin != null && e.titulos.length < c.titulosMin) return false
  if (c.patrimonioMin != null && e.dinheiro.patrimonio < c.patrimonioMin) return false
  if (c.patrimonioMax != null && e.dinheiro.patrimonio > c.patrimonioMax) return false
  if (c.posicao && !c.posicao.includes(e.jogador.posicao)) return false
  if (c.nivel && !c.nivel.includes(e.nivel)) return false
  if (c.papel && (!ultimo || !c.papel.includes(ultimo.papel))) return false
  if (c.flags && !c.flags.every((f) => e.flags[f])) return false
  if (c.semFlags && c.semFlags.some((f) => e.flags[f])) return false
  if (c.contratoAnosMax != null && (e.contrato?.anosRestantes ?? 99) > c.contratoAnosMax) return false
  if (c.lesaoRecente && !(e.lesaoAtual || (ultimo && ultimo.lesao))) return false
  if (c.campeaoRecente && !(ultimo && ultimo.campeao)) return false
  if (c.mvpRecente && !(ultimo && ultimo.premios?.includes('mvp'))) return false
  if (c.semPlayoffsRecente && !(ultimo && ultimo.fase && /Fora|Eliminado no play-in/.test(ultimo.fase))) return false
  if (c.pais && !c.pais.includes(e.jogador.pais)) return false
  if (c.caminho && !c.caminho.includes(e.jogador.caminho)) return false
  return true
}

// Sorteia `n` eventos distintos. Eventos já vistos recentemente ficam de fora (únicos, nunca mais).
export function selecionarEventos(estado, rng, n = 2, quando = 'pre') {
  const vistos = estado.eventosVistos ?? {}
  const pool = EVENTOS.filter((ev) => {
    if ((ev.quando ?? 'pre') !== quando) return false
    if (ev.unico && vistos[ev.id] != null) return false
    if (!ev.unico && vistos[ev.id] != null && estado.temporada - vistos[ev.id] < 6) return false
    return condOk(ev, estado)
  })
  const escolhidos = []
  const restante = [...pool]
  while (escolhidos.length < n && restante.length) {
    const ev = rng.ponderado(restante, (x) => x.peso ?? 1)
    escolhidos.push(ev)
    restante.splice(restante.indexOf(ev), 1)
  }
  return escolhidos
}

// Resolve o que realmente acontece (se for aleatório, sorteia). Retorna { resultado, efeitos }.
export function resolverEscolha(escolha, rng) {
  if (escolha.alea) {
    const ok = rng.chance(escolha.alea.p)
    const r = ok ? escolha.alea.sucesso : escolha.alea.falha
    return { resultado: r.resultado, efeitos: r.efeitos ?? {}, sorte: ok ? 'sucesso' : 'falha' }
  }
  return { resultado: escolha.resultado, efeitos: escolha.efeitos ?? {}, sorte: null }
}

// Aplica os efeitos no estado. `pend` acumula coisas que só valem na temporada (risco de lesão, minutos...).
export function aplicarEfeitos(estado, efeitos, pend = {}) {
  let e = { ...estado, atrs: { ...estado.atrs }, flags: { ...estado.flags }, dinheiro: { ...estado.dinheiro } }
  const novoPend = { ...pend }
  for (const [k, v] of Object.entries(efeitos)) {
    if (ATRS.includes(k)) e.atrs[k] = clamp(e.atrs[k] + v, 1, e.potencial)
    else if (k === 'moral') e.moral = clamp(e.moral + v, 0, 100)
    else if (k === 'fama') e.fama = clamp(e.fama + v, 0, 100)
    else if (k === 'tecnico') e.tecnico = clamp(e.tecnico + v, 0, 100)
    else if (k === 'vestiario') e.vestiario = clamp(e.vestiario + v, 0, 100)
    else if (k === 'imagem') e.imagem = clamp(e.imagem + v, 0, 100)
    else if (k === 'desgaste') e.desgaste = clamp(e.desgaste + v, 0, 100)
    else if (k === 'potencial') e.potencial = clamp(e.potencial + v, 58, 99)
    else if (k === 'dinheiro') e.dinheiro.patrimonio = Math.round((e.dinheiro.patrimonio + v) * 100) / 100
    else if (k === 'patrocinio') e.patrocinioExtra = Math.max(0, (e.patrocinioExtra ?? 0) + v)
    else if (k === 'gasto') e.gastoExtra = Math.max(0, (e.gastoExtra ?? 0) + v)
    else if (k === 'salarioPct' && e.contrato) e.contrato = { ...e.contrato, salario: Math.min(52, Math.round(e.contrato.salario * (1 + v / 100) * 10) / 10) }
    else if (k === 'flag') for (const f of [].concat(v)) e.flags[f] = true
    else if (k === 'semFlag') for (const f of [].concat(v)) delete e.flags[f]
    else if (k === 'risco') novoPend.risco = (novoPend.risco ?? 0) + v
    else if (k === 'foraTemporada') novoPend.foraTemporada = true
    else if (k === 'minutosBonus') novoPend.minutosBonus = (novoPend.minutosBonus ?? 0) + v
    else if (k === 'minutosPenalidade') novoPend.minutosPenalidade = (novoPend.minutosPenalidade ?? 0) + v
    else if (k === 'linha') e = adicionarLinha(e, v, 'evento')
  }
  e.media = calcMedia(e.atrs, e.jogador.posicao)
  return { estado: e, pend: novoPend }
}

export function registrarVisto(estado, ev) {
  return { ...estado, eventosVistos: { ...(estado.eventosVistos ?? {}), [ev.id]: estado.temporada } }
}

// Guarda o que foi decidido na temporada (alimenta a manchete e o resumo do ano).
export function registrarDecisao(estado, ev, escolha, r) {
  return {
    ...estado,
    decisoesAno: [...(estado.decisoesAno ?? []), { titulo: ev.titulo, rotulo: escolha.rotulo, resultado: r.resultado, efeitos: r.efeitos ?? {} }],
  }
}
