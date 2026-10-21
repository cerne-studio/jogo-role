import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

export default function useSala(salaId) {
  const [sala, setSala] = useState(null)
  const [jogadores, setJogadores] = useState([])

  useEffect(() => {
    if (!salaId || !supabase) return

    let cancelado = false

    async function recarregar() {
      const [{ data: salaData }, { data: jogadoresData }] = await Promise.all([
        supabase.from('salas').select('*').eq('id', salaId).single(),
        supabase.from('sala_jogadores').select('*').eq('sala_id', salaId).order('entrou_em'),
      ])
      if (cancelado) return
      setSala(salaData ?? null)
      setJogadores(jogadoresData ?? [])
    }

    // Rede de segurança: o realtime pode cair em silêncio (celular dormindo, wifi trocando). Sem isso a tela
    // fica presa na rodada antiga ("Abrindo a próxima rodada...") até recarregar. Busca de novo a cada 3 s
    // e sempre que a aba volta a ficar visível.
    async function atualizarSala() {
      const { data } = await supabase.from('salas').select('*').eq('id', salaId).single()
      if (!cancelado && data) {
        setSala((atual) => (atual && Date.parse(atual.atualizada_em) >= Date.parse(data.atualizada_em) ? atual : data))
      }
    }
    const intervalo = setInterval(atualizarSala, 3000)
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') atualizarSala()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener('online', atualizarSala)

    recarregar()

    const canal = supabase
      .channel(`sala:${salaId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'salas', filter: `id=eq.${salaId}` },
        (payload) => setSala(payload.new),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sala_jogadores', filter: `sala_id=eq.${salaId}` },
        () => recarregar(),
      )
      .subscribe()

    return () => {
      cancelado = true
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('online', atualizarSala)
      supabase.removeChannel(canal)
    }
  }, [salaId])

  return { sala, jogadores }
}
