import { useState } from 'react'
import { motion } from 'motion/react'
import { HelpCircle, Target } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'
import GuessInput from './GuessInput.jsx'
import { formatNumero, sortearPergunta } from '../../data/palpiteBank.js'

export default function PalpiteGame({ players, onBack }) {
  const [usedPerguntas, setUsedPerguntas] = useState([])
  const [rodada, setRodada] = useState(() => sortearPergunta([]))
  const [phase, setPhase] = useState('pergunta')
  const [guessIndex, setGuessIndex] = useState(0)
  const [palpites, setPalpites] = useState([])
  const [scores, setScores] = useState({})
  const [ultimoResultado, setUltimoResultado] = useState(null)

  function iniciarPalpites() {
    setGuessIndex(0)
    setPalpites([])
    setPhase('palpite')
  }

  function computarResultado(todosPalpites) {
    const resposta = rodada.resposta
    const diffs = todosPalpites.map((v) => Math.abs(v - resposta))
    const exatosIdx = todosPalpites
      .map((v, i) => (v === resposta ? i : -1))
      .filter((i) => i >= 0)

    let vencedoresIdx
    let tipo
    if (exatosIdx.length > 0) {
      vencedoresIdx = exatosIdx
      tipo = 'exato'
    } else {
      const minDiff = Math.min(...diffs)
      vencedoresIdx = diffs.map((d, i) => (d === minDiff ? i : -1)).filter((i) => i >= 0)
      tipo = 'proximo'
    }

    setScores((prev) => {
      const next = { ...prev }
      vencedoresIdx.forEach((i) => {
        next[players[i]] = (next[players[i]] || 0) + (tipo === 'exato' ? 2 : 1)
      })
      return next
    })
    setPalpites(todosPalpites)
    setUltimoResultado({ tipo, vencedoresIdx, diffs })
    setPhase('revelacao')
  }

  function registrarPalpite(valor) {
    const novosPalpites = [...palpites, valor]
    if (guessIndex + 1 < players.length) {
      setPalpites(novosPalpites)
      setGuessIndex((i) => i + 1)
      return
    }
    computarResultado(novosPalpites)
  }

  function proximaPergunta() {
    const novosUsados = [...usedPerguntas, rodada.pergunta]
    setUsedPerguntas(novosUsados)
    setRodada(sortearPergunta(novosUsados))
    setGuessIndex(0)
    setPalpites([])
    setUltimoResultado(null)
    setPhase('pergunta')
  }

  if (phase === 'pergunta') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-glow">
              <HelpCircle className="h-7 w-7 text-accent" />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-widest text-muted">
              {rodada.categoria}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">{rodada.pergunta}</h1>
            <p className="mt-3 text-sm text-secondary">
              Ninguém sabe a resposta certa — é chute educado mesmo. Discutam em voz alta se
              quiserem, depois cada um dá o palpite em segredo.
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={iniciarPalpites}
            className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Começar palpites
          </motion.button>
        </div>
      </div>
    )
  }

  if (phase === 'palpite') {
    return (
      <GuessInput
        playerName={players[guessIndex]}
        index={guessIndex}
        total={players.length}
        pergunta={rodada.pergunta}
        onGuess={registrarPalpite}
        onExit={onBack}
      />
    )
  }

  if (phase === 'revelacao') {
    const ordenados = players
      .map((nome, i) => ({ nome, valor: palpites[i], diff: ultimoResultado.diffs[i] }))
      .sort((a, b) => a.diff - b.diff)

    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-secondary">
            A resposta certa era
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-accent">
            {formatNumero(rodada.resposta)}
          </h1>
          <p className="mt-1 text-sm text-secondary">{rodada.unidade}</p>

          <ul className="mt-6 flex flex-col gap-2 text-left">
            {ordenados.map(({ nome, valor, diff }) => {
              const venceu = ultimoResultado.vencedoresIdx.includes(players.indexOf(nome))
              return (
                <li
                  key={nome}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    venceu ? 'border-success/40 bg-success/10' : 'border-border bg-surface'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {venceu && (
                      <span className="text-success">
                        {ultimoResultado.tipo === 'exato' ? '🎯' : '⭐'}
                      </span>
                    )}
                    {nome}
                  </span>
                  <span className="text-right text-sm">
                    <span className="font-bold tabular-nums text-primary">
                      {formatNumero(valor)}
                    </span>
                    <span className="ml-2 text-xs text-muted">
                      dif. {formatNumero(diff)}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>

          <p className="mt-4 text-xs text-secondary">
            {ultimoResultado.tipo === 'exato'
              ? '🎯 Acertou em cheio — vale 2 pontos.'
              : '⭐ Ficou mais perto — vale 1 ponto.'}
          </p>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setPhase('placar')}
            className="mt-6 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
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
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-glow">
              <Target className="h-6 w-6 text-accent" />
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">Placar</h1>
          </div>
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
            onClick={proximaPergunta}
            className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Próxima pergunta
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
