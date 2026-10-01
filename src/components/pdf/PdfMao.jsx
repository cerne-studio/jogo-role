import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import ExitButton from '../core/ExitButton.jsx'
import { supabase } from '../../lib/supabase.js'
import { BotaoPrimario, Cabecalho, Placar, PretaCard } from './pdfUtils.jsx'

// Mão privada do jogador (10 brancas). Selecionar 1 carta (ou 2, na ordem, se a preta tem 2 lacunas).
export default function PdfMao({ salaId, userId, sala, jogadores, juizNome, onExit }) {
  const est = sala.estado
  const [mao, setMao] = useState(null)
  const [sel, setSel] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const precisa = Math.max(est.preta.lacunas, 1)

  useEffect(() => {
    let cancelado = false
    supabase
      .from('pdf_maos')
      .select('carta_id,texto')
      .eq('sala_id', salaId)
      .eq('user_id', userId)
      .then(({ data }) => {
        if (!cancelado) setMao(data ?? [])
      })
    return () => {
      cancelado = true
    }
  }, [salaId, userId, est.rodada, sala.atualizada_em])

  useEffect(() => {
    setSel([])
    setErro('')
  }, [est.rodada])

  function alternar(id) {
    setSel((atual) => {
      if (atual.includes(id)) return atual.filter((x) => x !== id)
      if (precisa === 1) return [id]
      if (atual.length < precisa) return [...atual, id]
      return atual
    })
  }

  async function jogar() {
    setEnviando(true)
    setErro('')
    const { error } = await supabase.rpc('pdf_jogar', { p_sala_id: salaId, p_cartas: sel })
    setEnviando(false)
    if (error) setErro(error.message)
    else setSel([])
  }

  const textosEscolhidos = sel.map((id) => mao?.find((c) => c.carta_id === id)?.texto).filter(Boolean)

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 py-6">
      <ExitButton onExit={onExit} />
      <div className="mx-auto w-full max-w-sm flex-1 pb-28">
        <Cabecalho rodada={est.rodada} juizNome={juizNome} souJuiz={false} />
        <div className="mt-3">
          <Placar jogadores={jogadores} pontuacoes={est.pontuacoes} meta={est.meta} userId={userId} juizId={est.juiz_id} />
        </div>

        <div className="mt-5">
          <PretaCard preta={est.preta} respostas={textosEscolhidos} />
        </div>

        <p className="mt-6 text-xs font-medium uppercase tracking-widest text-muted">
          Sua mão · escolha {precisa === 1 ? 'uma carta' : `${precisa} cartas, na ordem`}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {mao === null ? (
            <p className="text-sm text-muted">Carregando...</p>
          ) : (
            mao.map((c) => {
              const posicao = sel.indexOf(c.carta_id)
              const marcada = posicao >= 0
              return (
                <motion.button
                  key={c.carta_id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => alternar(c.carta_id)}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium leading-snug transition ${
                    marcada
                      ? 'border-accent bg-accent text-black'
                      : 'border-border-strong bg-[#f5f5f0] text-black'
                  }`}
                >
                  <span>{c.texto}</span>
                  {marcada && precisa > 1 && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-accent">
                      {posicao + 1}
                    </span>
                  )}
                </motion.button>
              )
            })
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-base/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto w-full max-w-sm">
          {erro && <p className="mb-2 text-center text-sm text-danger">{erro}</p>}
          <BotaoPrimario disabled={sel.length !== precisa} carregando={enviando} onClick={jogar}>
            {enviando ? 'Enviando...' : sel.length === precisa ? 'Jogar essa' : `Escolha ${precisa - sel.length} carta(s)`}
          </BotaoPrimario>
        </div>
      </div>
    </div>
  )
}
