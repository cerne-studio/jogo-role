import { TIMES_POR_ID } from '../data/times.js'
import { PESOS_EFEITO as W } from './pesos.js'

function sorteio(arr, seed) {
  return arr[Math.abs(Math.floor(seed)) % arr.length]
}

// Uma frase que resume a temporada. Determinística pela temporada (não muda ao recarregar a tela).
export function gerarManchete(estado, rel) {
  const nome = estado.jogador.sobrenome
  const seed = estado.temporada * 7 + estado.idade
  if (rel.exterior) {
    if (rel.campeao) return `${nome} é campeão da ${rel.liga} com o ${rel.equipe}.`
    if (rel.premios.length) return `${nome} é ${rel.premios[0].nome.toLowerCase()} na ${rel.liga}.`
    if (rel.trocou) return `${nome} assina com o ${rel.equipe} e segue a carreira na ${rel.liga}.`
    return sorteio([
      `${nome} fecha mais uma temporada na ${rel.liga}: ${rel.stats.ppg} pontos por jogo.`,
      `${nome} é peça importante do ${rel.equipe} e segue em quadra.`,
      `${nome} mantém a rotina fora da NBA e a torcida do ${rel.equipe} agradece.`,
    ], seed)
  }
  if (rel.kind === 'base') {
    if (rel.fase?.startsWith('Campeão')) return `${nome} lidera ${rel.equipe} ao título e vira o rosto da temporada.`
    if (rel.premios.length) return `${nome} é eleito ${rel.premios[0].nome} e já aparece nos mock drafts.`
    if (rel.lesao) return `${nome} perde jogos com ${rel.lesao.nome}, mas segue no radar dos olheiros.`
    return sorteio([
      `${nome} cresce ano a ano e ganha espaço no time.`,
      `Olheiros da NBA têm ${nome} na lista de acompanhamento.`,
      `${nome} soma ${rel.stats.ppg} pontos por jogo e atrai atenção.`,
    ], seed)
  }
  const time = TIMES_POR_ID[estado.time]?.nome ?? 'o time'
  const ids = rel.premios.map((p) => p.id)
  if (rel.campeao && ids.includes('fmvp')) return `${nome} é o MVP das Finais e leva o ${time} ao título da NBA!`
  if (rel.campeao) return `${time} é campeão da NBA, com ${nome} em quadra!`
  if (ids.includes('mvp')) return `${nome} é eleito MVP da temporada com ${rel.stats.ppg} pontos por jogo.`
  if (ids.includes('dpoy')) return `${nome} é o Defensor do Ano e fecha o garrafão do ${time}.`
  if (ids.includes('roy')) return `${nome} é o Novato do Ano e promete muito pro ${time}.`
  if (ids.includes('ptsleader')) return `${nome} é o cestinha da NBA: ${rel.stats.ppg} pontos por jogo.`
  if (rel.finalista) return `${time} chega às Finais da NBA. ${nome} fica a um passo do anel.`
  if (rel.lesao?.grave) return `Pesadelo no ${time}: ${nome} sofre ${rel.lesao.nome} e perde a temporada.`
  if (ids.includes('allstar')) return `${nome} é convocado pro All-Star Game e segue em alta.`
  if (rel.papel === 'g_league') return `${nome} corre por fora na G League atrás de uma vaga no elenco.`
  if (rel.papel === 'banco' && rel.stats.ppg < 5) return `${nome} dá minutos de energia saindo do banco no ${time}.`
  if (!rel.playoffs.classificado && rel.vitorias < 30) return `Temporada de reconstrução no ${time}. ${nome} tenta se destacar no meio do caos.`
  if (rel.playoffs.classificado && rel.vitorias >= 55) return `${time} faz campanha de ${rel.vitorias} vitórias e ${nome} é peça importante.`
  return sorteio([
    `${nome} fecha a temporada com ${rel.stats.ppg} pontos, ${rel.stats.rpg} rebotes e ${rel.stats.apg} assistências.`,
    `${nome} segue evoluindo no ${time}.`,
    `${time} termina com ${rel.vitorias} vitórias e ${nome} ganha confiança.`,
  ], seed)
}

const ATRIBUTOS = { arremesso: 'o arremesso', infiltracao: 'as infiltrações', passe: 'o passe', defesa: 'a defesa', fisico: 'o físico', qi: 'a leitura de jogo' }

// Manchete baseada na decisão que mais pesou no ano. null se não houve decisão relevante.
export function mancheteDaEscolha(estado) {
  const nome = estado.jogador.sobrenome
  const decisoes = estado.decisoesAno ?? []
  let melhor = null
  for (const d of decisoes) {
    for (const [k, v] of Object.entries(d.efeitos)) {
      if (typeof v !== 'number' || !W[k]) continue
      const peso = Math.abs(W[k] * v)
      if (peso >= 6 && (!melhor || peso > melhor.peso)) melhor = { d, k, v, sinal: W[k] * v > 0 ? 1 : -1, peso }
    }
  }
  if (!melhor) return null
  const t = `"${melhor.d.titulo}"`
  const { k, sinal } = melhor
  const bom = sinal > 0
  if (k === 'fama') return bom ? `${nome} vira assunto nas redes depois de ${t}.` : `${nome} some do radar depois de ${t}.`
  if (k === 'imagem') return bom ? `A atitude de ${nome} em ${t} melhora a imagem do jogador.` : `Polêmica: ${nome} arranha a própria imagem em ${t}.`
  if (k === 'vestiario') return bom ? `${nome} conquista o vestiário depois de ${t}.` : `Clima estranho no elenco depois de ${t}.`
  if (k === 'tecnico') return bom ? `O técnico aprova a postura de ${nome} em ${t}.` : `O técnico fecha a cara pra ${nome} depois de ${t}.`
  if (k === 'moral') return bom ? `${nome} chega mais leve pros jogos depois de ${t}.` : `${nome} carrega o peso de ${t} pra dentro da quadra.`
  if (k === 'desgaste') return bom ? `${nome} se cuida e chega inteiro depois de ${t}.` : `O corpo de ${nome} cobra o preço de ${t}.`
  if (k === 'dinheiro' || k === 'patrocinio') return bom ? `${nome} faz bons negócios: ${t} rende dinheiro novo.` : `${t} pesa no bolso de ${nome}.`
  if (ATRIBUTOS[k]) return bom ? `${nome} sai de ${t} melhorando ${ATRIBUTOS[k]}.` : `${t} deixa ${nome} pior em ${ATRIBUTOS[k]}.`
  if (k === 'risco') return `${nome} corre risco depois de ${t}.`
  return `${nome} se vira com as consequências de ${t}.`
}
