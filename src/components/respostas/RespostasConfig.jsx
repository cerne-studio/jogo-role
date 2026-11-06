import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

export const TOTAIS = [5, 10, 15, 20]
export const TEMPOS = [15, 30, 45, 60]

function Opcao({ ativo, onClick, children, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition disabled:cursor-default ${
        ativo ? 'border-accent bg-accent-glow text-primary' : 'border-border bg-surface text-secondary'
      }`}
    >
      {children}
    </button>
  )
}

// Configuração do host no lobby: quantas perguntas, tempo pra responder e categorias.
// Os outros jogadores só esperam; o host manda tudo ao iniciar.
export default function RespostasConfig({ config, onChange, souHost }) {
  const [categorias, setCategorias] = useState([])
  const [personalizado, setPersonalizado] = useState(!TOTAIS.includes(config.total))

  useEffect(() => {
    let cancelado = false
    supabase.rpc('respostas_categorias').then(({ data }) => {
      if (!cancelado && Array.isArray(data)) setCategorias(data)
    })
    return () => {
      cancelado = true
    }
  }, [])

  if (!souHost) {
    return (
      <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-3 text-xs text-secondary">
        O host escolhe a quantidade de perguntas, o tempo e as categorias. É só esperar ele iniciar.
      </p>
    )
  }

  const todas = config.categorias.length === 0
  function alternarCategoria(nome) {
    const atual = new Set(config.categorias)
    if (atual.has(nome)) atual.delete(nome)
    else atual.add(nome)
    onChange({ ...config, categorias: [...atual] })
  }

  return (
    <div className="mt-6">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">Perguntas na partida</p>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {TOTAIS.map((v) => (
          <Opcao
            key={v}
            ativo={!personalizado && config.total === v}
            onClick={() => {
              setPersonalizado(false)
              onChange({ ...config, total: v })
            }}
          >
            {v}
          </Opcao>
        ))}
        <Opcao ativo={personalizado} onClick={() => setPersonalizado(true)}>
          Outro
        </Opcao>
      </div>
      {personalizado && (
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={50}
          value={config.total}
          onChange={(e) => onChange({ ...config, total: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })}
          className="mt-2 w-full rounded-xl border border-border-strong bg-surface px-4 py-3 text-base outline-none focus:border-accent"
          aria-label="Quantidade de perguntas"
        />
      )}

      <p className="mt-6 text-xs font-medium uppercase tracking-widest text-muted">Tempo pra responder</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {TEMPOS.map((v) => (
          <Opcao key={v} ativo={config.tempo === v} onClick={() => onChange({ ...config, tempo: v })}>
            {v}s
          </Opcao>
        ))}
      </div>

      <p className="mt-6 text-xs font-medium uppercase tracking-widest text-muted">Categorias</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange({ ...config, categorias: [] })}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
            todas ? 'border-accent bg-accent text-black' : 'border-border bg-surface text-secondary'
          }`}
        >
          Todas
        </button>
        {categorias.map((c) => {
          const ativa = config.categorias.includes(c.categoria)
          return (
            <button
              key={c.categoria}
              type="button"
              onClick={() => alternarCategoria(c.categoria)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                ativa ? 'border-accent bg-accent text-black' : 'border-border bg-surface text-secondary'
              }`}
            >
              {c.categoria}
            </button>
          )
        })}
      </div>
    </div>
  )
}
