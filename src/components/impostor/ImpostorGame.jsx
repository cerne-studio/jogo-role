import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, Minus, Plus } from 'lucide-react'
import PassDevice from '../core/PassDevice.jsx'
import ExitButton from '../core/ExitButton.jsx'
import { sortearPalavra } from '../../data/wordBank.js'
import { embaralhar, sortearUm, vibrar } from '../../lib/aleatorio.js'
import { PERSONAGENS } from '../../assets/role/index.js'

function sortearPapeis(players, numImpostores) {
  const indices = embaralhar(players.map((_, i) => i))
  const impostores = new Set(indices.slice(0, numImpostores))
  return players.map((_, i) => (impostores.has(i) ? 'impostor' : 'normal'))
}

function formatarTempo(seg) {
  const m = Math.floor(seg / 60)
  const r = seg % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export default function ImpostorGame({ players, onBack }) {
  const [phase, setPhase] = useState('config')
  const [numImpostores, setNumImpostores] = useState(
    Math.max(1, Math.round(players.length * 0.25)),
  )
  const [roles, setRoles] = useState([])
  const [palavra, setPalavra] = useState(null)
  const [usedWords, setUsedWords] = useState([])
  const [revealIndex, setRevealIndex] = useState(0)
  const [scores, setScores] = useState({})
  const [quemComeca, setQuemComeca] = useState('')
  const [tempoDiscussao, setTempoDiscussao] = useState(null)

  const maxImpostores = Math.max(1, players.length - 2)

  // Cronômetro opcional da discussão: avisa (vibra) quando acaba
  useEffect(() => {
    if (phase !== 'discussao' || tempoDiscussao == null) return
    if (tempoDiscussao <= 0) {
      vibrar([300, 100, 300, 100, 300])
      return
    }
    const t = setTimeout(() => setTempoDiscussao((x) => x - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, tempoDiscussao])

  function iniciarRodada() {
    const { item, index } = sortearPalavra(usedWords)
    setUsedWords((u) => [...u, index])
    setPalavra(item)
    setRoles(sortearPapeis(players, numImpostores))
    setRevealIndex(0)
    setQuemComeca(sortearUm(players))
    setTempoDiscussao(null)
    setPhase('reveal')
  }

  function registrarPonto(vencedor) {
    setScores((prev) => {
      const next = { ...prev }
      players.forEach((name, i) => {
        const isImpostor = roles[i] === 'impostor'
        if (vencedor === 'grupo' && !isImpostor) next[name] = (next[name] || 0) + 1
        if (vencedor === 'impostor' && isImpostor) next[name] = (next[name] || 0) + 1
      })
      return next
    })
    setPhase('placar')
  }

  if (phase === 'config') {
    return (
      <div className="flex min-h-[100dvh] flex-col px-6 py-8">
        <ExitButton onExit={onBack} />
        <div className="mx-auto w-full max-w-sm flex-1">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-secondary">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="mt-8 flex flex-col items-center text-center">
            <img src={PERSONAGENS.impostor} alt="" className="h-28 w-28 object-contain" />
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Quantos impostores?</h1>
            <p className="mt-1 text-sm text-secondary">{players.length} jogadores na rodada</p>

            <div className="mt-8 flex items-center gap-6">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setNumImpostores((n) => Math.max(1, n - 1))}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-strong"
              >
                <Minus className="h-5 w-5" />
              </motion.button>
              <span className="w-12 text-center text-4xl font-bold tabular-nums">
                {numImpostores}
              </span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setNumImpostores((n) => Math.min(maxImpostores, n + 1))}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-strong"
              >
                <Plus className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-sm pt-6">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={iniciarRodada}
            className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Sortear e começar
          </motion.button>
        </div>
      </div>
    )
  }

  if (phase === 'reveal') {
    const isImpostor = roles[revealIndex] === 'impostor'
    return (
      <PassDevice
        playerName={players[revealIndex]}
        index={revealIndex}
        total={players.length}
        onExit={onBack}
        onDone={() => {
          if (revealIndex + 1 < players.length) {
            setRevealIndex((i) => i + 1)
          } else {
            setPhase('discussao')
          }
        }}
      >
        {isImpostor ? (
          <>
            <img src={PERSONAGENS.impostor} alt="" className="mx-auto mb-2 h-24 w-24 object-contain" />
            <p className="text-xs font-medium uppercase tracking-widest text-danger">
              Você é o impostor
            </p>
            <p className="mt-2 inline-block rounded-full border border-border px-3 py-1 text-[11px] text-secondary">Categoria: {palavra.categoria}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{palavra.impostor}</h2>
            <p className="mt-4 text-sm text-secondary">
              Essa não é a palavra real. Blefe com base nela — e tente descobrir a
              verdadeira sem ser pego.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-medium uppercase tracking-widest text-secondary">
              A palavra é
            </p>
            <p className="mt-2 inline-block rounded-full border border-border px-3 py-1 text-[11px] text-secondary">Categoria: {palavra.categoria}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{palavra.base}</h2>
            <p className="mt-4 text-sm text-secondary">
              Um dos jogadores não sabe essa palavra. Descubra quem, discutindo.
            </p>
          </>
        )}
      </PassDevice>
    )
  }

  if (phase === 'discussao') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight">Todos já viram</h1>
          <p className="mt-2 text-sm text-secondary">
            Cada um fala uma dica sobre a palavra, sem entregar demais. Quem começa:
          </p>
          <p className="mt-1 text-2xl font-black text-accent">{quemComeca}</p>
          <p className="mt-3 text-xs text-muted">
            Depois de uma volta, discutam e votem em quem parece o impostor.
          </p>

          {tempoDiscussao == null ? (
            <div className="mt-6 flex justify-center gap-2">
              {[120, 180, 300].map((s) => (
                <button
                  key={s}
                  onClick={() => setTempoDiscussao(s)}
                  className="rounded-xl border border-border-strong px-3 py-2 text-xs font-semibold text-secondary"
                >
                  ⏱ {s / 60} min
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <p className={`text-4xl font-black tabular-nums ${tempoDiscussao <= 10 ? 'text-danger' : 'text-primary'}`}>
                {tempoDiscussao > 0 ? formatarTempo(tempoDiscussao) : 'Hora de votar!'}
              </p>
              <button onClick={() => setTempoDiscussao(null)} className="mt-1 text-xs text-muted">
                parar cronômetro
              </button>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setPhase('revelacao')}
            className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Revelar resultado
          </motion.button>
        </div>
      </div>
    )
  }

  if (phase === 'revelacao') {
    const impostores = players.filter((_, i) => roles[i] === 'impostor')
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-secondary">
            A palavra era
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{palavra.base}</h1>
          <p className="mt-6 text-xs font-medium uppercase tracking-widest text-danger">
            {impostores.length > 1 ? 'Os impostores eram' : 'O impostor era'}
          </p>
          <h2 className="mt-1 text-2xl font-semibold">{impostores.join(', ')}</h2>

          <p className="mt-8 text-sm text-secondary">O grupo acertou quem era?</p>
          <div className="mt-3 flex flex-col gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => registrarPonto('grupo')}
              className="w-full rounded-xl bg-success/15 px-6 py-4 text-sm font-semibold text-success"
            >
              🎉 Acertaram o impostor
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => registrarPonto('impostor')}
              className="w-full rounded-xl bg-danger/15 px-6 py-4 text-sm font-semibold text-danger"
            >
              😈 Impostor escapou
            </motion.button>
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
            onClick={() => setPhase('config')}
            className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Nova rodada
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
