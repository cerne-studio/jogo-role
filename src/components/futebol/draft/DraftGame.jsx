import { useEffect, useState } from 'react'
import ExitButton from '../../core/ExitButton.jsx'
import CriarOuEntrarSala from '../../sala/CriarOuEntrarSala.jsx'
import SalaLobby from '../../sala/SalaLobby.jsx'
import useJogadorAtual from '../../sala/useJogadorAtual.js'
import useSala from '../../sala/useSala.js'
import { lerSalaAtiva, limparSalaAtiva } from '../../sala/salaMemoria.js'
import { supabase } from '../../../lib/supabase.js'
import DraftConfig from './DraftConfig.jsx'
import DraftEntrada from './DraftEntrada.jsx'
import DraftEscolha from './DraftEscolha.jsx'
import DraftEspera from './DraftEspera.jsx'
import DraftFormacao from './DraftFormacao.jsx'
import DraftProntos from './DraftProntos.jsx'
import DraftRoleta from './DraftRoleta.jsx'
import DraftTatica from './DraftTatica.jsx'
import { TOTAL_RODADAS } from './draftUtils.jsx'
import { useAvancador, useRelogio, useTick, useTimes } from './useServidor.js'

const JOGO = 'draft'

function TelaMensagem({ mensagem, onExit }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
      <ExitButton onExit={onExit} />
      <p className="max-w-sm text-sm text-secondary">{mensagem}</p>
    </div>
  )
}

// Lobby: o host escolhe o modo e o tamanho do campeonato; todo mundo vê em tempo real.
function LobbyDraft({ salaInfo, sala, jogadores, souHost, onExit }) {
  const [erro, setErro] = useState('')
  const [iniciando, setIniciando] = useState(false)
  const cfg = { modo: 'historico', liga: null, torneio: 8, ...(sala.estado?.config ?? {}) }

  async function mudar(novo) {
    setErro('')
    const { error } = await supabase.rpc('fd_configurar', { p_sala_id: salaInfo.salaId, p_modo: novo.modo, p_liga: novo.liga, p_torneio: novo.torneio })
    if (error) setErro(error.message)
  }

  return (
    <SalaLobby
      codigo={salaInfo.codigo}
      jogadores={jogadores}
      souHost={souHost}
      minimo={1}
      iniciando={iniciando}
      erro={erro}
      onIniciar={async () => {
        setIniciando(true)
        setErro('')
        const { error } = await supabase.rpc('iniciar_partida', { p_sala_id: salaInfo.salaId })
        setIniciando(false)
        if (error) setErro(error.message)
      }}
      onExit={onExit}
    >
      <DraftConfig valor={cfg} onChange={mudar} somenteLeitura={!souHost} erro={erro} />
      <p className="mt-2 text-xs text-muted">De 1 a 8 jogadores. Sozinho na sala, o draft roda do mesmo jeito.</p>
    </SalaLobby>
  )
}

export default function DraftGame({ onBack }) {
  const { userId, carregando, erro: erroSessao } = useJogadorAtual()
  const [salaInfo, setSalaInfo] = useState(null)
  const [reconectando, setReconectando] = useState(true)
  const [caminho, setCaminho] = useState('entrada')
  const { sala, jogadores } = useSala(salaInfo?.salaId)
  const est = sala?.estado
  const { agora, pronto: relogioPronto } = useRelogio()
  useAvancador(salaInfo?.salaId, est, agora, userId)
  useTick(200)
  const times = useTimes(salaInfo?.salaId, `${est?.rodada}:${(est?.ja_escolheu ?? []).length}:${est?.fase}`)

  function sair() {
    limparSalaAtiva(JOGO)
    onBack()
  }

  // Reconexão: celular travou/recarregou no meio do draft, volta pra mesma sala (a escolha em andamento continua valendo).
  useEffect(() => {
    if (carregando || !userId) return
    const lembrada = lerSalaAtiva(JOGO)
    if (!lembrada) {
      setReconectando(false)
      return
    }
    let cancelado = false
    supabase.rpc('entrar_sala', { p_codigo: lembrada.codigo, p_nome: lembrada.nome }).then(({ data, error }) => {
      if (cancelado) return
      if (error) limparSalaAtiva(JOGO)
      else setSalaInfo({ salaId: data.sala_id, codigo: data.codigo })
      setReconectando(false)
    })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregando, userId])

  if (carregando || reconectando || !relogioPronto) return <TelaMensagem mensagem="Conectando..." onExit={sair} />
  if (erroSessao) return <TelaMensagem mensagem={erroSessao} onExit={sair} />

  if (!salaInfo) {
    if (caminho === 'amigos') return <CriarOuEntrarSala jogo={JOGO} onEntrou={setSalaInfo} onExit={sair} />
    return <DraftEntrada jogo={JOGO} onSolo={setSalaInfo} onAmigos={() => setCaminho('amigos')} onExit={sair} />
  }

  if (!sala) return <TelaMensagem mensagem="Entrando na sala..." onExit={sair} />

  const souHost = sala.host_id === userId
  if (sala.status === 'lobby') {
    return <LobbyDraft salaInfo={salaInfo} sala={sala} jogadores={jogadores} souHost={souHost} onExit={sair} />
  }

  const meuTime = times.find((t) => t.user_id === userId)
  const base = { salaId: salaInfo.salaId, userId, est, jogadores, agora, times, onExit: sair }

  if (est.fase === 'formacao') return <DraftFormacao {...base} />
  if (est.fase === 'tatica') return <DraftTatica {...base} />
  if (est.fase === 'prontos') return <DraftProntos {...base} />

  if (est.fase === 'draft') {
    const escolhaIni = Date.parse(est.escolha_ini)
    if (agora() < escolhaIni - 100) {
      return <DraftRoleta key={`${est.rodada}-${est.letra}`} letra={est.letra} ate={escolhaIni} agora={agora} rodada={est.rodada} total={TOTAL_RODADAS} />
    }
    if ((est.ja_escolheu ?? []).includes(userId)) return <DraftEspera {...base} meuTime={meuTime} />
    return <DraftEscolha key={est.rodada} {...base} />
  }

  return <TelaMensagem mensagem="Abrindo o draft..." onExit={sair} />
}
