import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Heart, Sparkles } from 'lucide-react'
import ExitButton from '../core/ExitButton.jsx'
import { supabase } from '../../lib/supabase.js'

export default function TheMindMao({ salaId, userId, sala, jogadores, onExit }) {
  const [minhaMao, setMinhaMao] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const { rodada, vidas, shurikens, historico, cartas_restantes: cartasRestantes } = sala.estado

  useEffect(() => {
    let cancelado = false
    supabase
      .from('themind_maos')
      .select('cartas')
      .eq('sala_id', salaId)
      .eq('rodada', rodada)
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelado) setMinhaMao([...(data?.cartas ?? [])].sort((a, b) => a - b))
      })
    return () => {
      cancelado = true
    }
    // re-busca sempre que a sala mudar (jogada de qualquer um pode ter afetado minha mão)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaId, userId, rodada, sala.atualizada_em])

  async function jogarMenorCarta() {
    if (!minhaMao || minhaMao.length === 0) return
    setEnviando(true)
    setErro('')
    const { error } = await supabase.rpc('jogar_carta', { p_sala_id: salaId, p_carta: minhaMao[0] })
    setEnviando(false)
    if (error) setErro(error.message)
  }

  async function usarShuriken() {
    setEnviando(true)
    setErro('')
    const { error } = await supabase.rpc('usar_shuriken', { p_sala_id: salaId })
    setEnviando(false)
    if (error) setErro(error.message)
  }

  const nomePorId = Object.fromEntries(jogadores.map((j) => [j.user_id, j.nome]))
  const ultimosEventos = [...(historico ?? [])].slice(-5).reverse()

  return (
    <div className="flex min-h-[100dvh] flex-col px-6 py-8">
      <ExitButton onExit={onExit} />
      <div className="mx-auto w-full max-w-sm flex-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">Rodada {rodada} de 7</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-sm font-semibold text-danger">
              <Heart className="h-4 w-4 fill-current" /> {vidas}
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold text-accent">
              <Sparkles className="h-4 w-4 fill-current" /> {shurikens}
            </span>
          </div>
        </div>

        <p className="mt-6 text-xs font-medium uppercase tracking-widest text-muted">Cartas restantes</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {jogadores.map((j) => (
            <li
              key={j.user_id}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium ${
                j.user_id === userId ? 'border-accent/40 bg-accent-glow text-primary' : 'border-border bg-surface text-secondary'
              }`}
            >
              {j.nome}: {cartasRestantes?.[j.user_id] ?? 0}
            </li>
          ))}
        </ul>

        {ultimosEventos.length > 0 && (
          <>
            <p className="mt-6 text-xs font-medium uppercase tracking-widest text-muted">Últimas jogadas</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {ultimosEventos.map((ev, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-secondary">
                    {ev.tipo === 'shuriken' ? `🌟 ${ev.nome}` : ev.nome}
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      ev.tipo === 'descarte' ? 'text-danger' : ev.tipo === 'shuriken' ? 'text-accent' : 'text-success'
                    }`}
                  >
                    {ev.valor}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-8 text-xs font-medium uppercase tracking-widest text-muted">Sua mão</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {minhaMao === null ? (
            <p className="text-sm text-muted">Carregando...</p>
          ) : minhaMao.length === 0 ? (
            <p className="text-sm text-secondary">
              Você jogou todas as suas cartas. Aguarde o resto do grupo.
            </p>
          ) : (
            minhaMao.map((c, i) => (
              <span
                key={c}
                className={`flex h-14 w-11 items-center justify-center rounded-xl border text-lg font-bold tabular-nums ${
                  i === 0 ? 'border-accent bg-accent-glow text-accent' : 'border-border-strong bg-elevated text-primary'
                }`}
              >
                {c}
              </span>
            ))
          )}
        </div>

        {erro && <p className="mt-4 text-sm text-danger">{erro}</p>}
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-col gap-2 pt-6">
        {minhaMao && minhaMao.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={enviando}
            onClick={jogarMenorCarta}
            className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-black disabled:opacity-30"
          >
            Jogar carta ({minhaMao[0]})
          </motion.button>
        )}
        {shurikens > 0 && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={enviando}
            onClick={usarShuriken}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-strong px-6 py-4 text-sm font-semibold text-secondary disabled:opacity-30"
          >
            <Sparkles className="h-4 w-4" /> Usar shuriken
          </motion.button>
        )}
      </div>
    </div>
  )
}
