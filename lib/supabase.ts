import { createClient } from '@supabase/supabase-js'

export type Registration = {
  id: string
  name: string
  email: string
  event_id: string
  qr_token: string
  checked_in: boolean
  checked_in_at: string | null
  created_at: string
}

export type Event = {
  id: string
  name: string
  date: string
  location: string
  description: string | null
  active: boolean
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export { getSupabase as supabase, getSupabaseAdmin as supabaseAdmin }
