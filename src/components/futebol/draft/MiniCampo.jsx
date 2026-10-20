import { FORMACOES } from '../formacoes.js'
import { iniciais } from '../adaptador.js'

// Campo vertical com a formação: gol embaixo, ataque em cima. Casa preenchida mostra iniciais + nota;
// vazia mostra a sigla da posição (pulsando em âmbar se for onde o próximo jogador pode entrar).
//   compativeis: vagas onde o jogador em foco pode entrar (null = sem jogador em foco)
//   destaque:    vaga onde ele vai entrar     filtro: vaga tocada pra filtrar a lista
export default function MiniCampo({ formacao, picks = [], destaque = null, compativeis = null, filtro = null, onSlot, grande = false, mostrarNomes = false }) {
  const slots = FORMACOES[formacao] ?? FORMACOES['4-3-3']
  const porSlot = Object.fromEntries(picks.map((p) => [p.slot, p]))
  const tam = grande ? 40 : 34
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#14301f]" style={{ aspectRatio: grande ? '0.82' : '0.9' }}>
      <svg viewBox="0 0 100 110" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="0" y={i * 13.75} width="100" height="13.75" fill={i % 2 ? '#1b3d28' : '#1f4630'} />
        ))}
        <g fill="none" stroke="rgba(255,255,255,.35)" strokeWidth=".6">
          <rect x="4" y="4" width="92" height="102" />
          <line x1="4" y1="55" x2="96" y2="55" />
          <circle cx="50" cy="55" r="11" />
          <rect x="26" y="88" width="48" height="18" />
          <rect x="38" y="98" width="24" height="8" />
          <rect x="26" y="4" width="48" height="18" />
          <rect x="38" y="4" width="24" height="8" />
        </g>
      </svg>
      <div className="absolute right-2 top-1.5 text-[10px] font-bold tracking-widest text-white/50">{formacao}</div>
      {slots.map((s, i) => {
        const idx = i + 1
        const p = porSlot[idx]
        const ativo = destaque === idx
        const compat = compativeis ? compativeis.includes(idx) : false
        const filtrado = filtro === idx
        const left = `${9 + s.y * 82}%`
        const top = `${7 + (1 - s.x) * 88}%`
        const clicavel = !!onSlot && !p && (compativeis ? compat : true)
        return (
          <button
            key={idx}
            type="button"
            disabled={!clicavel}
            onClick={() => onSlot?.(idx)}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center disabled:cursor-default"
            style={{ left, top, width: tam + 14 }}
          >
            {p ? (
              <>
                <span
                  className="flex items-center justify-center rounded-full border-2 border-[#4c1d95] bg-[#7c3aed] font-extrabold text-white shadow-[0_3px_6px_rgba(0,0,0,.5)]"
                  style={{ width: tam, height: tam, fontSize: grande ? 14 : 11 }}
                >
                  {iniciais(p.nome)}
                </span>
                <span className="mt-0.5 rounded bg-black/60 px-1 text-[10px] font-bold leading-4 text-white">{p.overall}</span>
                {mostrarNomes && <span className="max-w-[64px] truncate text-[9px] font-semibold text-white/90 drop-shadow">{p.nome}</span>}
              </>
            ) : (
              <span
                className={`flex items-center justify-center rounded-full border-2 border-dashed text-[10px] font-extrabold ${
                  ativo || filtrado
                    ? 'border-accent bg-accent/30 text-accent shadow-[0_0_14px_rgba(245,158,11,.7)]'
                    : compat
                      ? 'animate-pulse border-accent/80 bg-black/30 text-accent'
                      : 'border-white/30 bg-black/30 text-white/60'
                }`}
                style={{ width: tam, height: tam }}
              >
                {s.rotulo}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
