import { useState } from 'react'
import { Check, Clock, Shield, Swords, Scale } from 'lucide-react'
import ExitButton from '../../core/ExitButton.jsx'
import { supabase } from '../../../lib/supabase.js'
import { medidores, notaGeral } from '../adaptador.js'
import MiniCampo from './MiniCampo.jsx'
import { BotaoPrincipal } from './draftUtils.jsx'
import { useTick } from './useServidor.js'

const TATICAS = [
  { id: 'ofensiva', nome: 'Ofensiva', icon: Swords, desc: 'Pressiona, chuta mais e deixa espaço atrás.', marca: 'mais gols dos dois lados' },
  { id: 'equilibrada', nome: 'Equilibrada', icon: Scale, desc: 'Sem surpresa: vence quem for melhor.', marca: 'o time mais forte leva' },
  { id: 'defensiva', nome: 'Defensiva', icon: Shield, desc: 'Fecha a casa e sai no contra-ataque. Ajuda o time mais fraco.', marca: 'mais empates e zebras' },
]

function Medidor({ rotulo, valor }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] uppercase tracking-widest text-muted">
        <span>{rotulo}</span>
        <span className="font-bold text-primary">{valor}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(0, Math.min(100, (valor - 60) * 2.5))}%` }} />
      </div>
    </div>
  )
}

// Time montado + escolha da tática (a tática vem DEPOIS do draft: só dá pra decidir sabendo a força do time).
export default function DraftTatica({ salaId, userId, est, jogadores, agora, times, onExit }) {
  const [sel, setSel] = useState('equilibrada')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  useTick(250)

  const meu = times.find((t) => t.user_id === userId)
  const rivais = times.filter((t) => t.user_id !== userId && t.picks.length === 11)
  const nota = meu ? notaGeral(meu.picks) : 0
  const med = meu ? medidores(meu.picks, meu.formacao) : null
  const mediaRivais = rivais.length ? rivais.reduce((s, t) => s + notaGeral(t.picks), 0) / rivais.length : null
  const maisFraco = mediaRivais != null && nota < mediaRivais - 0.4
  const taticas = est.taticas ?? {}
  const jaConfirmei = !!taticas[userId]
  const restante = Math.max(0, Math.ceil((Date.parse(est.tatica_ate) - agora()) / 1000))

  async function confirmar() {
    setEnviando(true)
    setErro('')
    const { error } = await supabase.rpc('fd_definir_tatica', { p_sala_id: salaId, p_tatica: sel })
    setEnviando(false)
    if (error) setErro(error.message)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col px-6 py-8">
      <ExitButton onExit={onExit} />
      <div className="mx-auto w-full max-w-sm flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Time montado</p>
        <div className="mt-1 flex items-end justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{meu?.nome} FC</h1>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-muted">Nota geral</p>
            <p className="text-4xl font-black leading-none text-accent">{nota}</p>
          </div>
        </div>

        {meu && <div className="mt-4"><MiniCampo formacao={meu.formacao} picks={meu.picks} mostrarNomes grande /></div>}
        {med && (
          <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 rounded-2xl border border-border bg-surface p-4">
            <Medidor rotulo="Ataque" valor={med.ataque} />
            <Medidor rotulo="Meio" valor={med.meio} />
            <Medidor rotulo="Defesa" valor={med.defesa} />
            <Medidor rotulo="Goleiro" valor={med.goleiro} />
          </div>
        )}

        {!jaConfirmei ? (
          <>
            <h2 className="mt-7 text-lg font-bold tracking-tight">Escolha sua tática <span className="text-sm font-medium text-secondary">({restante}s)</span></h2>
            {maisFraco && (
              <p className="mt-2 rounded-xl border border-accent/40 bg-accent-glow px-3 py-2 text-xs font-semibold">
                Seu time é mais fraco que a média dos rivais. Defensiva aumenta a chance de zebra.
              </p>
            )}
            <div className="mt-3 flex flex-col gap-2">
              {TATICAS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSel(t.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${sel === t.id ? 'border-accent bg-accent-glow' : 'border-border bg-surface'}`}
                >
                  <t.icon className={`h-6 w-6 shrink-0 ${sel === t.id ? 'text-accent' : 'text-secondary'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{t.nome}</span>
                    <span className="block text-xs leading-snug text-secondary">{t.desc}</span>
                    <span className="mt-1 block text-[10px] font-semibold uppercase tracking-widest text-muted">{t.marca}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-7 text-lg font-bold tracking-tight">Tática escolhida: <span className="capitalize text-accent">{taticas[userId]}</span></h2>
            <ul className="mt-3 flex flex-col gap-2">
              {jogadores.map((j) => (
                <li key={j.user_id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
                  <span className="text-sm font-medium">{j.nome}</span>
                  {taticas[j.user_id] ? <Check className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-muted" />}
                </li>
              ))}
            </ul>
          </>
        )}
        {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
      </div>
      {!jaConfirmei && (
        <div className="mx-auto w-full max-w-sm pt-6">
          <BotaoPrincipal disabled={enviando} onClick={confirmar}>
            {enviando ? 'Confirmando...' : 'Confirmar tática'}
          </BotaoPrincipal>
        </div>
      )}
    </div>
  )
}
