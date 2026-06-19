import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const RESERVED = new Set(['admin', 'api', 'success', 'ticket', 'unsubscribe'])

export default async function SlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { slug } = await params
  const sp = await searchParams

  if (RESERVED.has(slug)) redirect('/')

  const { data: event } = await supabase()
    .from('events')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!event) redirect('/')

  const lang = sp.lang ? `&lang=${sp.lang}` : ''
  redirect(`/?event=${event.id}${lang}`)
}
