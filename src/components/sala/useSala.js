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
      supabase.removeChannel(canal)
    }
  }, [salaId])

  return { sala, jogadores }
}
