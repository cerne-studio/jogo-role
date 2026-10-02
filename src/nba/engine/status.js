// Status do jogador (moral, fama, técnico, vestiário, imagem, desgaste) e o que o dinheiro compra.
// Tudo que o jogo faz com esses números sai daqui, pra a tela mostrar exatamente o que a simulação usa.
import { clamp, arred } from './rng.js'

export const CHAVES_STATUS = ['moral', 'fama', 'tecnico', 'vestiario', 'imagem', 'desgaste']

export function fotoStatus(e) {
  return Object.fromEntries(CHAVES_STATUS.map((k) => [k, Math.round(e[k])]))
}

// ── serviços fixos (cobrados todo ano, dá pra cancelar) ──
export const SERVICOS = [
  { id: 'preparador', nome: 'Preparador físico', custo: 0.35, efeito: 'Desgaste −8 por temporada e um pouco menos de lesão.' },
  { id: 'nutri', nome: 'Nutricionista e chef', custo: 0.25, efeito: 'Desgaste −4 e moral +2 por temporada.' },
  { id: 'medica', nome: 'Equipe médica pessoal', custo: 0.6, efeito: 'Risco de lesão −5 pontos e lesões 30% mais curtas.' },
  { id: 'mental', nome: 'Psicólogo esportivo', custo: 0.25, efeito: 'Moral +5 por temporada.' },
  { id: 'agente', nome: 'Agente de elite', custo: 0.5, efeito: 'Contratos valem 5% mais e patrocínios 10% mais.' },
  { id: 'assessoria', nome: 'Assessoria de imagem', custo: 0.4, efeito: 'Imagem +3 por temporada.' },
]
export const SERVICOS_POR_ID = Object.fromEntries(SERVICOS.map((s) => [s.id, s]))

// ── compras de uma vez só ──
export const BENS = [
  { id: 'academia', nome: 'Academia em casa', custo: 2, efeito: 'Desgaste −3 por temporada, pra sempre.' },
]

// ── gastos que valem uma vez por temporada ──
export const ACOES = [
  { id: 'ferias', nome: 'Férias de luxo', custo: 0.4, efeito: 'Moral +10 e desgaste −8 agora.' },
  { id: 'fundacao', nome: 'Doação para a comunidade', custo: 1, efeito: 'Imagem +6, fama +2 e moral +4.' },
  { id: 'treino', nome: 'Treino individual', custo: 0.6, efeito: 'Escolha um atributo: +2 no fim da temporada.', escolhe: 'atributo' },
  { id: 'investir', nome: 'Investir em negócio', custo: 1, efeito: 'Pode render +60% ou perder metade. Escolha o valor.', escolhe: 'valor', valores: [1, 3, 10] },
]
export const ACOES_POR_ID = Object.fromEntries(ACOES.map((a) => [a.id, a]))

export const NOMES_ATRIBUTO = { arremesso: 'Arremesso', infiltracao: 'Infiltração', passe: 'Passe', defesa: 'Defesa', fisico: 'Físico', qi: 'QI de jogo' }

// Só quem já é profissional tem o que gastar; na base o dinheiro é zero.
export function podeGastar(e) {
  return e.nivel === 'nba' || e.nivel === 'gleague' || e.nivel === 'exterior'
}

const tem = (e, id) => !!e.servicos?.[id]

export function custoServicos(e) {
  return arred(SERVICOS.filter((s) => tem(e, s.id)).reduce((t, s) => t + s.custo, 0))
}

// ── o que cada status faz de verdade na simulação ──
export function modificadores(e) {
  const forma = clamp((e.moral - 50) * 0.04, -2, 2)
  const quimica = clamp((e.vestiario - 50) * 0.04, -2, 2)
  const minutos = (e.tecnico - 50) * 0.06
  const valorFama = (e.fama - 50) * 0.4
  const agente = tem(e, 'agente')
  const patroImagem = 1 + (e.imagem - 50) * 0.008
  return {
    forma, // pontos de overall em quadra
    quimica, // pontos na força do time
    minutos, // pontos no papel (minutos)
    valorFama, // % no valor de mercado
    valorAgente: agente ? 5 : 0, // % no valor de mercado
    patroImagem,
    patroAgente: agente ? 1.1 : 1,
    riscoLesao: riscoLesao(e),
    duracaoLesao: tem(e, 'medica') ? 0.7 : 1,
    perdeAtributo: e.desgaste > 65,
  }
}

export function riscoLesao(e) {
  const base = 0.1 + e.desgaste * 0.004 + (e.idade >= 33 ? 0.05 : 0)
  const reducao = (tem(e, 'medica') ? 0.05 : 0) + (tem(e, 'preparador') ? 0.02 : 0)
  return clamp(base - reducao, 0.02, 0.6)
}

// Conforto financeiro: sem grana a cabeça pesa, com muita grana pesa menos.
export function confortoFinanceiro(e) {
  const p = e.dinheiro.patrimonio
  if (p < 0.3) return -3
  if (p >= 25) return 2
  return 0
}

