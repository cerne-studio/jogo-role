import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Check, Minus, Plus, Shuffle, SkipForward, StickyNote, Trophy } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'
import PapelitoCollect from './PapelitoCollect.jsx'

const ROUND_INFO = [
  {
    titulo: 'Rodada 1 — Descrição livre',
    dica: 'Descreva à vontade: frases, características, comparações. Só não vale falar a palavra escrita nem partes óbvias dela.',
  },
  {
    titulo: 'Rodada 2 — Uma palavra',
    dica: 'Agora só vale UMA palavra por papelito, sem completar depois. A equipe usa o que lembra da rodada anterior.',
  },
  {
    titulo: 'Rodada 3 — Mímica',
    dica: 'Nada de falar. Só gestos, expressões e encenação.',
  },
]

function embaralhar(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

function distribuirTimes(players) {
  const ordemAleatoria = embaralhar(players)
  const times = {}
  ordemAleatoria.forEach((nome, i) => {
    times[nome] = i % 2 === 0 ? 'A' : 'B'
  })
  return times
}

export default function PapelitosGame({ players, onBack }) {
  const [phase, setPhase] = useState('setup')
  const [times, setTimes] = useState(() => distribuirTimes(players))
  const [quantidade, setQuantidade] = useState(4)
  const [tempoTurno, setTempoTurno] = useState(60)

  const [coletaIndex, setColetaIndex] = useState(0)
  const [todosPapelitos, setTodosPapelitos] = useState([])

  const [rodada, setRodada] = useState(1)
  const [pool, setPool] = useState([])
  const [currentTeam, setCurrentTeam] = useState('A')
  const [giverIndex, setGiverIndex] = useState({ A: 0, B: 0 })
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [turnoAcertos, setTurnoAcertos] = useState(0)
  const [scores, setScores] = useState({ A: 0, B: 0 })
  const [roundStartScores, setRoundStartScores] = useState({ A: 0, B: 0 })
  const [roundResults, setRoundResults] = useState([])

  const teamA = players.filter((p) => times[p] === 'A')
  const teamB = players.filter((p) => times[p] === 'B')

  useEffect(() => {
    if (phase !== 'turno-ativo') return
    if (secondsLeft <= 0) {
      setPhase('turno-fim')
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, secondsLeft])

  function toggleTime(nome) {
    setTimes((t) => ({ ...t, [nome]: t[nome] === 'A' ? 'B' : 'A' }))
  }

  function receberPapelitos(palavras) {
    const novosTotais = [...todosPapelitos, ...palavras]
    if (coletaIndex + 1 < players.length) {
      setTodosPapelitos(novosTotais)
      setColetaIndex((i) => i + 1)
      return
    }
    setTodosPapelitos(novosTotais)
    setPool(embaralhar(novosTotais))
    setPhase('rodada-intro')
  }

  function comecarRodada() {
    setPool(embaralhar(todosPapelitos))
    setPhase('turno-pronto')
  }

  function iniciarCronometro() {
    setSecondsLeft(tempoTurno)
    setPhase('turno-ativo')
  }

  function marcarAcerto() {
    const novoPool = pool.slice(1)
    setScores((s) => ({ ...s, [currentTeam]: s[currentTeam] + 1 }))
    setTurnoAcertos((n) => n + 1)
    setPool(novoPool)
    if (novoPool.length === 0) {
      setPhase('fim-rodada')
    }
  }

  function pularPapelito() {
    setPool((p) => (p.length > 1 ? [...p.slice(1), p[0]] : p))
  }

  function passarTurno() {
    setGiverIndex((g) => ({ ...g, [currentTeam]: g[currentTeam] + 1 }))
    setCurrentTeam((t) => (t === 'A' ? 'B' : 'A'))
    setTurnoAcertos(0)
    setPhase('turno-pronto')
  }

  function registrarResultadoRodada() {
    setRoundResults((r) => [
      ...r,
      { rodada, A: scores.A - roundStartScores.A, B: scores.B - roundStartScores.B },
    ])
  }

  function proximaRodada() {
    registrarResultadoRodada()
    setRoundStartScores(scores)
    setRodada((r) => r + 1)
    setPool(embaralhar(todosPapelitos))
    setPhase('turno-pronto')
  }

  function verResultadoFinal() {
    registrarResultadoRodada()
    setPhase('final')
  }

  if (phase === 'setup') {
    const timesValidos = teamA.length > 0 && teamB.length > 0
    return (
      <div className="flex min-h-[100dvh] flex-col px-6 py-8">
        <ExitButton onExit={onBack} />
        <div className="mx-auto w-full max-w-sm flex-1">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-glow">
              <StickyNote className="h-7 w-7 text-accent" />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Configurar Papelitos</h1>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest text-muted">Times</p>
            <button
              onClick={() => setTimes(distribuirTimes(players))}
              className="flex items-center gap-1 text-xs font-medium text-accent"
            >
              <Shuffle className="h-3.5 w-3.5" /> Embaralhar
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {players.map((nome) => {
              const time = times[nome]
              return (
                <button
                  key={nome}
                  onClick={() => toggleTime(nome)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-left"
                >
                  <span className="text-sm font-medium">{nome}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      time === 'A' ? 'bg-accent-glow text-accent' : 'bg-success/15 text-success'
                    }`}
                  >
                    Time {time}
                  </span>
                </button>
              )
            })}
          </div>
          {!timesValidos && (
            <p className="mt-2 text-xs text-danger">Cada time precisa de pelo menos 1 jogador.</p>
          )}

          <p className="mt-8 text-xs font-medium uppercase tracking-widest text-muted">
            Papelitos por jogador
          </p>
          <div className="mt-3 flex items-center gap-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setQuantidade((q) => Math.max(3, q - 1))}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-strong"
            >
              <Minus className="h-5 w-5" />
            </motion.button>
            <span className="w-10 text-center text-3xl font-bold tabular-nums">{quantidade}</span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setQuantidade((q) => Math.min(6, q + 1))}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-strong"
            >
              <Plus className="h-5 w-5" />
            </motion.button>
          </div>

          <p className="mt-8 text-xs font-medium uppercase tracking-widest text-muted">
            Tempo por turno
          </p>
          <div className="mt-3 flex items-center gap-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setTempoTurno((t) => Math.max(30, t - 15))}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-strong"
            >
              <Minus className="h-5 w-5" />
            </motion.button>
            <span className="w-16 text-center text-3xl font-bold tabular-nums">{tempoTurno}s</span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setTempoTurno((t) => Math.min(90, t + 15))}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-strong"
            >
              <Plus className="h-5 w-5" />
            </motion.button>
          </div>
        </div>
        <div className="mx-auto w-full max-w-sm pt-6">
          <motion.button
            whileTap={{ scale: timesValidos ? 0.97 : 1 }}
            disabled={!timesValidos}
            onClick={() => {
              setColetaIndex(0)
              setTodosPapelitos([])
              setPhase('coleta')
            }}
            className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-30"
          >
            Continuar
          </motion.button>
        </div>
      </div>
    )
  }

  if (phase === 'coleta') {
    return (
      <PapelitoCollect
        playerName={players[coletaIndex]}
        index={coletaIndex}
        total={players.length}
        quantidade={quantidade}
        onSubmit={receberPapelitos}
        onExit={onBack}
      />
    )
  }

  if (phase === 'rodada-intro' || phase === 'turno-pronto' || phase === 'turno-ativo' || phase === 'turno-fim' || phase === 'fim-rodada' || phase === 'final') {
    const info = ROUND_INFO[rodada - 1]
    const giverTeam = currentTeam === 'A' ? teamA : teamB
    const giverName = giverTeam[giverIndex[currentTeam] % giverTeam.length]
    const outroTime = currentTeam === 'A' ? 'B' : 'A'

    if (phase === 'rodada-intro') {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
          <ExitButton onExit={onBack} />
          <div className="w-full max-w-sm">
            <p className="text-xs font-medium uppercase tracking-widest text-muted">
              {todosPapelitos.length} papelitos no pote
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">{info.titulo}</h1>
            <p className="mt-3 text-sm text-secondary">{info.dica}</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={comecarRodada}
              className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
            >
              Começar rodada
            </motion.button>
          </div>
        </div>
      )
    }

    if (phase === 'turno-pronto') {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
          <ExitButton onExit={onBack} />
          <div className="w-full max-w-sm">
            <p className="text-xs font-medium uppercase tracking-widest text-muted">
              Passe o celular para
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{giverName}</h1>
            <p
              className={`mt-1 text-sm font-semibold ${
                currentTeam === 'A' ? 'text-accent' : 'text-success'
              }`}
            >
              Time {currentTeam}
            </p>
            <p className="mt-3 text-sm text-secondary">{info.dica}</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={iniciarCronometro}
              className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
            >
              Ver papelito e iniciar cronômetro
            </motion.button>
          </div>
        </div>
      )
    }

    if (phase === 'turno-ativo') {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
          <ExitButton onExit={onBack} />
          <div className="w-full max-w-sm">
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>Faltam {pool.length} de {todosPapelitos.length}</span>
              <span
                className={`font-bold tabular-nums ${secondsLeft <= 10 ? 'text-danger' : 'text-primary'}`}
              >
                {secondsLeft}s
              </span>
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight">{pool[0]}</h1>
            <p className="mt-3 text-xs text-secondary">{info.dica}</p>

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
                onClick={pularPapelito}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-strong px-6 py-4 text-sm font-semibold text-secondary"
              >
                <SkipForward className="h-5 w-5" /> Pular
              </motion.button>
            </div>
          </div>
        </div>
      )
    }

    if (phase === 'turno-fim') {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
          <ExitButton onExit={onBack} />
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold tracking-tight">Tempo esgotado</h1>
            <p className="mt-2 text-sm text-secondary">
              Time {currentTeam} acertou {turnoAcertos} papelito(s) nesse turno.
            </p>
            <div className="mt-6 flex justify-center gap-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-accent">Time A</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{scores.A}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-success">Time B</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{scores.B}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted">Faltam {pool.length} papelitos nesta rodada.</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={passarTurno}
              className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
            >
              Passar pro Time {outroTime}
            </motion.button>
          </div>
        </div>
      )
    }

    if (phase === 'fim-rodada') {
      const pontosRodadaA = scores.A - roundStartScores.A
      const pontosRodadaB = scores.B - roundStartScores.B
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
          <ExitButton onExit={onBack} />
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold tracking-tight">Fim da {info.titulo.split(' — ')[0]}</h1>
            <p className="mt-2 text-sm text-secondary">Todos os papelitos foram acertados.</p>
            <div className="mt-6 flex justify-center gap-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-accent">Time A</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">+{pontosRodadaA}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-success">Time B</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">+{pontosRodadaB}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted">
              Total até aqui: Time A {scores.A} · Time B {scores.B}
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={rodada < 3 ? proximaRodada : verResultadoFinal}
              className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
            >
              {rodada < 3 ? `Iniciar Rodada ${rodada + 1}` : 'Ver resultado final'}
            </motion.button>
          </div>
        </div>
      )
    }

    if (phase === 'final') {
      const vencedor = scores.A === scores.B ? null : scores.A > scores.B ? 'A' : 'B'
      return (
        <div className="flex min-h-[100dvh] flex-col px-6 py-8">
          <ExitButton onExit={onBack} />
          <div className="mx-auto w-full max-w-sm flex-1">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-glow">
                <Trophy className="h-7 w-7 text-accent" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight">
                {vencedor ? `Time ${vencedor} venceu!` : 'Empate!'}
              </h1>
            </div>

            <div className="mt-6 flex justify-center gap-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-accent">Time A</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">{scores.A}</p>
                <p className="mt-1 text-xs text-muted">{teamA.join(', ')}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-success">Time B</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">{scores.B}</p>
                <p className="mt-1 text-xs text-muted">{teamB.join(', ')}</p>
              </div>
            </div>

            <p className="mt-8 text-xs font-medium uppercase tracking-widest text-muted">
              Pontos por rodada
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {roundResults.map((r) => (
                <li
                  key={r.rodada}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
                >
                  <span className="text-sm font-medium">Rodada {r.rodada}</span>
                  <span className="text-sm tabular-nums text-secondary">
                    <span className="text-accent">A {r.A}</span>
                    {' · '}
                    <span className="text-success">B {r.B}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-sm pt-6">
            <button onClick={onBack} className="w-full rounded-xl px-6 py-3 text-sm text-secondary">
              Encerrar jogo
            </button>
          </div>
        </div>
      )
    }
  }

  return null
}
