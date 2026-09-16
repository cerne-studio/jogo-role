import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Lock, Plus, X } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'

export default function PapelitoCollect({ playerName, index, total, quantidade, onSubmit, onExit }) {
  const [revealed, setRevealed] = useState(false)
  const [palavras, setPalavras] = useState([])
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    setRevealed(false)
    setPalavras([])
    setInputValue('')
  }, [playerName])

  function adicionar() {
    const valor = inputValue.trim()
    if (!valor || palavras.length >= quantidade) return
    setPalavras((p) => [...p, valor])
    setInputValue('')
  }

  function remover(i) {
    setPalavras((p) => p.filter((_, idx) => idx !== i))
  }

  function confirmar() {
    if (palavras.length !== quantidade) return
    const palavrasConfirmadas = palavras
    setRevealed(false)
    setPalavras([])
    setInputValue('')
    onSubmit(palavrasConfirmadas)
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
              Papelitos {index + 1} de {total}
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
                onClick={() => setRevealed(true)}
                className="mt-2 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
              >
                Sou eu, escrever
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
            animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
            className="w-full max-w-sm text-center"
          >
            <div className="rounded-2xl border border-border-strong bg-elevated px-6 py-8">
              <p className="text-xs font-medium uppercase tracking-widest text-secondary">
                Escreva {quantidade} nomes ou palavras
              </p>
              <p className="mt-1 text-xs text-muted">
                Pessoas famosas, personagens, o que quiser. Ninguém mais vai ver quem escreveu o quê.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  adicionar()
                }}
                className="mt-5 flex gap-2"
              >
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ex: Shrek"
                  disabled={palavras.length >= quantidade}
                  autoFocus
                  className="flex-1 rounded-xl border border-border-strong bg-white/5 px-4 py-3 text-sm outline-none focus:border-accent disabled:opacity-40"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={palavras.length >= quantidade}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-black disabled:opacity-30"
                >
                  <Plus className="h-5 w-5" />
                </motion.button>
              </form>

              <ul className="mt-4 flex flex-col gap-2 text-left">
                <AnimatePresence initial={false}>
                  {palavras.map((p, i) => (
                    <motion.li
                      key={p + i}
                      initial={{ opacity: 0, x: -8, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 8, height: 0 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                      className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-2.5"
                    >
                      <span className="text-sm font-medium">{p}</span>
                      <button onClick={() => remover(i)} className="text-muted">
                        <X className="h-4 w-4" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              <p className="mt-4 text-xs font-medium tabular-nums text-muted">
                {palavras.length} de {quantidade}
              </p>

              <motion.button
                whileTap={{ scale: palavras.length === quantidade ? 0.97 : 1 }}
                disabled={palavras.length !== quantidade}
                onClick={confirmar}
                className="mt-4 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-30"
              >
                Pronto, esconder e passar
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
