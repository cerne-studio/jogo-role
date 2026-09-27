import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anon ? createClient(url, anon) : null
export const temSupabase = !!supabase

// Módulo-singleton: garante que a sessão anônima só é criada UMA vez mesmo se
// ensureAnonSession() for chamada mais de uma vez em paralelo (ex.: o duplo efeito
// do React StrictMode em dev). Sem isso, duas chamadas concorrentes podem cada
// uma achar "sem sessão" e criar dois usuários anônimos diferentes — aí o
// userId que o componente guarda no estado não bate com a sessão que o cliente
// supabase de fato usa nas chamadas seguintes.
let sessaoPromise = null

export function ensureAnonSession() {
  if (!supabase) return Promise.resolve(null)
  if (!sessaoPromise) {
    sessaoPromise = (async () => {
      const { data: sessaoAtual } = await supabase.auth.getSession()
      if (sessaoAtual.session) return sessaoAtual.session.user

      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) throw error
      return data.user
    })()
  }
  return sessaoPromise
}
