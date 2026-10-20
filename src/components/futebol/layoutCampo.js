// Onde cada peça fica no campo. Puro: recebe o estado visual (quem tem a bola e até onde ela chegou)
// e devolve as coordenadas das 22 peças. A tela só aplica essas posições com transição suave.
//
// Campo horizontal em unidades de SVG. O time A defende o gol da esquerda e ataca pra direita; o B, o contrário.

import { FORMACOES } from './formacoes.js'

export const CAMPO = { w: 360, h: 216, margem: 10 }
const COMPRIMENTO = CAMPO.w - CAMPO.margem * 2
const LARGURA = CAMPO.h - CAMPO.margem * 2

const PESO_AVANCO = { G: 0, D: 0.35, M: 0.7, F: 1 }
const PESO_RECUO = { G: 0, D: 0.5, M: 0.9, F: 0.6 }
const AVANCO = { ofensiva: 0.3, equilibrada: 0.2, defensiva: 0.1 }
const RECUO = { ofensiva: 0.7, equilibrada: 1, defensiva: 1.35 }

const limitar = (v, a, b) => Math.max(a, Math.min(b, v))

function mundoX(lado, nx) {
  return lado === 'A' ? CAMPO.margem + nx * COMPRIMENTO : CAMPO.w - CAMPO.margem - nx * COMPRIMENTO
}
function mundoY(ny) {
  return CAMPO.margem + ny * LARGURA
}

// zona: quanto a bola avançou, do ponto de vista de quem tem a posse (0 = no próprio gol, 1 = na área rival).
// by: posição lateral da bola (0 = topo, 1 = base).
export function posicoesDoTime({ lado, formacao, tatica, temBola, zona, by }) {
  const slots = FORMACOES[formacao]
  return slots.map((slot) => {
    let nx
    let ny
    if (temBola) {
      nx = slot.x + AVANCO[tatica] * PESO_AVANCO[slot.papel] * zona + (slot.papel === 'G' ? 0 : 0.03 * zona)
      const atracao = slot.papel === 'G' ? 0 : 0.18 + 0.22 * PESO_AVANCO[slot.papel]
      ny = slot.y + (by - slot.y) * atracao
    } else {
      nx = slot.x - PESO_RECUO[slot.papel] * zona * 0.17 * RECUO[tatica]
      ny = slot.y + (by - slot.y) * (slot.papel === 'G' ? 0.12 : 0.3)
    }
    nx = limitar(nx, 0.03, 0.97)
    ny = limitar(ny, 0.05, 0.95)
    return { x: mundoX(lado, nx), y: mundoY(ny) }
  })
}

export function posicaoDaBola(dono, zona, by) {
  return { x: mundoX(dono, 0.08 + 0.84 * zona), y: mundoY(by) }
}

// Posição do gol (boca do gol) do time que defende `ladoDefensor`, com deslocamento lateral em [-1, 1].
export function bocaDoGol(ladoDefensor, deslocamento = 0) {
  return {
    x: ladoDefensor === 'A' ? CAMPO.margem - 2 : CAMPO.w - CAMPO.margem + 2,
    y: CAMPO.h / 2 + deslocamento * 22,
  }
}

export function cantoDoCampo(ladoDefensor, cima) {
  return {
    x: ladoDefensor === 'A' ? CAMPO.margem + 2 : CAMPO.w - CAMPO.margem - 2,
    y: cima ? CAMPO.margem + 2 : CAMPO.h - CAMPO.margem - 2,
  }
}

export function marcaDoPenalti(ladoDefensor) {
  return { x: ladoDefensor === 'A' ? CAMPO.margem + 0.12 * COMPRIMENTO : CAMPO.w - CAMPO.margem - 0.12 * COMPRIMENTO, y: CAMPO.h / 2 }
}

// Peça mais próxima de um ponto, entre as do time (usado pra escolher quem fica com a bola).
export function maisProxima(posicoes, alvo, ignorarGoleiro = true, slots = null) {
  let melhor = -1
  let dist = Infinity
  posicoes.forEach((p, i) => {
    if (ignorarGoleiro && slots && slots[i].papel === 'G') return
    const d = (p.x - alvo.x) ** 2 + (p.y - alvo.y) ** 2
    if (d < dist) {
      dist = d
      melhor = i
    }
  })
  return melhor
}
