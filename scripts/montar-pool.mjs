// Monta o pool do draft a partir do CSV do FIFA (15–23): uma linha por jogador, na melhor versão dele ("pico").
// Uso: node scripts/montar-pool.mjs <entrada.csv> <saida.json> [tamanho]
// A saída NÃO vai pro repositório: os dados são da EA, ficam só numa tabela do Supabase sem leitura pelo cliente.

import { readFileSync, writeFileSync } from 'node:fs'

const [entrada, saida, tam = '1500'] = process.argv.slice(2)
if (!entrada || !saida) {
  console.error('uso: node scripts/montar-pool.mjs <entrada.csv> <saida.json> [tamanho]')
  process.exit(1)
}

function lerCsv(texto) {
  const linhas = []
  let campo = ''
  let linha = []
  let aspas = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++ }
      else if (c === '"') aspas = false
      else campo += c
    } else if (c === '"') aspas = true
    else if (c === ',') { linha.push(campo); campo = '' }
    else if (c === '\n') { linha.push(campo.replace(/\r$/, '')); linhas.push(linha); linha = []; campo = '' }
    else campo += c
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha) }
  return linhas
}

const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
const num = (v) => (v === '' || v == null ? null : Number(v))

const [cab, ...linhas] = lerCsv(readFileSync(entrada, 'utf8'))
const col = Object.fromEntries(cab.map((n, i) => [n, i]))
const melhores = new Map()

for (const l of linhas) {
  if (l.length < cab.length - 2) continue
  const ovr = num(l[col.overall])
  const id = l[col.player_id]
  const versao = num(l[col.fifa_version])
  const atual = melhores.get(id)
  if (!ovr || !versao) continue
  if (!atual || ovr > atual.overall || (ovr === atual.overall && versao > atual.versao)) {
    const gk = ['goalkeeping_diving', 'goalkeeping_handling', 'goalkeeping_reflexes', 'goalkeeping_positioning'].map((k) => num(l[col[k]]) ?? 0)
    const nomeCurto = l[col.short_name]
    const nomeLongo = l[col.long_name]
    const letras = [...new Set(
      semAcento(`${nomeCurto} ${nomeLongo}`).toUpperCase().split(/[^A-Z]+/).filter(Boolean).map((p) => p[0]),
    )].sort().join('')
    melhores.set(id, {
      id: Number(id), versao, nome: nomeCurto, nome_completo: nomeLongo, letras,
      posicoes: l[col.player_positions].split(',').map((p) => p.trim()).filter(Boolean),
      overall: ovr, ritmo: num(l[col.pace]), chute: num(l[col.shooting]), passe: num(l[col.passing]), drible: num(l[col.dribbling]),
      defesa: num(l[col.defending]), fisico: num(l[col.physic]), agressividade: num(l[col.mentality_aggression]),
      penaltis: num(l[col.mentality_penalties]), goleiro: Math.round(gk.reduce((a, b) => a + b, 0) / 4),
      clube: l[col.club_name], liga: l[col.league_id] === '7' ? 'Brasileirão' : l[col.league_name], pais: l[col.nationality_name], idade: num(l[col.age]),
    })
  }
}

const todos = [...melhores.values()]
const gks = todos.filter((p) => p.posicoes[0] === 'GK').sort((a, b) => b.overall - a.overall)
const linha = todos.filter((p) => p.posicoes[0] !== 'GK').sort((a, b) => b.overall - a.overall)
const nGk = Math.round(Number(tam) * 0.1)
const pool = [...gks.slice(0, nGk), ...linha.slice(0, Number(tam) - nGk)]
pool.sort((a, b) => b.overall - a.overall)

writeFileSync(saida, JSON.stringify(pool))
const porPos = {}
for (const p of pool) porPos[p.posicoes[0]] = (porPos[p.posicoes[0]] ?? 0) + 1
const porLiga = {}
for (const p of pool) porLiga[p.liga] = (porLiga[p.liga] ?? 0) + 1
console.log(`pool: ${pool.length} jogadores | overall ${pool.at(-1).overall}–${pool[0].overall}`)
console.log('posições:', porPos)
console.log('ligas (top):', Object.entries(porLiga).sort((a, b) => b[1] - a[1]).slice(0, 12))
