import { TIMES_POR_ID, LIGAS_EXTERIOR } from '../data/times.js'
import { clamp, arred, sigmoide } from './rng.js'
import { calcMedia, evoluirAtributos } from './jogador.js'
import { avaliarPremios, sorteiaMvpFinais } from './premios.js'
import { montarTabelas, forcaEfetivaUsuario, driftLiga } from './liga.js'
import { simularPlayoffs, faseAlcancada } from './playoffs.js'
import { checarMarcos } from './marcos.js'
import { riscoLesao, modificadores, aplicarServicos, fotoStatus } from './status.js'
import { rendaLiquidaAno, patrocinioAnual, salarioExterior } from './contrato.js'

export const LESOES = [
  { nome: 'entorse de tornozelo', jogosFora: [3, 12], sequela: 0, grave: false },
  { nome: 'estiramento na coxa', jogosFora: [6, 18], sequela: 0, grave: false },
  { nome: 'concussão', jogosFora: [4, 10], sequela: 0, grave: false },
  { nome: 'fratura na mão', jogosFora: [15, 35], sequela: 0, grave: false },
  { nome: 'lesão no menisco', jogosFora: [20, 45], sequela: 2, grave: false },
  { nome: 'lesão no ombro', jogosFora: [30, 60], sequela: 2, grave: false },
  { nome: 'hérnia de disco', jogosFora: [25, 60], sequela: 3, grave: true },
  { nome: 'fratura por estresse no pé', jogosFora: [40, 82], sequela: 3, grave: true },
  { nome: 'ruptura do ligamento cruzado anterior', jogosFora: [70, 82], sequela: 6, grave: true },
  { nome: 'ruptura do tendão de Aquiles', jogosFora: [78, 82], sequela: 9, grave: true },
]

const POS = {
  pts: { armador: 1.0, ala_armador: 1.08, ala: 1.03, ala_pivo: 0.96, pivo: 0.92 },
  reb: { armador: 0.45, ala_armador: 0.62, ala: 0.85, ala_pivo: 1.25, pivo: 1.5 },
  ast: { armador: 1.25, ala_armador: 0.8, ala: 0.75, ala_pivo: 0.55, pivo: 0.5 },
  blk: { armador: 0.2, ala_armador: 0.3, ala: 0.5, ala_pivo: 1.2, pivo: 2.0 },
}

export function sortearLesao(estado, rng, risco = 0) {
  const prob = riscoLesao(estado) + risco
  if (!rng.chance(prob)) return null
  // lesões graves são mais raras e mais prováveis com desgaste alto
  const pesoGrave = 0.18 + estado.desgaste * 0.004
  const grave = rng.chance(pesoGrave)
  const pool = LESOES.filter((l) => (l.sequela >= 3) === grave || (!grave && l.sequela < 3))
  return rng.pick(pool)
}

// ── papel no time ─────────────────────────────────────────────
export function determinarPapel(estado, forcaTime, pend = {}) {
  let rel = estado.media - (forcaTime - 6)
  rel += (estado.tecnico - 50) * 0.06
  rel += (pend.minutosBonus ?? 0) - (pend.minutosPenalidade ?? 0) * 3
  if (estado.ultimaTemporadaNba === 0) rel -= 3 // calouro
  let papel
  if (rel >= 10) papel = 'estrela'
  else if (rel >= 3) papel = 'titular'
  else if (rel >= -6) papel = 'rotacao'
  else if (rel >= -14) papel = 'banco'
  else papel = 'g_league'
  return { papel, rel }
}

const MPG = { estrela: [32, 37], titular: [27, 33], rotacao: [15, 25], banco: [4, 13], g_league: [0, 0] }

