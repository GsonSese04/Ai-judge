"use client"
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

type Row = { id: string; lawyer_id: string; lawyer_name: string | null; score: number; wins: number; losses: number }

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [filter, setFilter] = useState<'all'|'month'>('all')

  async function load() {
    const { data } = await supabaseBrowser
      .from('leaderboard')
      .select('id, lawyer_id, lawyer_name, score, wins, losses')
      .order('score', { ascending: false })
    setRows((data as any) || [])
  }

  useEffect(() => {
    load()
    const channel = supabaseBrowser
      .channel('leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, load)
      .subscribe()
    return () => { supabaseBrowser.removeChannel(channel) }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif">Leaderboard</h2>
        <div className="flex gap-2">
          <button className={`btn-secondary ${filter==='all'?'opacity-100':'opacity-70'}`} onClick={()=>setFilter('all')}>All Time</button>
          <button className={`btn-secondary ${filter==='month'?'opacity-100':'opacity-70'}`} onClick={()=>setFilter('month')}>This Month</button>
        </div>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-court-beige/60">
            <tr>
              <th className="text-left p-3">Rank</th>
              <th className="text-left p-3">Lawyer</th>
              <th className="text-left p-3">Points</th>
              <th className="text-left p-3">Wins</th>
              <th className="text-left p-3">Losses</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">
                  {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
                </td>
                <td className="p-3">{r.lawyer_name || r.lawyer_id}</td>
                <td className="p-3">{r.score}</td>
                <td className="p-3">{r.wins}</td>
                <td className="p-3">{r.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


