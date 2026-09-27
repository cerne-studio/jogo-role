import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Users } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'
import { supabase } from '../../lib/supabase.js'

export default function ManadaPergunta({
  salaId,
  rodada,
  pergunta,
  jogadoresConfirmados,
  totalJogadores,
  onExit,
}) {
  const [resposta, setResposta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviei, setEnviei] = useState(false)
  const [erro, setErro] = useState('')
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    let cancelado = false
    supabase
      .from('manada_respostas')
      .select('confirmada')
      .eq('sala_id', salaId)
      .eq('rodada', rodada)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelado) return
        if (data?.confirmada) setEnviei(true)
        setVerificando(false)
      })
    return () => {
      cancelado = true
    }
  }, [salaId, rodada])

  async function confirmar() {
    const texto = resposta.trim()
    if (!texto) return
    setEnviando(true)
    setErro('')
    const { error } = await supabase.rpc('confirmar_resposta', { p_sala_id: salaId, p_texto: texto })
    setEnviando(false)
    if (error) {
      setErro(error.message)
      return
    }
    setEnviei(true)
  }

  if (verificando) return null

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
      <ExitButton onExit={onExit} />
      <div className="w-full max-w-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Rodada {rodada}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{pergunta}</h1>

        {enviei ? (
          <>
            <p className="mt-6 text-sm font-semibold text-success">Resposta enviada ✓</p>
            <p className="mt-2 text-sm text-secondary">
              {jogadoresConfirmados} de {totalJogadores} jogadores responderam
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
              <Users className="h-4 w-4" /> Aguardando o resto do grupo...
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-secondary">
              Não pense na melhor resposta — pense na resposta que a maioria do grupo vai dar.
            </p>
            <textarea
              autoFocus
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              placeholder="Sua resposta"
              rows={2}
              className="mt-6 w-full resize-none rounded-xl border border-border-strong bg-white/5 px-4 py-4 text-center text-lg font-medium outline-none focus:border-accent"
            />
            {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
            <motion.button
              whileTap={{ scale: resposta.trim() ? 0.97 : 1 }}
              disabled={!resposta.trim() || enviando}
              onClick={confirmar}
              className="mt-6 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-30"
            >
              {enviando ? 'Enviando...' : 'Confirmar resposta'}
            </motion.button>
          </>
        )}
      </div>
    </div>
  )
}
