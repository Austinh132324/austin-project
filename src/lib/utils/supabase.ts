import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let supabase: SupabaseClient | null = null

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
}

export function getSupabase(): SupabaseClient | null {
  return supabase
}

export function isSupabaseConfigured(): boolean {
  return supabase !== null
}

export async function pingSupabase(): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase.from('analytics_events').select('id', { count: 'exact', head: true })
    return !error
  } catch {
    return false
  }
}
