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
    <div className="space-y-4 sm:space-y-6 px-4">
      <h2 className="text-2xl sm:text-3xl font-serif">Case History</h2>
      <div className="grid gap-3 sm:gap-4">
        {(cases ?? []).map(c => (
          <Link key={c.id} href={`/case/${c.id}`} className="card p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm sm:text-base break-words">{c.title || `Case ${c.id}`}</div>
              <div className="text-xs sm:text-sm opacity-70">{new Date(c.created_at as any).toLocaleString()}</div>
            </div>
            <div className="text-xs sm:text-sm px-2 py-1 rounded bg-court-beige whitespace-nowrap">{c.status}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}


