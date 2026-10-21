import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import Home from './components/Home.jsx'
import PlayerSetup from './components/PlayerSetup.jsx'
import { CAPAS, FOCOS } from './assets/role/index.js'

// Cada jogo vira um pedaço separado do site: a Home abre rápido e o celular só baixa o jogo que for usar.
const JOGOS_PASSA = {
  impostor: lazy(() => import('./components/impostor/ImpostorGame.jsx')),
  resistencia: lazy(() => import('./components/resistencia/ResistenciaGame.jsx')),
  mimica: lazy(() => import('./components/mimica/MimicaGame.jsx')),
  nota: lazy(() => import('./components/nota/JogoDaNotaGame.jsx')),
  quemsoueu: lazy(() => import('./components/quemsoueu/QuemSouEuGame.jsx')),
  tabu: lazy(() => import('./components/tabu/TabuGame.jsx')),
  palpite: lazy(() => import('./components/palpite/PalpiteGame.jsx')),
  papelitos: lazy(() => import('./components/papelitos/PapelitosGame.jsx')),
}
const JOGOS_CELULARES = {
  manada: lazy(() => import('./components/manada/ManadaGame.jsx')),
  themind: lazy(() => import('./components/themind/TheMindGame.jsx')),
  pdf: lazy(() => import('./components/pdf/PdfGame.jsx')),
  draft: lazy(() => import('./components/futebol/draft/DraftGame.jsx')),
}
const NbaCarreira = lazy(() => import('./components/nba/NbaCarreira.jsx'))
const FutebolDemo = lazy(() => import('./components/futebol/FutebolDemo.jsx'))

function Carregando() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
    </div>
  )
}

export default function App() {
  const demo = new URLSearchParams(window.location.search).get('demo') === 'futebol'
  const [screen, setScreen] = useState('home')
  const [selectedGame, setSelectedGame] = useState(null)
  const [players, setPlayers] = useState([])

  const goHome = useCallback(() => {
    setScreen('home')
    setSelectedGame(null)
    setPlayers([])
  }, [])

  // Botão "voltar" do celular volta pra Home em vez de sair do site no meio de uma partida
  useEffect(() => {
    const aoVoltar = () => goHome()
    window.addEventListener('popstate', aoVoltar)
    return () => window.removeEventListener('popstate', aoVoltar)
  }, [goHome])

  function abrir(game) {
    window.history.pushState({ jogo: game.id }, '')
    setSelectedGame(game)
    if (game.id === 'carreira') setScreen('carreira')
    else if (game.multiDispositivo) setScreen('game')
    else setScreen('setup')
  }

  if (demo) {
    return (
      <Suspense fallback={<Carregando />}>
        <FutebolDemo />
      </Suspense>
    )
  }

  if (screen === 'home') return <Home onSelectGame={abrir} />

  const Jogo = selectedGame && (JOGOS_CELULARES[selectedGame.id] ?? JOGOS_PASSA[selectedGame.id])

  return (
    <Suspense fallback={<Carregando />}>
      {screen === 'carreira' && <NbaCarreira onBack={goHome} />}

      {screen === 'setup' && (
        <PlayerSetup
          gameName={selectedGame.nome}
          capa={CAPAS[selectedGame.id]}
          foco={FOCOS[selectedGame.id]}
          minPlayers={selectedGame.minPlayers}
          maxPlayers={selectedGame.id === 'resistencia' ? 10 : undefined}
          onBack={goHome}
          onStart={(names) => {
            setPlayers(names)
            setScreen('game')
          }}
        />
      )}

      {screen === 'game' && Jogo && (JOGOS_CELULARES[selectedGame.id] ? <Jogo onBack={goHome} /> : <Jogo players={players} onBack={goHome} />)}
    </Suspense>
  )
}
