// Lê db/data/hint-cartas.txt, valida e gera db/028_seed_hint.sql.
// Uso: node scripts/gerar-seed-hint.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const linhas = readFileSync(join(raiz, 'db/data/hint-cartas.txt'), 'utf8').split(/\r?\n/)

const MODS = { falar: 'f', desenhar: 'd', mimica: 'm', cantarolar: 'c' }
const DIFS = new Set(['facil', 'media', 'dificil'])
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

const contagem = { falar: 0, desenhar: 0, mimica: 0, cantarolar: 0 }
const cartas = []
const erros = []
const temasVistos = new Set()

linhas.forEach((linha, i) => {
  const l = linha.trim()
  if (!l || l.startsWith('#')) return
  const partes = l.split('|')
  if (partes.length !== 5) return erros.push(`linha ${i + 1}: esperava 5 campos, achei ${partes.length}`)
  const [mod, tema, dif, resp, proib] = partes.map((p) => p.trim())
  if (!MODS[mod]) return erros.push(`linha ${i + 1}: modalidade inválida "${mod}"`)
  if (!DIFS.has(dif)) return erros.push(`linha ${i + 1}: dificuldade inválida "${dif}"`)
  const respostas = resp.split(';').map((r) => r.trim())
  if (respostas.length !== 5 || respostas.some((r) => !r)) return erros.push(`linha ${i + 1}: precisa de exatamente 5 respostas`)
  const itens = respostas.map((r) => {
    const [t, ...a] = r.split('/').map((x) => x.trim())
    return { t, a }
  })
  const normas = new Set(itens.map((x) => norm(x.t)))
  if (normas.size !== 5) erros.push(`linha ${i + 1}: respostas repetidas em "${tema}"`)
  for (const it of itens) for (const v of [it.t, ...it.a]) if (norm(proib) === norm(v)) erros.push(`linha ${i + 1}: a proibida "${proib}" é igual a uma resposta em "${tema}"`)
  const chaveTema = `${mod}:${norm(tema)}`
  if (temasVistos.has(chaveTema)) erros.push(`linha ${i + 1}: tema repetido "${tema}"`)
  temasVistos.add(chaveTema)
  contagem[mod] += 1
  cartas.push({
    id: `${MODS[mod]}${String(contagem[mod]).padStart(3, '0')}`,
    tema, mod, dif, itens, proibida: { t: proib, a: [] },
  })
})

if (erros.length) {
  console.error(erros.join('\n'))
  process.exit(1)
}

const q = (s) => `'${s.replace(/'/g, "''")}'`
const valores = cartas.map((c) => `  (${q(c.id)}, ${q(c.tema)}, ${q(c.mod)}, ${q(JSON.stringify(c.itens))}::jsonb, ${q(JSON.stringify(c.proibida))}::jsonb, ${q(c.dif)})`)

const sql = `-- HINT: banco de cartas original (${cartas.length} cartas). Gerado por scripts/gerar-seed-hint.mjs a partir de db/data/hint-cartas.txt.
-- Rode depois de db/027_hint.sql. Pode rodar de novo: atualiza as cartas existentes.

insert into hint_cartas (id, tema, modalidade, respostas, proibida, dificuldade) values
${valores.join(',\n')}
on conflict (id) do update
  set tema = excluded.tema, modalidade = excluded.modalidade, respostas = excluded.respostas,
      proibida = excluded.proibida, dificuldade = excluded.dificuldade, ativo = true;
`
writeFileSync(join(raiz, 'db/028_seed_hint.sql'), sql)
console.log('cartas:', cartas.length, contagem)
