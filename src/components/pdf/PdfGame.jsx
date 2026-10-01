import { useEffect, useState } from 'react'
import ExitButton from '../core/ExitButton.jsx'
import CriarOuEntrarSala from '../sala/CriarOuEntrarSala.jsx'
import SalaLobby from '../sala/SalaLobby.jsx'
import useJogadorAtual from '../sala/useJogadorAtual.js'
import useSala from '../sala/useSala.js'
import { lerSalaAtiva, limparSalaAtiva } from '../sala/salaMemoria.js'
import { supabase } from '../../lib/supabase.js'
import PdfMao from './PdfMao.jsx'
import PdfEspera from './PdfEspera.jsx'
import PdfJulgamento from './PdfJulgamento.jsx'
import PdfResultado from './PdfResultado.jsx'
import PdfFim from './PdfFim.jsx'
import PdfMeta from './PdfMeta.jsx'

const JOGO = 'pdf'

function TelaMensagem({ mensagem, onExit }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
      <ExitButton onExit={onExit} />
      <p className="max-w-sm text-sm text-secondary">{mensagem}</p>
    </div>
  )
}

export default function PdfGame({ onBack }) {
  const { userId, carregando, erro: erroSessao } = useJogadorAtual()
  const [salaInfo, setSalaInfo] = useState(null)
  const [reconectando, setReconectando] = useState(true)
  const [erroIniciar, setErroIniciar] = useState('')
  const [iniciando, setIniciando] = useState(false)
  const { sala, jogadores } = useSala(salaInfo?.salaId)

  function sair() {
    limparSalaAtiva(JOGO)
    onBack()
  }

  // Reconexão automática: celular travou/recarregou no meio da partida, volta pra mesma sala e mão.
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
    return <CriarOuEntrarSala jogo={JOGO} onEntrou={setSalaInfo} onExit={sair} />
  }

  if (!sala) return <TelaMensagem mensagem="Entrando na sala..." onExit={sair} />

  const souHost = sala.host_id === userId

  if (sala.status === 'lobby') {
    return (
      <SalaLobby
        codigo={salaInfo.codigo}
        jogadores={jogadores}
        souHost={souHost}
        erro={erroIniciar}
        iniciando={iniciando}
        onIniciar={async () => {
          setIniciando(true)
          setErroIniciar('')
          const { error } = await supabase.rpc('iniciar_partida', { p_sala_id: salaInfo.salaId })
          setIniciando(false)
          if (error) setErroIniciar(error.message)
        }}
        onExit={sair}
      >
        <PdfMeta salaId={salaInfo.salaId} meta={sala.estado?.meta ?? 5} souHost={souHost} />
      </SalaLobby>
    )
  }

  if (sala.status === 'finalizado' && sala.estado?.vencedor) {
    return <PdfFim sala={sala} jogadores={jogadores} userId={userId} onExit={sair} />
  }

  const est = sala.estado
  if (!est?.preta) return <TelaMensagem mensagem="Abrindo a rodada..." onExit={sair} />

  const souJuiz = est.juiz_id === userId
  const juizNome = jogadores.find((j) => j.user_id === est.juiz_id)?.nome ?? '...'
  const props = {
    salaId: salaInfo.salaId,
    userId,
    sala,
    jogadores,
    juizNome,
    souJuiz,
    souHost,
    onExit: sair,
  }

  if (est.fase === 'resultado') return <PdfResultado {...props} />
  if (est.fase === 'julgando') return <PdfJulgamento {...props} />

  const jaJoguei = (est.ja_jogaram ?? []).includes(userId)
  if (souJuiz || jaJoguei) return <PdfEspera {...props} />
  return <PdfMao {...props} />
}
