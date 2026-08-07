import { useEffect, useState } from 'react'
import { EarOff } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'

const TEMPO_TOTAL = 240

export default function SurdoView({ onExit }) {
  const [tempoRestante, setTempoRestante] = useState(TEMPO_TOTAL)

  useEffect(() => {
    if (tempoRestante <= 0) return
    const t = setTimeout(() => setTempoRestante((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [tempoRestante])

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
      <ExitButton onExit={onExit} />
      <div className="w-full max-w-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-glow mx-auto">
          <EarOff className="h-7 w-7 text-accent" />
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-widest text-muted">Você é o Surdo</p>
        <span className={`mt-2 block text-4xl font-bold tabular-nums ${tempoRestante <= 30 ? 'text-danger' : 'text-accent'}`}>
          {tempoRestante}s
        </span>
        <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-primary">
          Você não escuta nada. Preste atenção no Mudo — ele vai te mostrar ou escrever as
          regras. Fale em voz alta pro Cego o que ele te mostrou.
        </p>
        <p className="mt-4 text-xs text-secondary">
          Não precisa mexer no celular durante a partida — só olhar pro Mudo e falar pro Cego.
        </p>
      </div>
    </div>
  )
}
