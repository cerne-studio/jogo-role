import { useState } from 'react'
import { motion } from 'motion/react'
import { Trophy } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'
import Confete from '../core/Confete.jsx'
import { supabase } from '../../lib/supabase.js'
import { EQUIPES, equipeDe, nomeDe } from './hintUtils.js'

const LINHAS = [
  ['acertos', 'Respostas acertadas'],
  ['bonus', 'Pontos de bônus'],
  ['penalidades', 'Vezes que disseram a proibida'],
  ['palpites_certos', 'Palpites certos'],
  ['palpites_erros', 'Palpites errados'],
]

export default function HintFim({ salaId, sala, jogadores, userId, souHost, hostAusente, onExit }) {
  const est = sala.estado
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const vencedor = est.vencedor
  const minhaEq = equipeDe(est, userId)
  const ganhei = minhaEq === vencedor
  const podeReiniciar = souHost || hostAusente

  async function novaPartida() {
    setOcupado(true)
    setErro('')
    const { error } = await supabase.rpc('hint_nova_partida', { p_sala_id: salaId })
    setOcupado(false)
    if (error) setErro(error.message)
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col px-5 pb-10 pt-10">
      <ExitButton onExit={onExit} />
      {ganhei && <Confete />}
      <div className="mt-6 flex flex-col items-center text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 12 }}>
          <Trophy className="h-14 w-14" style={{ color: EQUIPES[vencedor].cor }} />
        </motion.div>
        <p className="mt-4 text-xs font-medium uppercase tracking-widest text-muted">Vencedora</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight" style={{ color: EQUIPES[vencedor].cor }}>
          Equipe {EQUIPES[vencedor].nome}
        </h1>
        <p className="mt-2 text-sm text-secondary">{ganhei ? 'Foi a sua equipe! Mandou bem.' : 'Não foi dessa vez. Revanche?'}</p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {['azul', 'vermelha'].map((eq) => (
          <div key={eq} className="rounded-2xl border border-border bg-surface p-4" style={eq === vencedor ? { borderColor: EQUIPES[eq].cor } : undefined}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: EQUIPES[eq].cor }}>
              {EQUIPES[eq].nome}
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums">{est.placar[eq]}</p>
            <ul className="mt-3 flex flex-col gap-1.5">
              {est.equipes[eq].map((id) => (
                <li key={id} className="truncate text-xs text-secondary">
                  {nomeDe(jogadores, id)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-xs">
          <tbody>
            {LINHAS.map(([k, nome]) => (
              <tr key={k} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 text-secondary">{nome}</td>
                <td className="w-10 px-2 text-right font-bold tabular-nums" style={{ color: EQUIPES.azul.cor }}>
                  {est.stats?.azul?.[k] ?? 0}
                </td>
                <td className="w-10 px-3 text-right font-bold tabular-nums" style={{ color: EQUIPES.vermelha.cor }}>
                  {est.stats?.vermelha?.[k] ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        {podeReiniciar ? (
          <motion.button whileTap={{ scale: 0.97 }} disabled={ocupado} onClick={novaPartida} className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-40">
            {ocupado ? 'Voltando pro lobby...' : 'Nova partida (mesmo grupo)'}
          </motion.button>
        ) : (
          <p className="text-center text-sm text-secondary">Aguardando o host começar outra partida...</p>
        )}
        {erro && <p className="mt-2 text-sm text-danger">{erro}</p>}
      </div>
    </div>
  )
}
