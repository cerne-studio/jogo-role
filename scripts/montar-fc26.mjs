// Monta o pool "Atual" e os clubes-bot de hoje a partir do CSV do EA Sports FC 26 (Kaggle: justdhia/ea-sports-fc-26-player-ratings,
// arquivo ea_fc26_players.csv). Uso: node scripts/montar-fc26.mjs <ea_fc26_players.csv> <pool-atual.json> <clubes-atual.json> [notaMinima=73]
// As saídas NÃO vão pro repositório (dados da EA): são carregadas em tabelas do Supabase sem leitura direta pelo cliente.

import { readFileSync, writeFileSync } from 'node:fs'
import { lerCsv } from './lib-csv.mjs'
import { gerarSiglas, melhorTime } from './lib-clubes.mjs'

const [entrada, saidaPool, saidaClubes, notaMin = '73'] = process.argv.slice(2)
if (!entrada || !saidaPool || !saidaClubes) {
  console.error('uso: node scripts/montar-fc26.mjs <ea_fc26_players.csv> <pool.json> <clubes.json> [notaMinima]')
  process.exit(1)
}

// Nome da liga no CSV (vem com patrocinador) -> nome que o jogo mostra; e quantos clubes de cada liga viram bot.
const LIGAS = {
  'Premier League': ['Premier League', 20],
  'LALIGA EA SPORTS': ['La Liga', 20],
  'Serie A Enilive': ['Serie A', 20],
  Bundesliga: ['Bundesliga', 18],
  "Ligue 1 McDonald's": ['Ligue 1', 18],
  Eredivisie: ['Eredivisie', 8],
  'Trendyol Süper Lig': ['Super Lig', 8],
  LPF: ['Liga Argentina', 8],
  'Liga Portugal': ['Liga Portugal', 8],
}

const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
const num = (v) => (v === '' || v == null ? null : Number(v))

const [cab, ...linhas] = lerCsv(readFileSync(entrada, 'utf8'))
const col = Object.fromEntries(cab.map((n, i) => [n, i]))

const todos = []
for (const l of linhas) {
  if (l.length < 40) continue
  const ovr = num(l[col.overallRating])
  if (!ovr) continue
  const primeiro = l[col.firstName]
  const ultimo = l[col.lastName]
  const comum = l[col.commonName]
  const nomeCompleto = `${primeiro} ${ultimo}`.trim()
  const nome = comum || (primeiro ? `${primeiro[0]}. ${ultimo}` : ultimo)
  const gk = ['gkDiving', 'gkHandling', 'gkReflexes', 'gkPositioning'].map((k) => num(l[col[k]]) ?? 0)
  const posicoes = [...new Set([l[col.position], ...(l[col.alternatePositions] ? l[col.alternatePositions].split(',').map((p) => p.trim()) : [])].filter(Boolean))]
  const ligaCsv = l[col.leagueName]
  todos.push({
    id: Number(l[col.id]), versao: 26, nome, nome_completo: nomeCompleto,
    letras: [...new Set(semAcento(`${nome} ${nomeCompleto}`).toUpperCase().split(/[^A-Z]+/).filter(Boolean).map((w) => w[0]))].sort().join(''),
    posicoes, overall: ovr,
    ritmo: num(l[col.pac]), chute: num(l[col.sho]), passe: num(l[col.pas]), drible: num(l[col.dri]), defesa: num(l[col.def]), fisico: num(l[col.phy]),
    agressividade: num(l[col.aggression]), penaltis: num(l[col.penalties]), goleiro: Math.round(gk.reduce((a, b) => a + b, 0) / 4),
    clube: l[col.team], liga: LIGAS[ligaCsv]?.[0] ?? ligaCsv, ligaCsv, pais: l[col.nationality], idade: num(l[col.age]) ?? null,
  })
}

// ---- pool do draft: todo mundo com nota mínima (goleiros contam igual)
const pool = todos.filter((p) => p.overall >= Number(notaMin)).sort((a, b) => b.overall - a.overall).map(({ ligaCsv, ...p }) => p)
writeFileSync(saidaPool, JSON.stringify(pool))
const porPos = {}
for (const p of pool) porPos[p.posicoes[0]] = (porPos[p.posicoes[0]] ?? 0) + 1
console.log(`pool atual: ${pool.length} jogadores | nota ${pool.at(-1).overall}–${pool[0].overall}`)
console.log('posições:', porPos)

// ---- clubes-bot: melhor time titular de cada clube das ligas escolhidas (elenco de hoje)
const porClube = new Map()
for (const p of todos) {
  const liga = LIGAS[p.ligaCsv]
  if (!liga) continue
  const k = `${p.ligaCsv}|${p.clube}`
  if (!porClube.has(k)) porClube.set(k, { nome: p.clube, liga: liga[0], max: liga[1], jogadores: [] })
  porClube.get(k).jogadores.push(p)
}
const clubes = []
for (const c of porClube.values()) {
  if (c.jogadores.length < 14) continue
  const melhor = melhorTime(c.jogadores)
  if (!melhor) continue
  clubes.push({
    clube_id: 26000 + clubes.length, nome: c.nome, liga: c.liga, versao: 26, formacao: melhor.formacao,
    overall: Math.round(melhor.media * 10) / 10, max: c.max,
    picks: melhor.picks.map(({ upd, ligaCsv, ...p }) => p),
  })
}
const escolhidos = []
for (const liga of new Set(clubes.map((c) => c.liga))) {
  escolhidos.push(...clubes.filter((c) => c.liga === liga).sort((a, b) => b.overall - a.overall).slice(0, clubes.find((c) => c.liga === liga).max))
}
escolhidos.forEach((c) => delete c.max)
gerarSiglas(escolhidos)
escolhidos.sort((a, b) => b.overall - a.overall)
writeFileSync(saidaClubes, JSON.stringify(escolhidos))
const cont = {}
for (const c of escolhidos) cont[c.liga] = (cont[c.liga] ?? 0) + 1
console.log(`clubes atuais: ${escolhidos.length} | overall ${escolhidos.at(-1).overall}–${escolhidos[0].overall}`, cont)
console.log(escolhidos.slice(0, 8).map((c) => `${c.sigla} ${c.nome} ${c.overall} ${c.formacao}`).join('\n'))
