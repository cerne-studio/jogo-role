import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, Check, Minus, Plus, SkipForward, Theater } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'
import { categorias, sortearPalavras } from '../../data/mimicaBank.js'

export default function MimicaGame({ players, onBack }) {
  const [phase, setPhase] = useState('setup')
  const [tempoRodada, setTempoRodada] = useState(60)
  const [categoriasAtivas, setCategoriasAtivas] = useState(categorias)

  const [mimicoIndex, setMimicoIndex] = useState(0)
  const [usedWords, setUsedWords] = useState([])
  const [palavras, setPalavras] = useState([])
  const [wordIndex, setWordIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [scores, setScores] = useState({})
  const [roundAcertos, setRoundAcertos] = useState(0)
  const [escolhendoQuem, setEscolhendoQuem] = useState(false)

  const mimicoNome = players[mimicoIndex]
  const outrosJogadores = players.filter((_, i) => i !== mimicoIndex)

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
    const novasPalavras = sortearPalavras(
      categoriasAtivas.length > 0 ? categoriasAtivas : categorias,
      usedWords,
    )
    setUsedWords((u) => [...u, ...novasPalavras])
    setPalavras(novasPalavras)
    setWordIndex(0)
    setRoundAcertos(0)
    setPhase('pronto')
  }

  function iniciarCronometro() {
    setSecondsLeft(tempoRodada)
    setPhase('ativa')
  }

  function avancarPalavra() {
    if (wordIndex + 1 < palavras.length) {
      setWordIndex((i) => i + 1)
    } else {
      setPhase('fim-rodada')
    }
  }

  function marcarAcerto(nomeQuemAdivinhou) {
    setScores((prev) => ({
      ...prev,
      [nomeQuemAdivinhou]: (prev[nomeQuemAdivinhou] || 0) + 1,
      [mimicoNome]: (prev[mimicoNome] || 0) + 1,
    }))
    setRoundAcertos((n) => n + 1)
    setEscolhendoQuem(false)
    avancarPalavra()
  }

  function proximoMimico() {
    setMimicoIndex((i) => (i + 1) % players.length)
    setPhase('pronto')
    setPalavras([])
  }

  if (phase === 'setup') {
    return (
      <div className="flex min-h-[100dvh] flex-col px-6 py-8">
        <ExitButton onExit={onBack} />
        <div className="mx-auto w-full max-w-sm flex-1">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-secondary">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="mt-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-glow">
              <Theater className="h-7 w-7 text-accent" />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Configurar Mímica</h1>
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
              onClick={() => setTempoRodada((t) => Math.min(120, t + 15))}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-strong"
            >
              <Plus className="h-5 w-5" />
            </motion.button>
          </div>

          <p className="mt-8 text-xs font-medium uppercase tracking-widest text-muted">
            Categorias ativas
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {categorias.map((cat) => {
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
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            Passe o celular para
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{mimicoNome}</h1>
          <p className="mt-2 text-sm text-secondary">
            Você vai mimicar. Ninguém mais pode ver a tela.
          </p>
          {palavras.length === 0 ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={prepararRodada}
              className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
            >
              Sortear palavras
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={iniciarCronometro}
              className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
            >
              Ver palavras e iniciar cronômetro
            </motion.button>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'ativa') {
    if (escolhendoQuem) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
          <ExitButton onExit={onBack} />
          <div className="w-full max-w-sm">
            <h1 className="text-xl font-bold tracking-tight">Quem adivinhou?</h1>
            <div className="mt-6 flex flex-col gap-2">
              {outrosJogadores.map((nome) => (
                <motion.button
                  key={nome}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => marcarAcerto(nome)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium"
                >
                  {nome}
                </motion.button>
              ))}
            </div>
            <button
              onClick={() => setEscolhendoQuem(false)}
              className="mt-4 text-sm text-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>
              Palavra {wordIndex + 1} de {palavras.length}
            </span>
            <span className={`font-bold tabular-nums ${secondsLeft <= 10 ? 'text-danger' : 'text-primary'}`}>
              {secondsLeft}s
            </span>
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight">{palavras[wordIndex]}</h1>

          <div className="mt-10 flex flex-col gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setEscolhendoQuem(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-success/15 px-6 py-4 text-sm font-semibold text-success"
            >
              <Check className="h-5 w-5" /> Acertou
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={avancarPalavra}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-strong px-6 py-4 text-sm font-semibold text-secondary"
            >
              <SkipForward className="h-5 w-5" /> Pular
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'fim-rodada') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight">Fim da rodada</h1>
          <p className="mt-2 text-sm text-secondary">
            {mimicoNome} acertou {roundAcertos} de {palavras.length} palavras.
          </p>
          <div className="mt-8 flex flex-col gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={proximoMimico}
              className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
            >
              Próximo mímico
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
            onClick={proximoMimico}
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
