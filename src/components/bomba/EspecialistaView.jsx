import { useEffect, useState } from 'react'
import ExitButton from '../core/ExitButton.jsx'
import { gerarModulosBomba, criarRand } from '../../data/bombaModulos.js'

const TEMPO_TOTAL = 240

export default function EspecialistaView({ codigo, onExit }) {
  const [modulos] = useState(() => gerarModulosBomba(criarRand(codigo)))
  const [tempoRestante, setTempoRestante] = useState(TEMPO_TOTAL)

  useEffect(() => {
    if (tempoRestante <= 0) return
    const t = setTimeout(() => setTempoRestante((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [tempoRestante])

  return (
    <div className="flex min-h-[100dvh] flex-col items-center px-6 py-8 text-center">
      <ExitButton onExit={onExit} />
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between text-xs text-secondary">
          <span>Manual de Desarme</span>
          <span className={`font-bold tabular-nums ${tempoRestante <= 30 ? 'text-danger' : 'text-primary'}`}>
            {tempoRestante}s
          </span>
        </div>
        <p className="mt-2 text-xs text-secondary">Escute o Defusador e guie ele por cada módulo.</p>

        <div className="mt-6 flex flex-col gap-4">
          {modulos.map((modulo, i) => (
            <div key={modulo.tipo} className="rounded-2xl border border-border-strong bg-elevated px-5 py-5 text-left">
              <p className="text-xs font-medium uppercase tracking-widest text-accent">
                Módulo {i + 1} — {modulo.nome}
              </p>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm text-primary">
                {modulo.manualLinhas.map((linha, j) => (
                  <li key={j}>{linha}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
