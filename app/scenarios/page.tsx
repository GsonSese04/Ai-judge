import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ScenariosPage() {
  const supabase = supabaseServer()
  const { data } = await supabase.from('scenarios').select('id, title, summary, difficulty, law_type, category').order('category', { ascending: true }).order('created_at', { ascending: false })

  const grouped: Record<string, any[]> = {}
  for (const s of (data ?? [])) {
    const key = s.category || 'Other'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(s)
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-serif">Predefined Case Scenarios</h2>
      {Object.entries(grouped).map(([cat, items]) => (
        <section key={cat} className="space-y-3">
          <h3 className="text-xl font-medium">{cat}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {items.map((s: any) => (
              <Link key={s.id} href={`/scenarios/${s.id}`} className="card p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-medium">{s.title}</div>
                  <div className="text-xs bg-court-beige px-2 py-1 rounded">{s.difficulty}</div>
                </div>
                <div className="opacity-80 mt-2">{s.summary}</div>
                <div className="text-xs mt-2 opacity-70">{s.law_type}</div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}


