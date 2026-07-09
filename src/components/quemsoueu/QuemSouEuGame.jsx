import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, EyeOff, Lock } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'
import { sortearPersonagens } from '../../data/personagensBank.js'

export default function QuemSouEuGame({ players, onBack }) {
  const [personagens] = useState(() => sortearPersonagens(players.length))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revelado, setRevelado] = useState(false)
  const [phase, setPhase] = useState('mostrar')
  const [ultimoResultado, setUltimoResultado] = useState(null)
  const [scores, setScores] = useState({})

  const jogadorAtual = players[currentIndex]
  const personagemAtual = personagens[currentIndex]

  function confirmar(acertou) {
    if (acertou) {
      setScores((prev) => ({ ...prev, [jogadorAtual]: (prev[jogadorAtual] || 0) + 1 }))
    }
    setUltimoResultado(acertou)
    setPhase('resultado')
  }

  function proximoJogador() {
    setCurrentIndex((i) => (i + 1) % players.length)
    setRevelado(false)
    setPhase('mostrar')
  }

  if (phase === 'mostrar') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10">
        <ExitButton onExit={onBack} />
        <AnimatePresence mode="wait">
          {!revelado ? (
            <motion.div
              key="locked"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="w-full max-w-sm text-center"
            >
              <p className="text-xs font-medium uppercase tracking-widest text-muted">
                É a vez de
              </p>
              <div className="mt-6 flex flex-col items-center gap-5 rounded-2xl border border-border bg-surface px-8 py-14 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-glow">
                  <Lock className="h-7 w-7 text-accent" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">{jogadorAtual}</h1>
                <p className="text-sm text-secondary">
                  {jogadorAtual}, feche os olhos ou vire de costas agora — o resto do
                  grupo vai ver seu personagem.
                </p>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setRevelado(true)}
                  className="mt-2 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
                >
                  Prontos, mostrar personagem
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
                <p className="text-xs font-medium uppercase tracking-widest text-danger">
                  Não mostrem pra {jogadorAtual}
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight">{personagemAtual}</h2>
                <p className="mt-4 text-sm text-secondary">
                  Mostrem a tela pro resto do grupo.
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setPhase('perguntas')}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-white/5 px-6 py-4 text-base font-semibold text-primary"
              >
                <EyeOff className="h-5 w-5" />
                Todo mundo viu, esconder
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (phase === 'perguntas') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight">{jogadorAtual} pergunta</h1>
          <p className="mt-2 text-sm text-secondary">
            Faça perguntas de sim/não pro grupo pra tentar descobrir quem você é. Sem
            pressa — quando achar que sabe, toque abaixo.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setPhase('confirmacao')}
            className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Vou tentar adivinhar
          </motion.button>
        </div>
      </div>
    )
  }

  if (phase === 'confirmacao') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight">
            {jogadorAtual} disse quem acha que é
          </h1>
          <p className="mt-2 text-sm text-secondary">O grupo confirma: acertou?</p>
          <div className="mt-6 flex flex-col gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => confirmar(true)}
              className="w-full rounded-xl bg-success/15 px-6 py-4 text-sm font-semibold text-success"
            >
              ✅ Acertou
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => confirmar(false)}
              className="w-full rounded-xl bg-danger/15 px-6 py-4 text-sm font-semibold text-danger"
            >
              ❌ Não acertou
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'resultado') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <h1 className={`text-2xl font-bold tracking-tight ${ultimoResultado ? 'text-success' : 'text-danger'}`}>
            {ultimoResultado ? 'Acertou!' : 'Não era dessa vez'}
          </h1>
          <p className="mt-2 text-sm text-secondary">
            {jogadorAtual} era <span className="font-semibold text-primary">{personagemAtual}</span>
          </p>
          <div className="mt-8 flex flex-col gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={proximoJogador}
              className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
            >
              Próximo jogador
            </motion.button>
            <button onClick={() => setPhase('placar')} className="text-sm text-secondary">
              Ver placar
            </button>
          </div>
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
            onClick={proximoJogador}
            className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Continuar jogando
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
