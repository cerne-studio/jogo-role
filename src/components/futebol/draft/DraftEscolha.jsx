import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Info, Search, X } from 'lucide-react'
import ExitButton from '../../core/ExitButton.jsx'
import { supabase } from '../../../lib/supabase.js'
import MiniCampo from './MiniCampo.jsx'
import { Bolinha, Cadeado, Cronometro, Nota, NomeComLetra, TOTAL_RODADAS, posPrincipal, semAcento, temLetra } from './draftUtils.jsx'
import { useTick } from './useServidor.js'

const ATRIBUTOS = [
  ['ritmo', 'Ritmo'], ['chute', 'Chute'], ['passe', 'Passe'], ['drible', 'Drible'], ['defesa', 'Defesa'], ['fisico', 'Físico'],
]

// Tela principal do draft: 7 s pra escolher alguém com a letra sorteada e encaixar numa vaga aberta.
export default function DraftEscolha({ salaId, userId, est, jogadores, agora, times, onExit }) {
  const [lista, setLista] = useState([])
  const [carregou, setCarregou] = useState(false)
  const [jogSel, setJogSel] = useState(null)
  const [slotFiltro, setSlotFiltro] = useState(null)
  const [slotAlvo, setSlotAlvo] = useState(null)
  const [busca, setBusca] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [ficha, setFicha] = useState(null)
  useTick(100)

  useEffect(() => {
    let vivo = true
    supabase.rpc('fd_elegiveis', { p_sala_id: salaId }).then(({ data }) => {
      if (!vivo) return
      setLista(data ?? [])
      setCarregou(true)
    })
    return () => {
      vivo = false
    }
  }, [salaId, est.rodada])

  const meuTime = times.find((t) => t.user_id === userId)
  const picks = meuTime?.picks ?? []
  const formacao = est.formacoes?.[userId] ?? '4-3-3'
  const pegos = est.pegos ?? {}
  const selecionado = lista.find((o) => o.pid === jogSel) ?? null
  const slotFinal = selecionado ? (slotAlvo && selecionado.slots.includes(slotAlvo) ? slotAlvo : selecionado.slots[0]) : null

  // Alguém levou o jogador que eu tinha selecionado: avisa e solta a seleção.
  useEffect(() => {
    if (jogSel && pegos[jogSel] && pegos[jogSel].u !== userId) {
      const o = lista.find((x) => x.pid === jogSel)
      setAviso(`${pegos[jogSel].n} acabou de pegar ${o?.nome ?? 'ele'}! Escolha outro.`)
      setJogSel(null)
      setSlotAlvo(null)
    }
  }, [pegos, jogSel, userId, lista])

  const prazo = Date.parse(est.prazos?.[userId] ?? est.escolha_ini)
  const restante = (prazo - agora()) / 1000

  const visiveis = useMemo(() => {
    const q = semAcento(busca).toLowerCase().trim()
    return lista.filter((o) => !q || semAcento(`${o.nome} ${o.nome_completo}`).toLowerCase().includes(q))
  }, [lista, busca])

  function estadoDe(o) {
    const p = pegos[o.pid]
    if (o.pego_por || p) return { tipo: 'pego', por: p ? (p.u === userId ? 'você' : p.n) : o.pego_por }
    if (o.slots.length === 0) return { tipo: 'semvaga' }
    if (slotFiltro && !o.slots.includes(slotFiltro)) return { tipo: 'incompat' }
    return { tipo: 'ok' }
  }

  function tocarJogador(o) {
    setAviso('')
    setJogSel(o.pid)
    setSlotAlvo(slotFiltro && o.slots.includes(slotFiltro) ? slotFiltro : o.slots[0])
  }

  function tocarVaga(idx) {
    setAviso('')
    if (selecionado) {
      if (selecionado.slots.includes(idx)) setSlotAlvo(idx)
    } else {
      setSlotFiltro((s) => (s === idx ? null : idx))
    }
  }

  async function confirmar() {
    if (!selecionado || !slotFinal || enviando) return
    setEnviando(true)
    const { data, error } = await supabase.rpc('fd_escolher', { p_sala_id: salaId, p_slot: slotFinal, p_pid: selecionado.pid })
    setEnviando(false)
    if (error) {
      setAviso(error.message)
      return
    }
    if (data?.ok === false) {
      setJogSel(null)
      setSlotAlvo(null)
      setAviso(data.motivo === 'pego' ? `${data.por} acabou de pegar ele! Escolha outro. (+3s)` : 'Tempo esgotado.')
    }
  }

  const ultima = est.feed?.[0]
  const rivais = times.filter((t) => t.user_id !== userId)

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ExitButton onExit={onExit} />
      <div className="mx-auto w-full max-w-sm flex-1 px-5 pb-28 pt-5">
        <div className="flex items-center gap-3 pr-10">
          <div className="min-w-0 flex-1 rounded-2xl border border-border bg-surface px-4 py-3">
            <p className="text-lg font-extrabold leading-tight">
              Rodada <span className="text-accent">{est.rodada}</span>/{TOTAL_RODADAS}
            </p>
            <div className="mt-2 flex gap-1">
              {Array.from({ length: TOTAL_RODADAS }, (_, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < est.rodada - 1 ? 'bg-accent' : i === est.rodada - 1 ? 'bg-accent/60' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] border-accent bg-base text-3xl font-black text-accent shadow-[0_0_22px_rgba(245,158,11,.45)]">
            {est.letra === '*' ? '?' : est.letra}
          </div>
          <Cronometro restante={restante} total={Math.max(7, restante)} tam={64} />
        </div>

        <div className="mt-4 grid grid-cols-[1.25fr_1fr] gap-3">
          <MiniCampo formacao={formacao} picks={picks} destaque={slotFinal} compativeis={selecionado ? selecionado.slots : null} filtro={slotFiltro} onSlot={tocarVaga} />
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-border bg-surface px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Última escolha</p>
              {ultima ? (
                <p className="mt-1.5 text-sm leading-snug">
                  <span className="font-bold">{ultima.n}</span> <span className="text-secondary">{ultima.auto ? 'recebeu' : 'escolheu'}</span>{' '}
                  <span className="font-bold text-accent">{ultima.j}</span>
                </p>
              ) : (
                <p className="mt-1.5 text-sm text-secondary">Ninguém escolheu ainda.</p>
              )}
            </div>
            {rivais.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Rivais</p>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {rivais.map((t) => {
                    const media = t.picks.length ? Math.round(t.picks.reduce((s, p) => s + p.overall, 0) / t.picks.length) : '-'
                    return (
                      <li key={t.user_id} className="flex items-center justify-between text-xs">
                        <span className="truncate font-semibold">{t.nome}</span>
                        <span className="tabular-nums text-secondary">{t.picks.length}/{TOTAL_RODADAS} · {media}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            <p className="px-1 text-[11px] leading-snug text-muted">
              Toque numa vaga pra filtrar a lista por posição. {slotFiltro ? 'Toque de novo pra limpar.' : ''}
            </p>
          </div>
        </div>

        <AnimatePresence>
          {aviso && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 rounded-xl border border-accent bg-accent-glow px-4 py-3 text-sm font-semibold"
            >
              {aviso}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5 rounded-2xl border border-border bg-surface p-3">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary">
            Escolha um jogador com a letra <span className="text-[16px] font-black text-accent">{est.letra === '*' ? 'qualquer' : est.letra}</span>
          </p>
          <label className="mt-3 flex items-center gap-2 rounded-xl border border-border-strong bg-white/5 px-3 py-2.5">
            <Search className="h-4 w-4 text-muted" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite o nome do jogador..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </label>

          <ul className="mt-3 flex flex-col gap-2">
            {!carregou && <li className="px-2 py-6 text-center text-sm text-secondary">Carregando opções...</li>}
            {carregou && visiveis.length === 0 && <li className="px-2 py-6 text-center text-sm text-secondary">Ninguém com esse nome.</li>}
            {visiveis.map((o) => {
              const st = estadoDe(o)
              const ativo = jogSel === o.pid
              const bloqueado = st.tipo !== 'ok'
              return (
                <li key={o.pid}>
                  <div
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                      ativo ? 'border-accent bg-accent-glow' : 'border-border bg-elevated'
                    } ${bloqueado ? 'opacity-45' : ''}`}
                  >
                    <button
                      disabled={bloqueado}
                      onClick={() => tocarJogador(o)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default"
                    >
                      <Bolinha nome={o.nome} cor={bloqueado ? '#5a5a6a' : '#f59e0b'} tam={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-bold leading-tight"><NomeComLetra nome={temLetra(o.nome, est.letra) ? o.nome : o.nome_completo} letra={est.letra} /></span>
                        <span className="block truncate text-[11px] text-secondary">
                          {st.tipo === 'pego' ? <Cadeado>Pego por {st.por}</Cadeado> : st.tipo === 'semvaga' ? 'Sem vaga pra essa posição' : st.tipo === 'incompat' ? 'Não joga na vaga escolhida' : `${posPrincipal(o.posicoes)} · ${o.clube}`}
                        </span>
                      </span>
                      <Nota valor={o.overall} />
                    </button>
                    <button onClick={() => setFicha(o)} aria-label={`Ficha de ${o.nome}`} className="shrink-0 p-1 text-muted">
                      <Info className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-base via-base to-transparent px-5 pb-5 pt-6">
        <div className="mx-auto w-full max-w-sm">
          <button
            disabled={!selecionado || enviando}
            onClick={confirmar}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-4 text-[16px] font-extrabold uppercase tracking-wide text-black transition active:scale-[0.98] disabled:opacity-30"
          >
            {selecionado ? `Confirmar ${selecionado.nome}` : 'Escolha um jogador'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {ficha && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={() => setFicha(null)}>
            <motion.div
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-border-strong bg-elevated p-5"
            >
              <div className="flex items-start gap-3">
                <Bolinha nome={ficha.nome} cor="#f59e0b" tam={52} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-bold leading-tight">{ficha.nome_completo}</h2>
                  <p className="text-xs text-secondary">{posPrincipal(ficha.posicoes)} · {ficha.pais}</p>
                  <p className="text-xs text-muted">{ficha.clube} · {ficha.liga}</p>
                </div>
                <Nota valor={ficha.overall} tam="lg" />
                <button onClick={() => setFicha(null)} aria-label="Fechar" className="p-1 text-muted"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {(ficha.posicoes?.[0] === 'GK' ? [['goleiro', 'Goleiro']] : ATRIBUTOS).map(([k, nome]) => (
                  <div key={k} className="flex items-center gap-3 text-sm">
                    <span className="w-14 text-secondary">{nome}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full bg-accent" style={{ width: `${ficha[k] ?? 0}%` }} />
                    </span>
                    <span className="w-7 text-right font-bold tabular-nums">{ficha[k] ?? '-'}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
