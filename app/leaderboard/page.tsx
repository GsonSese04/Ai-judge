"use client"
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

type Row = { id: string; lawyer_id: string; lawyer_name: string | null; score: number; wins: number; losses: number }

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [filter, setFilter] = useState<'all'|'month'>('all')

  async function load() {
    const AI_USER_ID = '00000000-0000-0000-0000-000000000000'
    
    // Get all leaderboard entries
    const { data: leaderboardData } = await supabaseBrowser
      .from('leaderboard')
      .select('id, lawyer_id, lawyer_name, score, wins, losses')
      .neq('lawyer_id', AI_USER_ID) // Exclude AI user ID
      .order('score', { ascending: false })
    
    if (!leaderboardData || leaderboardData.length === 0) {
      setRows([])
      return
    }
    
    // Get all unique lawyer IDs
    const lawyerIds = [...new Set(leaderboardData.map(r => r.lawyer_id))]
    
    // Fetch user data for all lawyer IDs
    const { data: usersData } = await supabaseBrowser
      .from('users')
      .select('id, email, role')
      .in('id', lawyerIds)
    
    // Create a map of user_id -> user data
    const usersMap = new Map((usersData || []).map(u => [u.id, u]))
    
    // Filter and map to ensure we only show real humans with emails
    const filtered = leaderboardData
      .filter((row) => {
        const user = usersMap.get(row.lawyer_id)
        // Only include if user exists, has email, and is not AI
        return user && user.email && user.role !== 'ai'
      })
      .map((row) => {
        const user = usersMap.get(row.lawyer_id)
        return {
          id: row.id,
          lawyer_id: row.lawyer_id,
          lawyer_name: user?.email || row.lawyer_name || row.lawyer_id, // Use email as display name
          score: row.score,
          wins: row.wins,
          losses: row.losses
        }
      })
    
    setRows(filtered)
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
    <div className="space-y-4 sm:space-y-6 px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h2 className="text-2xl sm:text-3xl font-serif">Leaderboard</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className={`btn-secondary flex-1 sm:flex-none text-sm sm:text-base ${filter==='all'?'opacity-100':'opacity-70'}`} onClick={()=>setFilter('all')}>All Time</button>
          <button className={`btn-secondary flex-1 sm:flex-none text-sm sm:text-base ${filter==='month'?'opacity-100':'opacity-70'}`} onClick={()=>setFilter('month')}>This Month</button>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead className="bg-court-beige/60">
            <tr>
              <th className="text-left p-2 sm:p-3 text-sm sm:text-base">Rank</th>
              <th className="text-left p-2 sm:p-3 text-sm sm:text-base">Lawyer</th>
              <th className="text-left p-2 sm:p-3 text-sm sm:text-base">Points</th>
              <th className="text-left p-2 sm:p-3 text-sm sm:text-base">Wins</th>
              <th className="text-left p-2 sm:p-3 text-sm sm:text-base">Losses</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 sm:p-3 text-sm sm:text-base">
                  {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
                </td>
                <td className="p-2 sm:p-3 text-sm sm:text-base break-words">{r.lawyer_name || r.lawyer_id}</td>
                <td className="p-2 sm:p-3 text-sm sm:text-base">{r.score}</td>
                <td className="p-2 sm:p-3 text-sm sm:text-base">{r.wins}</td>
                <td className="p-2 sm:p-3 text-sm sm:text-base">{r.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


