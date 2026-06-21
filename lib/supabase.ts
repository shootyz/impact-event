import { createClient, SupabaseClient } from '@supabase/supabase-js'

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

export type Zielgruppe = {
  id: string
  name: string
  created_at: string
}

export type Member = {
  id: string
  first_name: string
  last_name: string
  email: string
  unsubscribe_token: string
  unsubscribed: boolean
  created_at: string
  zielgruppe_id: string | null
  anrede?: string | null
  sprache?: string | null
  invite_codes?: { code: string; used: boolean }[] | { code: string; used: boolean } | null
}

export type Campaign = {
  id: string
  subject: string
  header_image_url: string | null
  body_html: string
  event_url: string | null
  sent_at: string | null
  recipient_count: number | null
  created_at: string
}

export type InviteCode = {
  id: string
  member_id: string
  event_id: string
  code: string
  used: boolean
  created_at: string
}

// Singletons — reused across requests within the same Vercel function instance
let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabase
}

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabaseAdmin
}

export { getSupabase as supabase, getSupabaseAdmin as supabaseAdmin }