// ── desempenho por jogo ───────────────────────────────────────
export function gerarStats(estado, papel, jogos, rng, escala = 1) {
  const { atrs, media: ovr, jogador } = estado
  const pos = jogador.posicao
  const [a, b] = MPG[papel]
  const mpg = arred(rng.uni(a, b), 1)
  const fator = mpg / 36

  const pts36 = clamp((ovr - 40) * 0.62 * POS.pts[pos] * (1 + (atrs.arremesso - ovr) * 0.004 + (atrs.infiltracao - ovr) * 0.002) + rng.norm(0, 1.2), 2, 46) * escala
  const reb36 = clamp((3.5 + (ovr - 50) * 0.15 + (atrs.fisico - ovr) * 0.03) * POS.reb[pos] + rng.norm(0, 0.5), 0.8, 18) * (escala > 1 ? 1.1 : 1)
  const ast36 = clamp((1.2 + (atrs.passe - 40) * 0.13) * POS.ast[pos] + rng.norm(0, 0.5), 0.3, 13)
  const stl36 = clamp(0.8 + (atrs.defesa - 60) * 0.03 + rng.norm(0, 0.15), 0.3, 2.6)
  const blk36 = clamp((0.3 + (atrs.defesa - 55) * 0.025) * POS.blk[pos] + rng.norm(0, 0.15), 0.1, 4)

  const ppg = arred(pts36 * fator, 1)
  const rpg = arred(reb36 * fator, 1)
  const apg = arred(ast36 * fator, 1)
  return {
    jogos,
    mpg,
    ppg,
    rpg,
    apg,
    spg: arred(stl36 * fator, 1),
    bpg: arred(blk36 * fator, 1),
    fgp: arred(clamp(40 + (atrs.arremesso + atrs.infiltracao - 110) * 0.12 + rng.norm(0, 1), 36, 66), 1),
    tpp: arred(clamp(27 + (atrs.arremesso - 50) * 0.2 + rng.norm(0, 1), 24, 46), 1),
  }
}

// Probabilidade (aprox.) de um jogo com >= x pontos, dado ppg e desvio proporcional.
function caudaPontos(x, ppg) {
  const sd = Math.max(3, ppg * 0.33)
  const z = (x - ppg) / sd
  return 0.5 * erfc(z / Math.SQRT2)
}
function erfc(x) {
  const z = Math.abs(x)
  const t = 1 / (1 + 0.5 * z)
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))))
  return x >= 0 ? r : 2 - r
}

export function marcasIndividuais(stats, rng) {
  const j = stats.jogos
  if (j <= 0) return { jogos30: 0, jogos40: 0, jogos50: 0, maxPontos: 0, tripleDuplas: 0 }
  const conta = (x) => Math.round(j * caudaPontos(x, stats.ppg) + rng.norm(0, 0.4))
  const j30 = Math.max(0, conta(30))
  const j40 = Math.max(0, Math.min(j30, conta(40)))
  const j50 = Math.max(0, Math.min(j40, conta(50)))
  let maxPontos = Math.round(stats.ppg + rng.uni(1.9, 2.8) * stats.ppg * 0.33)
  if (j50 > 0) maxPontos = Math.max(maxPontos, 50 + rng.int(0, 8))
  else if (j40 > 0) maxPontos = Math.max(maxPontos, 40 + rng.int(0, 9))
  const taxaTd = clamp(((stats.rpg - 5) * (stats.apg - 5) * (stats.ppg - 12)) / 1200, 0, 0.5)
  const tripleDuplas = Math.max(0, Math.round(j * taxaTd + rng.norm(0, 0.5)))
  return { jogos30: j30, jogos40: j40, jogos50: j50, maxPontos: Math.min(maxPontos, 85), tripleDuplas }
}

// Linha de estatística do usuário em um jogo de playoffs
function linhaJogoPlayoffs(stats, rng, vitoria) {
  const f = (v, sd) => Math.max(0, Math.round(v * 1.03 + rng.norm(0, sd) + (vitoria ? 0.6 : -0.4)))
  return {
    pontos: f(stats.ppg, Math.max(2.5, stats.ppg * 0.28)),
    rebotes: f(stats.rpg, Math.max(1.5, stats.rpg * 0.3)),
    assistencias: f(stats.apg, Math.max(1.2, stats.apg * 0.3)),
  }
}

