import { Heart, Skull, Trophy } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'

export default function TheMindFim({ sala, onExit }) {
  const { rodada, vidas, vencedor } = sala.estado

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
      <ExitButton onExit={onExit} />
      <div className="w-full max-w-sm">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
            vencedor ? 'bg-accent-glow' : 'bg-danger/15'
          }`}
        >
          {vencedor ? <Trophy className="h-8 w-8 text-accent" /> : <Skull className="h-8 w-8 text-danger" />}
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {vencedor ? '🎉 Vocês venceram!' : 'Game over'}
        </h1>
        <p className="mt-2 text-sm text-secondary">
          {vencedor
            ? `Completaram as 7 rodadas com ${vidas} vida(s) sobrando.`
            : `As vidas acabaram na rodada ${rodada}.`}
        </p>
        <p className="mt-4 flex items-center justify-center gap-1 text-sm text-secondary">
          <Heart className="h-4 w-4 text-danger" /> {vidas} vida(s) ao final
        </p>
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
