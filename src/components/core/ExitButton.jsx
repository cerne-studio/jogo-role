import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'

/**
 * Botão de saída fixo, presente em qualquer fase de qualquer jogo.
 * Confirma antes de sair pra não derrubar a partida com um toque sem querer.
 */
export default function ExitButton({ onExit }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setConfirming(true)}
        aria-label="Sair do jogo"
        className="fixed right-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-surface/90 text-secondary backdrop-blur"
      >
        <X className="h-4 w-4" />
      </motion.button>

      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="w-full max-w-xs rounded-2xl border border-border-strong bg-elevated p-6 text-center"
            >
              <h2 className="text-lg font-semibold tracking-tight">Sair do jogo?</h2>
              <p className="mt-2 text-sm text-secondary">
                O progresso dessa partida vai se perder.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onExit}
                  className="w-full rounded-xl bg-danger px-6 py-3 text-sm font-semibold text-white"
                >
                  Sair
                </motion.button>
                <button
                  onClick={() => setConfirming(false)}
                  className="w-full rounded-xl px-6 py-3 text-sm text-secondary"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