// ── temporada na NBA (ou G League com chamadas) ──────────────
export function simularTemporadaNba(estado, rng, pend = {}) {
  const time = TIMES_POR_ID[estado.time]
  const forcaTime = estado.liga[estado.time]
  const novato = estado.ultimaTemporadaNba === 0

  // lesão
  const mod = modificadores(estado)
  const lesao = sortearLesao(estado, rng, pend.risco ?? 0)
  const jogosLesado = lesao ? Math.round(rng.int(lesao.jogosFora[0], lesao.jogosFora[1]) * mod.duracaoLesao) : 0
  const disp = clamp((82 - jogosLesado) / 82, 0, 1)

  let { papel, rel } = determinarPapel(estado, forcaTime, pend)
  const duasVias = estado.contrato?.tipo === 'duas_vias'
  if (duasVias && papel === 'banco' && rel < -9) papel = 'g_league'

  // dias de descanso/jogos perdidos além de lesão (reserva joga menos)
  const jogosBase = papel === 'banco' ? rng.int(48, 76) : papel === 'rotacao' ? rng.int(62, 82) : 82
  const jogosNba = papel === 'g_league' ? clamp(Math.round((rel + 20) * 2.2), 0, 38) : Math.max(0, Math.min(jogosBase, 82 - jogosLesado))
  const emForma = { ...estado, media: estado.media + mod.forma }
  const stats = gerarStats(emForma, papel === 'g_league' ? 'banco' : papel, jogosNba, rng)
  const statsG = papel === 'g_league' || (duasVias && papel === 'banco')
    ? gerarStats({ ...emForma, media: emForma.media + 6 }, 'titular', Math.max(12, 50 - jogosNba), rng, 1.18)
    : null

  // time na tabela
  const fe = forcaEfetivaUsuario(forcaTime, estado.media, papel, disp) + mod.quimica
  const tabelas = montarTabelas(estado.liga, rng, { id: estado.time, forca: fe })
  const minha = tabelas[time.conf].find((x) => x.id === estado.time)
  const playoffs = simularPlayoffs(tabelas, rng, estado.time)
  const fase = faseAlcancada(playoffs, estado.time)
  const campeao = playoffs.campeao === estado.time
  const finalista = playoffs.finalistas.includes(estado.time)

  // jogos de playoffs do usuário (linha jogo a jogo, só nas séries dele)
  let jogosPlayoffs = 0
  let pontosPlayoffs = 0
  const series = playoffs.minhasSeries.map((s) => {
    const jogos = s.jogos.map((j) => {
      const vitoria = j.vencedor === estado.time
      const linha = disp > 0.2 && papel !== 'g_league' ? linhaJogoPlayoffs(stats, rng, vitoria) : null
      if (linha) {
        jogosPlayoffs++
        pontosPlayoffs += linha.pontos
      }
      return { ...j, vitoria, linha }
    })
    const oponente = s.a === estado.time ? s.b : s.a
    return { fase: s.fase, oponente, vitoria: s.vencedor === estado.time, placar: s.placar, jogos }
  })

  // prêmios
  const delta = estado.media - (estado.mediaAnterior ?? estado.media)
  const premios = papel === 'g_league' ? [] : avaliarPremios({ estado, stats, papel, vitorias: minha.vitorias, seed: minha.seed, novato, delta }, rng)
  const mvpFinais = campeao && papel !== 'g_league' && sorteiaMvpFinais(papel, estado.media, forcaTime, rng)
  if (mvpFinais) premios.unshift({ id: 'fmvp', nome: 'MVP das Finais', tier: 1 })

  // marcas individuais
  const marcas = marcasIndividuais(stats, rng)

  // consequências
  const venceu = minha.vitorias >= 50
  let fama = estado.fama
  if (premios.length) fama += premios[0].tier <= 2 ? 7 : 4
  if (stats.ppg >= 25) fama += 3
  if (campeao) fama += 7
  else if (finalista) fama += 3
  if (venceu) fama += 1
  if (papel === 'banco' || papel === 'g_league') fama -= 1
  fama = clamp(fama, 0, 100)

  let moral = estado.moral
  moral += campeao ? 14 : playoffs.classificado ? 3 : -6
  moral += papel === 'estrela' ? 4 : papel === 'banco' ? -6 : papel === 'g_league' ? -8 : 0
  moral = clamp(moral + rng.int(-4, 4), 0, 100)

  let desgaste = clamp(estado.desgaste + rng.int(3, 8) + (papel === 'estrela' ? 5 : 0) + Math.round(jogosPlayoffs / 6) + (pend.foraTemporada ? -20 : 0), 0, 100)
  const atrs = { ...estado.atrs }
  if (lesao) {
    desgaste = clamp(desgaste - 5, 0, 100)
    const queda = Math.floor(lesao.sequela / 3)
    if (queda) for (const k of Object.keys(atrs)) atrs[k] = clamp(atrs[k] - queda, 1, estado.potencial)
  }

  // carreira acumulada
  const c = estado.carreira
  const carreira = {
    ...c,
    jogos: c.jogos + stats.jogos,
    pontos: c.pontos + Math.round(stats.ppg * stats.jogos),
    rebotes: c.rebotes + Math.round(stats.rpg * stats.jogos),
    assistencias: c.assistencias + Math.round(stats.apg * stats.jogos),
    roubos: c.roubos + Math.round(stats.spg * stats.jogos),
    tocos: c.tocos + Math.round(stats.bpg * stats.jogos),
    tripleDuplas: c.tripleDuplas + marcas.tripleDuplas,
    jogos30: c.jogos30 + marcas.jogos30,
    jogos40: c.jogos40 + marcas.jogos40,
    jogos50: c.jogos50 + marcas.jogos50,
    maxPontos: Math.max(c.maxPontos, marcas.maxPontos),
    jogosPlayoffs: c.jogosPlayoffs + jogosPlayoffs,
    pontosPlayoffs: c.pontosPlayoffs + pontosPlayoffs,
  }

  const premiosCont = { ...estado.premios }
  for (const p of premios) premiosCont[p.id] = (premiosCont[p.id] ?? 0) + 1

  const salario = estado.contrato?.salario ?? 0
  const renda = rendaLiquidaAno(estado)
  const patrimonio = arred(estado.dinheiro.patrimonio + renda)

  const novoEstado = {
    ...estado,
    nivel: papel === 'g_league' ? 'gleague' : 'nba',
    atrs,
    fama,
    moral,
    desgaste,
    carreira,
    premios: premiosCont,
    titulos: campeao ? [...estado.titulos, { ano: estado.ano, time: estado.time }] : estado.titulos,
    dinheiro: { patrimonio },
    lesaoAtual: lesao ? { ...lesao, jogosFora: jogosLesado } : null,
    lesoes: lesao ? [...estado.lesoes, { ano: estado.ano, nome: lesao.nome, jogos: jogosLesado }] : estado.lesoes,
    ultimaTemporadaNba: papel === 'g_league' && jogosNba < 10 ? estado.ultimaTemporadaNba : estado.ultimaTemporadaNba + 1,
    media: calcMedia(atrs, estado.jogador.posicao),
  }

  const linha = {
    ano: estado.ano,
    idade: estado.idade,
    temporada: estado.temporada,
    time: estado.time,
    nivel: novoEstado.nivel,
    papel,
    ovr: estado.media,
    stats,
    statsG,
    vitorias: minha.vitorias,
    derrotas: minha.derrotas,
    seed: minha.seed,
    conf: time.conf,
    fase,
    campeao,
    premios: premios.map((p) => p.id),
    salario,
    lesao: lesao ? lesao.nome : null,
    jogosLesado,
  }
  novoEstado.historico = [...estado.historico, linha]

  const { estado: comMarcos, novos } = checarMarcos(novoEstado)

  const relatorio = {
    kind: 'nba',
    papel,
    rel,
    time: estado.time,
    forcaTime,
    forcaEfetiva: arred(fe, 1),
    novato,
    stats,
    statsG,
    marcas,
    vitorias: minha.vitorias,
    derrotas: minha.derrotas,
    seed: minha.seed,
    conf: time.conf,
    tabela: tabelas[time.conf].slice(0, 15),
    playoffs: { ...playoffs, series, fase },
    campeao,
    finalista,
    premios,
    lesao: lesao ? { ...lesao, jogosFora: jogosLesado } : null,
    marcos: novos,
    renda,
    patrocinio: patrocinioAnual(estado),
    salario,
    patrimonio,
    jogosPlayoffs,
    pontosPlayoffs,
  }
  return { estado: aplicarServicos(comMarcos), relatorio }
}

