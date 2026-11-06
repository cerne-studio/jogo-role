// Teste ponta a ponta do Respostas sem Perguntas contra o Supabase real (4 sessões anônimas simultâneas).
// Uso: VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/e2e-respostas.mjs
// (ou rode com um .env na raiz, que este script lê sozinho). Cria uma sala nova e não mexe em outras.
import fs from 'node:fs'

function env(nome) {
  if (process.env[nome]) return process.env[nome]
  for (const f of ['.env', '.env.local']) {
    try {
      const m = fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').match(new RegExp(`^${nome}=(.*)$`, 'm'))
      if (m) return m[1].trim().replace(/^"|"$/g, '')
    } catch { /* sem arquivo */ }
  }
  throw new Error(`falta ${nome}`)
}
const U = env('VITE_SUPABASE_URL')
const K = env('VITE_SUPABASE_ANON_KEY')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let falhas = 0
const ok = (c, m) => { console.log(c ? 'OK   ' : 'FALHA', m); if (!c) { falhas++; process.exitCode = 1 } }

// banco local, só pra saber a resposta depois de ver as palavras reveladas (o cliente nunca tem isso)
const BANCO = fs.readFileSync(new URL('../db/data/respostas-banco.txt', import.meta.url), 'utf8')
  .split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'))
  .map((l) => { const [categoria, , pergunta, resposta] = l.split('|'); return { categoria, pergunta, resposta, palavras: pergunta.trim().split(/\s+/) } })
function acharResposta(est) {
  const cands = BANCO.filter((q) => q.categoria === est.categoria && q.palavras.length === est.palavras
    && Object.entries(est.reveladas).every(([pos, w]) => q.palavras[pos - 1] === w))
  return cands.length === 1 ? cands[0] : null
}

