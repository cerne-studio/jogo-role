import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'
import { supabase } from '../../lib/supabase.js'

export default function CriarOuEntrarSala({ jogo, onEntrou, onExit }) {
  const [fase, setFase] = useState('escolha')
  const [nome, setNome] = useState('')
  const [codigo, setCodigo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function criar() {
    const nomeLimpo = nome.trim()
    if (!nomeLimpo) return
    setEnviando(true)
    setErro('')
    const { data, error } = await supabase.rpc('criar_sala', { p_jogo: jogo, p_nome: nomeLimpo })
    setEnviando(false)
    if (error) {
      setErro(error.message)
      return
    }
    onEntrou({ salaId: data.sala_id, codigo: data.codigo })
  }

  async function entrar() {
    const nomeLimpo = nome.trim()
    if (!nomeLimpo || codigo.length !== 6) return
    setEnviando(true)
    setErro('')
    const { data, error } = await supabase.rpc('entrar_sala', { p_codigo: codigo, p_nome: nomeLimpo })
    setEnviando(false)
    if (error) {
      setErro(error.message)
      return
    }
    onEntrou({ salaId: data.sala_id, codigo: data.codigo })
  }

  if (fase === 'escolha') {
    return (
      <div className="flex min-h-[100dvh] flex-col px-6 py-8">
        <ExitButton onExit={onExit} />
        <div className="mx-auto w-full max-w-sm flex-1">
          <button onClick={onExit} className="flex items-center gap-1 text-sm text-secondary">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="mt-8 flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold tracking-tight">Todo mundo no jogo</h1>
            <p className="mt-2 text-sm text-secondary">
              Cada jogador entra pelo próprio celular. Um cria a sala e mostra o código, os
              outros digitam esse código pra entrar.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setFase('criar')}
              className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black"
            >
              Criar sala nova
            </motion.button>
            <button
              onClick={() => setFase('entrar')}
              className="text-sm text-secondary underline underline-offset-4"
            >
              Já tenho um código
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (fase === 'criar') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <ExitButton onExit={onExit} />
        <div className="w-full max-w-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            Como você quer ser chamado?
          </p>
          <input
            type="text"
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            className="mt-6 w-full rounded-xl border border-border-strong bg-white/5 px-4 py-4 text-center text-lg font-medium outline-none focus:border-accent"
          />
          {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
          <motion.button
            whileTap={{ scale: nome.trim() ? 0.97 : 1 }}
            disabled={!nome.trim() || enviando}
            onClick={criar}
            className="mt-6 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-30"
          >
            {enviando ? 'Criando...' : 'Criar sala'}
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
      <ExitButton onExit={onExit} />
      <div className="w-full max-w-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Digite o código da sala
        </p>
        <input
          type="text"
          inputMode="numeric"
          autoFocus
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="mt-6 w-full rounded-xl border border-border-strong bg-white/5 px-4 py-4 text-center text-3xl font-bold tabular-nums tracking-widest outline-none focus:border-accent"
        />
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome"
          className="mt-4 w-full rounded-xl border border-border-strong bg-white/5 px-4 py-4 text-center text-lg font-medium outline-none focus:border-accent"
        />
        {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
        <motion.button
          whileTap={{ scale: nome.trim() && codigo.length === 6 ? 0.97 : 1 }}
          disabled={!nome.trim() || codigo.length !== 6 || enviando}
          onClick={entrar}
          className="mt-6 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-30"
        >
          {enviando ? 'Entrando...' : 'Entrar na sala'}
        </motion.button>
      </div>
    </div>
  )
}
