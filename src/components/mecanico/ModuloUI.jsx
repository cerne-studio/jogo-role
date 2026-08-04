import { useState } from 'react'
import { motion } from 'motion/react'
import { Delete, Minus, Plus } from 'lucide-react'

export default function ModuloUI({ modulo, onEstadoMudou }) {
  if (modulo.padraoUI === 'toggle') return <ToggleUI modulo={modulo} onEstadoMudou={onEstadoMudou} />
  if (modulo.padraoUI === 'keypad') return <KeypadUI modulo={modulo} onEstadoMudou={onEstadoMudou} />
  if (modulo.padraoUI === 'sequencia') return <SequenciaUI modulo={modulo} onEstadoMudou={onEstadoMudou} />
  if (modulo.padraoUI === 'stepper') return <StepperUI modulo={modulo} onEstadoMudou={onEstadoMudou} />
  if (modulo.padraoUI === 'combo') return <ComboUI modulo={modulo} onEstadoMudou={onEstadoMudou} />
  return null
}

function ToggleUI({ modulo, onEstadoMudou }) {
  const [estado, setEstado] = useState(() =>
    Object.fromEntries(modulo.componentes.map((c) => [c.id, c.valorInicial])),
  )

  function alternar(id) {
    if (modulo.trava && modulo.trava.bloqueia === id && estado[modulo.trava.origem] === 'puxada') {
      return
    }
    const opcoes = modulo.opcoes
    const atual = estado[id]
    const proximo = opcoes[(opcoes.indexOf(atual) + 1) % opcoes.length]
    const novoEstado = { ...estado, [id]: proximo }
    setEstado(novoEstado)
    onEstadoMudou(novoEstado)
  }

  return (
    <div className="flex flex-col gap-2">
      {modulo.componentes.map((c) => {
        const valor = estado[c.id]
        const travado = modulo.trava?.bloqueia === c.id && estado[modulo.trava.origem] === 'puxada'
        const ativo = valor === 'aberta' || valor === 'puxada' || valor === 'conectado'
        return (
          <motion.button
            key={c.id}
            whileTap={{ scale: travado ? 1 : 0.97 }}
            onClick={() => alternar(c.id)}
            disabled={travado}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition disabled:opacity-40 ${
              ativo ? 'border-accent bg-accent-glow text-primary' : 'border-border bg-surface text-secondary'
            }`}
          >
            <span>{c.nome}</span>
            <span className="text-xs uppercase tracking-widest">
              {travado ? 'travada' : valor}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

function KeypadUI({ modulo, onEstadoMudou }) {
  const [valor, setValor] = useState('')

  function tocar(d) {
    if (valor.length >= modulo.tamanhoCodigo) return
    const novo = valor + d
    setValor(novo)
    onEstadoMudou(novo)
  }

  function apagar() {
    const novo = valor.slice(0, -1)
    setValor(novo)
    onEstadoMudou(novo)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {Array.from({ length: modulo.tamanhoCodigo }).map((_, i) => (
          <div
            key={i}
            className="flex h-14 w-12 items-center justify-center rounded-xl border border-border-strong bg-white/5 text-2xl font-bold tabular-nums"
          >
            {valor[i] ?? ''}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <motion.button
            key={d}
            whileTap={{ scale: 0.92 }}
            onClick={() => tocar(d)}
            className="flex h-14 w-14 items-center justify-center rounded-xl border border-border-strong bg-white/5 text-lg font-bold"
          >
            {d}
          </motion.button>
        ))}
        <div />
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => tocar('0')}
          className="flex h-14 w-14 items-center justify-center rounded-xl border border-border-strong bg-white/5 text-lg font-bold"
        >
          0
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={apagar}
          className="flex h-14 w-14 items-center justify-center rounded-xl border border-border-strong bg-white/5 text-secondary"
        >
          <Delete className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  )
}

function SequenciaUI({ modulo, onEstadoMudou }) {
  const [ordem, setOrdem] = useState([])

  function tocar(id) {
    if (ordem.includes(id)) return
    const novaOrdem = [...ordem, id]
    setOrdem(novaOrdem)
    onEstadoMudou(novaOrdem)
  }

  return (
    <div className="flex flex-col gap-2">
      {modulo.componentes.map((c) => {
        const posicao = ordem.indexOf(c.id)
        const marcado = posicao >= 0
        return (
          <motion.button
            key={c.id}
            whileTap={{ scale: marcado ? 1 : 0.97 }}
            onClick={() => tocar(c.id)}
            disabled={marcado}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition disabled:opacity-50 ${
              marcado ? 'border-accent bg-accent-glow text-primary' : 'border-border bg-surface text-secondary'
            }`}
          >
            <span>{c.nome}</span>
            {marcado && <span className="text-xs font-bold text-accent">#{posicao + 1}</span>}
          </motion.button>
        )
      })}
    </div>
  )
}

function StepperUI({ modulo, onEstadoMudou }) {
  const [valor, setValor] = useState(modulo.valorInicial)

  function mudar(delta) {
    const novo = Math.max(0, Math.min(100, valor + delta))
    setValor(novo)
    onEstadoMudou(novo)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-5xl font-bold tabular-nums text-accent">{valor}°</span>
      <div className="flex items-center gap-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => mudar(-modulo.passo)}
          className="flex h-14 w-14 items-center justify-center rounded-xl border border-border-strong"
        >
          <Minus className="h-6 w-6" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => mudar(modulo.passo)}
          className="flex h-14 w-14 items-center justify-center rounded-xl border border-border-strong"
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      </div>
    </div>
  )
}

function ComboUI({ modulo, onEstadoMudou }) {
  const [selecionados, setSelecionados] = useState([])

  function alternar(id) {
    const novo = selecionados.includes(id)
      ? selecionados.filter((s) => s !== id)
      : [...selecionados, id]
    setSelecionados(novo)
    onEstadoMudou(novo)
  }

  const soma = modulo.componentes
    .filter((c) => selecionados.includes(c.id))
    .reduce((s, c) => s + c.valor, 0)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm text-secondary">
        Soma atual: <span className="font-bold tabular-nums text-primary">{soma}</span>
      </p>
      <div className="grid grid-cols-2 gap-2">
        {modulo.componentes.map((c) => {
          const marcado = selecionados.includes(c.id)
          return (
            <motion.button
              key={c.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => alternar(c.id)}
              className={`rounded-xl border px-4 py-4 text-center text-sm font-semibold transition ${
                marcado ? 'border-accent bg-accent-glow text-primary' : 'border-border bg-surface text-secondary'
              }`}
            >
              {c.nome}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
