import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, Bomb } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'
import CegoView from './CegoView.jsx'
import MudoView from './MudoView.jsx'
import SurdoView from './SurdoView.jsx'
import { gerarCodigo } from '../../data/bombaModulos.js'

const PAPEIS = [
  { id: 'mudo', nome: 'Mudo', desc: 'Vê o manual. Não pode falar — só mostrar ou escrever.' },
  { id: 'surdo', nome: 'Surdo', desc: 'Não vê nem escuta nada do app. Repassa falando pro Cego.' },
  { id: 'cego', nome: 'Cego', desc: 'Vê a bomba e mexe nela. Não sabe nenhuma regra.' },
]

export default function BombaGame({ onBack }) {
  const [fase, setFase] = useState('codigo-escolha')
  const [codigo, setCodigo] = useState('')
  const [inputCodigo, setInputCodigo] = useState('')
  const [papel, setPapel] = useState(null)

  if (fase === 'codigo-escolha') {
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
              Precisa de 3 celulares — Cego, Surdo e Mudo. Todo mundo fica junto na mesma
              sala, mas cada um só recebe um pedaço da informação.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setCodigo(gerarCodigo())
                setFase('codigo-gerado')
              }}
              className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
            >
              Gerar código novo da bomba
            </motion.button>
            <button
              onClick={() => setFase('codigo-digitar')}
              className="text-sm text-secondary underline underline-offset-4"
            >
              Já tenho um código
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (fase === 'codigo-gerado') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">Código da bomba</p>
          <h1 className="mt-3 text-5xl font-bold tracking-tight tabular-nums text-accent">{codigo}</h1>
          <p className="mt-4 text-sm text-secondary">
            Mostre esse código pros outros dois digitarem no aparelho deles. Depois, cada um
            escolhe seu papel.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setFase('papel')}
            className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Continuar
          </motion.button>
        </div>
      </div>
    )
  }

  if (fase === 'codigo-digitar') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            Digite o código da bomba
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
              setFase('papel')
            }}
            className="mt-6 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-30"
          >
            Confirmar código
          </motion.button>
        </div>
      </div>
    )
  }

  if (fase === 'papel') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">Qual é o seu papel?</p>
          <div className="mt-6 flex flex-col gap-3">
            {PAPEIS.map((p) => (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setPapel(p.id)
                  setFase('pronto')
                }}
                className="w-full rounded-xl border border-border-strong bg-surface px-6 py-5 text-left"
              >
                <span className="text-base font-semibold text-primary">Sou o {p.nome}</span>
                <p className="mt-1 text-xs text-secondary">{p.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (fase === 'pronto') {
    const info = PAPEIS.find((p) => p.id === papel)
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onBack} />
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight">Você é o {info.nome}</h1>
          <p className="mt-2 text-sm text-secondary">{info.desc}</p>
          <p className="mt-4 text-sm text-secondary">
            Combinem "3, 2, 1, já" os três juntos e apertem ao mesmo tempo.
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

  if (fase === 'jogo' && papel === 'cego') {
    return <CegoView codigo={codigo} onExit={onBack} />
  }

  if (fase === 'jogo' && papel === 'mudo') {
    return <MudoView codigo={codigo} onExit={onBack} />
  }

  if (fase === 'jogo' && papel === 'surdo') {
    return <SurdoView onExit={onBack} />
  }

  return null
}
