import { useEffect, useRef, useState } from 'react'
import { Dices } from 'lucide-react'
import { supabase } from '../../../lib/supabase.js'
import EscudoSvg from '../EscudoSvg.jsx'
import {
  FORMAS, NOMES_FORMA, NOMES_PADRAO, NOMES_SIMBOLO, PADROES, PALETA, SIMBOLOS, escudoAleatorio, escudoValido, siglaDe,
} from '../escudo.js'

function Chip({ ativo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold ${ativo ? 'border-accent bg-accent-glow text-primary' : 'border-border bg-surface text-secondary'}`}
    >
      {children}
    </button>
  )
}

function Cores({ valor, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PALETA.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Cor ${c}`}
          onClick={() => onChange(c)}
          className={`h-7 w-7 rounded-full border-2 ${valor.toLowerCase() === c ? 'border-accent ring-2 ring-accent/40' : 'border-white/20'}`}
          style={{ background: c }}
        />
      ))}
    </div>
  )
}

// O jogador monta o escudo do time (forma, padrão, símbolo, cores e sigla) ou sorteia um. Salva sozinho no servidor.
export default function EditorEscudo({ salaId, estado, userId, nomeTime }) {
  const salvo = estado?.escudos?.[userId]
  const inicial = escudoValido(salvo) ? salvo : escudoAleatorio(`h${String(userId).slice(0, 8)}`, siglaDe(nomeTime))
  const [escudo, setEscudo] = useState(inicial)
  const [aberto, setAberto] = useState(false)
  const timer = useRef(null)
  const primeira = useRef(true)

  // Grava (com atraso) toda vez que o jogador mexe; a primeira renderização não grava
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false
      return
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      supabase.rpc('fd_definir_escudo', { p_sala_id: salaId, p_escudo: escudo })
    }, 500)
    return () => clearTimeout(timer.current)
  }, [escudo, salaId])

  function mudar(patch) {
    setEscudo((e) => ({ ...e, ...patch }))
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-4">
        <EscudoSvg escudo={escudo} tam={64} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Escudo do seu time</p>
          <p className="mt-0.5 truncate text-sm font-bold">{nomeTime ? `${nomeTime} FC` : 'Seu time'}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setEscudo(escudoAleatorio(null, escudo.sigla))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-extrabold text-black"
            >
              <Dices className="h-4 w-4" /> Sortear
            </button>
            <button
              type="button"
              onClick={() => setAberto((a) => !a)}
              className="rounded-lg border border-border-strong px-3 py-1.5 text-[12px] font-semibold text-secondary"
            >
              {aberto ? 'Fechar' : 'Montar o meu'}
            </button>
          </div>
        </div>
      </div>

      {aberto && (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">Forma</p>
            <div className="flex flex-wrap gap-2">
              {FORMAS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => mudar({ forma: f })}
                  aria-label={NOMES_FORMA[f]}
                  className={`rounded-xl border p-1.5 ${escudo.forma === f ? 'border-accent bg-accent-glow' : 'border-border bg-elevated'}`}
                >
                  <EscudoSvg escudo={{ ...escudo, forma: f }} tam={34} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">Padrão</p>
            <div className="flex flex-wrap gap-1.5">
              {PADROES.map((p) => <Chip key={p} ativo={escudo.padrao === p} onClick={() => mudar({ padrao: p })}>{NOMES_PADRAO[p]}</Chip>)}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">Símbolo</p>
            <div className="flex flex-wrap gap-1.5">
              {SIMBOLOS.map((s) => <Chip key={s} ativo={escudo.simbolo === s} onClick={() => mudar({ simbolo: s })}>{NOMES_SIMBOLO[s]}</Chip>)}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">Cor principal</p>
            <Cores valor={escudo.cor1} onChange={(c) => mudar({ cor1: c })} />
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">Cor do detalhe</p>
            <Cores valor={escudo.cor2} onChange={(c) => mudar({ cor2: c })} />
          </div>
          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-muted">Sigla (até 3 letras)</span>
            <input
              value={escudo.sigla}
              maxLength={3}
              onChange={(e) => mudar({ sigla: e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase() || 'FC' })}
              className="w-24 rounded-xl border border-border-strong bg-white/5 px-3 py-2 text-center text-lg font-extrabold uppercase outline-none focus:border-accent"
            />
          </label>
        </div>
      )}
    </div>
  )
}