async function sessao() {
  const r = await fetch(`${U}/auth/v1/signup`, { method: 'POST', headers: { apikey: K, 'Content-Type': 'application/json' }, body: '{}' })
  const j = await r.json()
  if (!j.access_token) throw new Error('login anonimo falhou: ' + JSON.stringify(j))
  return { token: j.access_token, id: j.user.id }
}
async function rpc(u, fn, args = {}) {
  const r = await fetch(`${U}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: K, Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) })
  const t = await r.text()
  let d; try { d = JSON.parse(t) } catch { d = t }
  return { status: r.status, data: d, erro: r.status >= 300 ? (d?.message ?? t) : null }
}
async function sala(u, id) {
  const r = await fetch(`${U}/rest/v1/salas?id=eq.${id}&select=*`, { headers: { apikey: K, Authorization: `Bearer ${u.token}` } })
  return (await r.json())[0]
}

const nomes = ['Ana', 'Bia', 'Caio', 'Davi']
const us = []
for (let i = 0; i < 4; i++) us.push(await sessao())
const c = await rpc(us[0], 'criar_sala', { p_jogo: 'respostas', p_nome: nomes[0] })
ok(!c.erro, 'criar sala ' + (c.erro ?? c.data.codigo))
const salaId = c.data.sala_id
for (let i = 1; i < 4; i++) ok(!(await rpc(us[i], 'entrar_sala', { p_codigo: c.data.codigo, p_nome: nomes[i] })).erro, 'entrar ' + nomes[i])
const porId = Object.fromEntries(us.map((u) => [u.id, u]))

const cats = await rpc(us[0], 'respostas_categorias')
ok(Array.isArray(cats.data) && cats.data.length === 14, 'categorias (13 + Rolê 18+): ' + (cats.data?.length ?? cats.erro))

// segurança: tabelas privadas e funções internas
for (const t of ['respostas_perguntas', 'respostas_sala']) {
  const r = await fetch(`${U}/rest/v1/${t}?select=*`, { headers: { apikey: K, Authorization: `Bearer ${us[0].token}` } })
  const j = await r.json()
  ok(r.status >= 400 || (Array.isArray(j) && j.length === 0), `tabela ${t} sem leitura direta (${r.status})`)
}
for (const [fn, args] of [['respostas_encerrar', { p_sala_id: salaId, p_tipo: 'acertou', p_uid: us[0].id, p_pontos: 99 }], ['respostas_confere', { p_texto: 'a', p_resposta: 'a', p_aceitas: [] }], ['respostas_sortear', { p_categorias: ['Futebol'], p_total: 1 }]]) {
  ok((await rpc(us[0], fn, args)).erro, `${fn} fechada pro cliente`)
}

ok((await rpc(us[1], 'iniciar_respostas', { p_sala_id: salaId, p_total: 2, p_tempo: 30, p_categorias: [] })).erro, 'nao-host nao inicia')
ok((await rpc(us[0], 'iniciar_respostas', { p_sala_id: salaId, p_total: 0, p_tempo: 30, p_categorias: [] })).erro, 'total 0 recusado')
const ini = await rpc(us[0], 'iniciar_respostas', { p_sala_id: salaId, p_total: 2, p_tempo: 30, p_categorias: [] })
ok(!ini.erro, 'iniciar ' + (ini.erro ?? ''))
let s = await sala(us[0], salaId)
ok(s.estado.fase === 'escolha' && s.estado.n === 1 && !JSON.stringify(s.estado).includes('"pergunta"'), 'estado publico sem pergunta')

async function jogarPergunta(n, acertar) {
  s = await sala(us[0], salaId)
  const e0 = s.estado
  ok(e0.n === n && e0.fase === 'escolha', `pergunta ${n} aberta, ${e0.palavras} palavras, categoria ${e0.categoria}`)
  const outro = us.find((u) => u.id !== e0.vez)
  ok((await rpc(outro, 'respostas_revelar', { p_sala_id: salaId, p_pos: 1 })).erro, 'fora da vez nao revela')
  // 1º turno: revela a palavra 1 e erra
  let r = await rpc(porId[e0.vez], 'respostas_revelar', { p_sala_id: salaId, p_pos: 1 })
  ok(!r.erro, 'revelou palavra 1')
  s = await sala(us[0], salaId)
  ok(s.estado.fase === 'resposta' && s.estado.pontos === e0.palavras - 1 && Object.keys(s.estado.reveladas).length === 1, 'vale ' + s.estado.pontos)
  const primeiro = s.estado.vez
  r = await rpc(porId[primeiro], 'respostas_responder', { p_sala_id: salaId, p_texto: 'resposta absurda 123' })
  ok(!r.erro && r.data.correto === false, 'resposta errada')
  s = await sala(us[0], salaId)
  ok(s.estado.fase === 'escolha' && s.estado.vez !== primeiro, 'vez passou')
  ok(!JSON.stringify(s.estado).includes('absurda'), 'resposta errada nao aparece pros outros')
  // 2º turno: revela a palavra 2, agora dá pra identificar a pergunta
  r = await rpc(porId[s.estado.vez], 'respostas_revelar', { p_sala_id: salaId, p_pos: 2 })
  ok(!r.erro, 'revelou palavra 2')
  s = await sala(us[0], salaId)
  const q = acharResposta(s.estado)
  ok(!!q, 'pergunta identificada pelo banco local')
  const quem = s.estado.vez
  const pontos = s.estado.pontos
  ok(pontos === e0.palavras - 2, 'vale ' + pontos)
  r = await rpc(porId[quem], 'respostas_responder', { p_sala_id: salaId, p_texto: acertar ? q.resposta : 'nao sei' })
  ok(!r.erro && r.data.correto === acertar, acertar ? 'acertou: ' + q.resposta : 'errou de novo')
  s = await sala(us[0], salaId)
  if (acertar) {
    ok(s.estado.fase === 'resultado' && s.estado.placar[quem] >= pontos && s.estado.resultado.pergunta === q.pergunta, `+${pontos} pontos e pergunta revelada`)
    ok(s.estado.resultado.tentativas.some((t) => t.texto === 'resposta absurda 123'), 'resultado mostra as tentativas')
    const dup = await rpc(porId[quem], 'respostas_responder', { p_sala_id: salaId, p_texto: q.resposta })
    ok(dup.erro, 'duplo envio nao pontua')
  }
  return quem
}

await jogarPergunta(1, true)
// resultado dura 9 s; avancar antes nao muda nada
let a = await rpc(us[0], 'avancar_respostas', { p_sala_id: salaId })
ok(a.data.fase === 'resultado', 'avancar antes do prazo e no-op')
console.log('aguardando o resultado fechar (~9 s)...')
for (let i = 0; i < 20; i++) {
  await sleep(1000)
  a = await rpc(us[(i % 4)], 'avancar_respostas', { p_sala_id: salaId })
  if (a.data.fase !== 'resultado') break
}
ok(a.data.n === 2 && a.data.fase === 'escolha', 'abriu a pergunta 2')
await jogarPergunta(2, true)
console.log('aguardando o resultado fechar (~9 s)...')
for (let i = 0; i < 20; i++) {
  await sleep(1000)
  a = await rpc(us[0], 'avancar_respostas', { p_sala_id: salaId })
  if (a.data.fase === 'final') break
}
s = await sala(us[0], salaId)
ok(s.status === 'finalizado' && s.estado.fase === 'final', 'partida finalizada')
const soma = Object.values(s.estado.placar).reduce((x, y) => x + y, 0)
ok(soma > 0, 'placar final ' + JSON.stringify(s.estado.placar))

ok((await rpc(us[1], 'respostas_nova_partida', { p_sala_id: salaId })).erro, 'nao-host nao reinicia logo')
ok(!(await rpc(us[0], 'respostas_nova_partida', { p_sala_id: salaId })).erro, 'host reinicia')
s = await sala(us[0], salaId)
ok(s.status === 'lobby', 'voltou pro lobby')
console.log(falhas ? `\n${falhas} FALHA(S)` : '\ntudo certo')
