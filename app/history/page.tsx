import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const supabase = supabaseServer()
  const { data: cases } = await supabase
    .from('cases')
    .select('id, title, status, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-serif">Case History</h2>
      <div className="grid gap-4">
        {(cases ?? []).map(c => (
          <Link key={c.id} href={`/case/${c.id}`} className="card p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{c.title || `Case ${c.id}`}</div>
              <div className="text-sm opacity-70">{new Date(c.created_at as any).toLocaleString()}</div>
            </div>
            <div className="text-sm px-2 py-1 rounded bg-court-beige">{c.status}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}


