import { useEffect, useState } from 'react'
import ExitButton from '../core/ExitButton.jsx'
import { CAPAS } from '../../assets/role/index.js'
import CriarOuEntrarSala from '../sala/CriarOuEntrarSala.jsx'
import SalaLobby from '../sala/SalaLobby.jsx'
import useJogadorAtual from '../sala/useJogadorAtual.js'
import useSala from '../sala/useSala.js'
import { lerSalaAtiva, limparSalaAtiva } from '../sala/salaMemoria.js'
import { supabase } from '../../lib/supabase.js'
import RespostasConfig from './RespostasConfig.jsx'
import RespostasPartida from './RespostasPartida.jsx'
import RespostasFim from './RespostasFim.jsx'
import useRespostasRelogio from './useRespostasRelogio.js'

const JOGO = 'respostas'

function TelaMensagem({ mensagem, onExit }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
      <ExitButton onExit={onExit} />
      <p className="max-w-sm text-sm text-secondary">{mensagem}</p>
    </div>
  )
}

// Tela da partida em andamento: separada pra o relógio só rodar quando há partida.
function Partida({ salaId, userId, sala, jogadores, souHost, onExit }) {
  const restante = useRespostasRelogio(salaId, sala.estado)
  if (sala.estado?.fase === 'final' || sala.status === 'finalizado') {
    return <RespostasFim salaId={salaId} sala={sala} jogadores={jogadores} userId={userId} souHost={souHost} onExit={onExit} />
  }
  if (!sala.estado?.categoria) return <TelaMensagem mensagem="Abrindo a pergunta..." onExit={onExit} />
  return <RespostasPartida salaId={salaId} userId={userId} sala={sala} jogadores={jogadores} restante={restante} onExit={onExit} />
}

export default function RespostasGame({ onBack }) {
  const { userId, carregando, erro: erroSessao } = useJogadorAtual()
  const [salaInfo, setSalaInfo] = useState(null)
  const [reconectando, setReconectando] = useState(true)
  const [erroIniciar, setErroIniciar] = useState('')
  const [iniciando, setIniciando] = useState(false)
  const [config, setConfig] = useState({ total: 10, tempo: 30, categorias: [] })
  const { sala, jogadores } = useSala(salaInfo?.salaId)

  function sair() {
    limparSalaAtiva(JOGO)
    onBack()
  }

  // Reconexão automática: celular travou/recarregou, volta pra mesma sala sem pedir o código de novo.
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
      if (error) {
        limparSalaAtiva(JOGO)
      } else {
        setSalaInfo({ salaId: data.sala_id, codigo: data.codigo })
      }
      setReconectando(false)
    })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregando, userId])

  if (carregando || reconectando) return <TelaMensagem mensagem="Conectando..." onExit={sair} />
  if (erroSessao) return <TelaMensagem mensagem={erroSessao} onExit={sair} />

  if (!salaInfo) {
    return <CriarOuEntrarSala capa={CAPAS.respostas} jogo={JOGO} onEntrou={setSalaInfo} onExit={sair} />
  }

  if (!sala) return <TelaMensagem mensagem="Entrando na sala..." onExit={sair} />

  const souHost = sala.host_id === userId

  if (sala.status === 'lobby') {
    return (
      <SalaLobby
        capa={CAPAS.respostas}
        codigo={salaInfo.codigo}
        jogadores={jogadores}
        souHost={souHost}
        minimo={2}
        erro={erroIniciar}
        iniciando={iniciando}
        onIniciar={async () => {
          setIniciando(true)
          setErroIniciar('')
          const { error } = await supabase.rpc('iniciar_respostas', {
            p_sala_id: salaInfo.salaId,
            p_total: config.total,
            p_tempo: config.tempo,
            p_categorias: config.categorias,
          })
          setIniciando(false)
          if (error) setErroIniciar(error.message)
        }}
        onExit={sair}
      >
        <RespostasConfig config={config} onChange={setConfig} souHost={souHost} />
      </SalaLobby>
    )
  }

  return <Partida salaId={salaInfo.salaId} userId={userId} sala={sala} jogadores={jogadores} souHost={souHost} onExit={sair} />
}
