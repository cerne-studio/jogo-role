import { useEffect, useMemo, useState } from 'react'

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const PASSO = 360 / ALFABETO.length

// Roleta de letras: gira passando letra por letra, desacelera e para exatamente na sorteada.
// Dura até `ate` (hora do servidor, ms); quem entra com a roleta já no fim vê só a letra.
export default function DraftRoleta({ letra, ate, agora, rodada, total }) {
  const alvo = letra === '*' ? 0 : ALFABETO.indexOf(letra)
  const [passo, setPasso] = useState(0)

  // Intervalos entre as letras, cada um um pouco mais longo que o anterior, somando o tempo que falta.
  const sequencia = useMemo(() => {
    const resto = Math.max(0, ate - agora() - 200)
    const gaps = []
    let soma = 0
    let g = 45
    while (soma + g < resto && gaps.length < 60) {
      gaps.push(g)
      soma += g
      g *= 1.13
    }
    return gaps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letra, ate])

  useEffect(() => {
    let k = 0
    let t
    setPasso(0)
    function andar() {
      if (k >= sequencia.length) return
      t = setTimeout(() => {
        k += 1
        setPasso(k)
        andar()
      }, sequencia[k])
    }
    andar()
    return () => clearTimeout(t)
  }, [alvo, sequencia])

  const indiceAbs = alvo - sequencia.length + passo
  const indice = ((indiceAbs % 26) + 26) % 26
  const parou = passo >= sequencia.length
  const mostrada = letra === '*' ? '?' : ALFABETO[indice]

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">Rodada</p>
      <p className="text-3xl font-extrabold tracking-tight">
        <span className="text-accent">{rodada}</span> <span className="text-secondary">de {total}</span>
      </p>

      <div className="relative mt-8 h-[290px] w-[290px]">
        <div className="absolute left-1/2 top-[-6px] z-10 h-0 w-0 -translate-x-1/2 border-x-[11px] border-t-[18px] border-x-transparent border-t-accent drop-shadow-[0_0_8px_rgba(245,158,11,.9)]" />
        <div
          className="absolute inset-0 rounded-full border-2 border-accent/60 bg-surface shadow-[0_0_60px_-10px_rgba(245,158,11,.55)]"
          style={{ transform: `rotate(${-indiceAbs * PASSO}deg)`, transition: parou ? 'transform .25s ease-out' : 'transform 90ms linear' }}
        >
          {[...ALFABETO].map((l, i) => (
            <span
              key={l}
              className={`absolute left-1/2 top-1/2 text-lg font-extrabold ${i === indice ? 'text-accent' : 'text-white/70'}`}
              style={{ transform: `rotate(${i * PASSO}deg) translateY(-122px) translateX(-50%)`, transformOrigin: '0 0' }}
            >
              {l}
            </span>
          ))}
        </div>
        <div className="absolute inset-[72px] flex items-center justify-center rounded-full border-2 border-accent bg-base shadow-[inset_0_0_30px_rgba(245,158,11,.25)]">
          <span className={`text-[92px] font-black leading-none text-accent ${parou ? 'animate-[popLetra_.35s_ease-out]' : ''}`}>{mostrada}</span>
        </div>
      </div>
      <style>{'@keyframes popLetra{0%{transform:scale(.7)}60%{transform:scale(1.15)}100%{transform:scale(1)}}'}</style>

      <div className="mt-10 w-full max-w-xs rounded-2xl border border-border bg-surface px-4 py-3">
        <p className="text-sm font-semibold">Escolha pelo nome, sobrenome ou apelido.</p>
        <p className="mt-0.5 text-xs text-secondary">O jogador precisa ter uma palavra começando com a letra sorteada.</p>
      </div>
    </div>
  )
}
