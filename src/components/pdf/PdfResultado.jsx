import { useState } from 'react'
import { motion } from 'motion/react'
import { Crown } from 'lucide-react'
import Confete from '../core/Confete.jsx'
import ExitButton from '../core/ExitButton.jsx'
import { supabase } from '../../lib/supabase.js'
import { BotaoPrimario, Cabecalho, FraseComRespostas, Placar } from './pdfUtils.jsx'

// Revela quem escreveu cada resposta e quem levou o ponto da rodada.
export default function PdfResultado({ salaId, userId, sala, jogadores, juizNome, souJuiz, souHost, onExit }) {
  const est = sala.estado
  const res = est.resultado
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const podeAvancar = souJuiz || souHost

  async function proxima() {
    setEnviando(true)
    setErro('')
    const { error } = await supabase.rpc('pdf_proxima', { p_sala_id: salaId })
    setEnviando(false)
    if (error) setErro(error.message)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 py-6">
      <ExitButton onExit={onExit} />
      {res.vencedor_id === userId && <Confete />}
      <div className="mx-auto w-full max-w-sm flex-1 pb-28">
        <Cabecalho rodada={est.rodada} juizNome={juizNome} souJuiz={souJuiz} />
        <div className="mt-3">
          <Placar jogadores={jogadores} pontuacoes={est.pontuacoes} meta={est.meta} userId={userId} juizId={est.juiz_id} />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="mt-6 flex items-center gap-2 rounded-2xl border border-accent/40 bg-accent-glow px-4 py-3 text-accent"
        >
          <Crown className="h-6 w-6" />
          <p className="text-base font-extrabold">
            {res.vencedor_id === userId ? 'Você levou o ponto!' : `${res.vencedor_nome} levou o ponto`}
          </p>
        </motion.div>

        <div className="mt-4 flex flex-col gap-3">
          {res.todas.map((r, i) => {
            const venceu = r.idx === res.idx
            return (
              <motion.div
                key={r.idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: venceu ? 1 : 0.8, y: 0 }}
                transition={{ delay: 0.25 + i * 0.12 }}
                className={`rounded-2xl border p-4 ${
                  venceu ? 'border-accent bg-accent-glow' : 'border-border bg-[#0d0d10]'
                }`}
              >
                <p className="text-[16px] font-semibold leading-snug text-primary">
                  <FraseComRespostas texto={est.preta.texto} lacunas={est.preta.lacunas} respostas={r.textos} />
                </p>
                <p className="mt-3 text-[11px] font-medium uppercase tracking-widest text-muted">
                  {r.user_id === userId ? 'Você' : r.nome}
                  {venceu ? ' · +1' : ''}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-canvas/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto w-full max-w-sm">
          {podeAvancar ? (
            <>
              {erro && <p className="mb-2 text-center text-sm text-danger">{erro}</p>}
              <BotaoPrimario carregando={enviando} onClick={proxima}>
                {enviando ? 'Abrindo...' : 'Próxima rodada'}
              </BotaoPrimario>
            </>
          ) : (
            <p className="py-4 text-center text-sm text-secondary">Esperando o juiz abrir a próxima rodada...</p>
          )}
        </div>
      </div>
    </div>
  )
}