// ── temporada de base (faculdade / clube no exterior) ────────
export function simularTemporadaBase(estado, rng) {
  const pro = estado.nivel === 'pro_exterior'
  const lesao = sortearLesao(estado, rng, 0)
  const jogosLesado = lesao ? Math.min(rng.int(lesao.jogosFora[0], lesao.jogosFora[1]), 30) : 0
  const jogosTotais = pro ? 34 : 34
  const jogos = Math.max(0, jogosTotais - Math.round(jogosLesado * 0.4))
  const papel = estado.media >= 62 ? 'estrela' : estado.media >= 54 ? 'titular' : 'rotacao'
  const stats = gerarStats({ ...estado, media: estado.media + (pro ? 0 : 5) }, papel, jogos, rng, pro ? 1 : 1.12)

  const forcaEquipe = clamp(56 + rng.norm(10, 8), 50, 90)
  const forcaEf = forcaEquipe + (estado.media - 55) * 0.25
  let fase
  if (pro) {
    const p = sigmoide((forcaEf - 74) / 5)
    fase = rng.chance(p * 0.55) ? 'Campeão da liga nacional' : rng.chance(p) ? 'Semifinal da liga' : forcaEf >= 62 ? 'Playoffs da liga' : 'Fora dos playoffs'
  } else {
    const p = sigmoide((forcaEf - 70) / 4.5)
    if (rng.chance(p * 0.12)) fase = 'Campeão Nacional (March Madness)'
    else if (rng.chance(p * 0.30)) fase = 'Final Four'
    else if (rng.chance(p * 0.55)) fase = 'Elite Eight'
    else if (rng.chance(0.45 + p * 0.3)) fase = 'Sweet Sixteen'
    else fase = forcaEf >= 58 ? 'Segunda rodada do March Madness' : 'Fora do March Madness'
  }

  const premios = []
  if (stats.ppg >= 17 && estado.media >= 60 && rng.chance(0.5)) premios.push({ id: 'allamerican', nome: pro ? 'Seleção da liga' : 'All-American', tier: 3 })
  if (!pro && estado.idade === 18 && estado.media >= 62 && rng.chance(0.4)) premios.push({ id: 'calouro', nome: 'Calouro do Ano', tier: 3 })
  if (!pro && stats.ppg >= 21 && estado.media >= 66 && rng.chance(0.35)) premios.push({ id: 'jogador_ano', nome: 'Jogador do Ano da NCAA', tier: 2 })

  let fama = estado.fama + (premios.length ? 5 : 1) + (fase.startsWith('Campeão') ? 6 : fase === 'Final Four' ? 4 : 0) + (stats.ppg >= 20 ? 4 : 0)
  fama = clamp(fama, 0, 100)
  const desgaste = clamp(estado.desgaste + rng.int(2, 6) - (lesao ? 5 : 0), 0, 100)
  const atrs = { ...estado.atrs }
  if (lesao) {
    const queda = Math.floor(lesao.sequela / 3)
    if (queda) for (const k of Object.keys(atrs)) atrs[k] = clamp(atrs[k] - queda, 1, estado.potencial)
  }
  const premiosCont = { ...estado.premios }
  for (const p of premios) premiosCont[p.id] = (premiosCont[p.id] ?? 0) + 1

  const linha = {
    ano: estado.ano, idade: estado.idade, temporada: estado.temporada, time: null, equipe: estado.equipe,
    nivel: estado.nivel, papel, ovr: estado.media, stats, fase, premios: premios.map((p) => p.id), salario: 0,
    lesao: lesao ? lesao.nome : null, jogosLesado,
  }
  const novo = {
    ...estado,
    atrs,
    fama,
    desgaste,
    premios: premiosCont,
    media: calcMedia(atrs, estado.jogador.posicao),
    lesaoAtual: lesao ? { ...lesao, jogosFora: jogosLesado } : null,
    lesoes: lesao ? [...estado.lesoes, { ano: estado.ano, nome: lesao.nome, jogos: jogosLesado }] : estado.lesoes,
    historico: [...estado.historico, linha],
  }
  return {
    estado: novo,
    relatorio: { kind: 'base', papel, stats, fase, premios, lesao: lesao ? { ...lesao, jogosFora: jogosLesado } : null, equipe: estado.equipe, pro },
  }
}

