import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase.js'
import { avancarEtapa, criarTorneio, etapaAtual, etapaTemResultado, humanosAtivos, simularEtapaAtual } from '../torneio.js'

// Mantém o campeonato da sala em sincronia e, quando é a hora, "é o celular que roda a próxima etapa":
//  - sem calendário ainda  -> sorteia os grupos e simula a rodada 1
//  - etapa liberada (todo mundo deu continuar) -> revela a etapa, monta a próxima e simula
// Vários celulares podem tentar ao mesmo tempo: o servidor só aceita quem chegar com a versão atual.
export default function useTorneio(salaId, estado) {
  const [dado, setDado] = useState(null) // { versao, dados }
  const [erro, setErro] = useState('')
  const ocupado = useRef(false)
  const torneioV = estado?.torneio_v
  const liberado = !!estado?.liberado

  useEffect(() => {
    if (!salaId || !torneioV) return
    let vivo = true
    supabase.rpc('fd_torneio_obter', { p_sala_id: salaId }).then(({ data, error }) => {
      if (!vivo) return
      if (error) setErro(error.message)
      else if (data) setDado(data)
    })
    return () => {
      vivo = false
    }
  }, [salaId, torneioV])

  const publicar = useCallback(
    async (versao, torneio, partidas) => {
      const ativos = etapaAtual(torneio) && !torneio.campeaoId ? humanosAtivos(torneio) : []
      const { error } = await supabase.rpc('fd_torneio_publicar', { p_sala_id: salaId, p_versao: versao, p_dados: torneio, p_partidas: partidas, p_ativos: ativos })
      if (error) setErro(error.message)
    },
    [salaId],
  )

  useEffect(() => {
    if (!dado || ocupado.current || dado.versao !== torneioV) return
    const t = dado.dados
    const precisaCriar = !t.etapas
    const precisaAvancar = !!t.etapas && !t.campeaoId && liberado && etapaAtual(t) && etapaTemResultado(t, etapaAtual(t))
    if (!precisaCriar && !precisaAvancar) return
    ocupado.current = true
    // pequeno atraso aleatório pra todos os celulares não calcularem a mesma coisa juntos
    const timer = setTimeout(async () => {
      try {
        const base = precisaCriar ? criarTorneio({ times: t.times, tamanho: t.tamanho, semente: t.semente }) : avancarEtapa(t)
        if (base.campeaoId) {
          await publicar(dado.versao, base, {})
        } else {
          const { torneio, partidas } = simularEtapaAtual(base)
          const guardar = Object.fromEntries(Object.entries(partidas).map(([id, p]) => [id, { sim: p.sim, cfg: p.cfg }]))
          await publicar(dado.versao, torneio, guardar)
        }
      } catch (e) {
        setErro(e.message)
      } finally {
        ocupado.current = false
      }
    }, Math.random() * 1200)
    return () => {
      clearTimeout(timer)
      ocupado.current = false
    }
  }, [dado, torneioV, liberado, publicar])

  return { torneio: dado?.dados ?? null, sincronizado: dado?.versao === torneioV, erro }
}
