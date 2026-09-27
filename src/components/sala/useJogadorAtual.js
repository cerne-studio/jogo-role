import { useEffect, useState } from 'react'
import { ensureAnonSession, temSupabase } from '../../lib/supabase.js'

export default function useJogadorAtual() {
  const [userId, setUserId] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let cancelado = false

    if (!temSupabase) {
      setCarregando(false)
      setErro('Supabase não configurado (faltam as variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
      return
    }

    ensureAnonSession()
      .then((user) => {
        if (!cancelado) setUserId(user?.id ?? null)
      })
      .catch((e) => {
        if (!cancelado) setErro(e.message)
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [])

  return { userId, carregando, erro }
}
