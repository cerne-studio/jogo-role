import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Lock, EyeOff } from 'lucide-react'
import ExitButton from './ExitButton.jsx'

const AUTO_HIDE_SECONDS = 12

/**
 * Primitiva de "revela e passa": tela neutra bloqueada por padrão,
 * exige toque explícito pra revelar, e esconde sozinha (auto-hide)
 * se ninguém apertar o botão — nunca depende de alguém lembrar.
 */
export default function PassDevice({ playerName, index, total, children, onDone, onExit }) {
  const [revealed, setRevealed] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(AUTO_HIDE_SECONDS)

  useEffect(() => {
    setRevealed(false)
    setSecondsLeft(AUTO_HIDE_SECONDS)
  }, [playerName])

  useEffect(() => {
    if (!revealed) return
    if (secondsLeft <= 0) {
      handleHide()
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, secondsLeft])

  function handleHide() {
    setRevealed(false)
    onDone()
  }

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
              Jogador {index + 1} de {total}
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
                  setSecondsLeft(AUTO_HIDE_SECONDS)
                }}
                className="mt-2 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
              >
                Sou eu, revelar
              </motion.button>
              <p className="text-xs text-muted">
                Só toque se ninguém mais estiver olhando pra tela.
              </p>
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
              {children}
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleHide}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-white/5 px-6 py-4 text-base font-semibold text-primary"
            >
              <EyeOff className="h-5 w-5" />
              Esconder e passar ({secondsLeft}s)
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
