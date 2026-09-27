/**
 * Engine de simulação de carreira de basquete.
 * Puro JavaScript — sem side-effects, fácil de testar.
 */

import {
  PESOS_POSICAO,
  PRODUCAO_POSICAO,
  LIGAS,
  LESOES,
  EVENTOS,
  MANCHETES,
} from '../../data/carreiraBank.js'

// ─── utilidades ──────────────────────────────────────────────
export function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
export function clamp(v, min = 0, max = 99) {
  return Math.max(min, Math.min(max, v))
}
export function lerp(a, b, t) {
  return a + (b - a) * t
}

// ─── média geral ─────────────────────────────────────────────
export function calcMedia(atrs, posicao) {
  const pesos = PESOS_POSICAO[posicao]
  return Math.round(
    Object.keys(pesos).reduce((acc, k) => acc + atrs[k] * pesos[k], 0)
  )
}

// ─── atributos iniciais ──────────────────────────────────────
export function gerarAtributosIniciais(posicao) {
  const base = {
    arremesso: rand(46, 62),
    infiltracao: rand(46, 62),
    passe: rand(44, 60),
    defesa: rand(44, 60),
    fisico: rand(46, 62),
    qi: rand(48, 64),
  }
  // bônus de posição pra começar mais equilibrado
  if (posicao === 'armador') { base.passe += 6; base.qi += 4 }
  if (posicao === 'ala_armador') { base.arremesso += 6; base.infiltracao += 3 }
  if (posicao === 'ala') { base.defesa += 4; base.infiltracao += 4 }
  if (posicao === 'ala_pivo') { base.fisico += 6; base.defesa += 4 }
  if (posicao === 'pivo') { base.fisico += 8; base.infiltracao += 4 }
  return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, clamp(v, 40, 75)]))
}

// ─── estado inicial do jogador ───────────────────────────────
export function gerarEstadoInicial({ sobrenome, numero, posicao, pais, liga }) {
  const atrs = gerarAtributosIniciais(posicao)
  const media = calcMedia(atrs, posicao)
  const ligaObj = LIGAS[liga]
  const time = pick(
    ligaObj.times.filter((t) => t.forca < media + 18 && t.forca >= media - 22)
  ) ?? ligaObj.times[ligaObj.times.length - 1]

  return {
    // identidade
    sobrenome,
    numero,
    posicao,
    pais,
    liga,
    time: time.nome,
    timeForca: time.forca,
    ligaObj,
    // atributos
    atrs,
    potencial: clamp(media + rand(14, 28), 60, 99),
    // carreira
    temporada: 1,
    idade: 18,
    media,
    fama: 10,
    moral: 55,
    tecnico: 55,   // relacionamento com a comissão técnica, 0-100
    desgaste: 0,   // 0-100; acima de 75 aumenta risco de lesão
    // estatísticas acumuladas
    estatisticas: [],
    titulos: [],
    premiosIndividuais: [],
    selecao: { partidas: 0, pontos: 0, torneios: [] },
    transferencias: [],
    lesaoHistorico: [],
    valoresMaximos: { media: media, salario: 0 },
    // flags
    aposentado: false,
    lesaoAtual: null,
    jogosLesado: 0,
  }
}

// ─── progressão de atributos ─────────────────────────────────
export function evoluirAtributos(estado, efeitos = {}) {
  const { temporada, potencial, atrs, posicao, desgaste } = estado
  const idade = estado.idade

  // curva de desenvolvimento: sobe até ~27, platô até ~32, cai depois
  let ganhoBase
  if (idade <= 23) ganhoBase = rand(4, 8)
  else if (idade <= 27) ganhoBase = rand(2, 5)
  else if (idade <= 31) ganhoBase = rand(-1, 2)
  else if (idade <= 34) ganhoBase = rand(-3, 0)
  else ganhoBase = rand(-5, -2)

  // penalidade de desgaste
  const penDesgaste = desgaste > 60 ? -rand(1, 3) : 0

  const novosAtrs = { ...atrs }
  for (const k of Object.keys(novosAtrs)) {
    const delta = ganhoBase + penDesgaste + (efeitos[k] ?? 0)
    novosAtrs[k] = clamp(novosAtrs[k] + delta, 1, potencial)
  }

  return novosAtrs
}

// ─── simulação de temporada ───────────────────────────────────
export function simularTemporada(estado, liga) {
  const { posicao, atrs, timeForca } = estado
  const prod = PRODUCAO_POSICAO[posicao]
  const media = calcMedia(atrs, posicao)

  // desempenho relativo ao time (quanto melhor que o plantel, mais destaque)
  const desempenho = clamp(media + (media - timeForca) * 0.18 + rand(-5, 5), 40, 99)

  const jogosEfetivos = Math.max(0, liga.jogos)

  if (jogosEfetivos === 0) {
    return { jogos: 0, pontosPorJogo: 0, rebotesPorJogo: 0, assistenciasPorJogo: 0, percentualArremesso: 0, desempenho }
  }

  const minutesMult = clamp((media / 80) * 1.1 + rand(-0.1, 0.1), 0.5, 1.4)

  // stats por jogo (base + ajuste pelo desempenho)
  const ptsPorJogo = +(
    (12 + (desempenho - 60) * 0.35) * prod.pontos * minutesMult
  ).toFixed(1)
  const rebPorJogo = +(
    (5 + (desempenho - 60) * 0.12) * prod.rebotes * minutesMult
  ).toFixed(1)
  const astPorJogo = +(
    (3 + (desempenho - 60) * 0.1) * prod.assistencias * minutesMult
  ).toFixed(1)
  const pct = clamp(prod.arremessoBase + (desempenho - 60) * 0.2 + rand(-4, 4), 30, 68)

  return {
    jogos: jogosEfetivos,
    pontosPorJogo: Math.max(0, ptsPorJogo),
    rebotesPorJogo: Math.max(0, rebPorJogo),
    assistenciasPorJogo: Math.max(0, astPorJogo),
    percentualArremesso: pct,
    desempenho,
  }
}

