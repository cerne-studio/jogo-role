import { useState } from 'react'
import { Check, Clock } from 'lucide-react'
import ExitButton from '../../core/ExitButton.jsx'
import { supabase } from '../../../lib/supabase.js'
import { LISTA_FORMACOES } from '../formacoes.js'
import MiniCampo from './MiniCampo.jsx'
import { BotaoPrincipal } from './draftUtils.jsx'
import { useTick } from './useServidor.js'

// Cada jogador escolhe a própria formação. Sem escolha até o relógio zerar = 4-3-3.
export default function DraftFormacao({ salaId, userId, est, jogadores, agora, onExit }) {
  const [sel, setSel] = useState('4-3-3')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  useTick(250)

  const confirmadas = est.formacoes ?? {}
  const jaConfirmei = !!confirmadas[userId]
  const restante = Math.max(0, Math.ceil((Date.parse(est.formacao_ate) - agora()) / 1000))

  async function confirmar() {
    setEnviando(true)
    setErro('')
    const { error } = await supabase.rpc('fd_definir_formacao', { p_sala_id: salaId, p_formacao: sel })
    setEnviando(false)
    if (error) setErro(error.message)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col px-6 py-8">
      <ExitButton onExit={onExit} />
      <div className="mx-auto w-full max-w-sm flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Draft FC</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Escolha sua formação</h1>
        <p className="mt-1 text-sm text-secondary">Define as 11 posições que você vai preencher. {restante}s.</p>

        <div className="mt-5">
          <MiniCampo formacao={jaConfirmei ? confirmadas[userId] : sel} grande />
        </div>

        {!jaConfirmei && (
          <div className="mt-4 flex flex-wrap gap-2">
            {LISTA_FORMACOES.map((f) => (
              <button
                key={f}
                onClick={() => setSel(f)}
                className={`rounded-xl border px-3.5 py-2 text-sm font-bold ${sel === f ? 'border-accent bg-accent-glow text-primary' : 'border-border bg-surface text-secondary'}`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {jaConfirmei && (
          <ul className="mt-5 flex flex-col gap-2">
            {jogadores.map((j) => (
              <li key={j.user_id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
                <span className="text-sm font-medium">{j.nome}</span>
                {confirmadas[j.user_id] ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-success"><Check className="h-4 w-4" />{confirmadas[j.user_id]}</span>
                ) : (
                  <Clock className="h-4 w-4 text-muted" />
                )}
              </li>
            ))}
          </ul>
        )}
        {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
      </div>
      {!jaConfirmei && (
        <div className="mx-auto w-full max-w-sm pt-6">
          <BotaoPrincipal disabled={enviando} onClick={confirmar}>
            {enviando ? 'Confirmando...' : `Confirmar ${sel}`}
          </BotaoPrincipal>
        </div>
      )}
    </div>
  )
}