// Aplicado no fim de cada temporada profissional (junto com a cobrança dos serviços na renda do ano).
export function aplicarServicos(e) {
  if (!podeGastar(e)) return e
  let { desgaste, moral, imagem } = e
  if (tem(e, 'preparador')) desgaste -= 8
  if (tem(e, 'nutri')) { desgaste -= 4; moral += 2 }
  if (e.bens?.academia) desgaste -= 3
  if (tem(e, 'mental')) moral += 5
  if (tem(e, 'assessoria')) imagem += 3
  moral += confortoFinanceiro(e)
  let novo = { ...e, desgaste: clamp(desgaste, 0, 100), moral: clamp(moral, 0, 100), imagem: clamp(imagem, 0, 100) }
  // sem dinheiro pra manter a equipe: corta tudo
  if (novo.servicos && Object.keys(novo.servicos).length && novo.dinheiro.patrimonio < custoServicos(novo)) {
    novo = { ...novo, servicos: {}, linhaDoTempo: [...novo.linhaDoTempo, { ano: novo.ano, idade: novo.idade, texto: 'Cortou a equipe pessoal por falta de dinheiro.', tipo: 'info' }] }
  }
  return novo
}

// ── compras e contratações ──
const gastouAno = (e, id) => (e.usadoAno?.t === e.temporada && e.usadoAno.ids.includes(id))
export function jaUsouNoAno(e, id) {
  return gastouAno(e, id)
}

function cobrar(e, custo) {
  return { ...e, dinheiro: { patrimonio: arred(e.dinheiro.patrimonio - custo) } }
}

export function alternarServico(e, id) {
  const s = SERVICOS_POR_ID[id]
  if (!s || !podeGastar(e)) return { estado: e, erro: 'Só dá pra contratar depois de virar profissional.' }
  if (tem(e, id)) {
    const servicos = { ...e.servicos }
    delete servicos[id]
    return { estado: { ...e, servicos }, mensagem: `${s.nome} cancelado.` }
  }
  if (e.dinheiro.patrimonio < s.custo * 2) return { estado: e, erro: `Precisa de pelo menos ${fmt(s.custo * 2)} de patrimônio pra bancar ${s.nome.toLowerCase()}.` }
  return { estado: { ...e, servicos: { ...(e.servicos ?? {}), [id]: true } }, mensagem: `${s.nome} contratado. Entra na conta a cada temporada.` }
}

export function comprarBem(e, id) {
  const b = BENS.find((x) => x.id === id)
  if (!b || !podeGastar(e)) return { estado: e, erro: 'Disponível só pra profissionais.' }
  if (e.bens?.[id]) return { estado: e, erro: 'Você já tem isso.' }
  if (e.dinheiro.patrimonio < b.custo) return { estado: e, erro: `Faltam ${fmt(b.custo - e.dinheiro.patrimonio)}.` }
  return { estado: { ...cobrar(e, b.custo), bens: { ...(e.bens ?? {}), [id]: true } }, mensagem: `${b.nome} comprada.` }
}

// Gasto de uma vez por temporada. `param` = atributo escolhido ou valor investido.
export function usarAcao(e, id, rng, param) {
  const a = ACOES_POR_ID[id]
  if (!a || !podeGastar(e)) return { estado: e, erro: 'Disponível só pra profissionais.' }
  if (gastouAno(e, id)) return { estado: e, erro: 'Já fez isso nessa temporada.' }
  const custo = id === 'investir' ? param : a.custo
  if (e.dinheiro.patrimonio < custo) return { estado: e, erro: `Faltam ${fmt(custo - e.dinheiro.patrimonio)}.` }
  let n = cobrar(e, custo)
  let mensagem = ''
  if (id === 'ferias') {
    n = { ...n, moral: clamp(n.moral + 10, 0, 100), desgaste: clamp(n.desgaste - 8, 0, 100) }
    mensagem = 'Férias feitas: cabeça leve e corpo descansado.'
  } else if (id === 'fundacao') {
    n = { ...n, imagem: clamp(n.imagem + 6, 0, 100), fama: clamp(n.fama + 2, 0, 100), moral: clamp(n.moral + 4, 0, 100) }
    mensagem = 'A doação saiu na imprensa e a comunidade agradeceu.'
  } else if (id === 'treino') {
    if (!param) return { estado: e, erro: 'Escolha um atributo.' }
    n = { ...n, focoAno: param }
    mensagem = `Treino individual de ${NOMES_ATRIBUTO[param].toLowerCase()} marcado: o ganho vem no fim da temporada.`
  } else if (id === 'investir') {
    if (!a.valores.includes(param)) return { estado: e, erro: 'Valor inválido.' }
    if (rng.chance(0.55)) {
      const lucro = arred(param * 0.6)
      n = { ...n, dinheiro: { patrimonio: arred(n.dinheiro.patrimonio + param + lucro) } }
      mensagem = `O negócio deu certo: você recebeu ${fmt(param + lucro)} (lucro de ${fmt(lucro)}).`
    } else {
      const volta = arred(param * 0.5)
      n = { ...n, dinheiro: { patrimonio: arred(n.dinheiro.patrimonio + volta) } }
      mensagem = `O negócio quebrou: só voltaram ${fmt(volta)} dos ${fmt(param)}.`
    }
  }
  return { estado: { ...n, usadoAno: { t: e.temporada, ids: [...(e.usadoAno?.t === e.temporada ? e.usadoAno.ids : []), id] } }, mensagem }
}

function fmt(v) {
  return `US$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`
}
