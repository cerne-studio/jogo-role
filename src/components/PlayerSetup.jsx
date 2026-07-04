import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Plus, X } from 'lucide-react'

export default function PlayerSetup({ gameName, minPlayers, maxPlayers, onBack, onStart }) {
  const [players, setPlayers] = useState([])
  const [nameInput, setNameInput] = useState('')

  function addPlayer() {
    const nome = nameInput.trim()
    if (!nome) return
    if (maxPlayers && players.length >= maxPlayers) return
    setPlayers((p) => [...p, nome])
    setNameInput('')
  }

  function removePlayer(i) {
    setPlayers((p) => p.filter((_, idx) => idx !== i))
  }

  const canStart = players.length >= minPlayers && (!maxPlayers || players.length <= maxPlayers)

  return (
    <div className="flex min-h-[100dvh] flex-col px-6 py-8">
      <div className="mx-auto w-full max-w-sm flex-1">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-secondary">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <h1 className="mt-4 text-2xl font-bold tracking-tight">{gameName}</h1>
        <p className="mt-1 text-sm text-secondary">
          Quem vai jogar? Mínimo {minPlayers}
          {maxPlayers ? ` · máximo ${maxPlayers}` : ''}.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            addPlayer()
          }}
          className="mt-6 flex gap-2"
        >
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Nome do jogador"
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
            autoFocus
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-black"
          >
            <Plus className="h-5 w-5" />
          </motion.button>
        </form>

        <ul className="mt-4 flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {players.map((name, i) => (
              <motion.li
                key={name + i}
                initial={{ opacity: 0, x: -8, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 8, height: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
              >
                <span className="text-sm font-medium">
                  <span className="mr-2 text-muted">{i + 1}.</span>
                  {name}
                </span>
                <button onClick={() => removePlayer(i)} className="text-muted">
                  <X className="h-4 w-4" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      <div className="mx-auto w-full max-w-sm pt-6">
        <motion.button
          whileTap={{ scale: canStart ? 0.97 : 1 }}
          disabled={!canStart}
          onClick={() => onStart(players)}
          className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-30"
        >
          {canStart ? 'Continuar' : `Faltam ${Math.max(0, minPlayers - players.length)} jogador(es)`}
        </motion.button>
      </div>
    </div>
  )
}
