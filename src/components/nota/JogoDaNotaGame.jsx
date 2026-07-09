import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import PassDevice from '../core/PassDevice.jsx'
import ExitButton from '../core/ExitButton.jsx'
import SecretGuess from './SecretGuess.jsx'

export default function JogoDaNotaGame({ players, onBack }) {
  const [phase, setPhase] = useState('distribuir-nota')
  const [donoIndex, setDonoIndex] = useState(0)
  const [nota, setNota] = useState(() => Math.floor(Math.random() * 11))
  const [guessIndex, setGuessIndex] = useState(0)
  const [palpites, setPalpites] = useState([])
  const [scores, setScores] = useState({})

  const donoNome = players[donoIndex]
  const outrosJogadores = players.filter((_, i) => i !== donoIndex)

  function registrarPalpite(valor) {
    const novosPalpites = [...palpites, valor]
    if (guessIndex + 1 < outrosJogadores.length) {
      setPalpites(novosPalpites)
      setGuessIndex((i) => i + 1)
      return
    }
    const acertadores = outrosJogadores.filter((_, i) => novosPalpites[i] === nota)
    setPalpites(novosPalpites)
    setScores((prev) => {
      const next = { ...prev }
      if (acertadores.length > 0) {
        next[donoNome] = (next[donoNome] || 0) + acertadores.length
        acertadores.forEach((nome) => {
          next[nome] = (next[nome] || 0) + 1
        })
      }
      return next
    })
    setPhase('revelacao')
  }

  function proximoDono() {
    setDonoIndex((i) => (i + 1) % players.length)
    setNota(Math.floor(Math.random() * 11))
    setGuessIndex(0)
    setPalpites([])
    setPhase('distribuir-nota')
  }

  if (phase === 'distribuir-nota') {
    return (
      <PassDevice
        playerName={donoNome}
        index={donoIndex}
        total={players.length}
        onExit={onBack}
        onDone={() => setPhase('perguntas')}
      >
        <p className="text-xs font-medium uppercase tracking-widest text-secondary">
          Sua nota secreta é
        </p>
        <h2 className="mt-3 text-5xl font-bold tracking-tight text-accent">{nota}</h2>
        <p className="mt-4 text-sm text-secondary">
          Responda as perguntas dos outros com sinceridade, sem entregar o número.
        </p>
      </PassDevice>
    )
  }

  if (phase === 'perguntas') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight">Perguntem pra {donoNome}</h1>
          <p className="mt-2 text-sm text-secondary">
            O resto do grupo faz perguntas em voz alta pra tentar descobrir a nota. Sem
            pressa — quando acharem que sabem, toquem abaixo.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setPhase('palpites')}
            className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Ir pros palpites
          </motion.button>
        </div>
      </div>
    )
  }

  if (phase === 'palpites') {
    return (
      <SecretGuess
        playerName={outrosJogadores[guessIndex]}
        index={guessIndex}
        total={outrosJogadores.length}
        onGuess={registrarPalpite}
        onExit={onBack}
      />
    )
  }

  if (phase === 'revelacao') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-secondary">
            A nota de {donoNome} era
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-accent">{nota}</h1>

          <ul className="mt-6 flex flex-col gap-2 text-left">
            {outrosJogadores.map((nome, i) => {
              const acertou = palpites[i] === nota
              return (
                <li
                  key={nome}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    acertou ? 'border-success/40 bg-success/10' : 'border-border bg-surface'
                  }`}
                >
                  <span className="text-sm font-medium">{nome}</span>
                  <span className={`text-sm font-bold tabular-nums ${acertou ? 'text-success' : 'text-secondary'}`}>
                    {palpites[i]} {acertou ? '✅' : ''}
                  </span>
                </li>
              )
            })}
          </ul>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setPhase('placar')}
            className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Ver placar
          </motion.button>
        </div>
      </div>
    )
  }

  if (phase === 'placar') {
    const ordenado = [...players].sort((a, b) => (scores[b] || 0) - (scores[a] || 0))
    return (
      <div className="flex min-h-[100dvh] flex-col px-6 py-8">
        <ExitButton onExit={onBack} />
        <div className="mx-auto w-full max-w-sm flex-1">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-secondary">
            <ArrowLeft className="h-4 w-4" /> Sair
          </button>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Placar</h1>
          <ul className="mt-6 flex flex-col gap-2">
            {ordenado.map((name) => (
              <li
                key={name}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
              >
                <span className="text-sm font-medium">{name}</span>
                <span className="text-sm font-bold tabular-nums text-accent">
                  {scores[name] || 0}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-col gap-2 pt-6">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={proximoDono}
            className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Próxima rodada
          </motion.button>
          <button onClick={onBack} className="w-full rounded-xl px-6 py-3 text-sm text-secondary">
            Encerrar jogo
          </button>
        </div>
      </div>
    )
  }

  return null
}
