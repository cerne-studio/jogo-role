import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import PassDevice from '../core/PassDevice.jsx'
import ExitButton from '../core/ExitButton.jsx'
import SecretVote from './SecretVote.jsx'
import { getComposicao } from '../../data/resistenciaTable.js'

function sortearPapeis(players, numTraidores) {
  const indices = players.map((_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  const traidores = new Set(indices.slice(0, numTraidores))
  return players.map((_, i) => (traidores.has(i) ? 'traidor' : 'leal'))
}

export default function ResistenciaGame({ players, onBack }) {
  const composicao = getComposicao(players.length)
  const [roles] = useState(() => sortearPapeis(players, composicao.traidores))
  const [phase, setPhase] = useState('reveal-roles')
  const [roleRevealIndex, setRoleRevealIndex] = useState(0)

  const [missionIndex, setMissionIndex] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [failCount, setFailCount] = useState(0)
  const [leaderIndex, setLeaderIndex] = useState(0)
  const [rejectionsInARow, setRejectionsInARow] = useState(0)
  const [proposedTeam, setProposedTeam] = useState([])
  const [voteIndex, setVoteIndex] = useState(0)
  const [collectedVotes, setCollectedVotes] = useState([])
  const [lastResult, setLastResult] = useState(null)
  const [fimMotivo, setFimMotivo] = useState(null)

  const teamSize = composicao.missoes[missionIndex]
  const traidoresNomes = players.filter((_, i) => roles[i] === 'traidor')

  function toggleProposto(i) {
    setProposedTeam((prev) => {
      if (prev.includes(i)) return prev.filter((x) => x !== i)
      if (prev.length >= teamSize) return prev
      return [...prev, i]
    })
  }

  function aprovarEquipe() {
    setRejectionsInARow(0)
    setCollectedVotes([])
    setVoteIndex(0)
    setPhase('votacao-secreta')
  }

  function rejeitarEquipe() {
    const novasRejeicoes = rejectionsInARow + 1
    if (novasRejeicoes >= 5) {
      setFimMotivo('rejeicoes')
      setPhase('fim')
      return
    }
    setRejectionsInARow(novasRejeicoes)
    setLeaderIndex((l) => (l + 1) % players.length)
    setProposedTeam([])
    setPhase('propor-equipe')
  }

  function registrarVoto(sabotou) {
    const novosVotos = [...collectedVotes, sabotou]
    if (voteIndex + 1 < proposedTeam.length) {
      setCollectedVotes(novosVotos)
      setVoteIndex((i) => i + 1)
      return
    }
    const sabotagens = novosVotos.filter(Boolean).length
    const falhou = sabotagens >= composicao.falhasNecessarias[missionIndex]
    setLastResult({ sabotagens, falhou })
    if (falhou) setFailCount((c) => c + 1)
    else setSuccessCount((c) => c + 1)
    setPhase('resultado-missao')
  }

  function proximaMissao() {
    const novoSucesso = successCount
    const novaFalha = failCount
    if (novoSucesso >= 3) {
      setFimMotivo('leais')
      setPhase('fim')
      return
    }
    if (novaFalha >= 3) {
      setFimMotivo('traidores')
      setPhase('fim')
      return
    }
    setMissionIndex((m) => m + 1)
    setLeaderIndex((l) => (l + 1) % players.length)
    setRejectionsInARow(0)
    setProposedTeam([])
    setPhase('propor-equipe')
  }

  if (phase === 'reveal-roles') {
    const isTraidor = roles[roleRevealIndex] === 'traidor'
    const outrosTraidores = traidoresNomes.filter((n) => n !== players[roleRevealIndex])
    return (
      <PassDevice
        playerName={players[roleRevealIndex]}
        index={roleRevealIndex}
        total={players.length}
        onExit={onBack}
        onDone={() => {
          if (roleRevealIndex + 1 < players.length) {
            setRoleRevealIndex((i) => i + 1)
          } else {
            setPhase('propor-equipe')
          }
        }}
      >
        {isTraidor ? (
          <>
            <p className="text-xs font-medium uppercase tracking-widest text-danger">
              Você é traidor
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">Sabote em silêncio</h2>
            {outrosTraidores.length > 0 && (
              <p className="mt-4 text-sm text-secondary">
                Outro(s) traidor(es): <span className="text-primary">{outrosTraidores.join(', ')}</span>
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-xs font-medium uppercase tracking-widest text-secondary">
              Você é leal
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">Ajude a Resistência</h2>
            <p className="mt-4 text-sm text-secondary">3 sucessos vencem o jogo pros leais.</p>
          </>
        )}
      </PassDevice>
    )
  }

  const MissionHeader = (
    <div className="mb-6 flex items-center justify-between text-xs">
      <span className="rounded-full border border-border px-3 py-1 text-secondary">
        Missão {missionIndex + 1} de 5 · {teamSize} pessoas
      </span>
      <span className="text-secondary">
        ✅ {successCount} · 💥 {failCount}
      </span>
    </div>
  )

  if (phase === 'propor-equipe') {
    return (
      <div className="flex min-h-[100dvh] flex-col px-6 py-8">
        <ExitButton onExit={onBack} />
        <div className="mx-auto w-full max-w-sm flex-1">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-secondary">
            <ArrowLeft className="h-4 w-4" /> Sair
          </button>
          <div className="mt-6">{MissionHeader}</div>
          <h1 className="text-xl font-bold tracking-tight">
            Líder: {players[leaderIndex]}
          </h1>
          <p className="mt-1 text-sm text-secondary">
            O líder escolhe {teamSize} jogador(es) em voz alta pra missão. Toque nos nomes
            escolhidos.
          </p>
          {rejectionsInARow > 0 && (
            <p className="mt-2 text-xs text-danger">
              {rejectionsInARow} rejeição(ões) seguida(s) — 5 e os traidores vencem.
            </p>
          )}

          <ul className="mt-6 flex flex-col gap-2">
            {players.map((name, i) => {
              const selecionado = proposedTeam.includes(i)
              return (
                <li key={name + i}>
                  <button
                    onClick={() => toggleProposto(i)}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                      selecionado
                        ? 'border-accent bg-accent-glow text-primary'
                        : 'border-border bg-surface text-secondary'
                    }`}
                  >
                    {name}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="mx-auto w-full max-w-sm pt-6">
          <motion.button
            whileTap={{ scale: proposedTeam.length === teamSize ? 0.97 : 1 }}
            disabled={proposedTeam.length !== teamSize}
            onClick={() => setPhase('aprovacao')}
            className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-30"
          >
            Propor equipe ({proposedTeam.length}/{teamSize})
          </motion.button>
        </div>
      </div>
    )
  }

  if (phase === 'aprovacao') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          {MissionHeader}
          <h1 className="text-2xl font-bold tracking-tight">Aprovam a equipe?</h1>
          <p className="mt-2 text-sm text-secondary">
            {proposedTeam.map((i) => players[i]).join(', ')}
          </p>
          <p className="mt-4 text-xs text-muted">
            Contem até 3 e mostrem o polegar (pra cima ou pra baixo) ao mesmo tempo.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={aprovarEquipe}
              className="w-full rounded-xl bg-success/15 px-6 py-4 text-sm font-semibold text-success"
            >
              👍 Maioria aprovou
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={rejeitarEquipe}
              className="w-full rounded-xl bg-danger/15 px-6 py-4 text-sm font-semibold text-danger"
            >
              👎 Maioria rejeitou
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'votacao-secreta') {
    const jogadorAtualIdx = proposedTeam[voteIndex]
    return (
      <SecretVote
        playerName={players[jogadorAtualIdx]}
        index={voteIndex}
        total={proposedTeam.length}
        isTraidor={roles[jogadorAtualIdx] === 'traidor'}
        onVote={registrarVoto}
        onExit={onBack}
      />
    )
  }

  if (phase === 'resultado-missao') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          {MissionHeader}
          <h1 className={`text-3xl font-bold tracking-tight ${lastResult.falhou ? 'text-danger' : 'text-success'}`}>
            {lastResult.falhou ? 'Missão sabotada' : 'Missão bem-sucedida'}
          </h1>
          <p className="mt-2 text-sm text-secondary">
            {lastResult.sabotagens} carta(s) de sabotagem foram jogadas.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={proximaMissao}
            className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Continuar
          </motion.button>
        </div>
      </div>
    )
  }

  if (phase === 'fim') {
    const traidoresVenceram = fimMotivo === 'traidores' || fimMotivo === 'rejeicoes'
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <h1 className={`text-3xl font-bold tracking-tight ${traidoresVenceram ? 'text-danger' : 'text-success'}`}>
            {traidoresVenceram ? 'Os traidores venceram' : 'Os leais venceram'}
          </h1>
          <p className="mt-2 text-sm text-secondary">
            {fimMotivo === 'rejeicoes'
              ? '5 propostas rejeitadas seguidas.'
              : `${successCount} sucesso(s) · ${failCount} falha(s)`}
          </p>
          <p className="mt-6 text-xs font-medium uppercase tracking-widest text-secondary">
            Os traidores eram
          </p>
          <h2 className="mt-1 text-xl font-semibold">{traidoresNomes.join(', ')}</h2>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onBack}
            className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Voltar ao início
          </motion.button>
        </div>
      </div>
    )
  }

  return null
}
