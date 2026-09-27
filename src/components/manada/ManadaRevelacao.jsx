import { useState } from 'react'
import { motion } from 'motion/react'
import { Trophy } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'
import { supabase } from '../../lib/supabase.js'

export default function ManadaRevelacao({ sala, jogadores, souHost, onExit }) {
  const [avancando, setAvancando] = useState(false)
  const [erro, setErro] = useState('')

  const { resultado_rodada: resultado, pontuacoes, vaca_rosa: vacaRosa, vencedor } = sala.estado
  const nomePorId = Object.fromEntries(jogadores.map((j) => [j.user_id, j.nome]))
  const grupos = [...(resultado?.grupos ?? [])].sort((a, b) => b.tamanho - a.tamanho)

  async function proximaRodada() {
    setAvancando(true)
    setErro('')
    const { error } = await supabase.rpc('proxima_rodada', { p_sala_id: sala.id })
    setAvancando(false)
    if (error) setErro(error.message)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col px-6 py-8">
      <ExitButton onExit={onExit} />
      <div className="mx-auto w-full max-w-sm flex-1">
        {vencedor && (
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-glow">
              <Trophy className="h-7 w-7 text-accent" />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">
              🎉 {nomePorId[vencedor]} venceu!
            </h1>
          </div>
        )}

        <p className="text-xs font-medium uppercase tracking-widest text-muted">Rodada {resultado?.rodada}</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight">
          {resultado?.manada_normalizada ? 'A Manada respondeu:' : 'Empate — ninguém pontuou'}
        </h2>

        <ul className="mt-4 flex flex-col gap-2">
          {grupos.map((g) => {
            const ehManada = g.normalizada === resultado?.manada_normalizada
            const isolado = g.tamanho === 1
            return (
              <li
                key={g.normalizada}
                className={`rounded-xl border px-4 py-3 ${
                  ehManada ? 'border-success/40 bg-success/10' : 'border-border bg-surface'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {ehManada && '🐄 '}
                    {g.membros[0].resposta_texto}
                  </span>
                  <span className="text-xs font-medium tabular-nums text-secondary">{g.tamanho}</span>
                </div>
                <p className="mt-1 text-xs text-secondary">
                  {g.membros.map((m) => m.nome).join(', ')}
                  {isolado && resultado?.vaca_rosa_transferida && ' 🩷'}
                </p>
              </li>
            )
          })}
        </ul>

        <p className="mt-8 text-xs font-medium uppercase tracking-widest text-muted">Placar</p>
        <ul className="mt-3 flex flex-col gap-2">
          {[...jogadores]
            .sort((a, b) => (pontuacoes?.[b.user_id] ?? 0) - (pontuacoes?.[a.user_id] ?? 0))
            .map((j) => (
              <li
                key={j.user_id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
              >
                <span className="text-sm font-medium">
                  {j.nome} {j.user_id === vacaRosa && '🩷'}
                </span>
                <span className="text-sm font-bold tabular-nums text-accent">🐄 {pontuacoes?.[j.user_id] ?? 0}</span>
              </li>
            ))}
        </ul>
      </div>

      <div className="mx-auto w-full max-w-sm pt-6">
        {vencedor ? (
          <button onClick={onExit} className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black">
            Encerrar jogo
          </button>
        ) : souHost ? (
          <>
            {erro && <p className="mb-3 text-sm text-danger">{erro}</p>}
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={avancando}
              onClick={proximaRodada}
              className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-30"
            >
              {avancando ? 'Avançando...' : 'Próxima pergunta'}
            </motion.button>
          </>
        ) : (
          <p className="text-center text-sm text-secondary">Aguardando o host avançar a rodada...</p>
        )}
      </div>
    </div>
  )
}
