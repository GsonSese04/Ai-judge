"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'
import { useModal } from '@/components/ModalProvider'

export default function ScenarioDetail() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [scenario, setScenario] = useState<any>(null)
  const [opponentType, setOpponentType] = useState<'human' | 'ai'>('human')
  const router = useRouter()
  const { showModal } = useModal()

  useEffect(() => {
    (async () => {
      const { data } = await supabaseBrowser.from('scenarios').select('*').eq('id', id).single()
      setScenario(data)
    })()
  }, [id])

  async function createFromScenario(role: 'A'|'B') {
    const { data: { user } } = await supabaseBrowser.auth.getUser()
    if (!user) { 
      showModal('Sign in first', 'Sign In Required', 'warning')
      return 
    }
    const res = await fetch('/api/scenarios/create-case', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: id, userId: user.id, role, opponentType })
    })
    if (!res.ok) { 
      const j = await res.json().catch(()=>({}))
      showModal(j.error || 'Failed to create case', 'Error', 'error')
      return 
    }
    const { id: caseId } = await res.json()
    router.push(`/case/${caseId}`)
  }

  if (!scenario) return <div className="opacity-70">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 space-y-6 px-4">
      <h2 className="text-2xl sm:text-3xl font-serif">{scenario.title}</h2>
      <div className="card p-4 sm:p-6 space-y-3">
        <div className="opacity-90 whitespace-pre-wrap text-sm sm:text-base">{scenario.summary}</div>
        {scenario.facts && (
          <div>
            <div className="font-medium mb-1 text-sm sm:text-base">Facts of the case</div>
            <p className="opacity-90 whitespace-pre-wrap text-sm sm:text-base">{scenario.facts}</p>
          </div>
        )}
        <div className="text-xs sm:text-sm">Difficulty: {scenario.difficulty} · Law: {scenario.law_type}</div>
        {/* Detailed facts replace raw JSON; evidence available upon request */}
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm mb-1">Opponent Type</label>
            <select className="border rounded p-2 sm:p-3 w-full text-sm sm:text-base" value={opponentType} onChange={e=>setOpponentType(e.target.value as 'human' | 'ai')}>
              <option value="human">Real Lawyer</option>
              <option value="ai">AI Lawyer</option>
            </select>
            {opponentType === 'ai' && (
              <p className="text-xs sm:text-sm opacity-70 mt-1">You'll play as Lawyer A against an AI opponent</p>
            )}
          </div>
          {opponentType === 'human' ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="btn w-full sm:w-auto" onClick={() => createFromScenario('A')}>Join as Lawyer A</button>
              <button className="btn-secondary w-full sm:w-auto" onClick={() => createFromScenario('B')}>Join as Lawyer B</button>
            </div>
          ) : (
            <button className="btn w-full sm:w-auto" onClick={() => createFromScenario('A')}>Start Case vs AI</button>
          )}
        </div>
      </div>
    </div>
  )
}


