// Treino da temporada: o técnico recomenda um foco (bom técnico acerta mais), o jogador escolhe.
import { PESOS_POSICAO, POSICOES } from '../data/times.js'
import { clamp } from './rng.js'

export const NOMES_ATRIBUTO_TREINO = {
  arremesso: 'arremesso', infiltracao: 'infiltração', passe: 'passe', defesa: 'defesa', fisico: 'físico', qi: 'leitura de jogo',
}

const DICA = {
  arremesso: 'Arremesso é o que abre a quadra e vira pontos.',
  infiltracao: 'Atacar o aro com mais variedade gera lances livres e bolas fáceis.',
  passe: 'Passe e visão fazem o time jogar melhor com você na quadra.',
  defesa: 'Defesa sólida segura minutos e vale prêmios.',
  fisico: 'Físico sustenta o corpo ao longo dos anos e dos playoffs.',
  qi: 'Leitura de jogo envelhece bem e melhora todo o resto.',
}

const importanciaTexto = (peso) => (peso >= 0.22 ? 'essencial' : peso >= 0.14 ? 'importante' : 'secundário')

export function opcoesDeTreino(estado) {
  const pesos = PESOS_POSICAO[estado.jogador.posicao]
  return Object.keys(NOMES_ATRIBUTO_TREINO).map((id) => ({
    id,
    atual: estado.atrs[id],
    folga: Math.max(0, estado.potencial - estado.atrs[id]),
    peso: pesos[id] ?? 0.1,
    importancia: importanciaTexto(pesos[id] ?? 0.1),
  }))
}

// { recomendado: id | 'descanso', motivo, confianca: 'alta'|'media'|'baixa', opcoes }
export function recomendarTreino(estado, rng) {
  const opcoes = opcoesDeTreino(estado)
  const pos = POSICOES.find((p) => p.id === estado.jogador.posicao)?.nome.toLowerCase() ?? 'jogador'
  const confianca = estado.tecnico >= 60 ? 'alta' : estado.tecnico >= 35 ? 'media' : 'baixa'

  if (estado.desgaste >= 70 && estado.tecnico >= 40) {
    return { recomendado: 'descanso', confianca, opcoes, motivo: 'Seu corpo está no limite. O técnico quer que você segure a carga e recupere antes de pensar em evoluir.' }
  }

  const ranque = [...opcoes].sort((a, b) => b.peso * b.folga - a.peso * a.folga)
  let escolhido = ranque[0]
  if (confianca === 'media' && rng.chance(0.3)) escolhido = ranque[1]
  if (confianca === 'baixa') escolhido = rng.pick(ranque.slice(0, 3))

  let motivo
  if (confianca === 'baixa') motivo = `O técnico não confia muito em você e deu um palpite rápido: ${NOMES_ATRIBUTO_TREINO[escolhido.id]}.`
  else if (escolhido.folga <= 2) motivo = `Você está perto do seu teto em tudo. Pra manter o nível como ${pos}, o técnico sugere reforçar ${NOMES_ATRIBUTO_TREINO[escolhido.id]}.`
  else motivo = `${DICA[escolhido.id]} Como ${pos}, ${NOMES_ATRIBUTO_TREINO[escolhido.id]} é ${escolhido.importancia} e ainda tem espaço pra crescer.`
  return { recomendado: escolhido.id, confianca, opcoes, motivo }
}

// Aplica a escolha de treino. `rec` é o que o técnico recomendou nessa temporada.
export function aplicarTreino(estado, escolha, rec) {
  const seguiu = escolha === rec.recomendado
  let tecnico = estado.tecnico
  if (rec.confianca !== 'baixa') tecnico = clamp(tecnico + (seguiu ? 2 : estado.tecnico >= 50 ? -1 : 0), 0, 100)

  let novo
  let rotulo
  let efeitos
  if (escolha === 'descanso') {
    novo = { ...estado, desgaste: clamp(estado.desgaste - 10, 0, 100), moral: clamp(estado.moral + 3, 0, 100), focoTreino: null }
    rotulo = 'Descanso e recuperação'
    efeitos = { desgaste: -10, moral: 3 }
  } else {
    const bonus = 1 + (seguiu && estado.tecnico >= 60 ? 1 : 0)
    novo = { ...estado, desgaste: clamp(estado.desgaste + 3, 0, 100), focoTreino: { atributo: escolha, bonus } }
    rotulo = `Treino de ${NOMES_ATRIBUTO_TREINO[escolha]}${seguiu ? ' (como o técnico pediu)' : ''}`
    efeitos = { [escolha]: bonus, desgaste: 3 }
  }
  novo.tecnico = tecnico
  novo.decisoesAno = [...(novo.decisoesAno ?? []), { titulo: 'Treino da temporada', rotulo, resultado: '', efeitos }]
  return novo
}

