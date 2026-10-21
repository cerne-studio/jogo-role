import { useMemo } from 'react'
import { motion } from 'motion/react'

const CORES = ['#f59e0b', '#fbbf24', '#f0f0f2', '#10b981', '#ef4444', '#8b5cf6']

// Chuva de confete leve (só CSS/motion, sem imagem) pra comemorar uma vitória. Não bloqueia toque.
export default function Confete({ quantidade = 28 }) {
  const pecas = useMemo(
    () =>
      Array.from({ length: quantidade }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        atraso: Math.random() * 0.9,
        duracao: 2.2 + Math.random() * 1.6,
        giro: (Math.random() - 0.5) * 720,
        deriva: (Math.random() - 0.5) * 60,
        tam: 6 + Math.random() * 6,
        cor: CORES[i % CORES.length],
        redonda: i % 3 === 0,
      })),
    [quantidade],
  )
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden>
      {pecas.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: '105vh', x: p.deriva, opacity: [1, 1, 0], rotate: p.giro }}
          transition={{ duration: p.duracao, delay: p.atraso, ease: 'easeIn' }}
          className="absolute top-0"
          style={{ left: `${p.x}%`, width: p.tam, height: p.redonda ? p.tam : p.tam * 0.5, background: p.cor, borderRadius: p.redonda ? '50%' : 2 }}
        />
      ))}
    </div>
  )
}
