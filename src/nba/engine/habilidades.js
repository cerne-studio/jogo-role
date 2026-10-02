// Habilidades detalhadas (bola de 3, ball handling, toco...) derivadas dos 6 atributos base, da posição e da altura.
// Cada jogador tem um "jeito" fixo (desvio estável por habilidade, vindo do nome e do número), então dois pivôs de mesmo overall não são iguais.
import { clamp } from './rng.js'

export const GRUPOS_HABILIDADE = [
  { id: 'ataque', rotulo: 'Ataque', itens: ['tres', 'media', 'finalizacao', 'lance_livre'] },
  { id: 'criacao', rotulo: 'Criação', itens: ['handle', 'passe', 'visao'] },
  { id: 'defesa', rotulo: 'Defesa', itens: ['def_perimetro', 'def_garrafao', 'roubo', 'toco'] },
  { id: 'fisico', rotulo: 'Físico', itens: ['rebote', 'velocidade', 'forca', 'salto'] },
]

export const NOMES_HABILIDADE = {
  tres: 'Bola de 3',
  media: 'Arremesso de média',
  finalizacao: 'Finalização no aro',
  lance_livre: 'Lance livre',
  handle: 'Ball handling',
  passe: 'Passe',
  visao: 'Visão de jogo',
  def_perimetro: 'Defesa de perímetro',
  def_garrafao: 'Defesa de garrafão',
  roubo: 'Roubo de bola',
  toco: 'Toco',
  rebote: 'Rebote',
  velocidade: 'Velocidade',
  forca: 'Força',
  salto: 'Salto',
}

function hash(texto) {
  let h = 2166136261
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// desvio fixo de -4 a +4 por habilidade
function jeito(jogador, chave) {
  return (hash(`${jogador.sobrenome}#${jogador.numero}:${chave}`) % 9) - 4
}

const GUARD = { armador: 1, ala_armador: 0.7, ala: 0.1, ala_pivo: -0.6, pivo: -1 } // +1 = jogador de perímetro, -1 = pivô

export function calcularHabilidades(atrs, jogador) {
  const { arremesso: A, infiltracao: I, passe: P, defesa: D, fisico: F, qi: Q } = atrs
  const g = GUARD[jogador.posicao] ?? 0
  const alt = (jogador.altura ?? 198) - 198 // cm acima/abaixo de um ala
  const base = {
    tres: A + g * 3,
    media: A * 0.65 + I * 0.15 + Q * 0.2,
    finalizacao: I * 0.8 + F * 0.2 - g * 3 + alt * 0.1,
    lance_livre: A * 0.8 + Q * 0.2,
    handle: P * 0.45 + I * 0.3 + Q * 0.25 + g * 6 - Math.max(0, alt) * 0.35,
    passe: P + g * 1,
    visao: P * 0.4 + Q * 0.6,
    def_perimetro: D * 0.7 + F * 0.15 + Q * 0.15 + g * 4,
    def_garrafao: D * 0.7 + F * 0.3 - g * 6 + alt * 0.2,
    roubo: D * 0.55 + Q * 0.25 + P * 0.2 + g * 3,
    toco: D * 0.55 + F * 0.25 + Q * 0.2 - g * 5 + alt * 0.45,
    rebote: F * 0.55 + D * 0.2 + Q * 0.25 - g * 5 + alt * 0.4,
    velocidade: F * 0.55 + I * 0.25 + Q * 0.2 + g * 6 - Math.max(0, alt) * 0.3,
    forca: F * 0.9 + D * 0.1 - g * 7 + alt * 0.1,
    salto: F * 0.8 + I * 0.2 + g * 1 - Math.max(0, alt - 12) * 0.2,
  }
  const out = {}
  for (const [k, v] of Object.entries(base)) out[k] = clamp(Math.round(v + jeito(jogador, k)), 25, 99)
  return out
}

// Compara com o ano anterior (se houver) pra mostrar quem subiu e quem caiu.
export function deltasHabilidades(atrs, atrsAnterior, jogador) {
  if (!atrsAnterior) return {}
  const agora = calcularHabilidades(atrs, jogador)
  const antes = calcularHabilidades(atrsAnterior, jogador)
  return Object.fromEntries(Object.keys(agora).map((k) => [k, agora[k] - antes[k]]))
}

export function notaLetra(v) {
  if (v >= 90) return 'S'
  if (v >= 80) return 'A'
  if (v >= 70) return 'B'
  if (v >= 60) return 'C'
  if (v >= 50) return 'D'
  return 'E'
}

// Destaques do jogador: melhores e piores habilidades, pra frase de resumo.
export function destaques(hab) {
  const lista = Object.entries(hab).sort((a, b) => b[1] - a[1])
  return { melhores: lista.slice(0, 3), piores: lista.slice(-2) }
}
