import { EQUIPES } from './hintUtils.js'

// Trilha de pontuação das duas equipes até a meta, com a "reta final" marcada na barra.
export default function HintPlacar({ est }) {
  const meta = est.meta
  const reta = est.regras?.reta_final === false ? null : meta - est.reta
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3">
      {['azul', 'vermelha'].map((eq) => {
        const pts = est.placar?.[eq] ?? 0
        const pct = Math.max(0, Math.min(1, pts / meta)) * 100
        const emVez = est.vez === eq && est.fase !== 'fim'
        return (
          <div key={eq}>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-semibold" style={{ color: EQUIPES[eq].cor }}>
                <span className="h-2 w-2 rounded-full" style={{ background: EQUIPES[eq].cor, boxShadow: emVez ? `0 0 8px ${EQUIPES[eq].cor}` : 'none', opacity: emVez ? 1 : 0.4 }} />
                {EQUIPES[eq].nome}
                {emVez && <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-widest text-secondary">vez</span>}
              </span>
              <span className="tabular-nums text-secondary">
                <b className="text-base text-primary">{pts}</b> / {meta}
              </span>
            </div>
            <div className="relative mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: EQUIPES[eq].cor }} />
              {reta !== null && (
                <span className="absolute top-0 h-full w-px bg-accent/80" style={{ left: `${(reta / meta) * 100}%` }} title="Reta final" />
              )}
            </div>
          </div>
        )
      })}
      {reta !== null && <p className="text-[10px] text-muted">Linha dourada = reta final: o adversário escolhe a carta de quem estiver depois dela.</p>}
    </div>
  )
}
