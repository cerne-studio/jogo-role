import { Trophy } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'

export default function PdfFim({ sala, jogadores, userId, onExit }) {
  const est = sala.estado
  const ordenados = [...jogadores].sort(
    (a, b) => (est.pontuacoes?.[b.user_id] ?? 0) - (est.pontuacoes?.[a.user_id] ?? 0),
  )
  const campeao = jogadores.find((j) => j.user_id === est.vencedor)

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
      <ExitButton onExit={onExit} />
      <div className="w-full max-w-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-glow">
          <Trophy className="h-8 w-8 text-accent" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {campeao?.user_id === userId ? 'Você ganhou!' : `${campeao?.nome ?? 'Alguém'} ganhou`}
        </h1>
        <p className="mt-2 text-sm text-secondary">Primeiro a chegar em {est.meta} pontos.</p>

        <ul className="mt-6 flex flex-col gap-2 text-left">
          {ordenados.map((j, i) => (
            <li
              key={j.user_id}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                i === 0 ? 'border-accent/40 bg-accent-glow' : 'border-border bg-surface'
              }`}
            >
              <span className="text-sm font-medium">
                {i + 1}. {j.nome}
              </span>
              <span className="text-sm font-bold tabular-nums">{est.pontuacoes?.[j.user_id] ?? 0}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onExit}
          className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
        >
          Encerrar jogo
        </button>
      </div>
    </div>
  )
}
