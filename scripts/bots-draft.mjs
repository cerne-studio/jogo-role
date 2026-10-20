// Entra numa sala de Draft FC já criada e joga como N "amigos" automáticos (pra testar sozinho, sem outros celulares).
// Eles escolhem a formação, escolhem o melhor jogador disponível 2–5 s depois da roleta (disputando os mesmos craques
// que você) e escolhem a tática. Ctrl+C encerra.
//
//   node --env-file=.env scripts/bots-draft.mjs <codigo-da-sala> [quantidade=2]
import { createClient } from '@supabase/supabase-js'

const [codigo, qtd = '2'] = process.argv.slice(2)
const URL = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_ANON_KEY
if (!codigo || !URL || !KEY) {
  console.error('uso: node --env-file=.env scripts/bots-draft.mjs <codigo> [quantidade]')
  process.exit(2)
}

const NOMES = ['Ana', 'Beto', 'Lucas', 'Duda', 'Caio', 'Bia', 'Teo']
const FORMACOES = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '4-5-1', '5-3-2', '3-4-3']
const dorme = (ms) => new Promise((r) => setTimeout(r, ms))

async function bot(nome, i) {
  const c = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: sessao, error } = await c.auth.signInAnonymously()
  if (error) throw error
  const { data: sala, error: e2 } = await c.rpc('entrar_sala', { p_codigo: codigo, p_nome: nome })
  if (e2) throw new Error(`${nome}: ${e2.message}`)
  console.log(`${nome} entrou na sala ${codigo}`)
  const uid = sessao.user.id
  const feito = { formacao: false, tatica: false, rodada: 0 }

  async function estado() {
    const { data } = await c.from('salas').select('estado,status').eq('id', sala.sala_id).single()
    return data
  }

  for (;;) {
    const s = await estado()
    const est = s?.estado ?? {}
    try {
      if (est.fase === 'formacao' && !est.formacoes?.[uid]) {
        await dorme(1500 + Math.random() * 2000)
        await c.rpc('fd_definir_formacao', { p_sala_id: sala.sala_id, p_formacao: FORMACOES[(i + 2) % FORMACOES.length] })
      } else if (est.fase === 'draft' && est.rodada !== feito.rodada && !(est.ja_escolheu ?? []).includes(uid)) {
        const espera = new Date(est.escolha_ini).getTime() - Date.now()
        await dorme(Math.max(0, espera) + 1500 + Math.random() * 3500)
        const { data: lista } = await c.rpc('fd_elegiveis', { p_sala_id: sala.sala_id })
        const pulados = new Set()
        for (let t = 0; t < 6; t++) {
          const o = (lista ?? []).find((x) => !x.pego_por && x.slots.length > 0 && !pulados.has(x.pid))
          if (!o) break
          const { data: r } = await c.rpc('fd_escolher', { p_sala_id: sala.sala_id, p_slot: o.slots[0], p_pid: o.pid })
          if (r?.ok) {
            console.log(`${nome} r${est.rodada} (${est.letra}): ${o.nome}`)
            break
          }
          pulados.add(o.pid)
        }
        feito.rodada = est.rodada
      } else if (est.fase === 'tatica' && !est.taticas?.[uid]) {
        await dorme(1500 + Math.random() * 3000)
        await c.rpc('fd_definir_tatica', { p_sala_id: sala.sala_id, p_tatica: ['ofensiva', 'equilibrada', 'defensiva'][i % 3] })
      } else if (est.fase === 'prontos') {
        console.log(`${nome}: draft concluído`)
        return
      } else {
        // qualquer um da sala resolve prazos estourados; os bots ajudam
        await c.rpc('fd_avancar', { p_sala_id: sala.sala_id })
      }
    } catch (e) {
      console.warn(`${nome}:`, e.message)
    }
    await dorme(700)
  }
}

const n = Math.min(7, Math.max(1, Number(qtd)))
await Promise.all(Array.from({ length: n }, (_, i) => bot(NOMES[i], i)))
process.exit(0)
