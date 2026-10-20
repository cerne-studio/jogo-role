import { useEffect, useState } from 'react'

export function corDoTime(time) {
  const texto = String(time?.id ?? time?.nome ?? '')
  let h = 7
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0
  return `hsl(${h % 360}, 62%, 42%)`
}

// Escudo genérico: círculo colorido com a sigla (sem escudos oficiais).
export function Escudo({ time, tam = 40, destaque = false }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-extrabold text-white ${destaque ? 'ring-2 ring-accent' : ''}`}
      style={{ width: tam, height: tam, background: corDoTime(time), fontSize: tam * 0.3, border: '2px solid rgba(255,255,255,.25)' }}
    >
      {time?.sigla ?? '?'}
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
