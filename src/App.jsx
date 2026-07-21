import { useState } from 'react'
import Home from './components/Home.jsx'
import PlayerSetup from './components/PlayerSetup.jsx'
import ImpostorGame from './components/impostor/ImpostorGame.jsx'
import ResistenciaGame from './components/resistencia/ResistenciaGame.jsx'
import MimicaGame from './components/mimica/MimicaGame.jsx'
import JogoDaNotaGame from './components/nota/JogoDaNotaGame.jsx'
import QuemSouEuGame from './components/quemsoueu/QuemSouEuGame.jsx'
import TabuGame from './components/tabu/TabuGame.jsx'
import PalpiteGame from './components/palpite/PalpiteGame.jsx'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [selectedGame, setSelectedGame] = useState(null)
  const [players, setPlayers] = useState([])

  function goHome() {
    setScreen('home')
    setSelectedGame(null)
    setPlayers([])
  }

  if (screen === 'home') {
    return (
      <Home
        onSelectGame={(game) => {
          setSelectedGame(game)
          setScreen('setup')
        }}
      />
    )
  }

  if (screen === 'setup') {
    return (
      <PlayerSetup
        gameName={selectedGame.nome}
        minPlayers={selectedGame.minPlayers}
        maxPlayers={selectedGame.id === 'resistencia' ? 10 : undefined}
        onBack={goHome}
        onStart={(names) => {
          setPlayers(names)
          setScreen('game')
        }}
      />
    )
  }

  if (screen === 'game' && selectedGame.id === 'impostor') {
    return <ImpostorGame players={players} onBack={goHome} />
  }

  if (screen === 'game' && selectedGame.id === 'resistencia') {
    return <ResistenciaGame players={players} onBack={goHome} />
  }

  if (screen === 'game' && selectedGame.id === 'mimica') {
    return <MimicaGame players={players} onBack={goHome} />
  }

  if (screen === 'game' && selectedGame.id === 'nota') {
    return <JogoDaNotaGame players={players} onBack={goHome} />
  }

  if (screen === 'game' && selectedGame.id === 'quemsoueu') {
    return <QuemSouEuGame players={players} onBack={goHome} />
  }

  if (screen === 'game' && selectedGame.id === 'tabu') {
    return <TabuGame players={players} onBack={goHome} />
  }

  if (screen === 'game' && selectedGame.id === 'palpite') {
    return <PalpiteGame players={players} onBack={goHome} />
  }

  return null
}
