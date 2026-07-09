import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Lock } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'

const AUTO_DEFAULT_SECONDS = 15

/**
 * Mesma primitiva de "revela e passa", mas a ação de votar já é o que
 * esconde e passa — sem contador de progresso visível pro grupo, pra
 * não vazar quem já votou ou hesitação de ninguém.
 */
export default function SecretVote({ playerName, index, total, isTraidor, onVote, onExit }) {
  const [revealed, setRevealed] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(AUTO_DEFAULT_SECONDS)

  useEffect(() => {
    setRevealed(false)
    setSecondsLeft(AUTO_DEFAULT_SECONDS)
  }, [playerName])

  useEffect(() => {
    if (!revealed) return
    if (secondsLeft <= 0) {
      onVote(false)
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, secondsLeft])

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10">
      {onExit && <ExitButton onExit={onExit} />}
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="locked"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="w-full max-w-sm text-center"
          >
            <p className="text-xs font-medium uppercase tracking-widest text-muted">
              Voto secreto da missão
            </p>
            <div className="mt-6 flex flex-col items-center gap-5 rounded-2xl border border-border bg-surface px-8 py-14 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-glow">
                <Lock className="h-7 w-7 text-accent" />
              </div>
              <div>
                <p className="text-sm text-secondary">Passe o celular para</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">{playerName}</h1>
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setRevealed(true)
                  setSecondsLeft(AUTO_DEFAULT_SECONDS)
                }}
                className="mt-2 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
              >
                Sou eu, votar
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="w-full max-w-sm text-center"
          >
            <div className="rounded-2xl border border-border-strong bg-elevated px-8 py-12 shadow-[0_20px_60px_-20px_rgba(245,158,11,0.2)]">
              {isTraidor ? (
                <>
                  <p className="text-xs font-medium uppercase tracking-widest text-danger">
                    Você é traidor
                  </p>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight">
                    Vote no destino da missão
                  </h2>
                  <div className="mt-6 flex flex-col gap-2">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onVote(false)}
                      className="w-full rounded-xl bg-success/15 px-6 py-4 text-sm font-semibold text-success"
                    >
                      ✅ Sucesso
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onVote(true)}
                      className="w-full rounded-xl bg-danger/15 px-6 py-4 text-sm font-semibold text-danger"
                    >
                      💣 Sabotar
                    </motion.button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium uppercase tracking-widest text-secondary">
                    Você é leal
                  </p>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight">
                    Só pode votar sucesso
                  </h2>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onVote(false)}
                    className="mt-6 w-full rounded-xl bg-accent px-6 py-4 text-sm font-semibold text-black"
                  >
                    Confirmar sucesso
                  </motion.button>
                </>
              )}
            </div>
            <p className="mt-4 text-xs text-muted">
              Jogador {index + 1} de {total} nesta missão
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
