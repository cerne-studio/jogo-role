// Teste ponta a ponta do campeonato do Draft FC contra o Supabase real: 2 humanos fazem o draft, o campeonato é
// montado com bots de clubes reais e roda até o campeão (grupos + mata-mata), publicando etapa por etapa
// exatamente como os celulares fazem (versão otimista, "continuar", simulação completa só dos jogos com humano).
//
//   node --env-file=.env scripts/e2e-torneio.mjs [tamanho=8] [modo=historico] [liga]
import { createClient } from '@supabase/supabase-js'
import { avancarEtapa, criarTorneio, etapaAtual, etapaTemResultado, humanosAtivos, simularEtapaAtual, tabelaDoGrupo } from '../src/components/futebol/torneio.js'

const [tamanho = '8', modo = 'historico', liga = null] = process.argv.slice(2)
const URL = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_ANON_KEY
if (!URL || !KEY) {
  console.error('Faltam VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
  process.exit(2)
}

let falhas = 0
function ok(nome, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${nome}${!cond && extra ? `  -> ${extra}` : ''}`)
  if (!cond) falhas++
}
const dorme = (ms) => new Promise((r) => setTimeout(r, ms))

async function jogador(nome) {
  const c = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  for (let t = 1; t <= 4; t++) {
    const { data, error } = await c.auth.signInAnonymously()
    if (!error) return { c, id: data.user.id, nome }
    await dorme(800 * t)
  }
  throw new Error('login anonimo falhou')
}
const rpc = async (j, fn, args) => {
  const { data, error } = await j.c.rpc(fn, args)
  return { data, error: error?.message ?? null }
}
const estadoDe = async (j, salaId) => (await j.c.from('salas').select('estado').eq('id', salaId).single()).data.estado
const esperaAte = async (iso) => {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms > 0) await dorme(ms + 150)
}

async function escolhePrimeira(j, salaId) {
  const pulados = new Set()
  for (let t = 0; t < 8; t++) {
    const { data: lista } = await j.c.rpc('fd_elegiveis', { p_sala_id: salaId })
    const o = (lista ?? []).find((x) => !x.pego_por && x.slots.length > 0 && !pulados.has(x.pid))
    if (!o) return
    const { data: r } = await j.c.rpc('fd_escolher', { p_sala_id: salaId, p_slot: o.slots[0], p_pid: o.pid })
    if (r?.ok) return
    pulados.add(o.pid)
  }
}

async function main() {
  const A = await jogador('Ana')
  const B = await jogador('Beto')
  const criada = await rpc(A, 'criar_sala', { p_jogo: 'draft', p_nome: 'Ana' })
  const salaId = criada.data.sala_id
  await rpc(B, 'entrar_sala', { p_codigo: criada.data.codigo, p_nome: 'Beto' })
  const cfg = await rpc(A, 'fd_configurar', { p_sala_id: salaId, p_modo: modo, p_liga: liga, p_torneio: Number(tamanho), p_dificuldade: 'normal' })
  ok(`configura ${modo}${liga ? ` (${liga})` : ''} / ${tamanho} times`, !cfg.error, cfg.error)
  await esperaErroPreparar(A, salaId)
  await rpc(A, 'iniciar_partida', { p_sala_id: salaId })
  await rpc(A, 'fd_definir_formacao', { p_sala_id: salaId, p_formacao: '4-3-3' })
  await rpc(B, 'fd_definir_formacao', { p_sala_id: salaId, p_formacao: '4-4-2' })

  // draft rápido: os dois escolhem logo que a roleta acaba
  for (let r = 1; r <= 11; r++) {
    const est = await estadoDe(A, salaId)
    if (est.rodada !== r) break
    await esperaAte(est.escolha_ini)
    await Promise.all([A, B].map((j) => escolhePrimeira(j, salaId)))
  }
  let est = await estadoDe(A, salaId)
  ok('draft terminou na tatica', est.fase === 'tatica', est.fase)
  await rpc(A, 'fd_definir_tatica', { p_sala_id: salaId, p_tatica: 'ofensiva' })
  await rpc(B, 'fd_definir_tatica', { p_sala_id: salaId, p_tatica: 'defensiva' })
  est = await estadoDe(A, salaId)
  ok('draft pronto', est.fase === 'prontos', est.fase)

  // ---------- montar o campeonato ----------
  const { data: semDraft } = await rpc(A, 'fd_torneio_obter', { p_sala_id: salaId })
  ok('ainda nao existe campeonato', semDraft == null)
  const prep = await rpc(A, 'fd_torneio_preparar', { p_sala_id: salaId })
  ok('prepara o campeonato', !prep.error && prep.data?.versao === 1, prep.error)
  const prep2 = await rpc(B, 'fd_torneio_preparar', { p_sala_id: salaId })
  ok('preparar de novo nao duplica', !prep2.error && prep2.data?.versao === 1, prep2.error)
  est = await estadoDe(A, salaId)
  ok('sala entra na fase torneio', est.fase === 'torneio' && est.torneio_v === 1)

  const { data: obt } = await rpc(A, 'fd_torneio_obter', { p_sala_id: salaId })
  const times = obt.dados.times
  ok(`${tamanho} times: 2 humanos + bots`, times.length === Number(tamanho) && times.filter((t) => t.tipo === 'humano').length === 2)
  ok('todo time tem 11 jogadores', times.every((t) => t.picks.length === 11))
  ok('bots sao clubes reais com sigla', times.filter((t) => t.tipo === 'bot').every((t) => t.sigla && t.clube_id))
  if (modo === 'liga') ok('bots so da liga escolhida', times.filter((t) => t.tipo === 'bot').every((t) => t.liga === liga))
  console.log(`      bots: ${times.filter((t) => t.tipo === 'bot').map((t) => `${t.sigla}(${t.overall})`).join(' ')}`)

  // ---------- RLS ----------
  const { data: tabela } = await A.c.from('fd_torneio').select('*').limit(1)
  ok('cliente nao le fd_torneio direto', (tabela ?? []).length === 0)
  const { data: part } = await A.c.from('fd_partidas').select('*').limit(1)
  ok('cliente nao le fd_partidas direto', (part ?? []).length === 0)
  const { data: clubes } = await A.c.from('fd_clubes').select('*').limit(1)
  ok('cliente nao le fd_clubes direto', (clubes ?? []).length === 0)
  const D = await jogador('Duda')
  ok('quem nao e da sala nao ve o campeonato', !!(await rpc(D, 'fd_torneio_obter', { p_sala_id: salaId })).error)

  // ---------- rodando o campeonato como os celulares ----------
  let guarda = 0
  let versao = 1
  let ultimaEtapa = ''
  while (guarda++ < 60) {
    const { data: s } = await rpc(A, 'fd_torneio_obter', { p_sala_id: salaId })
    versao = s.versao
    let t = s.dados
    const e = await estadoDe(A, salaId)
    const precisaCriar = !t.etapas
    const precisaAvancar = !precisaCriar && !t.campeaoId && e.liberado && etapaAtual(t) && etapaTemResultado(t, etapaAtual(t))
    if (t.campeaoId) break
    if (precisaCriar || precisaAvancar) {
      const base = precisaCriar ? criarTorneio({ times: t.times, tamanho: t.tamanho, semente: t.semente }) : avancarEtapa(t)
      let pub
      if (base.campeaoId) pub = await rpc(A, 'fd_torneio_publicar', { p_sala_id: salaId, p_versao: versao, p_dados: base, p_partidas: {}, p_ativos: [] })
      else {
        const { torneio, partidas } = simularEtapaAtual(base)
        const guardar = Object.fromEntries(Object.entries(partidas).map(([id, p]) => [id, { sim: p.sim, cfg: p.cfg }]))
        pub = await rpc(A, 'fd_torneio_publicar', { p_sala_id: salaId, p_versao: versao, p_dados: torneio, p_partidas: guardar, p_ativos: humanosAtivos(torneio) })
        const rep = await rpc(B, 'fd_torneio_publicar', { p_sala_id: salaId, p_versao: versao, p_dados: torneio, p_partidas: guardar, p_ativos: [] })
        ok(`etapa ${etapaAtual(torneio).id}: segundo publicador com versao velha e recusado`, rep.data?.ok === false && rep.data?.motivo === 'desatualizado', JSON.stringify(rep))
      }
      ok(`publica ${base.campeaoId ? 'o campeao' : etapaAtual(base)?.id}`, pub.data?.ok === true, pub.error ?? JSON.stringify(pub.data))
      continue
    }
    // etapa em andamento: cada humano assiste (busca a simulação) e dá continuar
    const etapa = etapaAtual(t)
    if (etapa.id !== ultimaEtapa) {
      ultimaEtapa = etapa.id
      const ativos = humanosAtivos(t)
      for (const j of [A, B]) {
        const meu = t.times.find((x) => x.user_id === j.id)
        const jogo = etapa.jogos.find((x) => x.A === meu.id || x.B === meu.id)
        if (jogo) {
          const sim = await rpc(j, 'fd_partida_obter', { p_sala_id: salaId, p_jogo_id: jogo.id })
          ok(`${j.nome} recebe a simulacao do jogo ${jogo.id} (${sim.data?.sim?.eventos?.length} lances)`, sim.data?.sim?.eventos?.length > 20, sim.error)
        }
      }
      const semHumano = etapa.jogos.find((x) => !x.A.startsWith('h') && !x.B.startsWith('h'))
      if (semHumano) {
        const r = await rpc(A, 'fd_partida_obter', { p_sala_id: salaId, p_jogo_id: semHumano.id })
        ok('jogo so de bots nao guarda a simulacao completa', r.data == null)
      }
      const c1 = await rpc(A, 'fd_torneio_continuar', { p_sala_id: salaId })
      if (ativos.length > 1) ok(`${etapa.id}: 1 de ${ativos.length} deu continuar, ainda nao libera`, c1.data?.liberado === false, JSON.stringify(c1.data))
      const c2 = await rpc(B, 'fd_torneio_continuar', { p_sala_id: salaId })
      ok(`${etapa.id}: todos deram continuar, libera`, c2.data?.liberado === true, c2.error ?? JSON.stringify(c2.data))
    }
    await dorme(300)
  }

  const { data: fim } = await rpc(A, 'fd_torneio_obter', { p_sala_id: salaId })
  const t = fim.dados
  ok('campeonato acabou com campeao', !!t.campeaoId, `cursor=${t.cursor}`)
  const campeao = t.times.find((x) => x.id === t.campeaoId)
  console.log(`      campeao: ${campeao?.nome} (${campeao?.tipo}) | etapas: ${t.etapas.map((x) => x.id).join(' > ')}`)
  const esperado = { 8: 15, 16: 31, 20: 47 }[Number(tamanho)]
  ok(`${esperado} jogos no total`, Object.keys(t.resultados).length === esperado, String(Object.keys(t.resultados).length))
  const golsRes = Object.values(t.resultados).reduce((s, r) => s + r.golsA + r.golsB, 0)
  const golsJog = Object.values(t.est.jogadores).reduce((s, p) => s + p.gols + p.golsContra, 0)
  ok('gols dos jogadores = gols dos placares', golsRes === golsJog, `${golsJog} x ${golsRes}`)
  for (let gi = 0; gi < t.grupos.length; gi++) {
    const tab = tabelaDoGrupo(t, gi)
    ok(`grupo ${'ABCD'[gi]}: tabela fecha`, tab.every((l) => l.v + l.e + l.d === l.j) && tab.reduce((s, l) => s + l.gp, 0) === tab.reduce((s, l) => s + l.gc, 0))
  }
  console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo')
  process.exit(falhas ? 1 : 0)
}

async function esperaErroPreparar(j, salaId) {
  const r = await rpc(j, 'fd_torneio_preparar', { p_sala_id: salaId })
  ok('nao prepara antes do draft acabar', !!r.error && r.error.includes('draft ainda nao terminou'), r.error)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
