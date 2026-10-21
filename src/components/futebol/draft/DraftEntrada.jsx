import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, User, Users } from 'lucide-react'
import ExitButton from '../../core/ExitButton.jsx'
import CapaJogo from '../../core/CapaJogo.jsx'
import { CAPAS } from '../../../assets/role/index.js'
import { supabase } from '../../../lib/supabase.js'
import { salvarSalaAtiva } from '../../sala/salaMemoria.js'
import DraftConfig from './DraftConfig.jsx'
import { BotaoPrincipal } from './draftUtils.jsx'

// Primeira tela: Solo (cria a sala, configura e já começa) ou Com os amigos (criar / entrar por código).
export default function DraftEntrada({ jogo, onSolo, onAmigos, onExit }) {
  const [fase, setFase] = useState('modo')
  const [nome, setNome] = useState('')
  const [cfg, setCfg] = useState({ modo: 'historico', liga: null, torneio: 8, dificuldade: 'normal' })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function montarSolo() {
    const nomeLimpo = nome.trim()
    if (!nomeLimpo) return
    setEnviando(true)
    setErro('')
    try {
      const { data: sala, error } = await supabase.rpc('criar_sala', { p_jogo: jogo, p_nome: nomeLimpo })
      if (error) throw error
      const { error: e2 } = await supabase.rpc('fd_configurar', { p_sala_id: sala.sala_id, p_modo: cfg.modo, p_liga: cfg.liga, p_torneio: cfg.torneio, p_dificuldade: cfg.dificuldade })
      if (e2) throw e2
      const { error: e3 } = await supabase.rpc('iniciar_partida', { p_sala_id: sala.sala_id })
      if (e3) throw e3
      salvarSalaAtiva(jogo, { codigo: sala.codigo, nome: nomeLimpo })
      onSolo({ salaId: sala.sala_id, codigo: sala.codigo })
    } catch (e) {
      setErro(e.message)
      setEnviando(false)
    }
  }

  if (fase === 'modo') {
    return (
      <div className="flex min-h-[100dvh] flex-col px-6 py-8">
        <ExitButton onExit={onExit} />
        <div className="mx-auto w-full max-w-sm flex-1">
          <button onClick={onExit} className="flex items-center gap-1 text-sm text-secondary">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <CapaJogo src={CAPAS.draft} foco="78% 50%" className="mt-6" />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Draft FC</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Como você quer jogar?</h1>
          <p className="mt-2 text-sm text-secondary">Monte um time por letras, escolha a tática e dispute o campeonato.</p>
          <div className="mt-8 flex flex-col gap-3">
            {[
              { id: 'solo', icon: User, titulo: 'Solo', desc: 'Você contra os bots de clubes reais.' },
              { id: 'amigos', icon: Users, titulo: 'Com os amigos', desc: 'Cada um no seu celular. Jogador pego por um fica travado pros outros.' },
            ].map((o) => (
              <motion.button
                key={o.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => (o.id === 'solo' ? setFase('solo') : onAmigos())}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 text-left"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-glow">
                  <o.icon className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="font-semibold tracking-tight">{o.titulo}</h2>
                  <p className="mt-0.5 text-xs leading-snug text-secondary">{o.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col px-6 py-8">
      <ExitButton onExit={onExit} />
      <div className="mx-auto w-full max-w-sm flex-1">
        <button onClick={() => setFase('modo')} className="flex items-center gap-1 text-sm text-secondary">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Configure seu campeonato</h1>
        <p className="mt-6 text-xs font-medium uppercase tracking-widest text-muted">Nome do técnico</p>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome"
          className="mt-3 w-full rounded-xl border border-border-strong bg-white/5 px-4 py-4 text-lg font-medium outline-none focus:border-accent"
        />
        <DraftConfig valor={cfg} onChange={setCfg} />
        {erro && <p className="mt-4 text-sm text-danger">{erro}</p>}
      </div>
      <div className="mx-auto w-full max-w-sm pt-6">
        <BotaoPrincipal disabled={!nome.trim() || enviando} onClick={montarSolo}>
          {enviando ? 'Montando...' : 'Montar meu time'}
        </BotaoPrincipal>
      </div>
    </div>
  )
}
