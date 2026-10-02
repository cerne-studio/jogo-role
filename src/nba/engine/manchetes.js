import { TIMES_POR_ID } from '../data/times.js'

function sorteio(arr, seed) {
  return arr[Math.abs(Math.floor(seed)) % arr.length]
}

// Uma frase que resume a temporada. Determinística pela temporada (não muda ao recarregar a tela).
export function gerarManchete(estado, rel) {
  const nome = estado.jogador.sobrenome
  const seed = estado.temporada * 7 + estado.idade
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
