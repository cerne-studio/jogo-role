// Bots que jogam HINT numa sala real (pra testar a interface com pessoas "de verdade" do outro lado).
//   node --env-file=.env scripts/bots-hint.mjs CODIGO [qtd=3] [ritmoSeg=1]
// Cada bot é uma sessão anônima separada. Eles escolhem carta, começam a rodada, marcam acertos, desenham
// (quando a carta é de Desenhar), encerram, palpitam e avançam prazos. Se o responsável for o humano, ficam quietos.
import { createClient } from '@supabase/supabase-js'

const URL = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_ANON_KEY
const [codigo, qtdArg, ritmoArg] = process.argv.slice(2)
if (!URL || !KEY || !codigo) {
  console.error('uso: node --env-file=.env scripts/bots-hint.mjs CODIGO [qtd] [ritmo]')
  process.exit(2)
}
const QTD = Number(qtdArg ?? 3)
const RITMO = Number(ritmoArg ?? 1)
const espera = (ms) => new Promise((r) => setTimeout(r, ms))

async function bot(nome) {
  const c = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data } = await c.auth.signInAnonymously()
  const { data: s, error } = await c.rpc('entrar_sala', { p_codigo: codigo, p_nome: nome })
  if (error) throw new Error(`${nome}: ${error.message}`)
  return { c, id: data.user.id, nome, salaId: s.sala_id, memo: {} }
}

async function volta(b) {
  const { data: sala } = await b.c.from('salas').select('*').eq('id', b.salaId).single()
  if (!sala || sala.status !== 'em_andamento') return sala?.status
  const est = sala.estado
  const chave = `${est.turno}:${est.fase}`
  const meu = est.equipes.azul.includes(b.id) ? 'azul' : est.equipes.vermelha.includes(b.id) ? 'vermelha' : null
  await b.c.rpc('hint_avancar', { p_sala_id: b.salaId })
  if (b.memo[chave]) return 'ok'

  if (est.fase === 'selecao') {
    const deveEscolher = est.escolhe === est.vez ? est.responsavel === b.id : meu === est.escolhe
    if (!deveEscolher) return 'ok'
    b.memo[chave] = true
    await espera(2000 * RITMO)
    const carta = est.obrigatoria_id ?? est.roda[Math.floor(Math.random() * est.roda.length)].id
    const r = await b.c.rpc('hint_escolher', { p_sala_id: b.salaId, p_carta: carta })
    console.log(b.nome, 'escolheu', r.error?.message ?? 'ok')
  } else if (est.fase === 'revelacao' && est.responsavel === b.id) {
    b.memo[chave] = true
    await espera(3000 * RITMO)
    const r = await b.c.rpc('hint_comecar', { p_sala_id: b.salaId })
    console.log(b.nome, 'começou', r.error?.message ?? 'ok')
  } else if (est.fase === 'jogando' && est.responsavel === b.id) {
    b.memo[chave] = true
    const modalidade = est.carta.modalidade
    console.log(b.nome, 'é o responsável, modalidade', modalidade)
    let k = 0
    const alvos = [0, 1, 2]
    for (let passo = 0; passo < 24; passo++) {
      await espera(1000 * RITMO)
      if (modalidade === 'desenhar' && passo < 16) {
        const id = `bot${est.turno}${passo}`
        const pts = []
        for (let i = 0; i <= 6; i++) {
          const a = ((passo * 6 + i) / 24) * Math.PI * 2
          pts.push([0.5 + 0.3 * Math.cos(a), 0.5 + 0.3 * Math.sin(a)].map((v) => Math.round(v * 1000) / 1000))
        }
        const r = await b.c.rpc('hint_desenhar', { p_sala_id: b.salaId, p_ops: [{ t: 's', id, c: passo % 6, w: 7, e: false, p: pts }] })
        if (r.error) console.log('desenho:', r.error.message)
      }
      if (passo === 5 || passo === 9 || passo === 13) {
        const r = await b.c.rpc('hint_acertar', { p_sala_id: b.salaId, p_idx: alvos[k++], p_valor: true })
        console.log(b.nome, 'marcou acerto', r.error?.message ?? 'ok')
      }
    }
    const r = await b.c.rpc('hint_encerrar', { p_sala_id: b.salaId })
    console.log(b.nome, 'encerrou', r.error?.message ?? 'ok')
  } else if (est.fase === 'palpite' && meu === (est.vez === 'azul' ? 'vermelha' : 'azul')) {
    // só o primeiro bot da equipe palpita
    b.memo[chave] = true
    if (est.equipes[meu].filter((u) => u !== est.responsavel)[0] !== b.id && !b.sou1) return 'ok'
    await espera(3000 * RITMO)
    const r = await b.c.rpc('hint_palpite', { p_sala_id: b.salaId, p_texto: 'chute do bot' })
    console.log(b.nome, 'palpitou', r.error?.message ?? 'ok')
  }
  return 'ok'
}

const bots = []
for (let i = 1; i <= QTD; i++) bots.push(await bot(`Bot${i}`))
bots[0].sou1 = true
console.log('bots na sala:', bots.map((b) => b.nome).join(', '))

let ativo = true
await Promise.all(
  bots.map(async (b) => {
    while (ativo) {
      try {
        const st = await volta(b)
        if (st === 'finalizado') {
          console.log(b.nome, 'partida finalizada')
          ativo = false
        }
      } catch (e) {
        console.log(b.nome, 'erro', e.message)
      }
      await espera(900)
    }
  }),
)
