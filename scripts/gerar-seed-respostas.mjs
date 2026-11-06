// Gera db/025_seed_respostas.sql a partir de db/data/respostas-banco.txt e confere o banco.
// Uso: node scripts/gerar-seed-respostas.mjs
import fs from 'node:fs'

const origem = new URL('../db/data/respostas-banco.txt', import.meta.url)
const destino = new URL('../db/025_seed_respostas.sql', import.meta.url)
const DIF = { f: 'facil', m: 'media', d: 'dificil' }

const linhas = fs.readFileSync(origem, 'utf8').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'))
const itens = linhas.map((l, i) => {
  const [categoria, dif, pergunta, resposta, alt = ''] = l.split('|')
  if (!categoria || !DIF[dif] || !pergunta || !resposta) throw new Error(`linha ${i + 1} inválida: ${l}`)
  return {
    id: `q${String(i + 1).padStart(3, '0')}`,
    categoria: categoria.trim(),
    dificuldade: DIF[dif],
    pergunta: pergunta.trim(),
    resposta: resposta.trim(),
    aceitas: alt.split(';').map((s) => s.trim()).filter(Boolean),
  }
})

// conferências
const palavras = (p) => p.trim().split(/\s+/).length
const avisos = []
const vistas = new Set()
for (const q of itens) {
  if (vistas.has(q.pergunta)) avisos.push(`pergunta repetida: ${q.id}`)
  vistas.add(q.pergunta)
  const n = palavras(q.pergunta)
  if (n < 8 || n > 25) avisos.push(`${q.id} tem ${n} palavras`)
  if (q.pergunta.includes("'")) { /* aspas simples são escapadas no SQL */ }
}
const conta = (f) => itens.reduce((m, q) => ((m[f(q)] = (m[f(q)] ?? 0) + 1), m), {})
console.log('perguntas:', itens.length)
console.log('por categoria:', conta((q) => q.categoria))
console.log('por dificuldade:', conta((q) => q.dificuldade))
const ini = conta((q) => q.pergunta.split(' ')[0])
console.log('primeiras palavras mais comuns:', Object.entries(ini).sort((a, b) => b[1] - a[1]).slice(0, 8))
const tam = itens.map((q) => palavras(q.pergunta))
console.log('palavras por pergunta: min', Math.min(...tam), 'max', Math.max(...tam), 'média', (tam.reduce((a, b) => a + b, 0) / tam.length).toFixed(1))
if (avisos.length) console.log('AVISOS:', avisos)

const esc = (s) => s.replace(/'/g, "''")
const arr = (a) => `array[${a.map((s) => `'${esc(s)}'`).join(', ')}]::text[]`
const valores = itens
  .map((q) => `  ('${q.id}', '${esc(q.categoria)}', '${esc(q.pergunta)}', '${esc(q.resposta)}', ${q.aceitas.length ? arr(q.aceitas) : "'{}'::text[]"}, '${q.dificuldade}')`)
  .join(',\n')

const sql = `-- Seed do banco de perguntas do Respostas sem Perguntas. Rode depois de db/024_respostas.sql.
-- GERADO por scripts/gerar-seed-respostas.mjs a partir de db/data/respostas-banco.txt — edite o .txt e gere de novo.
-- Idempotente: o id (q001...) segue a ordem do .txt, e rodar de novo atualiza em vez de duplicar.
-- Perguntas novas no fim do .txt entram sem mexer nas antigas.

insert into respostas_perguntas (id, categoria, pergunta, resposta, aceitas, dificuldade) values
${valores}
on conflict (id) do update set
  categoria = excluded.categoria,
  pergunta = excluded.pergunta,
  resposta = excluded.resposta,
  aceitas = excluded.aceitas,
  dificuldade = excluded.dificuldade;
`
fs.writeFileSync(destino, sql)
console.log('gerado db/025_seed_respostas.sql')
