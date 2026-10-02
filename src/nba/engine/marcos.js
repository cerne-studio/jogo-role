// Marcos e recordes de carreira. Os números de referência são totais históricos públicos (aproximados).
// Só estatística: nada de fala ou acusação atribuída a ninguém.

export const RANKING_PONTOS = [
  { nome: 'LeBron James', valor: 42000 },
  { nome: 'Kareem Abdul-Jabbar', valor: 38387 },
  { nome: 'Karl Malone', valor: 36928 },
  { nome: 'Kobe Bryant', valor: 33643 },
  { nome: 'Michael Jordan', valor: 32292 },
  { nome: 'Dirk Nowitzki', valor: 31560 },
  { nome: 'Wilt Chamberlain', valor: 31419 },
  { nome: 'Shaquille O\'Neal', valor: 28596 },
]

export const RANKING_ASSISTENCIAS = [
  { nome: 'John Stockton', valor: 15806 },
  { nome: 'Jason Kidd', valor: 12091 },
  { nome: 'Magic Johnson', valor: 10141 },
]

export const RANKING_REBOTES = [
  { nome: 'Wilt Chamberlain', valor: 23924 },
  { nome: 'Bill Russell', valor: 21620 },
  { nome: 'Kareem Abdul-Jabbar', valor: 17440 },
  { nome: 'Tim Duncan', valor: 15091 },
]

const fmt = (n) => n.toLocaleString('pt-BR')

// Cada marco: [id, condição(estado), texto]
const MARCOS = [
  ['pts_1k', (e) => e.carreira.pontos >= 1000, 'Primeiros 1.000 pontos na NBA'],
  ['pts_5k', (e) => e.carreira.pontos >= 5000, '5.000 pontos na carreira'],
  ['pts_10k', (e) => e.carreira.pontos >= 10000, 'Clube dos 10.000 pontos'],
  ['pts_15k', (e) => e.carreira.pontos >= 15000, '15.000 pontos na carreira'],
  ['pts_20k', (e) => e.carreira.pontos >= 20000, 'Clube dos 20.000 pontos'],
  ['pts_25k', (e) => e.carreira.pontos >= 25000, '25.000 pontos na carreira'],
  ['pts_30k', (e) => e.carreira.pontos >= 30000, 'Clube dos 30.000 pontos, território de lenda'],
  ['ast_5k', (e) => e.carreira.assistencias >= 5000, '5.000 assistências'],
  ['ast_10k', (e) => e.carreira.assistencias >= 10000, 'Clube das 10.000 assistências'],
  ['reb_5k', (e) => e.carreira.rebotes >= 5000, '5.000 rebotes'],
  ['reb_10k', (e) => e.carreira.rebotes >= 10000, 'Clube dos 10.000 rebotes'],
  ['reb_15k', (e) => e.carreira.rebotes >= 15000, '15.000 rebotes na carreira'],
  ['jogos_500', (e) => e.carreira.jogos >= 500, '500 jogos na NBA'],
  ['jogos_1000', (e) => e.carreira.jogos >= 1000, '1.000 jogos na NBA'],
  ['jogos_1300', (e) => e.carreira.jogos >= 1300, '1.300 jogos: longevidade rara'],
  ['td_10', (e) => e.carreira.tripleDuplas >= 10, '10 triplos-duplos'],
  ['td_50', (e) => e.carreira.tripleDuplas >= 50, '50 triplos-duplos'],
  ['td_100', (e) => e.carreira.tripleDuplas >= 100, '100 triplos-duplos'],
  ['j50_1', (e) => e.carreira.jogos50 >= 1, 'Primeiro jogo de 50 pontos'],
  ['j50_10', (e) => e.carreira.jogos50 >= 10, '10 jogos de 50 pontos ou mais'],
  ['ring_1', (e) => e.titulos.length >= 1, 'Primeiro anel de campeão'],
  ['ring_3', (e) => e.titulos.length >= 3, 'Tricampeão da NBA'],
  ['ring_5', (e) => e.titulos.length >= 5, 'Pentacampeão da NBA'],
  ['ring_6', (e) => e.titulos.length >= 6, 'Seis anéis: igualou o recorde dos seis títulos de Michael Jordan'],
  ['ring_11', (e) => e.titulos.length >= 11, 'Onze anéis: igualou o recorde histórico de Bill Russell'],
  ['mvp_1', (e) => (e.premios.mvp ?? 0) >= 1, 'Primeiro MVP da temporada'],
  ['mvp_3', (e) => (e.premios.mvp ?? 0) >= 3, 'Três vezes MVP'],
  ['mvp_6', (e) => (e.premios.mvp ?? 0) >= 6, 'Seis MVPs: igualou o recorde de Kareem Abdul-Jabbar'],
  ['as_1', (e) => (e.premios.allstar ?? 0) >= 1, 'Primeira seleção para o All-Star Game'],
  ['as_10', (e) => (e.premios.allstar ?? 0) >= 10, 'Dez All-Stars'],
]

function rankingTexto(lista, valor, rotulo) {
  const ultrapassados = lista.filter((x) => valor > x.valor)
  return ultrapassados.map((x) => `Ultrapassou ${x.nome} em ${rotulo} da carreira (${fmt(x.valor)})`)
}

// Retorna { estado, novos: [texto] } com os marcos recém-conquistados.
export function checarMarcos(estado) {
  const ja = new Set(estado.marcos)
  const novos = []
  for (const [id, cond, texto] of MARCOS) {
    if (!ja.has(id) && cond(estado)) {
      ja.add(id)
      novos.push(texto)
    }
  }
  const rank = [
    ['rkp', RANKING_PONTOS, estado.carreira.pontos, 'pontos'],
    ['rka', RANKING_ASSISTENCIAS, estado.carreira.assistencias, 'assistências'],
    ['rkr', RANKING_REBOTES, estado.carreira.rebotes, 'rebotes'],
  ]
  for (const [pref, lista, valor, rot] of rank) {
    for (const x of lista) {
      const id = `${pref}_${x.nome}`
      if (valor > x.valor && !ja.has(id)) {
        ja.add(id)
        novos.push(rankingTexto([x], valor, rot)[0])
      }
    }
  }
  return { estado: { ...estado, marcos: [...ja] }, novos }
}

// Comparações pro resumo final.
export function posicaoHistorica(valor, lista) {
  const acima = lista.filter((x) => x.valor > valor)
  return { acima: acima.length, proximo: acima[acima.length - 1] ?? null }
}

// Recordes absolutos da liga (para comparar jogos e temporadas)
export const RECORDES_LIGA = {
  pontosJogo: { valor: 100, quem: 'Wilt Chamberlain (1962)' },
  pontosPorJogoTemporada: { valor: 50.4, quem: 'Wilt Chamberlain (1961-62)' },
  titulos: { valor: 11, quem: 'Bill Russell' },
  mvps: { valor: 6, quem: 'Kareem Abdul-Jabbar' },
}
