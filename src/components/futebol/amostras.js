// Times de amostra (nomes genéricos, notas inventadas) pra testes e pra tela de demonstração.
// No jogo de verdade os jogadores vêm do draft / da base de dados.

import { criarRng, limitar } from './rng.js'
import { FORMACOES } from './formacoes.js'

const NOMES = ['Silva', 'Costa', 'Souza', 'Lima', 'Rocha', 'Dias', 'Melo', 'Cruz', 'Nunes', 'Reis', 'Pinto', 'Faria', 'Gomes',
  'Alves', 'Mota', 'Vieira', 'Teles', 'Barros', 'Moraes', 'Lopes', 'Brito', 'Neves', 'Duarte', 'Pires', 'Ramos', 'Leal',
  'Matos', 'Freitas', 'Campos', 'Bento', 'Aguiar', 'Cardoso', 'Farias', 'Xavier', 'Prado', 'Viana', 'Maciel', 'Tavares']
const INICIAIS = 'ABCDEFGHIJKLMNOPRSTV'

export function gerarTime({ id, nome, nivel = 78, formacao = '4-3-3', tatica = 'equilibrada', agressividade = 55, semente = 1 }) {
  const rng = criarRng(semente * 7919 + id.length * 31 + nome.length)
  const slots = FORMACOES[formacao]
  const jogadores = slots.map((slot, i) => {
    const ovr = Math.round(limitar(nivel + (rng.proximo() - 0.5) * 10, 45, 97))
    const p = slot.papel
    const ruido = () => Math.round((rng.proximo() - 0.5) * 8)
    const agrBase = p === 'D' ? agressividade + 10 : p === 'M' ? agressividade + 4 : p === 'F' ? agressividade - 12 : agressividade - 20
    return {
      id: `${id}-${i + 1}`,
      nome: `${rng.escolher([...INICIAIS])}. ${rng.escolher(NOMES)}`,
      num: p === 'G' ? 1 : i + 1,
      ovr,
      atq: limitar(p === 'F' ? ovr + 3 + ruido() : p === 'M' ? ovr - 8 + ruido() : p === 'D' ? ovr - 22 + ruido() : 30, 15, 97),
      pas: limitar(p === 'M' ? ovr + 2 + ruido() : p === 'F' ? ovr - 6 + ruido() : p === 'D' ? ovr - 10 + ruido() : 40, 15, 97),
      def: limitar(p === 'D' ? ovr + 2 + ruido() : p === 'M' ? ovr - 12 + ruido() : p === 'F' ? ovr - 35 : 30, 12, 97),
      fis: limitar(ovr - 6 + ruido() * 2, 30, 95),
      agr: Math.round(limitar(agrBase + ruido() * 3, 12, 97)),
      gol: p === 'G' ? ovr : 12,
      penal: limitar(ovr - 10 + ruido() * 2, 25, 95),
    }
  })
  return { id, nome, formacao, tatica, jogadores }
}
