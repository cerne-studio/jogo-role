import { useId } from 'react'
import { escudoDoTime } from './escudo.js'

// Contornos (viewBox 100x120). `texto`: onde fica a sigla; `simbolo`: centro do símbolo.
const FORMAS_SVG = {
  classico: { d: 'M10 8 H90 V62 C90 92 66 108 50 114 C34 108 10 92 10 62 Z', texto: 92, simbolo: 46 },
  arredondado: { d: 'M16 8 H84 Q94 8 94 18 V68 Q94 98 50 113 Q6 98 6 68 V18 Q6 8 16 8 Z', texto: 92, simbolo: 46 },
  hexagono: { d: 'M50 5 L93 29 V83 L50 111 L7 83 V29 Z', texto: 90, simbolo: 46 },
  redondo: { d: 'M50 10 A47 47 0 1 1 49.99 10 Z', texto: 82, simbolo: 42 },
  losango: { d: 'M50 4 L95 58 L50 114 L5 58 Z', texto: 74, simbolo: 38 },
}

// Símbolos desenhados em torno do centro (50, 50); depois são deslocados pra `simbolo`.
const SIMBOLOS_SVG = {
  estrela: <path d="M50 28 L57 44 L74 45.5 L61 56.5 L65 73 L50 64.5 L35 73 L39 56.5 L26 45.5 L43 44 Z" />,
  raio: <path d="M57 26 L36 58 H50 L43 80 L66 46 H52 Z" />,
  coroa: <path d="M28 72 L28 42 L41 55 L50 36 L59 55 L72 42 L72 72 Z" />,
  bola: (
    <>
      <circle cx="50" cy="52" r="20" />
      <path d="M50 42 L58 48 L55 58 L45 58 L42 48 Z" fill="rgba(0,0,0,.55)" stroke="none" />
    </>
  ),
  chama: <path d="M50 26 C59 40 68 47 66 62 C64 75 55 80 50 80 C43 80 34 73 36 60 C37 51 43 49 45 40 C47 45 50 47 53 44 C53 38 50 34 50 26 Z" />,
  diamante: <path d="M50 30 L70 50 L50 80 L30 50 Z" />,
  folha: <path d="M30 74 C30 48 48 32 72 32 C72 56 56 76 30 74 Z M30 74 L58 46" />,
}

function Padrao({ forma, padrao, cor2 }) {
  switch (padrao) {
    case 'vertical':
      return <><rect x="30" y="0" width="14" height="120" fill={cor2} /><rect x="56" y="0" width="14" height="120" fill={cor2} /></>
    case 'horizontal':
      return <rect x="0" y="44" width="100" height="30" fill={cor2} />
    case 'metade':
      return <rect x="50" y="0" width="50" height="120" fill={cor2} />
    case 'diagonal':
      return <polygon points="0,120 100,0 100,120" fill={cor2} />
    case 'faixa':
      return <rect x="0" y="64" width="100" height="14" fill={cor2} />
    default:
      return null
  }
}

// Escudo do time: aceita um objeto `escudo` direto ou um `time` (usa time.escudo ou gera um estável pelo id).
export default function EscudoSvg({ escudo, time, tam = 40, className = '' }) {
  const id = useId().replace(/:/g, '')
  const e = escudo ?? escudoDoTime(time)
  const f = FORMAS_SVG[e.forma] ?? FORMAS_SVG.classico
  const simbolo = e.simbolo !== 'nenhum' ? SIMBOLOS_SVG[e.simbolo] : null
  const dy = f.simbolo - 50
  return (
    <svg viewBox="0 0 100 120" width={tam} height={tam * 1.2} className={`shrink-0 ${className}`} role="img" aria-label={`Escudo ${e.sigla}`}>
      <defs>
        <clipPath id={`c${id}`}><path d={f.d} /></clipPath>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".22" />
          <stop offset=".5" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity=".25" />
        </linearGradient>
      </defs>
      <path d={f.d} fill="rgba(0,0,0,.35)" transform="translate(1.5 3)" />
      <g clipPath={`url(#c${id})`}>
        <rect width="100" height="120" fill={e.cor1} />
        <Padrao forma={e.forma} padrao={e.padrao} cor2={e.cor2} />
        <rect width="100" height="120" fill={`url(#b${id})`} />
      </g>
      <path d={f.d} fill="none" stroke="#f4f2ed" strokeWidth="4" strokeLinejoin="round" />
      {simbolo && (
        <g transform={`translate(0 ${dy})`} fill="#ffffff" stroke="rgba(0,0,0,.5)" strokeWidth="2.2" strokeLinejoin="round">
          {simbolo}
        </g>
      )}
      <text
        x="50" y={f.texto} textAnchor="middle" fontSize={e.sigla.length > 2 ? 21 : 25} fontWeight="900" fill="#ffffff"
        stroke="rgba(0,0,0,.65)" strokeWidth="4" paintOrder="stroke" strokeLinejoin="round"
        style={{ fontFamily: 'Geist, system-ui, sans-serif', letterSpacing: 1 }}
      >
        {e.sigla}
      </text>
    </svg>
  )
}
