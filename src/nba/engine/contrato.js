import { TIMES } from '../data/times.js'
import { clamp, arred } from './rng.js'

// Valores em US$ milhões por ano. Teto salarial simplificado (~US$ 150 mi); contrato máximo ≈ 35% do teto.
export const TETO_SALARIAL = 150
export const SALARIO_MAXIMO = 52
export const SALARIO_MINIMO = 1.3
export const SALARIO_DUAS_VIAS = 0.6

// Quanto o mercado paga por um jogador com esse perfil (por ano).
export function valorMercado(estado) {
  const ovr = estado.media
  let v = SALARIO_MINIMO + Math.max(0, ovr - 58) ** 2 * 0.085
  v *= 1 + (estado.fama - 50) * 0.004
  if (estado.idade >= 36) v *= 0.7
  else if (estado.idade >= 33) v *= 0.85
  else if (estado.idade <= 22) v *= 1.05
  if (estado.lesaoAtual?.grave) v *= 0.85
  return arred(clamp(v, SALARIO_MINIMO, SALARIO_MAXIMO))
}

// Escala do contrato de novato por posição no draft (1ª rodada) — 2ª rodada vira mínimo ou duas vias.
export function salarioNovato(pick) {
  if (pick <= 30) return arred(clamp(13.8 * 0.955 ** (pick - 1), 2.6, 13.8))
  return 1.3
}

export function contratoNovato(pick) {
  if (pick > 58) return null
  if (pick > 40) return { tipo: 'duas_vias', salario: SALARIO_DUAS_VIAS, anos: 2, anosRestantes: 2 }
  if (pick > 30) return { tipo: 'segunda_rodada', salario: 1.3, anos: 3, anosRestantes: 3 }
  return { tipo: 'novato', salario: salarioNovato(pick), anos: 4, anosRestantes: 4 }
}

function elegibilidadeTime(time, estado) {
  // times fortes pagam menos (já têm elenco); times ruins têm espaço no teto
  return clamp(1.12 - (time.forca - 60) * 0.006, 0.82, 1.15)
}

// Propostas ao fim do contrato: renovação com o time atual + ofertas de outros times + veterano mínimo pra contender.
// Ninguém te contrata abaixo desse overall; o corte sobe com a idade (a liga é implacável com veterano fraco).
export function overallMinimoParaContrato(idade) {
  return 56 + Math.max(0, idade - 21) * 1.6
}

export function gerarPropostas(estado, rng) {
  if (estado.media < overallMinimoParaContrato(estado.idade)) return []
  const mercado = valorMercado(estado)
  const propostas = []
  const timeAtual = TIMES.find((t) => t.id === estado.time)

  if (timeAtual) {
    const lealdade = clamp(0.95 + (estado.tecnico - 50) * 0.002 + (estado.vestiario - 50) * 0.001, 0.85, 1.05)
    propostas.push({
      id: 'renovar',
      tipo: 'renovacao',
      time: timeAtual.id,
      salario: arred(clamp(mercado * lealdade, SALARIO_MINIMO, SALARIO_MAXIMO)),
      anos: estado.idade >= 33 ? 2 : rng.int(3, 4),
      rotulo: 'Renovar com o time',
    })
  }

  const outros = rng.embaralhar(TIMES.filter((t) => t.id !== estado.time))
  const quantas = estado.media >= 72 ? 3 : estado.media >= 62 ? 2 : 1
  for (const t of outros.slice(0, quantas)) {
    const sal = clamp(mercado * elegibilidadeTime(t, estado) * rng.uni(0.92, 1.12), SALARIO_MINIMO, SALARIO_MAXIMO)
    propostas.push({
      id: `fa_${t.id}`,
      tipo: 'agencia_livre',
      time: t.id,
      salario: arred(sal),
      anos: estado.idade >= 33 ? rng.int(1, 2) : rng.int(2, 5),
      rotulo: `Agência livre: ${t.nome}`,
    })
  }

  // Veterano que quer anel: mínimo num contender
  if (estado.idade >= 30 && estado.media >= 66) {
    const contenders = TIMES.filter((t) => t.forca >= 84 && t.id !== estado.time)
    if (contenders.length) {
      const t = rng.pick(contenders)
      propostas.push({
        id: `anel_${t.id}`,
        tipo: 'anel',
        time: t.id,
        salario: arred(clamp(mercado * 0.45, SALARIO_MINIMO, 12)),
        anos: 1,
        rotulo: `Caçar o anel: ${t.nome}`,
      })
    }
  }

  return propostas
}

export function aplicarContrato(estado, proposta) {
  return {
    ...estado,
    time: proposta.time,
    contrato: {
      tipo: proposta.tipo === 'renovacao' ? 'renovacao' : proposta.tipo === 'anel' ? 'veterano_min' : 'agente_livre',
      salario: proposta.salario,
      anos: proposta.anos,
      anosRestantes: proposta.anos,
    },
  }
}

export function patrocinioAnual(estado) {
  // US$ mi/ano em patrocínios, só começa a valer com fama
  const base = Math.max(0, estado.fama - 35) ** 1.5 * 0.06
  const imagem = 1 + (estado.imagem - 50) * 0.008
  return arred(clamp(base * imagem + (estado.patrocinioExtra ?? 0), 0, 90))
}

// Patrimônio líquido ganho no ano: salário depois de imposto e empresário + patrocínio - gastos de vida.
export function rendaLiquidaAno(estado) {
  const bruto = estado.contrato?.salario ?? 0
  const liquido = bruto * 0.52
  return arred(liquido + patrocinioAnual(estado) * 0.7 - 0.25 - (estado.gastoExtra ?? 0))
}