// ─── selecionar eventos pra temporada ────────────────────────
export function selecionarEventos(estado, qtd = 2) {
  const { idade, media, fama, desgaste, temporada } = estado
  const disponiveis = EVENTOS.filter((ev) => {
    const c = ev.cond ?? {}
    if (c.idadeMin && idade < c.idadeMin) return false
    if (c.idadeMax && idade > c.idadeMax) return false
    if (c.mediaMin && media < c.mediaMin) return false
    if (c.mediaMax && media > c.mediaMax) return false
    if (c.famaMin && fama < c.famaMin) return false
    if (c.temporadaMin && temporada < c.temporadaMin) return false
    if (c.desgasteMin && desgaste < c.desgasteMin) return false
    return true
  })

  // embaralha e tira qtd únicos
  const embaralhado = [...disponiveis].sort(() => Math.random() - 0.5)
  return embaralhado.slice(0, qtd)
}

// ─── aplicar efeitos de escolha ───────────────────────────────
export function aplicarEfeitos(estado, efeitos) {
  let s = { ...estado, atrs: { ...estado.atrs } }
  for (const [k, v] of Object.entries(efeitos)) {
    if (k in s.atrs) s.atrs[k] = clamp(s.atrs[k] + v, 1, s.potencial)
    else if (k === 'moral') s.moral = clamp(s.moral + v, 0, 100)
    else if (k === 'fama') s.fama = clamp(s.fama + v, 0, 100)
    else if (k === 'tecnico') s.tecnico = clamp(s.tecnico + v, 0, 100)
    else if (k === 'desgaste') s.desgaste = clamp(s.desgaste + v, 0, 100)
    else if (k === 'potencial') s.potencial = clamp(s.potencial + v, 60, 99)
    // flags especiais
    // risco, foraTemporada, chinaBoost, selecaoBoost, minutosPenalidade
    // tratados no componente principal
  }
  return s
}

// ─── transferência ────────────────────────────────────────────
export function gerarOfertaTransferencia(estado) {
  const { media, fama, liga: ligaAtual, atrs, posicao } = estado
  const ligas = Object.values(LIGAS).filter((l) => l.id !== ligaAtual)

  const candidatas = ligas.filter(
    (l) => l.prestigio >= calcMedia(atrs, posicao) - 20
  )
  if (!candidatas.length) return null

  const liga = pick(candidatas)
  const timeCandidato = pick(
    liga.times.filter((t) => Math.abs(t.forca - media) < 20)
  ) ?? pick(liga.times)

  return {
    time: timeCandidato.nome,
    timeForca: timeCandidato.forca,
    liga: liga.id,
    ligaObj: liga,
    salario: +(liga.salarioBase * (0.8 + fama * 0.008 + media * 0.006)).toFixed(2),
    prestígio: liga.prestigio,
  }
}

// ─── lesão ────────────────────────────────────────────────────
export function sorteiarLesao(desgaste, risco = 0) {
  const prob = 0.06 + desgaste * 0.004 + risco
  if (Math.random() > prob) return null
  return pick(LESOES)
}

// ─── prêmio individual ────────────────────────────────────────
export function avaliarPremios(estado, stats) {
  const { media, fama, tecnico } = estado
  const premios = []

  if (stats.desempenho >= 88 && fama >= 55 && Math.random() < 0.35) premios.push('MVP da Liga')
  if (stats.desempenho >= 82 && Math.random() < 0.45) premios.push('Quinteto Ideal')
  if (stats.pontosPorJogo >= 24 && Math.random() < 0.4) premios.push('Artilheiro da Liga')
  if (stats.rebotesPorJogo >= 10 && Math.random() < 0.4) premios.push('Reboteiro da Liga')
  if (stats.assistenciasPorJogo >= 9 && Math.random() < 0.4) premios.push('Líder em Assistências')
  if (stats.desempenho >= 90 && fama >= 70 && Math.random() < 0.2) premios.push('MVP das Finais')

  return premios
}

// ─── conquista da liga ────────────────────────────────────────
export function simularCampeonato(estado, stats) {
  const { timeForca, atrs, posicao } = estado
  const media = calcMedia(atrs, posicao)
  const forcaEfetiva = timeForca * 0.65 + media * 0.35
  // sorteio ponderado pela força relativa
  const chance = clamp((forcaEfetiva - 60) * 0.02 + 0.05, 0.02, 0.45)
  if (Math.random() > chance) return null

  return estado.ligaObj?.copa ?? estado.ligaObj?.nome ?? 'Campeonato Nacional'
}

// ─── manchete ─────────────────────────────────────────────────
export function gerarManchete(estado, stats) {
  const tiers =
    stats.desempenho >= 85
      ? 'excelente'
      : stats.desempenho >= 72
        ? 'boa'
        : stats.desempenho >= 60
          ? 'media'
          : 'ruim'
  const template = pick(MANCHETES[tiers])
  return template
    .replace('{nome}', estado.sobrenome)
    .replace('{time}', estado.time)
}

// ─── contrato / salário ───────────────────────────────────────
export function calcularSalario(estado) {
  const { ligaObj, atrs, posicao, fama } = estado
  const media = calcMedia(atrs, posicao)
  return +(ligaObj.salarioBase * (0.7 + fama * 0.006 + media * 0.007)).toFixed(2)
}