// ── temporada fora da NBA (clube estrangeiro, depois de não rolar ou por escolha) ──
export function sortearClubeExterior(pais, rng, ligaAtual = null) {
  const ligas = LIGAS_EXTERIOR.filter((l) => l.liga !== ligaAtual)
  const doPais = ligas.filter((l) => l.pais === pais)
  const liga = doPais.length && rng.chance(0.5) ? rng.pick(doPais) : rng.pick(ligas)
  return { liga: liga.liga, clube: rng.pick(liga.clubes) }
}

export function simularTemporadaExterior(estado, rng) {
  const mod = modificadores(estado)
  const lesao = sortearLesao(estado, rng, 0)
  const jogosLesado = lesao ? Math.min(Math.round(rng.int(lesao.jogosFora[0], lesao.jogosFora[1]) * mod.duracaoLesao), 30) : 0
  const jogos = Math.max(0, 34 - Math.round(jogosLesado * 0.4))
  const papel = estado.media >= 60 ? 'estrela' : estado.media >= 52 ? 'titular' : 'rotacao'
  const stats = gerarStats({ ...estado, media: estado.media + 4 + mod.forma }, papel, jogos, rng, 1.05)

  // 35% de chance de trocar de clube (e de liga) a cada ano; o contrato anual acompanha o overall
  let equipe = estado.equipe
  let liga = estado.ligaExterior
  let trocou = false
  if (!liga || rng.chance(0.35)) {
    const c = sortearClubeExterior(estado.jogador.pais, rng, liga)
    trocou = !!liga
    equipe = c.clube
    liga = c.liga
  }
  const salario = salarioExterior(estado.media)
  const contrato = { tipo: 'exterior', salario, anos: 1, anosRestantes: 1 }

  const forcaEquipe = clamp(56 + rng.norm(10, 8), 50, 90)
  const forcaEf = forcaEquipe + (estado.media - 55) * 0.25
  const p = sigmoide((forcaEf - 74) / 5)
  const campeao = rng.chance(p * 0.55)
  const fase = campeao ? 'Campeão da liga' : rng.chance(p) ? 'Semifinal da liga' : forcaEf >= 62 ? 'Playoffs da liga' : 'Fora dos playoffs'

  const premios = []
  if (stats.ppg >= 19 && estado.media >= 60 && rng.chance(0.35)) premios.push({ id: 'mvp_liga', nome: 'MVP da liga', tier: 2 })
  else if (stats.ppg >= 14 && rng.chance(0.45)) premios.push({ id: 'selecao_liga', nome: 'Seleção da liga', tier: 3 })

  const fama = clamp(estado.fama + (premios.length ? 3 : 0) + (campeao ? 3 : 0) - 1, 0, 100)
  const moral = clamp(estado.moral + (campeao ? 8 : fase === 'Fora dos playoffs' ? -3 : 1) + rng.int(-3, 3), 0, 100)
  const desgaste = clamp(estado.desgaste + rng.int(2, 6) - (lesao ? 5 : 0), 0, 100)
  const atrs = { ...estado.atrs }
  if (lesao) {
    const queda = Math.floor(lesao.sequela / 3)
    if (queda) for (const k of Object.keys(atrs)) atrs[k] = clamp(atrs[k] - queda, 1, estado.potencial)
  }
  const premiosCont = { ...estado.premios }
  for (const pr of premios) premiosCont[pr.id] = (premiosCont[pr.id] ?? 0) + 1

  const renda = rendaLiquidaAno({ ...estado, contrato, fama })
  const patrimonio = arred(estado.dinheiro.patrimonio + renda)
  const x = estado.carreiraExterior ?? { anos: 0, jogos: 0, pontos: 0, rebotes: 0, assistencias: 0, titulos: 0 }
  const carreiraExterior = {
    anos: x.anos + 1,
    jogos: x.jogos + stats.jogos,
    pontos: x.pontos + Math.round(stats.ppg * stats.jogos),
    rebotes: x.rebotes + Math.round(stats.rpg * stats.jogos),
    assistencias: x.assistencias + Math.round(stats.apg * stats.jogos),
    titulos: x.titulos + (campeao ? 1 : 0),
  }

  const linha = {
    ano: estado.ano, idade: estado.idade, temporada: estado.temporada, time: null, equipe,
    nivel: 'exterior', papel, ovr: estado.media, stats, fase, campeao, premios: premios.map((pr) => pr.id), salario,
    lesao: lesao ? lesao.nome : null, jogosLesado,
  }
  const novo = {
    ...estado,
    equipe,
    ligaExterior: liga,
    contrato,
    atrs,
    fama,
    moral,
    desgaste,
    premios: premiosCont,
    carreiraExterior,
    dinheiro: { patrimonio },
    media: calcMedia(atrs, estado.jogador.posicao),
    lesaoAtual: lesao ? { ...lesao, jogosFora: jogosLesado } : null,
    lesoes: lesao ? [...estado.lesoes, { ano: estado.ano, nome: lesao.nome, jogos: jogosLesado }] : estado.lesoes,
    historico: [...estado.historico, linha],
  }
  return {
    estado: aplicarServicos(novo),
    relatorio: {
      kind: 'base', exterior: true, pro: true, papel, stats, fase, campeao, premios, equipe, liga, trocou, salario, renda, patrimonio,
      lesao: lesao ? { ...lesao, jogosFora: jogosLesado } : null,
    },
  }
}

// ── virada de ano: envelhece, evolui atributos, mexe na liga ──
export function avancarAno(estado, rng, { foco = {}, campeaoId = null } = {}) {
  const base = { ...estado, mediaAnterior: estado.media }
  const focoTotal = { ...foco }
  if (estado.focoAno) focoTotal[estado.focoAno] = (focoTotal[estado.focoAno] ?? 0) + 2
  const atrs = evoluirAtributos(estado, rng, focoTotal)
  const media = calcMedia(atrs, estado.jogador.posicao)
  const contrato = estado.contrato
    ? { ...estado.contrato, anosRestantes: Math.max(0, estado.contrato.anosRestantes - (estado.nivel === 'nba' || estado.nivel === 'gleague' ? 1 : 0)) }
    : null
  const novo = {
    ...base,
    focoAno: null,
    atrs,
    media,
    idade: estado.idade + 1,
    temporada: estado.temporada + 1,
    ano: estado.ano + 1,
    desgaste: clamp(estado.desgaste - 10, 0, 100),
    liga: driftLiga(estado.liga, rng, campeaoId),
    contrato,
    lesaoAtual: null,
    mediaAnterior: estado.media,
  }
  novo.statusInicio = fotoStatus(novo)
  return novo
}
