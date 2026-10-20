import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase.js'

// Enquanto o FC26 não estiver carregado no banco, "Atual" fica desligado (o servidor também recusa).
export const ATUAL_DISPONIVEL = false

const MODOS = [
  { id: 'historico', nome: 'Histórico', desc: 'O auge de cada craque, FIFA 15 ao 23.' },
  { id: 'atual', nome: 'Atual', desc: 'Elencos de hoje.' },
  { id: 'liga', nome: 'Por liga', desc: 'Só jogadores de uma liga.' },
]
const TORNEIOS = [8, 16, 20]

export function useLigas() {
  const [ligas, setLigas] = useState([])
  useEffect(() => {
    let vivo = true
    supabase.rpc('fd_ligas').then(({ data }) => {
      if (vivo && Array.isArray(data)) setLigas(data)
    })
    return () => {
      vivo = false
    }
  }, [])
  return ligas
}

// Escolha de modo do draft, liga (quando "Por liga") e tamanho do campeonato.
// `valor` = { modo, liga, torneio }. Só o host muda no lobby (somenteLeitura pros outros).
export default function DraftConfig({ valor, onChange, somenteLeitura = false, erro = '' }) {
  const ligas = useLigas()
  const { modo, liga, torneio } = valor

  function escolher(patch) {
    if (somenteLeitura) return
    const novo = { ...valor, ...patch }
    if (novo.modo === 'liga' && !novo.liga) novo.liga = ligas[0]?.liga ?? null
    onChange(novo)
  }

  return (
    <div className="mt-6">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">Quais jogadores entram</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {MODOS.map((m) => {
          const ativo = m.id === modo
          const bloqueado = m.id === 'atual' && !ATUAL_DISPONIVEL
          return (
            <button
              key={m.id}
              disabled={somenteLeitura || bloqueado}
              onClick={() => escolher({ modo: m.id })}
              className={`rounded-xl border px-2 py-3 text-left transition disabled:cursor-default ${
                ativo ? 'border-accent bg-accent-glow text-primary' : 'border-border bg-surface text-secondary'
              } ${bloqueado ? 'opacity-40' : ''}`}
            >
              <span className="block text-sm font-bold">{m.nome}</span>
              <span className="block text-[10px] leading-snug text-muted">{bloqueado ? 'em breve' : m.desc}</span>
            </button>
          )
        })}
      </div>

      {modo === 'liga' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {ligas.map((l) => (
            <button
              key={l.liga}
              disabled={somenteLeitura}
              onClick={() => escolher({ liga: l.liga })}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                liga === l.liga ? 'border-accent bg-accent-glow text-primary' : 'border-border bg-surface text-secondary'
              }`}
            >
              {l.liga}
            </button>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs font-medium uppercase tracking-widest text-muted">Campeonato</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {TORNEIOS.map((n) => (
          <button
            key={n}
            disabled={somenteLeitura}
            onClick={() => escolher({ torneio: n })}
            className={`rounded-xl border px-3 py-3 text-center transition disabled:cursor-default ${
              n === torneio ? 'border-accent bg-accent-glow text-primary' : 'border-border bg-surface text-secondary'
            }`}
          >
            <span className="block text-xl font-bold tabular-nums">{n}</span>
            <span className="block text-[10px] uppercase tracking-widest text-muted">times</span>
          </button>
        ))}
      </div>
      {somenteLeitura && <p className="mt-2 text-xs text-muted">Só o host muda as opções.</p>}
      {erro && <p className="mt-2 text-xs text-danger">{erro}</p>}
    </div>
  )
}
