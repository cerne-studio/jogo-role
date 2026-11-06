import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Clock, Crown, Send } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'
import { supabase } from '../../lib/supabase.js'
import RespostasResultado from './RespostasResultado.jsx'

const fmt = (s) => (s == null ? '--' : `${s}s`)

function Tile({ pos, palavra, selecionavel, onEscolher }) {
  if (palavra != null) {
    return (
      <motion.div
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="flex min-h-12 flex-col items-center justify-center rounded-xl border border-accent/50 bg-accent-glow px-3 py-1"
      >
        <span className="text-[9px] font-bold leading-none tabular-nums text-accent/70">{String(pos).padStart(2, '0')}</span>
        <span className="text-[15px] font-bold leading-tight text-primary">{palavra}</span>
      </motion.div>
    )
  }
  return (
    <motion.button
      type="button"
      whileTap={selecionavel ? { scale: 0.92 } : undefined}
      disabled={!selecionavel}
      onClick={() => onEscolher(pos)}
      aria-label={`Revelar palavra ${pos}`}
      className={`flex h-12 w-12 items-center justify-center rounded-xl border text-sm font-bold tabular-nums transition ${
        selecionavel ? 'border-border-strong bg-elevated text-primary active:border-accent' : 'border-border bg-surface text-muted'
      }`}
    >
      {String(pos).padStart(2, '0')}
    </motion.button>
  )
}

// Caixa de resposta. O componente é remontado (key) a cada palavra revelada, então o "enviado" nunca vaza pra outro turno.
function CaixaResposta({ salaId, onErro }) {
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    if (!texto.trim() || enviando) return
    setEnviando(true)
    const { error } = await supabase.rpc('respostas_responder', { p_sala_id: salaId, p_texto: texto })
    if (error) {
      onErro(error.message)
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3">
      <p className="text-center text-xs font-bold uppercase tracking-widest text-accent">Qual é a resposta?</p>
      <input
        autoFocus
        value={texto}
        maxLength={100}
        disabled={enviando}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Digite sua resposta..."
        autoComplete="off"
        autoCapitalize="sentences"
        className="w-full rounded-xl border border-border-strong bg-surface px-4 py-3.5 text-base outline-none focus:border-accent"
      />
      <motion.button
        whileTap={{ scale: 0.97 }}
        type="submit"
        disabled={!texto.trim() || enviando}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-base font-bold text-black disabled:opacity-30"
      >
        <Send className="h-4 w-4" /> {enviando ? 'Enviando...' : 'Confirmar resposta'}
      </motion.button>
    </form>
  )
}

