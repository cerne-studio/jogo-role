import { Lock } from 'lucide-react'
import { iniciais } from '../adaptador.js'

export const TOTAL_RODADAS = 11

export const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')

// Destaca em âmbar as palavras do nome que começam com a letra sorteada.
export function NomeComLetra({ nome, letra }) {
  if (!letra || letra === '*') return <>{nome}</>
  const partes = nome.split(/(\s+)/)
  return (
    <>
      {partes.map((p, i) =>
        semAcento(p).toUpperCase().replace(/[^A-Z]/g, '').startsWith(letra) ? (
          <span key={i} className="text-accent">{p}</span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}

// Alguma palavra do texto começa com a letra?
export function temLetra(texto, letra) {
  if (!letra || letra === '*') return true
  return String(texto).split(/\s+/).some((p) => semAcento(p).toUpperCase().replace(/[^A-Z]/g, '').startsWith(letra))
}

export function Bolinha({ nome, cor = '#7c3aed', tam = 40 }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border-2 font-extrabold text-white"
      style={{ width: tam, height: tam, borderColor: cor, background: `${cor}55`, fontSize: tam * 0.34 }}
    >
      {iniciais(nome)}
    </span>
  )
}

export function Nota({ valor, tam = 'md' }) {
  const cor = valor >= 90 ? 'border-accent text-accent' : valor >= 85 ? 'border-success text-success' : 'border-white/25 text-primary'
  return (
    <span className={`inline-flex items-center justify-center rounded-lg border-2 font-extrabold tabular-nums ${cor} ${tam === 'lg' ? 'h-11 min-w-[52px] px-2 text-2xl' : 'h-8 min-w-[38px] px-1.5 text-[16px]'}`}>
      {valor}
    </span>
  )
}

export function posPrincipal(posicoes) {
  return (posicoes ?? []).slice(0, 3).join(' · ')
}

export function Cadeado({ children }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
      <Lock className="h-4 w-4" />
      {children}
    </span>
  )
}

// Anel de contagem regressiva. Vermelho só nos últimos 3 s.
export function Cronometro({ restante, total = 7, tam = 76 }) {
  const seg = Math.max(0, Math.ceil(restante))
  const frac = Math.max(0, Math.min(1, restante / total))
  const urgente = restante <= 3
  const r = tam / 2 - 6
  const circ = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: tam, height: tam }}>
      <svg width={tam} height={tam} className="-rotate-90">
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5" />
        <circle
          cx={tam / 2} cy={tam / 2} r={r} fill="none" strokeWidth="5" strokeLinecap="round"
          stroke={urgente ? '#ef4444' : '#f59e0b'} strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-2xl font-black tabular-nums ${urgente ? 'text-danger' : 'text-primary'}`}>
        {seg}s
      </div>
    </div>
  )
}

export function BotaoPrincipal({ children, ...props }) {
  return (
    <button
      {...props}
      className="w-full rounded-2xl bg-accent px-6 py-4 text-[16px] font-extrabold uppercase tracking-wide text-black transition active:scale-[0.98] disabled:opacity-30"
    >
      {children}
    </button>
  )
}
