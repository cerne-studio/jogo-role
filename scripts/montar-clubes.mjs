// Monta os times-bot (clubes reais) a partir do CSV do FIFA (15–23): o melhor time titular de cada clube, na melhor
// temporada dele, já escalado numa formação. Uso: node scripts/montar-clubes.mjs <entrada.csv> <saida.json>
// A saída NÃO vai pro repositório (dados da EA): é carregada numa tabela do Supabase sem leitura direta pelo cliente.

import { readFileSync, writeFileSync } from 'node:fs'
import { lerCsv } from './lib-csv.mjs'
import { gerarSiglas, melhorTime } from './lib-clubes.mjs'

const [entrada, saida] = process.argv.slice(2)
if (!entrada || !saida) {
  console.error('uso: node scripts/montar-clubes.mjs <entrada.csv> <saida.json>')
  process.exit(1)
}

// league_id -> [nome da liga, quantos clubes entram]
const LIGAS = {
  13: ['Premier League', 20], 53: ['La Liga', 20], 31: ['Serie A', 20], 19: ['Bundesliga', 20], 16: ['Ligue 1', 20],
  7: ['Brasileirão', 20], 308: ['Liga Portugal', 10], 10: ['Eredivisie', 8], 68: ['Super Lig', 8], 353: ['Liga Argentina', 8],
}

const num = (v) => (v === '' || v == null ? null : Number(v))
const [cab, ...linhas] = lerCsv(readFileSync(entrada, 'utf8'))
const col = Object.fromEntries(cab.map((n, i) => [n, i]))

// (clube, versão) -> jogadores (um por player_id, na atualização mais recente)
const grupos = new Map()
for (const l of linhas) {
  if (l.length < cab.length - 2) continue
  const liga = LIGAS[l[col.league_id]]
  if (!liga) continue
  const chave = `${l[col.club_team_id]}|${l[col.fifa_version]}`
  if (!grupos.has(chave)) grupos.set(chave, { clubeId: l[col.club_team_id], nome: l[col.club_name], liga: liga[0], versao: Number(l[col.fifa_version]), jogadores: new Map() })
  const g = grupos.get(chave)
  const upd = num(l[col.fifa_update]) ?? 0
  const ant = g.jogadores.get(l[col.player_id])
  if (ant && ant.upd >= upd) continue
  const gk = ['goalkeeping_diving', 'goalkeeping_handling', 'goalkeeping_reflexes', 'goalkeeping_positioning'].map((k) => num(l[col[k]]) ?? 0)
  g.jogadores.set(l[col.player_id], {
    upd,
    nome: l[col.short_name], nome_completo: l[col.long_name],
    posicoes: l[col.player_positions].split(',').map((p) => p.trim()).filter(Boolean),
    overall: num(l[col.overall]),
    ritmo: num(l[col.pace]), chute: num(l[col.shooting]), passe: num(l[col.passing]), drible: num(l[col.dribbling]),
    defesa: num(l[col.defending]), fisico: num(l[col.physic]), agressividade: num(l[col.mentality_aggression]),
    penaltis: num(l[col.mentality_penalties]), goleiro: Math.round(gk.reduce((a, b) => a + b, 0) / 4),
  })
}

const melhorPorClube = new Map()
for (const g of grupos.values()) {
  const jogadores = [...g.jogadores.values()].filter((j) => j.overall)
  if (jogadores.length < 14) continue
  const melhor = melhorTime(jogadores)
  if (!melhor) continue
  const atual = melhorPorClube.get(g.clubeId)
  if (!atual || melhor.media > atual.media) {
    melhorPorClube.set(g.clubeId, {
      clube_id: Number(g.clubeId), nome: g.nome, liga: g.liga, versao: g.versao, formacao: melhor.formacao,
      overall: Math.round(melhor.media * 10) / 10,
      picks: melhor.picks.map(({ upd, ...p }) => p),
    })
  }
}

// Top N clubes de cada liga
const porLiga = {}
for (const c of melhorPorClube.values()) (porLiga[c.liga] ??= []).push(c)
const escolhidos = []
for (const [, [nome, qtd]] of Object.entries(LIGAS)) {
  escolhidos.push(...(porLiga[nome] ?? []).sort((a, b) => b.overall - a.overall).slice(0, qtd))
}

gerarSiglas(escolhidos)

escolhidos.sort((a, b) => b.overall - a.overall)
writeFileSync(saida, JSON.stringify(escolhidos))
console.log(`clubes: ${escolhidos.length} | overall ${escolhidos.at(-1).overall}–${escolhidos[0].overall}`)
const cont = {}
for (const c of escolhidos) cont[c.liga] = (cont[c.liga] ?? 0) + 1
console.log(cont)
console.log(escolhidos.slice(0, 8).map((c) => `${c.sigla} ${c.nome} ${c.versao} ${c.overall} ${c.formacao}`).join('\n'))
