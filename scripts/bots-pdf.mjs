// Bots pra testar o P.D.F sozinho: entram numa sala pelo código e jogam sozinhos (como jogador e como juiz).
//
//   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/bots-pdf.mjs 123456 [qtd_bots]
import { createClient } from '@supabase/supabase-js'

const URL = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_ANON_KEY
const codigo = process.argv[2]
const qtd = Number(process.argv[3] ?? 2)
if (!URL || !KEY || !codigo) {
  console.error('uso: node scripts/bots-pdf.mjs <codigo> [qtd_bots]  (com VITE_SUPABASE_URL/ANON_KEY no ambiente)')
  process.exit(2)
}

const NOMES = ['Bot Beto', 'Bot Caio', 'Bot Duda', 'Bot Eva', 'Bot Gil']
const espera = (ms) => new Promise((r) => setTimeout(r, ms))

async function entrar(nome) {
  const c = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await c.auth.signInAnonymously()
  if (error) throw error
  const r = await c.rpc('entrar_sala', { p_codigo: codigo, p_nome: nome })
  if (r.error) throw new Error(r.error.message)
  return { c, id: data.user.id, nome, salaId: r.data.sala_id }
}

async function loop(b) {
  for (;;) {
    const { data: sala } = await b.c.from('salas').select('*').eq('id', b.salaId).single()
    if (!sala || sala.status === 'finalizado') {
      console.log(`${b.nome}: partida terminou`)
      return
    }
    const est = sala.estado
    if (sala.status === 'em_andamento') {
      const souJuiz = est.juiz_id === b.id
      if (est.fase === 'jogando' && !souJuiz && !(est.ja_jogaram ?? []).includes(b.id)) {
        const { data: mao } = await b.c.from('pdf_maos').select('carta_id').eq('user_id', b.id)
        const precisa = Math.max(est.preta.lacunas, 1)
        const ids = (mao ?? []).sort(() => Math.random() - 0.5).slice(0, precisa).map((m) => m.carta_id)
        await espera(1500 + Math.random() * 2500)
        const r = await b.c.rpc('pdf_jogar', { p_sala_id: b.salaId, p_cartas: ids })
        if (r.error && !/ja fechou|ja jogou/.test(r.error.message)) console.log(`${b.nome}: ${r.error.message}`)
      } else if (est.fase === 'julgando' && souJuiz) {
        await espera(2500)
        const idx = est.respostas[Math.floor(Math.random() * est.respostas.length)].idx
        await b.c.rpc('pdf_escolher', { p_sala_id: b.salaId, p_idx: idx })
      } else if (est.fase === 'resultado' && souJuiz) {
        await espera(3500)
        await b.c.rpc('pdf_proxima', { p_sala_id: b.salaId })
      }
    }
    await espera(1200)
  }
}

const bots = []
for (let i = 0; i < qtd; i++) bots.push(await entrar(NOMES[i]))
console.log(`${bots.length} bot(s) na sala ${codigo}. Inicie a partida pelo celular/navegador.`)
await Promise.all(bots.map(loop))