function Placar({ ordem, placar, acertos, vez, nomes, userId }) {
  const [aberto, setAberto] = useState(false)
  const lista = [...ordem].sort((a, b) => (placar[b] ?? 0) - (placar[a] ?? 0))
  return (
    <div className="rounded-2xl border border-border bg-surface">
      <button type="button" onClick={() => setAberto((a) => !a)} className="flex w-full items-center justify-between px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-widest text-muted">Placar</span>
        <span className="flex items-center gap-2 text-xs text-secondary">
          {!aberto && lista[0] && (
            <span>
              <Crown className="mr-1 inline h-3 w-3 text-accent" />
              {nomes[lista[0]]} {placar[lista[0]] ?? 0}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition ${aberto ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {aberto && (
        <ul className="flex flex-col gap-1.5 px-3 pb-3">
          {lista.map((id, i) => (
            <li
              key={id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                id === userId ? 'bg-accent-glow' : 'bg-elevated'
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <span className="w-4 text-xs text-muted">{i + 1}</span>
                {nomes[id]}
                {id === vez && <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-black uppercase text-black">vez</span>}
              </span>
              <span className="tabular-nums">
                <b>{placar[id] ?? 0}</b>
                <span className="ml-2 text-[11px] text-muted">{acertos[id] ?? 0} ✓</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function RespostasPartida({ salaId, userId, sala, jogadores, restante, onExit }) {
  const [erro, setErro] = useState('')
  const e = sala.estado
  const nomes = Object.fromEntries(jogadores.map((j) => [j.user_id, j.nome]))
  const reveladas = e.reveladas ?? {}
  const nReveladas = Object.keys(reveladas).length
  const euSouAVez = e.vez === userId
  const nomeVez = nomes[e.vez] ?? '...'

  async function escolher(pos) {
    setErro('')
    const { error } = await supabase.rpc('respostas_revelar', { p_sala_id: salaId, p_pos: pos })
    if (error) setErro(error.message)
  }

  const ultimo = e.fase === 'escolha' && e.ultimo ? e.ultimo : null
  const tempoTotal = e.fase === 'escolha' ? 15 : e.tempo
  const pct = restante == null ? 0 : Math.min(100, (restante / tempoTotal) * 100)

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pb-8 pt-6">
      <ExitButton onExit={onExit} />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4">
        <header className="pr-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-accent">Respostas sem Perguntas</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-secondary">
            Pergunta {String(e.n).padStart(2, '0')}/{String(e.total).padStart(2, '0')}
          </p>
          <span className="mt-2 inline-block rounded-full border border-border-strong bg-surface px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
            {e.categoria}
          </span>
        </header>

        {e.fase === 'resultado' ? (
          <RespostasResultado est={e} nomes={nomes} userId={userId} restante={restante} />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-border bg-surface px-2 py-2">
                <p className="text-lg font-black tabular-nums">{e.palavras}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted">palavras</p>
              </div>
              <div className="rounded-xl border border-accent/40 bg-accent-glow px-2 py-2">
                <motion.p key={e.pontos} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="text-lg font-black tabular-nums text-accent">
                  {e.pontos}
                </motion.p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted">pontos valendo</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-2 py-2">
                <p className="truncate text-sm font-black">{euSouAVez ? 'Você' : nomeVez}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted">vez de</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-secondary">
                <span>{e.fase === 'escolha' ? 'Escolhendo palavra' : 'Hora de responder'}</span>
                <span className="flex items-center gap-1 tabular-nums">
                  <Clock className="h-3.5 w-3.5" /> {fmt(restante)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-elevated">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ${pct < 25 ? 'bg-danger' : 'bg-accent'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 py-1">
              {Array.from({ length: e.palavras }, (_, i) => i + 1).map((pos) => (
                <Tile
                  key={`${e.n}-${pos}`}
                  pos={pos}
                  palavra={reveladas[pos] ?? null}
                  selecionavel={euSouAVez && e.fase === 'escolha'}
                  onEscolher={escolher}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${e.vez}-${e.fase}-${nReveladas}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                {ultimo && (
                  <p className="mb-2 text-center text-xs font-semibold text-danger">
                    {ultimo.uid === userId ? 'Você' : nomes[ultimo.uid]}{' '}
                    {ultimo.tipo === 'tempo' ? 'ficou sem tempo' : 'errou'}.
                  </p>
                )}
                {e.fase === 'escolha' &&
                  (euSouAVez ? (
                    <p className="text-center text-base font-bold">Sua vez! Toque em uma palavra escondida.</p>
                  ) : (
                    <p className="text-center text-sm text-secondary">
                      <b className="text-primary">{nomeVez}</b> está escolhendo uma palavra...
                    </p>
                  ))}
                {e.fase === 'resposta' &&
                  (euSouAVez ? (
                    <CaixaResposta key={`${e.n}-${nReveladas}`} salaId={salaId} onErro={setErro} />
                  ) : (
                    <p className="text-center text-sm text-secondary">
                      <b className="text-primary">{nomeVez}</b> está tentando responder...
                    </p>
                  ))}
                {erro && <p className="mt-2 text-center text-xs text-danger">{erro}</p>}
              </motion.div>
            </AnimatePresence>
          </>
        )}

        <Placar ordem={e.ordem} placar={e.placar} acertos={e.acertos} vez={e.fase === 'resultado' ? null : e.vez} nomes={nomes} userId={userId} />
      </div>
    </div>
  )
}
