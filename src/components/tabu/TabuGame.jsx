import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, Ban, Check, Minus, Plus, SkipForward } from 'lucide-react'
import { categoriasTabu, sortearCartas } from '../../data/tabuBank.js'

export default function TabuGame({ players, onBack }) {
  const [phase, setPhase] = useState('setup')
  const [tempoRodada, setTempoRodada] = useState(90)
  const [categoriasAtivas, setCategoriasAtivas] = useState(categoriasTabu)

  const [rodadaIndex, setRodadaIndex] = useState(0)
  const [usedCards, setUsedCards] = useState([])
  const [cartas, setCartas] = useState([])
  const [cardIndex, setCardIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [scores, setScores] = useState({})
  const [roundAcertos, setRoundAcertos] = useState(0)

  const descritorNome = players[rodadaIndex % players.length]
  const adivinhadorNome = players[(rodadaIndex + 1) % players.length]

  useEffect(() => {
    if (phase !== 'ativa') return
    if (secondsLeft <= 0) {
      setPhase('fim-rodada')
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, secondsLeft])

  function toggleCategoria(cat) {
    setCategoriasAtivas((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    )
  }

  function prepararRodada() {
    const novasCartas = sortearCartas(
      categoriasAtivas.length > 0 ? categoriasAtivas : categoriasTabu,
      usedCards,
    )
    setUsedCards((u) => [...u, ...novasCartas.map((c) => c.palavra)])
    setCartas(novasCartas)
    setCardIndex(0)
    setRoundAcertos(0)
    setPhase('pronto')
  }

  function iniciarCronometro() {
    setSecondsLeft(tempoRodada)
    setPhase('ativa')
  }

  function avancarCarta() {
    if (cardIndex + 1 < cartas.length) {
      setCardIndex((i) => i + 1)
    } else {
      setPhase('fim-rodada')
    }
  }

  function marcarAcerto() {
    setScores((prev) => ({
      ...prev,
      [adivinhadorNome]: (prev[adivinhadorNome] || 0) + 1,
      [descritorNome]: (prev[descritorNome] || 0) + 1,
    }))
    setRoundAcertos((n) => n + 1)
    avancarCarta()
  }

  function proximaDupla() {
    setRodadaIndex((i) => i + 1)
    setPhase('pronto')
    setCartas([])
  }

  if (phase === 'setup') {
    return (
      <div className="flex min-h-[100dvh] flex-col px-6 py-8">
        <div className="mx-auto w-full max-w-sm flex-1">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-secondary">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="mt-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-glow">
              <Ban className="h-7 w-7 text-accent" />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Configurar Tabu</h1>
          </div>

          <p className="mt-8 text-xs font-medium uppercase tracking-widest text-muted">
            Tempo por rodada
          </p>
          <div className="mt-3 flex items-center gap-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setTempoRodada((t) => Math.max(30, t - 15))}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-strong"
            >
              <Minus className="h-5 w-5" />
            </motion.button>
            <span className="w-16 text-center text-3xl font-bold tabular-nums">
              {tempoRodada}s
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setTempoRodada((t) => Math.min(180, t + 15))}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-strong"
            >
              <Plus className="h-5 w-5" />
            </motion.button>
          </div>

          <p className="mt-8 text-xs font-medium uppercase tracking-widest text-muted">
            Categorias ativas
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {categoriasTabu.map((cat) => {
              const ativa = categoriasAtivas.includes(cat)
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategoria(cat)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                    ativa
                      ? 'border-accent bg-accent-glow text-primary'
                      : 'border-border bg-surface text-secondary'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>
        <div className="mx-auto w-full max-w-sm pt-6">
          <motion.button
            whileTap={{ scale: categoriasAtivas.length > 0 ? 0.97 : 1 }}
            disabled={categoriasAtivas.length === 0}
            onClick={prepararRodada}
            className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-30"
          >
            Começar
          </motion.button>
        </div>
      </div>
    )
  }

  if (phase === 'pronto') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <div className="w-full max-w-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            Passe o celular para
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{descritorNome}</h1>
          <p className="mt-2 text-sm text-secondary">
            Você vai descrever as palavras sem falar as proibidas.{' '}
            <span className="font-semibold text-primary">{adivinhadorNome}</span> tenta
            adivinhar — os outros só podem escutar.
          </p>
          {cartas.length === 0 ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={prepararRodada}
              className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
            >
              Sortear cartas
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={iniciarCronometro}
              className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
            >
              Ver carta e iniciar cronômetro
            </motion.button>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'ativa') {
    const carta = cartas[cardIndex]
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>
              Carta {cardIndex + 1} de {cartas.length}
            </span>
            <span className={`font-bold tabular-nums ${secondsLeft <= 10 ? 'text-danger' : 'text-primary'}`}>
              {secondsLeft}s
            </span>
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight">{carta.palavra}</h1>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border-strong bg-elevated">
            <p className="border-b border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-danger">
              Não pode falar
            </p>
            {carta.proibidas.map((p, i) => (
              <div
                key={p}
                className={`flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-primary ${
                  i < carta.proibidas.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <Ban className="h-3.5 w-3.5 shrink-0 text-danger" />
                {p}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={marcarAcerto}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-success/15 px-6 py-4 text-sm font-semibold text-success"
            >
              <Check className="h-5 w-5" /> Acertou
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={avancarCarta}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-strong px-6 py-4 text-sm font-semibold text-secondary"
            >
              <SkipForward className="h-5 w-5" /> Pular / falou proibida
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'fim-rodada') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight">Fim da rodada</h1>
          <p className="mt-2 text-sm text-secondary">
            {descritorNome} e {adivinhadorNome} acertaram {roundAcertos} de {cartas.length}{' '}
            cartas.
          </p>
          <div className="mt-8 flex flex-col gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={proximaDupla}
              className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
            >
              Próxima dupla
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
        <div className="mx-auto w-full max-w-sm flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Placar</h1>
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
            onClick={proximaDupla}
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
