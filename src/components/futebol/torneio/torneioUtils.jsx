import { useEffect, useState } from 'react'
import EscudoSvg from '../EscudoSvg.jsx'

export function corDoTime(time) {
  const texto = String(time?.id ?? time?.nome ?? '')
  let h = 7
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0
  return `hsl(${h % 360}, 62%, 42%)`
}

// Escudo do time (o que o jogador montou ou o escudo gerado do clube). `tam` é a altura aproximada em px.
export function Escudo({ time, tam = 40, destaque = false }) {
  return (
    <span className={`inline-flex shrink-0 ${destaque ? 'drop-shadow-[0_0_6px_rgba(255,186,56,.9)]' : ''}`} style={{ width: tam * 0.84 }}>
      <EscudoSvg time={time} tam={tam * 0.84} />
    </span>
  )
}

export function Titulo({ pequeno, grande, children }) {
  return (
    <div>
      {pequeno && <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{pequeno}</p>}
      <h1 className="mt-1 text-2xl font-bold tracking-tight">{grande}</h1>
      {children}
    </div>
  )
}

export function Abas({ abas, valor, onChange }) {
  return (
    <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
      {abas.map(([k, nome]) => (
        <button key={k} onClick={() => onChange(k)} className={`flex-1 rounded-lg py-2 text-[13px] font-bold ${valor === k ? 'bg-elevated text-accent' : 'text-secondary'}`}>
          {nome}
        </button>
      ))}
    </div>
  )
}

// Guarda no sessionStorage os jogos que o jogador já assistiu (sobrevive a reload; some ao fechar a aba).
export function useAssistidos(salaId) {
  const chave = `fd:assistidos:${salaId}`
  const [set, setSet] = useState(() => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem(chave) ?? '[]'))
    } catch {
      return new Set()
    }
  })
  useEffect(() => {
    try {
      sessionStorage.setItem(chave, JSON.stringify([...set]))
    } catch {
      // sem sessionStorage: segue sem lembrar
    }
  }, [set, chave])
  return [set, (id) => setSet((s) => new Set(s).add(id))]
}
