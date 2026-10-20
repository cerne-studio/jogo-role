import { useMemo, useState } from 'react'
import ExitButton from '../../core/ExitButton.jsx'
import { supabase } from '../../../lib/supabase.js'
import { medidores, notaGeral, timeParaMotor } from '../adaptador.js'
import { gerarTime } from '../amostras.js'
import { simularPartida } from '../motor.js'
import PartidaAoVivo from '../PartidaAoVivo.jsx'
import MiniCampo from './MiniCampo.jsx'
import { BotaoPrincipal } from './draftUtils.jsx'

function Amistoso({ cfg, sim, onVoltar, onOutro }) {
  return (
    <div className="mx-auto w-full max-w-[480px] px-4 pb-10 pt-4" style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>
      <button onClick={onVoltar} className="mb-3 text-sm text-secondary">← Voltar pros times</button>
      <PartidaAoVivo sim={sim} cfg={cfg} onOutra={onOutro} />
    </div>
  )
}

// Fim do draft: todos os times montados. Daqui sai o campeonato; por enquanto dá pra jogar um amistoso
// com o motor de partida (contra o rival, ou contra um time de bots no modo solo).
export default function DraftProntos({ salaId, userId, est, times, onExit }) {
  const [amistoso, setAmistoso] = useState(null)
  const [iniciando, setIniciando] = useState(false)
  const [erro, setErro] = useState('')
  const [rodada, setRodada] = useState(0)

  const meu = times.find((t) => t.user_id === userId)
  const rivais = times.filter((t) => t.user_id !== userId && t.picks.length === 11)

  const jogo = useMemo(() => {
    if (!amistoso || !meu) return null
    const A = timeParaMotor({ id: 'meu', nome: `${meu.nome} FC`, formacao: meu.formacao, tatica: est.taticas?.[userId] ?? 'equilibrada', picks: meu.picks })
    let B
    if (amistoso === 'bot') {
      B = gerarTime({ id: 'bot', nome: 'Bots FC', nivel: Math.max(66, Math.round(notaGeral(meu.picks)) - 4), formacao: '4-4-2', tatica: 'equilibrada', agressividade: 55, semente: 11 + rodada })
    } else {
      const r = times.find((t) => t.user_id === amistoso)
      B = timeParaMotor({ id: 'rival', nome: `${r.nome} FC`, formacao: r.formacao, tatica: est.taticas?.[r.user_id] ?? 'equilibrada', picks: r.picks })
    }
    const semente = 1000 + rodada * 7 + (amistoso === 'bot' ? 1 : 2)
    return { cfg: { A, B }, sim: simularPartida(A, B, { semente, mataMata: false }) }
  }, [amistoso, meu, times, est.taticas, userId, rodada])

  if (jogo) {
    return (
      <div className="min-h-[100dvh]">
        <ExitButton onExit={onExit} />
        <Amistoso cfg={jogo.cfg} sim={jogo.sim} onVoltar={() => setAmistoso(null)} onOutro={() => setRodada((r) => r + 1)} />
      </div>
    )
  }

  const todos = times.filter((t) => t.picks.length === 11)
  return (
    <div className="flex min-h-[100dvh] flex-col px-6 py-8">
      <ExitButton onExit={onExit} />
      <div className="mx-auto w-full max-w-sm flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Draft concluído</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Times prontos</h1>
        <p className="mt-1 text-sm text-secondary">
          {est.config?.torneio ?? 8} times vão disputar o campeonato, com os bots completando as vagas com clubes reais.
        </p>

        <ul className="mt-5 flex flex-col gap-3">
          {todos.map((t) => {
            const med = medidores(t.picks, t.formacao)
            const eu = t.user_id === userId
            return (
              <li key={t.user_id} className={`rounded-2xl border p-4 ${eu ? 'border-accent bg-accent-glow' : 'border-border bg-surface'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{t.nome} FC {eu && <span className="text-xs font-semibold text-accent">(você)</span>}</p>
                    <p className="text-xs text-secondary">{t.formacao} · <span className="capitalize">{est.taticas?.[t.user_id] ?? 'equilibrada'}</span></p>
                  </div>
                  <p className="text-3xl font-black text-accent">{notaGeral(t.picks)}</p>
                </div>
                <p className="mt-2 text-xs text-secondary">Ataque {med.ataque} · Meio {med.meio} · Defesa {med.defesa} · Goleiro {med.goleiro}</p>
              </li>
            )
          })}
        </ul>

        {meu && <div className="mt-5"><MiniCampo formacao={meu.formacao} picks={meu.picks} mostrarNomes grande /></div>}

        <div className="mt-6 flex flex-col gap-2">
          <BotaoPrincipal
            disabled={iniciando}
            onClick={async () => {
              setIniciando(true)
              setErro('')
              const { error } = await supabase.rpc('fd_torneio_preparar', { p_sala_id: salaId })
              if (error) setErro(error.message)
              setIniciando(false)
            }}
          >
            {iniciando ? 'Montando...' : 'Começar campeonato'}
          </BotaoPrincipal>
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <button onClick={() => setAmistoso('bot')} className="w-full rounded-2xl border border-border-strong bg-elevated px-6 py-3.5 text-sm font-bold">Jogar amistoso vs bots</button>
          {rivais.map((r) => (
            <button key={r.user_id} onClick={() => setAmistoso(r.user_id)} className="w-full rounded-2xl border border-border-strong bg-elevated px-6 py-3.5 text-sm font-bold">
              Amistoso contra {r.nome} FC
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
