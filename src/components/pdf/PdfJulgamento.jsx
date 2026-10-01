import { useState } from 'react'
import { motion } from 'motion/react'
import ExitButton from '../core/ExitButton.jsx'
import { supabase } from '../../lib/supabase.js'
import { BotaoPrimario, BotaoPular, Cabecalho, FraseComRespostas, Placar } from './pdfUtils.jsx'

// Todo mundo vê as respostas (anônimas). Só o juiz escolhe.
export default function PdfJulgamento({ salaId, userId, sala, jogadores, juizNome, souJuiz, souHost, onExit }) {
  const est = sala.estado
  const [escolhida, setEscolhida] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function confirmar() {
    if (escolhida === null) return
    setEnviando(true)
    setErro('')
    const { error } = await supabase.rpc('pdf_escolher', { p_sala_id: salaId, p_idx: escolhida })
    setEnviando(false)
    if (error) setErro(error.message)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 py-6">
      <ExitButton onExit={onExit} />
      <div className="mx-auto w-full max-w-sm flex-1 pb-28">
        <Cabecalho rodada={est.rodada} juizNome={juizNome} souJuiz={souJuiz} />
        <div className="mt-3">
          <Placar jogadores={jogadores} pontuacoes={est.pontuacoes} meta={est.meta} userId={userId} juizId={est.juiz_id} />
        </div>

        <p className="mt-5 text-sm text-secondary">
          {souJuiz
            ? 'Leia as respostas em voz alta e escolha a melhor.'
            : `${juizNome} está escolhendo a melhor resposta...`}
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {est.respostas.map((r) => {
            const marcada = escolhida === r.idx
            return (
              <motion.button
                key={r.idx}
                disabled={!souJuiz}
                whileTap={{ scale: souJuiz ? 0.98 : 1 }}
                onClick={() => setEscolhida(r.idx)}
                className={`rounded-2xl border p-4 text-left text-[16px] font-semibold leading-snug text-primary transition ${
                  marcada ? 'border-accent bg-accent-glow' : 'border-border-strong bg-[#0d0d10]'
                } ${souJuiz ? '' : 'cursor-default'}`}
              >
                <FraseComRespostas texto={est.preta.texto} lacunas={est.preta.lacunas} respostas={r.textos} />
              </motion.button>
            )
          })}
        </div>

        <BotaoPular salaId={salaId} souHost={souHost} desde={est.fase_desde} limite={60} />
      </div>

      {souJuiz && (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-base/95 px-5 py-4 backdrop-blur">
          <div className="mx-auto w-full max-w-sm">
            {erro && <p className="mb-2 text-center text-sm text-danger">{erro}</p>}
            <BotaoPrimario disabled={escolhida === null} carregando={enviando} onClick={confirmar}>
              {enviando ? 'Enviando...' : escolhida === null ? 'Toque na melhor resposta' : 'Essa é a melhor'}
            </BotaoPrimario>
          </div>
        </div>
      )}
    </div>
  )
}
