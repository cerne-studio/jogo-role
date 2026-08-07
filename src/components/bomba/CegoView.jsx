import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import ExitButton from '../core/ExitButton.jsx'
import {
  gerarModulosBomba,
  criarRand,
  validarFios,
  validarTeclado,
  validarSimbolos,
} from '../../data/bombaModulos.js'

const TEMPO_TOTAL = 240

export default function CegoView({ codigo, onExit }) {
  const [modulos] = useState(() => gerarModulosBomba(criarRand(codigo)))
  const [moduloIndex, setModuloIndex] = useState(0)
  const [tempoRestante, setTempoRestante] = useState(TEMPO_TOTAL)
  const [strikes, setStrikes] = useState(0)
  const [fase, setFase] = useState('jogo')
  const [motivoDerrota, setMotivoDerrota] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [sequenciaTocada, setSequenciaTocada] = useState([])
  const [valorTeclado, setValorTeclado] = useState('')

  const moduloAtual = modulos[moduloIndex]

  useEffect(() => {
    if (fase !== 'jogo') return
    if (tempoRestante <= 0) {
      setMotivoDerrota('tempo')
      setFase('derrota')
      return
    }
    const t = setTimeout(() => setTempoRestante((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [fase, tempoRestante])

  function registrarStrike() {
    const novo = strikes + 1
    setStrikes(novo)
    setTempoRestante((t) => Math.max(0, t - 15))
    if (novo >= 3) {
      setMotivoDerrota('strikes')
      setFase('derrota')
      return true
    }
    return false
  }

  function avancarModulo() {
    setSequenciaTocada([])
    setValorTeclado('')
    if (moduloIndex + 1 < modulos.length) {
      setModuloIndex((i) => i + 1)
    } else {
      setFase('vitoria')
    }
  }

  function cortarFio(fioId) {
    if (validarFios(moduloAtual, fioId)) {
      setFeedback({ tipo: 'ok' })
      setTimeout(() => {
        setFeedback(null)
        avancarModulo()
      }, 700)
    } else {
      const explodiu = registrarStrike()
      if (!explodiu) {
        setFeedback({ tipo: 'erro' })
        setTimeout(() => {
          setFeedback(null)
          avancarModulo()
        }, 900)
      }
    }
  }

  function confirmarTeclado() {
    if (validarTeclado(moduloAtual, valorTeclado)) {
      setFeedback({ tipo: 'ok' })
      setTimeout(() => {
        setFeedback(null)
        avancarModulo()
      }, 700)
    } else {
      const explodiu = registrarStrike()
      setValorTeclado('')
      if (!explodiu) {
        setFeedback({ tipo: 'erro' })
        setTimeout(() => setFeedback(null), 900)
      }
    }
  }

  function tocarSimbolo(id) {
    if (sequenciaTocada.includes(id)) return
    const nova = [...sequenciaTocada, id]
    setSequenciaTocada(nova)
    if (nova.length === moduloAtual.resposta.length) {
      if (validarSimbolos(moduloAtual, nova)) {
        setFeedback({ tipo: 'ok' })
        setTimeout(() => {
          setFeedback(null)
          avancarModulo()
        }, 700)
      } else {
        const explodiu = registrarStrike()
        setSequenciaTocada([])
        if (!explodiu) {
          setFeedback({ tipo: 'erro' })
          setTimeout(() => setFeedback(null), 900)
        }
      }
    }
  }

  if (fase === 'vitoria') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onExit} />
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold tracking-tight text-success">Bomba desarmada!</h1>
          <p className="mt-2 text-sm text-secondary">
            {strikes} erro(s) · {tempoRestante}s restantes
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onExit}
            className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Encerrar
          </motion.button>
        </div>
      </div>
    )
  }

  if (fase === 'derrota') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onExit} />
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold tracking-tight text-danger">💥 Bum.</h1>
          <p className="mt-2 text-sm text-secondary">
            {motivoDerrota === 'tempo' ? 'O tempo acabou.' : 'Vocês erraram demais.'}
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onExit}
            className="mt-8 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
          >
            Encerrar
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center px-6 py-8 text-center">
      <ExitButton onExit={onExit} />
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between text-xs text-secondary">
          <span>
            Módulo {moduloIndex + 1} de {modulos.length}
          </span>
          <span className={`font-bold tabular-nums ${tempoRestante <= 30 ? 'text-danger' : 'text-primary'}`}>
            {tempoRestante}s
          </span>
        </div>
        <div className="mt-2 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-2 w-2 rounded-full ${i < strikes ? 'bg-danger' : 'bg-white/15'}`} />
          ))}
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight">{moduloAtual.nome}</h1>
        <p className="mt-1 text-xs text-secondary">Escute o Surdo e aperte o que ele mandar.</p>

        {feedback && (
          <p className={`mt-3 text-sm font-semibold ${feedback.tipo === 'ok' ? 'text-success' : 'text-danger'}`}>
            {feedback.tipo === 'ok' ? 'Certo!' : 'Errado!'}
          </p>
        )}

        <div className="mt-6">
          {moduloAtual.padraoUI === 'fios' && (
            <div className="flex flex-col gap-2">
              {moduloAtual.componentes.map((fio) => (
                <motion.button
                  key={fio.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => cortarFio(fio.id)}
                  className="flex items-center justify-between rounded-xl border border-border-strong bg-surface px-4 py-3 text-left text-sm font-medium"
                >
                  <span>{fio.posicao}º fio</span>
                  <span>{fio.cor}</span>
                </motion.button>
              ))}
            </div>
          )}

          {moduloAtual.padraoUI === 'teclado' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-border-strong bg-elevated px-6 py-6 text-left">
                {moduloAtual.componentes.map((c) => (
                  <p key={c.id} className="text-sm text-primary">
                    {c.label}: <span className="font-bold text-accent">{c.valor}</span>
                  </p>
                ))}
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={valorTeclado}
                onChange={(e) =>
                  setValorTeclado(e.target.value.replace(/\D/g, '').slice(0, moduloAtual.tamanhoCodigo))
                }
                placeholder="Código"
                className="w-full rounded-xl border border-border-strong bg-white/5 px-4 py-4 text-center text-2xl font-bold tabular-nums outline-none focus:border-accent"
              />
              <motion.button
                whileTap={{ scale: valorTeclado.length === moduloAtual.tamanhoCodigo ? 0.97 : 1 }}
                disabled={valorTeclado.length !== moduloAtual.tamanhoCodigo}
                onClick={confirmarTeclado}
                className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-30"
              >
                Confirmar
              </motion.button>
            </div>
          )}

          {moduloAtual.padraoUI === 'simbolos' && (
            <div className="flex flex-col gap-2">
              {moduloAtual.componentes.map((s) => {
                const marcado = sequenciaTocada.includes(s.id)
                return (
                  <motion.button
                    key={s.id}
                    whileTap={{ scale: marcado ? 1 : 0.97 }}
                    onClick={() => tocarSimbolo(s.id)}
                    disabled={marcado}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium disabled:opacity-50 ${
                      marcado
                        ? 'border-accent bg-accent-glow text-primary'
                        : 'border-border-strong bg-surface text-secondary'
                    }`}
                  >
                    <span>{s.nome}</span>
                    {marcado && (
                      <span className="text-xs font-bold text-accent">#{sequenciaTocada.indexOf(s.id) + 1}</span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
