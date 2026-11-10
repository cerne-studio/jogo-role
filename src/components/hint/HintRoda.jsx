import { motion } from 'motion/react'
import { MODS } from './hintUtils.js'

// A roda: 5 setores (0 = entrada, 1 e 3 = bônus +1, 4 = obrigatória). As cartas andam um setor por turno.
// Quem manda na rotação é o servidor; aqui só desenhamos o estado e animamos a mudança de setor.

const CX = 150
const CY = 150
const R_FORA = 138
const R_DENTRO = 58
const R_CARTA = 100
const GRAUS = 72

const rad = (g) => (g * Math.PI) / 180
const ponto = (r, g) => [CX + r * Math.cos(rad(g)), CY + r * Math.sin(rad(g))]

function setorPath(i) {
  const a0 = -90 + i * GRAUS + 1.5
  const a1 = -90 + (i + 1) * GRAUS - 1.5
  const [x0, y0] = ponto(R_FORA, a0)
  const [x1, y1] = ponto(R_FORA, a1)
  const [x2, y2] = ponto(R_DENTRO, a1)
  const [x3, y3] = ponto(R_DENTRO, a0)
  return `M${x0} ${y0} A${R_FORA} ${R_FORA} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${R_DENTRO} ${R_DENTRO} 0 0 0 ${x3} ${y3} Z`
}

export default function HintRoda({ roda = [], zonas, regras, obrigatoriaId, selecionadaId, destaqueId }) {
  const bonus = regras?.bonus === false ? [] : (zonas?.bonus ?? [1, 3])
  const obrig = regras?.obrigatoria === false ? -1 : (zonas?.obrigatoria ?? 4)

  return (
    <svg viewBox="0 0 300 300" className="mx-auto block w-full max-w-[320px]" role="img" aria-label="Roda de cartas">
      {[0, 1, 2, 3, 4].map((i) => {
        const ehBonus = bonus.includes(i)
        const ehObrig = i === obrig
        const mid = -90 + i * GRAUS + GRAUS / 2
        const [lx, ly] = ponto(R_FORA - 7, mid)
        return (
          <g key={i}>
            <path
              d={setorPath(i)}
              fill={ehObrig ? 'rgba(255,90,95,0.16)' : ehBonus ? 'rgba(255,186,56,0.16)' : 'rgba(255,255,255,0.05)'}
              stroke={ehObrig ? 'rgba(255,90,95,0.7)' : ehBonus ? 'rgba(255,186,56,0.7)' : 'rgba(255,255,255,0.18)'}
              strokeWidth="1.5"
            />
            {(ehBonus || ehObrig || i === 0) && (
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fontWeight="700"
                letterSpacing="0.5"
                fill={ehObrig ? '#ff5a5f' : ehBonus ? '#ffba38' : 'rgba(255,255,255,0.45)'}
              >
                {ehObrig ? 'OBRIGATÓRIA' : ehBonus ? '+1' : 'ENTRADA'}
              </text>
            )}
          </g>
        )
      })}

      <circle cx={CX} cy={CY} r={R_DENTRO - 8} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" />
      <text x={CX} y={CY - 4} textAnchor="middle" fontSize="15" fontWeight="800" fill="#ffba38" letterSpacing="2">
        HINT
      </text>
      <text x={CX} y={CY + 12} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.5)" letterSpacing="1.5">
        GIRA A CADA TURNO
      </text>

      {roda.map((c) => {
        const mod = MODS[c.modalidade]
        const Icone = mod.icon
        const mid = -90 + c.pos * GRAUS + GRAUS / 2
        const [x, y] = ponto(R_CARTA, mid)
        const forcada = obrigatoriaId === c.id
        const sel = selecionadaId === c.id
        return (
          <motion.g
            key={c.id}
            initial={{ x, y, scale: 0.4, opacity: 0 }}
            animate={{ x, y, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 110, damping: 16 }}
          >
            <circle
              r="25"
              fill={mod.cor}
              stroke={sel || destaqueId === c.id ? '#ffffff' : forcada ? '#ff5a5f' : 'rgba(0,0,0,0.35)'}
              strokeWidth={sel || destaqueId === c.id || forcada ? 3.5 : 1.5}
            />
            <Icone x={-11} y={-11} width={22} height={22} color="#0b0b10" strokeWidth={2.4} />
          </motion.g>
        )
      })}
    </svg>
  )
}
