import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, Bomb } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'
import DefusadorView from './DefusadorView.jsx'
import EspecialistaView from './EspecialistaView.jsx'
import { gerarCodigo } from '../../data/bombaModulos.js'

export default function BombaGame({ onBack }) {
  const [fase, setFase] = useState('papel')
  const [papel, setPapel] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [inputCodigo, setInputCodigo] = useState('')

  function escolherDefusador() {
    setPapel('defusador')
    setCodigo(gerarCodigo())
    setFase('codigo-defusador')
  }

  function escolherEspecialista() {
    setPapel('especialista')
    setFase('codigo-especialista')
  }

  if (fase === 'papel') {
    return (
      <div className="flex min-h-[100dvh] flex-col px-6 py-8">
        <ExitButton onExit={onBack} />
        <div className="mx-auto w-full max-w-sm flex-1">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-secondary">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="mt-8 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-glow">
              <Bomb className="h-7 w-7 text-accent" />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">A Bomba</h1>
            <p className="mt-2 text-sm text-secondary">
              Precisa de 2 celulares. Sentem de costas um pro outro (ou em cômodos separados) —
              ninguém pode ver a tela do outro.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={escolherDefusador}
              className="w-full rounded-xl border border-border-strong bg-surface px-6 py-5 text-left"
            >
              <span className="text-base font-semibold text-primary">Sou o Defusador</span>
              <p className="mt-1 text-xs text-secondary">Vejo a bomba. Não tenho o manual.</p>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={escolherEspecialista}
              className="w-full rounded-xl border border-border-strong bg-surface px-6 py-5 text-left"
            >
              <span className="text-base font-semibold text-primary">Sou o Especialista</span>
              <p className="mt-1 text-xs text-secondary">Tenho o manual. Não vejo a bomba.</p>
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  if (fase === 'codigo-defusador') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">Seu código da bomba</p>
          <h1 className="mt-3 text-5xl font-bold tracking-tight tabular-nums text-accent">{codigo}</h1>
          <p className="mt-4 text-sm text-secondary">
            Fale esse código em voz alta pro Especialista digitar no aparelho dele. Depois,
            combinem "3, 2, 1, já" e apertem os dois ao mesmo tempo.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setFase('jogo')}
            className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            3, 2, 1, já
          </motion.button>
        </div>
      </div>
    )
  }

  if (fase === 'codigo-especialista') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            Digite o código que o Defusador te falou
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={inputCodigo}
            onChange={(e) => setInputCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="mt-6 w-full rounded-xl border border-border-strong bg-white/5 px-4 py-4 text-center text-3xl font-bold tabular-nums tracking-widest outline-none focus:border-accent"
          />
          <motion.button
            whileTap={{ scale: inputCodigo.length === 6 ? 0.97 : 1 }}
            disabled={inputCodigo.length !== 6}
            onClick={() => {
              setCodigo(inputCodigo)
              setFase('esperando')
            }}
            className="mt-6 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-30"
          >
            Confirmar código
          </motion.button>
        </div>
      </div>
    )
  }

  if (fase === 'esperando') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight">Manual carregado</h1>
          <p className="mt-2 text-sm text-secondary">
            Combinem "3, 2, 1, já" com o Defusador e apertem os dois ao mesmo tempo.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setFase('jogo')}
            className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            3, 2, 1, já
          </motion.button>
        </div>
      </div>
    )
  }

  if (fase === 'jogo' && papel === 'defusador') {
    return <DefusadorView codigo={codigo} onExit={onBack} />
  }

  if (fase === 'jogo' && papel === 'especialista') {
    return <EspecialistaView codigo={codigo} onExit={onBack} />
  }

  return null
}
