import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anon ? createClient(url, anon) : null
export const temSupabase = !!supabase

export async function ensureAnonSession() {
  if (!supabase) return null
  const { data: sessaoAtual } = await supabase.auth.getSession()
  if (sessaoAtual.session) return sessaoAtual.session.user

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return data.user
}
