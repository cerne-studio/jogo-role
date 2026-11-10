import { useEffect, useState } from 'react'
import ExitButton from '../core/ExitButton.jsx'
import CriarOuEntrarSala from '../sala/CriarOuEntrarSala.jsx'
import SalaLobby from '../sala/SalaLobby.jsx'
import { CAPAS } from '../../assets/role/index.js'
import useJogadorAtual from '../sala/useJogadorAtual.js'
import useSala from '../sala/useSala.js'
import { lerSalaAtiva, limparSalaAtiva } from '../sala/salaMemoria.js'
import { supabase } from '../../lib/supabase.js'
import HintConfig from './HintConfig.jsx'
import HintPartida from './HintPartida.jsx'
import HintFim from './HintFim.jsx'
import { useHintRelogio, useHostAusente, usePresenca } from './hintUtils.js'

const JOGO = 'hint'

function TelaMensagem({ mensagem, onExit }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
      <ExitButton onExit={onExit} />
      <p className="max-w-sm text-sm text-secondary">{mensagem}</p>
    </div>
  )
}

// HINT: dois times, roda de cartas, quatro modalidades. Toda a lógica (pontos, roda, prazos, segredos) está no
// servidor; esta tela só mostra o estado e manda as ações. Qualquer celular avança os prazos e o host pode ser
// substituído se sumir, então a partida não depende de um aparelho só.
export default function HintGame({ onBack }) {
  const { userId, carregando, erro: erroSessao } = useJogadorAtual()
  const [salaInfo, setSalaInfo] = useState(null)
  const [reconectando, setReconectando] = useState(true)
  const [erroIniciar, setErroIniciar] = useState('')
  const [iniciando, setIniciando] = useState(false)
  const [erroHost, setErroHost] = useState('')
  const { sala, jogadores } = useSala(salaInfo?.salaId)
  const noJogo = sala?.status === 'em_andamento'
  const { restante, offset } = useHintRelogio(salaInfo?.salaId, sala?.estado, noJogo)
  usePresenca(salaInfo?.salaId)
  const souHost = sala?.host_id === userId
  const hostAusente = useHostAusente(salaInfo?.salaId, sala?.host_id, souHost, offset)

  function sair() {
    limparSalaAtiva(JOGO)
    onBack()
  }

  // Reconexão automática: celular travou/recarregou no meio da partida, volta pra mesma sala (e o quadro
  // e a carta são reconstruídos do servidor).
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

  async function assumirHost() {
    setErroHost('')
    const { error } = await supabase.rpc('hint_assumir_host', { p_sala_id: salaInfo.salaId })
    if (error) setErroHost(error.message)
  }

  if (carregando || reconectando) return <TelaMensagem mensagem="Conectando..." onExit={sair} />
  if (erroSessao) return <TelaMensagem mensagem={erroSessao} onExit={sair} />
  if (!salaInfo) return <CriarOuEntrarSala capa={CAPAS.hint} jogo={JOGO} onEntrou={setSalaInfo} onExit={sair} />
  if (!sala) return <TelaMensagem mensagem="Entrando na sala..." onExit={sair} />

  const bannerHost = hostAusente && (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-accent/40 bg-elevated px-4 py-3 text-xs text-secondary">
      <span>O host sumiu da sala. {erroHost && <span className="text-danger">{erroHost}</span>}</span>
      <button onClick={assumirHost} className="shrink-0 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-black">
        Assumir o comando
      </button>
    </div>
  )

  if (sala.status === 'lobby') {
    return (
      <>
        <SalaLobby
          capa={CAPAS.hint}
          codigo={salaInfo.codigo}
          jogadores={jogadores}
          souHost={souHost}
          minimo={4}
          erro={erroIniciar}
          iniciando={iniciando}
          onIniciar={async () => {
            setIniciando(true)
            setErroIniciar('')
            const { error } = await supabase.rpc('hint_iniciar', { p_sala_id: salaInfo.salaId })
            setIniciando(false)
            if (error) setErroIniciar(error.message)
          }}
          onExit={sair}
        >
          <HintConfig salaId={salaInfo.salaId} est={sala.estado} jogadores={jogadores} souHost={souHost} />
        </SalaLobby>
        {bannerHost}
      </>
    )
  }

  const est = sala.estado
  if (sala.status === 'finalizado' && est?.vencedor) {
    return (
      <>
        <HintFim salaId={salaInfo.salaId} sala={sala} jogadores={jogadores} userId={userId} souHost={souHost} hostAusente={hostAusente} onExit={sair} />
        {bannerHost}
      </>
    )
  }
  if (!est?.fase || !est?.roda) return <TelaMensagem mensagem="Abrindo a partida..." onExit={sair} />

  return (
    <>
      <HintPartida salaId={salaInfo.salaId} sala={sala} jogadores={jogadores} userId={userId} restante={restante} onExit={sair} />
      {bannerHost}
    </>
  )
}
