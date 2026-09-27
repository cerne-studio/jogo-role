import { useState } from 'react'
import ExitButton from '../core/ExitButton.jsx'
import CriarOuEntrarSala from '../sala/CriarOuEntrarSala.jsx'
import SalaLobby from '../sala/SalaLobby.jsx'
import useJogadorAtual from '../sala/useJogadorAtual.js'
import useSala from '../sala/useSala.js'
import { supabase } from '../../lib/supabase.js'
import TheMindMao from './TheMindMao.jsx'
import TheMindFim from './TheMindFim.jsx'

function TelaMensagem({ mensagem, onExit }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
      <ExitButton onExit={onExit} />
      <p className="max-w-sm text-sm text-secondary">{mensagem}</p>
    </div>
  )
}

export default function TheMindGame({ onBack }) {
  const { userId, carregando, erro: erroSessao } = useJogadorAtual()
  const [salaInfo, setSalaInfo] = useState(null)
  const [erroIniciar, setErroIniciar] = useState('')
  const [iniciando, setIniciando] = useState(false)
  const { sala, jogadores } = useSala(salaInfo?.salaId)

  if (carregando) return <TelaMensagem mensagem="Conectando..." onExit={onBack} />
  if (erroSessao) return <TelaMensagem mensagem={erroSessao} onExit={onBack} />

  if (!salaInfo) {
    return <CriarOuEntrarSala jogo="themind" onEntrou={setSalaInfo} onExit={onBack} />
  }

  if (!sala) return <TelaMensagem mensagem="Entrando na sala..." onExit={onBack} />

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
        onExit={onBack}
      />
    )
  }

  if (sala.status === 'finalizado') {
    return <TheMindFim sala={sala} onExit={onBack} />
  }

  return <TheMindMao salaId={salaInfo.salaId} userId={userId} sala={sala} jogadores={jogadores} onExit={onBack} />
}
