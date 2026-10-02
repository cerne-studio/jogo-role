import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'

const OPCOES = [3, 5, 7]
// Tem que bater com pdf_max_jogadores() no banco (db/011_pdf_max_jogadores.sql).
const MAX_JOGADORES = 20

// Meta de pontos no lobby. O host escolhe; os outros só veem o valor (atualiza em tempo real).
export default function PdfMeta({ salaId, meta = 5, souHost }) {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function escolher(valor) {
    if (valor === meta || enviando) return
    setEnviando(true)
    setErro('')
    const { error } = await supabase.rpc('pdf_definir_meta', { p_sala_id: salaId, p_meta: valor })
    setEnviando(false)
    if (error) setErro(error.message)
  }

  return (
    <div className="mt-6">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">Quem faz quantos pontos ganha</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {OPCOES.map((valor) => {
          const ativo = valor === meta
          return (
            <button
              key={valor}
              disabled={!souHost || enviando}
              onClick={() => escolher(valor)}
              className={`rounded-xl border px-3 py-3 text-center transition disabled:cursor-default ${
                ativo ? 'border-accent bg-accent-glow text-primary' : 'border-border bg-surface text-secondary'
              }`}
            >
              <span className="block text-xl font-bold tabular-nums">{valor}</span>
              <span className="block text-[10px] uppercase tracking-widest text-muted">
                {valor === 3 ? 'rápido' : valor === 5 ? 'normal' : 'longo'}
              </span>
            </button>
          )
        })}
      </div>
      {!souHost && <p className="mt-2 text-xs text-muted">Só o host muda a meta.</p>}
      <p className="mt-2 text-xs text-muted">De 3 a {MAX_JOGADORES} jogadores.</p>
      {erro && <p className="mt-2 text-xs text-danger">{erro}</p>}
    </div>
  )
}
