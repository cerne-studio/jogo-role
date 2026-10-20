import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Check, Clock } from 'lucide-react'
import ExitButton from '../../core/ExitButton.jsx'
import { supabase } from '../../../lib/supabase.js'
import { BotaoPrincipal } from '../draft/draftUtils.jsx'
import { etapaAtual, foiEliminado, jogoDoTime, timePorId } from '../torneio.js'
import { Premiacao, Rankings } from './Estatisticas.jsx'
import JogoTorneio from './JogoTorneio.jsx'
import Resumo from './Resumo.jsx'
import { Chaveamento, TabelasGrupos } from './Tabelas.jsx'
import { Abas, Escudo, Titulo, useAssistidos } from './torneioUtils.jsx'
import useTorneio from './useTorneio.js'

function Moldura({ onExit, children }) {
  return (
    <div className="min-h-[100dvh] px-5 pb-12 pt-6">
      <ExitButton onExit={onExit} />
      <div className="mx-auto w-full max-w-sm space-y-4">{children}</div>
    </div>
  )
}

function Sorteio({ torneio, meuId, onSeguir }) {
  return (
    <>
      <Titulo pequeno="Sorteio dos grupos" grande={`${torneio.tamanho} times no campeonato`} />
      <div className="grid gap-3">
        {torneio.grupos.map((g, gi) => (
          <motion.div
            key={gi} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.25 }}
            className="rounded-2xl border border-border bg-surface p-3"
          >
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">Grupo {'ABCD'[gi]}</p>
            <div className="grid gap-2">
              {g.map((id, k) => {
                const t = timePorId(torneio, id)
                return (
                  <motion.div
                    key={id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: gi * 0.25 + 0.3 + k * 0.12 }}
                    className={`flex items-center gap-3 rounded-xl px-2 py-1.5 ${id === meuId ? 'bg-accent-glow' : t.tipo === 'humano' ? 'bg-white/5' : ''}`}
                  >
                    <Escudo time={t} tam={32} />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{t.nome}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">{t.tipo === 'humano' ? 'técnico' : 'bot'}</span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>
      <BotaoPrincipal onClick={onSeguir}>Começar campeonato</BotaoPrincipal>
    </>
  )
}

function Campeao({ torneio, meuId, userId, onExit }) {
  const campeao = timePorId(torneio, torneio.campeaoId)
  const [aba, setAba] = useState('premios')
  return (
    <>
      <div className="rounded-3xl border border-accent/50 bg-accent-glow p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Campeão</p>
        <div className="mt-4 flex justify-center"><Escudo time={campeao} tam={84} destaque /></div>
        <h1 className="mt-3 text-3xl font-black tracking-tight">{campeao.nome}</h1>
        {campeao.tipo === 'humano' && <p className="mt-1 text-sm text-secondary">{campeao.user_id === userId ? 'É o seu time!' : 'Técnico humano'}</p>}
      </div>
      <Abas abas={[['premios', 'Premiação'], ['rank', 'Rankings'], ['mata', 'Mata-mata']]} valor={aba} onChange={setAba} />
      {aba === 'premios' && <Premiacao est={torneio.est} />}
      {aba === 'rank' && <Rankings est={torneio.est} />}
      {aba === 'mata' && <Chaveamento torneio={torneio} ate={torneio.cursor} meuId={meuId} />}
      <BotaoPrincipal onClick={onExit}>Voltar ao início</BotaoPrincipal>
    </>
  )
}

export default function TorneioGame({ salaId, userId, est, jogadores, onExit }) {
  const { torneio, sincronizado, erro } = useTorneio(salaId, est)
  const [assistidos, marcarAssistido] = useAssistidos(salaId)
  const [view, setView] = useState('hub') // hub | jogo | resumo
  const [aba, setAba] = useState('rodada')
  const [sorteioVisto, setSorteioVisto] = useState(() => sessionStorage.getItem(`fd:sorteio:${salaId}`) === '1')
  const [enviando, setEnviando] = useState(false)
  const etapaId = torneio?.etapas?.[torneio.cursor]?.id

  // Mudou a etapa: volta pro hub
  useEffect(() => {
    setView('hub')
    setAba('rodada')
  }, [etapaId])

  // Etapa travada tem prazo: passou muito tempo e alguém não deu "continuar", libera sozinho
  useEffect(() => {
    const t = setInterval(() => supabase.rpc('fd_torneio_forcar', { p_sala_id: salaId }), 20000)
    return () => clearInterval(t)
  }, [salaId])

  if (!torneio || !torneio.etapas) {
    return (
      <Moldura onExit={onExit}>
        <p className="pt-24 text-center text-sm text-secondary">{erro || 'Montando o campeonato...'}</p>
      </Moldura>
    )
  }

  const meuTime = torneio.times.find((t) => t.user_id === userId)
  const meuId = meuTime?.id ?? null

  if (torneio.campeaoId) {
    return <Moldura onExit={onExit}><Campeao torneio={torneio} meuId={meuId} userId={userId} onExit={onExit} /></Moldura>
  }

  if (!sorteioVisto) {
    return (
      <Moldura onExit={onExit}>
        <Sorteio torneio={torneio} meuId={meuId} onSeguir={() => { sessionStorage.setItem(`fd:sorteio:${salaId}`, '1'); setSorteioVisto(true) }} />
      </Moldura>
    )
  }

  const etapa = etapaAtual(torneio)
  const meuJogo = meuId ? jogoDoTime(torneio, meuId, etapa) : null
  const jaAssisti = !meuJogo || assistidos.has(meuJogo.id)
  const prontos = new Set(est.prontos ?? [])
  const euPronto = prontos.has(userId)
  const ativos = est.ativos ?? []
  const fora = meuId && foiEliminado(torneio, meuId)

  async function continuar() {
    setEnviando(true)
    await supabase.rpc('fd_torneio_continuar', { p_sala_id: salaId })
    setEnviando(false)
  }

  if (view === 'jogo' && meuJogo) {
    return (
      <div className="min-h-[100dvh] px-4 pb-12 pt-6">
        <ExitButton onExit={onExit} />
        <div className="mx-auto w-full max-w-[480px]">
          <JogoTorneio
            salaId={salaId} torneio={torneio} etapa={etapa} jogo={meuJogo}
            onAssistiu={() => marcarAssistido(meuJogo.id)} onVoltar={() => setView('resumo')}
          />
        </div>
      </div>
    )
  }

  if (view === 'resumo' && jaAssisti) {
    return (
      <Moldura onExit={onExit}>
        <Resumo torneio={torneio} etapa={etapa} meuId={meuId} />
        {euPronto ? (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm font-semibold">Aguardando os outros ({prontos.size}/{Math.max(ativos.length, prontos.size)})</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {jogadores.filter((j) => ativos.includes(j.user_id)).map((j) => (
                <li key={j.user_id} className="flex items-center justify-between text-sm">
                  <span>{j.nome}</span>
                  {prontos.has(j.user_id) ? <Check className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-muted" />}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <BotaoPrincipal disabled={enviando || !sincronizado} onClick={continuar}>
            {etapa.fase === 'final' ? 'Ver o campeão' : 'Continuar'}
          </BotaoPrincipal>
        )}
        <button onClick={() => setView('hub')} className="w-full py-2 text-sm text-secondary">Ver tabelas e rankings</button>
      </Moldura>
    )
  }

  // Hub: o que fazer agora + tabelas
  const ate = torneio.cursor // só etapas já reveladas
  const eu = meuId ? timePorId(torneio, meuId) : null
  return (
    <Moldura onExit={onExit}>
      <Titulo pequeno="Campeonato" grande={etapa.nome}>
        {eu && <p className="mt-1 text-sm text-secondary">{eu.nome}{fora ? ' · eliminado' : ''}</p>}
      </Titulo>

      {meuJogo ? (
        <div className="rounded-2xl border border-accent/40 bg-accent-glow p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Seu jogo</p>
          <div className="mt-3 flex items-center justify-around">
            {[timePorId(torneio, meuJogo.A), timePorId(torneio, meuJogo.B)].map((t) => (
              <div key={t.id} className="flex w-[42%] flex-col items-center text-center">
                <Escudo time={t} tam={48} destaque={t.id === meuId} />
                <p className="mt-1.5 text-sm font-bold leading-tight">{t.nome}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            {jaAssisti ? (
              <BotaoPrincipal onClick={() => setView('resumo')}>Ver resumo da rodada</BotaoPrincipal>
            ) : (
              <BotaoPrincipal onClick={() => setView('jogo')}>Ver o jogo</BotaoPrincipal>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm text-secondary">{fora ? 'Seu time está eliminado, mas dá pra acompanhar o resto.' : 'Seu time não joga nessa etapa.'}</p>
          <div className="mt-3">
            <BotaoPrincipal onClick={() => { marcarAssistido(`vi:${etapa.id}`); setView('resumo') }}>Ver resultados da rodada</BotaoPrincipal>
          </div>
        </div>
      )}

      <Abas abas={[['rodada', 'Jogos'], ['grupos', 'Grupos'], ['mata', 'Mata-mata'], ['rank', 'Rankings']]} valor={aba} onChange={setAba} />
      {aba === 'rodada' && (
        <div className="space-y-2">
          {etapa.jogos.map((j) => {
            const A = timePorId(torneio, j.A)
            const B = timePorId(torneio, j.B)
            return (
              <div key={j.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface p-3">
                <Escudo time={A} tam={26} /><span className="min-w-0 flex-1 truncate text-sm font-semibold">{A.nome}</span>
                <span className="text-xs text-muted">x</span>
                <span className="min-w-0 flex-1 truncate text-right text-sm font-semibold">{B.nome}</span><Escudo time={B} tam={26} />
              </div>
            )
          })}
        </div>
      )}
      {aba === 'grupos' && <TabelasGrupos torneio={torneio} ate={ate} meuId={meuId} grupoInicial={Math.max(0, torneio.grupos.findIndex((g) => g.includes(meuId)))} />}
      {aba === 'mata' && <Chaveamento torneio={torneio} ate={ate} meuId={meuId} />}
      {aba === 'rank' && <Rankings est={torneio.estRevelado} />}
    </Moldura>
  )
}
