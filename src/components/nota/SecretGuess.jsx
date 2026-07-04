import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Lock } from 'lucide-react'

const AUTO_DEFAULT_SECONDS = 20
const NUMEROS = Array.from({ length: 11 }, (_, i) => i)

export default function SecretGuess({ playerName, index, total, onGuess }) {
  const [revealed, setRevealed] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(AUTO_DEFAULT_SECONDS)

  useEffect(() => {
    setRevealed(false)
    setSecondsLeft(AUTO_DEFAULT_SECONDS)
  }, [playerName])

  useEffect(() => {
    if (!revealed) return
    if (secondsLeft <= 0) {
      onGuess(5)
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, secondsLeft])

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10">
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
              Palpite {index + 1} de {total}
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
                Sou eu, palpitar
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
            <div className="rounded-2xl border border-border-strong bg-elevated px-6 py-10">
              <p className="text-xs font-medium uppercase tracking-widest text-secondary">
                Qual nota você acha que é?
              </p>
              <div className="mt-5 grid grid-cols-4 gap-2">
                {NUMEROS.map((n) => (
                  <motion.button
                    key={n}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => onGuess(n)}
                    className="flex h-14 items-center justify-center rounded-xl border border-border-strong bg-white/5 text-lg font-bold tabular-nums"
                  >
                    {n}
                  </motion.button>
                ))}
              </div>
            </div>
            <p className="mt-4 text-xs text-muted">
              Jogador {index + 1} de {total}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
