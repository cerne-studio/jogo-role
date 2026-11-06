import { useState } from 'react'
import { motion } from 'motion/react'
import { Trophy } from 'lucide-react'
import Confete from '../core/Confete.jsx'
import ExitButton from '../core/ExitButton.jsx'
import { supabase } from '../../lib/supabase.js'

const MEDALHAS = ['🥇', '🥈', '🥉']

// Ranking final. Empate na maior pontuação divide a vitória (sem desempate). O host recomeça com os mesmos jogadores;
// se o host sumiu, o servidor deixa outro jogador assumir depois de 90 s parado aqui.
export default function RespostasFim({ salaId, sala, jogadores, userId, souHost, onExit }) {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const est = sala.estado
  const pontos = (id) => est.placar?.[id] ?? 0
  const ordenados = [...jogadores].sort((a, b) => pontos(b.user_id) - pontos(a.user_id) || a.nome.localeCompare(b.nome))
  const maior = ordenados.length ? pontos(ordenados[0].user_id) : 0
  const campeoes = ordenados.filter((j) => pontos(j.user_id) === maior)
  const euGanhei = campeoes.some((j) => j.user_id === userId)

  async function novaPartida() {
    setEnviando(true)
    setErro('')
    const { error } = await supabase.rpc('respostas_nova_partida', { p_sala_id: salaId })
    setEnviando(false)
    if (error) setErro(error.message)
  }

  // posição com empate (mesma pontuação = mesma colocação)
  let colocacao = 0
  let anterior = null
  const linhas = ordenados.map((j, i) => {
    if (pontos(j.user_id) !== anterior) colocacao = i + 1
    anterior = pontos(j.user_id)
    return { j, colocacao }
  })

  return (
    <div className="flex min-h-[100dvh] flex-col items-center px-6 py-10 text-center">
      <ExitButton onExit={onExit} />
      {euGanhei && <Confete quantidade={46} />}
      <div className="w-full max-w-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-glow">
          <Trophy className="h-8 w-8 text-accent" />
        </div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-accent">Resultado final</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {campeoes.length > 1
            ? `Empate: ${campeoes.map((c) => c.nome).join(' e ')}`
            : euGanhei
              ? 'Você ganhou!'
              : `${campeoes[0]?.nome ?? 'Alguém'} ganhou`}
        </h1>
        <p className="mt-1 text-sm text-secondary">{maior} {maior === 1 ? 'ponto' : 'pontos'} no topo</p>

        <ul className="mt-6 flex flex-col gap-2 text-left">
          {linhas.map(({ j, colocacao: col }, i) => (
            <motion.li
              key={j.user_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i }}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                col === 1 ? 'border-accent/40 bg-accent-glow' : 'border-border bg-surface'
              } ${j.user_id === userId ? 'ring-1 ring-white/10' : ''}`}
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <span className="w-7 text-center text-base">{MEDALHAS[col - 1] ?? `${col}º`}</span>
                <span>
                  {j.nome}
                  <span className="block text-[11px] text-muted">
                    {est.acertos?.[j.user_id] ?? 0} {(est.acertos?.[j.user_id] ?? 0) === 1 ? 'acerto' : 'acertos'}
                  </span>
                </span>
              </span>
              <span className="text-lg font-black tabular-nums">{pontos(j.user_id)}</span>
            </motion.li>
          ))}
        </ul>

        {erro && <p className="mt-4 text-sm text-danger">{erro}</p>}
        {souHost ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={enviando}
            onClick={novaPartida}
            className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-40"
          >
            {enviando ? 'Preparando...' : 'Nova partida'}
          </motion.button>
        ) : (
          <>
            <p className="mt-8 text-sm text-secondary">Aguardando o host começar uma nova partida...</p>
            <button onClick={novaPartida} disabled={enviando} className="mt-2 text-xs text-muted underline">
              O host sumiu? Assumir a sala
            </button>
          </>
        )}
        <button onClick={onExit} className="mt-4 w-full rounded-xl border border-border-strong px-6 py-3 text-sm font-semibold text-secondary">
          Sair
        </button>
      </div>
    </div>
  )
}
