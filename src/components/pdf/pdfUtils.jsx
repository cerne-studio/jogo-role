import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { supabase } from '../../lib/supabase.js'

// Preta com as respostas encaixadas nas lacunas ("____"). Sem resposta, a lacuna aparece
// como um traço. Pergunta aberta (0 lacunas): a resposta vem embaixo da pergunta.
export function FraseComRespostas({ texto, lacunas, respostas }) {
  const partes = texto.split('____')
  if (lacunas === 0 || partes.length === 1) {
    return (
      <>
        <span>{texto}</span>
        {respostas?.[0] && <span className="mt-3 block font-bold text-accent">{respostas[0]}</span>}
      </>
    )
  }
  return partes.map((parte, i) => (
    <span key={i}>
      {parte}
      {i < partes.length - 1 &&
        (respostas?.[i] ? (
          <b className="text-accent">{respostas[i]}</b>
        ) : (
          <span className="inline-block w-12 border-b-2 border-accent/70 align-baseline">&nbsp;</span>
        ))}
    </span>
  ))
}

export function PretaCard({ preta, respostas, compacta }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 text-left font-bold leading-snug shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)] ${
        compacta ? 'p-4 text-[16px]' : 'p-5 text-[19px]'
      }`}
      style={{ background: 'linear-gradient(160deg, #1b1b20 0%, #0a0a0c 70%)' }}
    >
      <span className="pointer-events-none absolute -bottom-3 -right-1 select-none text-[54px] font-black leading-none tracking-tighter text-white/[0.05]">P.D.F</span>
      <FraseComRespostas texto={preta.texto} lacunas={preta.lacunas} respostas={respostas} />
      {preta.lacunas === 2 && (
        <p className="mt-3 text-[10px] font-medium uppercase tracking-widest text-muted">
          2 respostas · a ordem importa
        </p>
      )}
    </div>
  )
}

export function Placar({ jogadores, pontuacoes, meta, userId, juizId }) {
  const ordenados = [...jogadores].sort(
    (a, b) => (pontuacoes?.[b.user_id] ?? 0) - (pontuacoes?.[a.user_id] ?? 0),
  )
  return (
    <ul className="grid grid-cols-2 gap-1.5">
      {ordenados.map((j) => {
        const pts = pontuacoes?.[j.user_id] ?? 0
        const eu = j.user_id === userId
        return (
          <li
            key={j.user_id}
            className={`rounded-xl border px-3 py-2 ${eu ? 'border-accent/40 bg-accent-glow' : 'border-border bg-surface'}`}
          >
            <div className="flex items-center justify-between gap-2 text-[12px]">
              <span className={`truncate font-semibold ${eu ? 'text-primary' : 'text-secondary'}`}>
                {j.user_id === juizId ? '⚖️ ' : ''}
                {j.nome}
              </span>
              <span className="font-bold tabular-nums text-accent">{pts}/{meta}</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${Math.min(100, (pts / meta) * 100)}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function Cabecalho({ rodada, juizNome, souJuiz }) {
  return (
    <div className="flex items-center justify-between pr-12">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">Rodada {rodada}</p>
      <p className="text-xs font-semibold text-accent">{souJuiz ? 'Você é o juiz' : `Juiz: ${juizNome}`}</p>
    </div>
  )
}

function useSegundosDesde(iso) {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const inicio = iso ? new Date(iso).getTime() : agora
  return Math.max(0, Math.floor((agora - inicio) / 1000))
}

// Só o host vê. Destrava a rodada quando alguém sumiu (o servidor também confere o tempo).
export function BotaoPular({ salaId, souHost, desde, limite }) {
  const segundos = useSegundosDesde(desde)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  if (!souHost) return null
  const falta = Math.max(0, limite - segundos)

  async function pular() {
    setEnviando(true)
    setErro('')
    const { error } = await supabase.rpc('pdf_pular', { p_sala_id: salaId })
    setEnviando(false)
    if (error) setErro(error.message)
  }

  return (
    <div className="mt-6 text-center">
      <button
        disabled={falta > 0 || enviando}
        onClick={pular}
        className="text-xs text-secondary underline underline-offset-4 disabled:no-underline disabled:opacity-40"
      >
        {falta > 0 ? `Alguém sumiu? Dá pra pular em ${falta}s` : 'Alguém sumiu? Pular rodada'}
      </button>
      {erro && <p className="mt-2 text-xs text-danger">{erro}</p>}
    </div>
  )
}

export function BotaoPrimario({ children, onClick, disabled, carregando }) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      disabled={disabled || carregando}
      onClick={onClick}
      className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-30"
    >
      {children}
    </motion.button>
  )
}
