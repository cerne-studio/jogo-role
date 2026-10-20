import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase.js'
import { notaGeral } from '../adaptador.js'
import PartidaAoVivo from '../PartidaAoVivo.jsx'
import { timePorId } from '../torneio.js'
import { BotaoPrincipal } from '../draft/draftUtils.jsx'
import { Escudo } from './torneioUtils.jsx'

// Pré-jogo + partida ao vivo do jogo do meu time. A simulação já foi decidida (e publicada) por um celular;
// aqui só se reproduz. Terminou (ou "pular pro fim") = jogo assistido.
export default function JogoTorneio({ salaId, torneio, etapa, jogo, onAssistiu, onVoltar }) {
  const [partida, setPartida] = useState(null)
  const [erro, setErro] = useState('')
  const [comecou, setComecou] = useState(false)
  const [fim, setFim] = useState(false)
  const A = timePorId(torneio, jogo.A)
  const B = timePorId(torneio, jogo.B)

  useEffect(() => {
    let vivo = true
    supabase.rpc('fd_partida_obter', { p_sala_id: salaId, p_jogo_id: jogo.id }).then(({ data, error }) => {
      if (!vivo) return
      if (error) setErro(error.message)
      else if (!data) setErro('Essa partida ainda não chegou. Tenta de novo em instantes.')
      else setPartida(data)
    })
    return () => {
      vivo = false
    }
  }, [salaId, jogo.id])

  const rotulo = `${etapa.fase === 'grupos' ? `Grupo ${jogo.grupo} · ` : ''}${etapa.nome}`

  if (!comecou) {
    return (
      <div className="space-y-4">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-accent">Dia de jogo</p>
        <p className="text-center text-sm text-secondary">{rotulo}{etapa.fase !== 'grupos' ? ' · eliminatória' : ''}</p>
        <div className="flex items-center justify-around rounded-2xl border border-border bg-surface p-4">
          {[A, B].map((t, i) => (
            <div key={t.id} className="flex w-[40%] flex-col items-center text-center">
              <Escudo time={t} tam={56} />
              <p className="mt-2 text-sm font-bold leading-tight">{t.nome}</p>
              <p className="mt-1 text-2xl font-black text-accent">{notaGeral(t.picks)}</p>
              <p className="text-[11px] text-secondary">{t.formacao} · {t.tatica}</p>
              {i === 0 && <span className="sr-only">contra</span>}
            </div>
          ))}
        </div>
        {erro && <p className="text-sm text-danger">{erro}</p>}
        <BotaoPrincipal disabled={!partida} onClick={() => setComecou(true)}>{partida ? 'Iniciar jogo' : 'Carregando...'}</BotaoPrincipal>
        <button onClick={onVoltar} className="w-full py-2 text-sm text-secondary">Voltar</button>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>
      <PartidaAoVivo sim={partida.sim} cfg={partida.cfg} rotuloTopo={rotulo} autoIniciar onFim={() => { setFim(true); onAssistiu() }} />
      <button
        onClick={() => { onAssistiu(); onVoltar() }}
        className={`mt-4 w-full rounded-xl py-3 text-[15px] font-extrabold uppercase tracking-wide ${fim ? 'bg-accent text-black' : 'bg-elevated text-secondary'}`}
      >
        {fim ? 'Ver resumo da rodada' : 'Pular e ver o resumo'}
      </button>
    </div>
  )
}
