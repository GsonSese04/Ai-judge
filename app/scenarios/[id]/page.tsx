"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function ScenarioDetail() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [scenario, setScenario] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    (async () => {
      const { data } = await supabaseBrowser.from('scenarios').select('*').eq('id', id).single()
      setScenario(data)
    })()
  }, [id])

  async function createFromScenario(role: 'A'|'B') {
    const { data: { user } } = await supabaseBrowser.auth.getUser()
    if (!user) { alert('Sign in first'); return }
    const res = await fetch('/api/scenarios/create-case', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: id, userId: user.id, role })
    })
    if (!res.ok) { const j = await res.json().catch(()=>({})); alert(j.error || 'Failed to create case'); return }
    const { id: caseId } = await res.json()
    router.push(`/case/${caseId}`)
  }

  if (!scenario) return <div className="opacity-70">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <h2 className="text-3xl font-serif">{scenario.title}</h2>
      <div className="card p-6 space-y-3">
        <div className="opacity-90 whitespace-pre-wrap">{scenario.summary}</div>
        {scenario.facts && (
          <div>
            <div className="font-medium mb-1">Facts of the case</div>
            <p className="opacity-90 whitespace-pre-wrap">{scenario.facts}</p>
          </div>
        )}
        <div className="text-sm">Difficulty: {scenario.difficulty} · Law: {scenario.law_type}</div>
        {/* Detailed facts replace raw JSON; evidence available upon request */}
        <div className="flex gap-3 pt-2">
          <button className="btn" onClick={() => createFromScenario('A')}>Join as Lawyer A</button>
          <button className="btn-secondary" onClick={() => createFromScenario('B')}>Join as Lawyer B</button>
        </div>
      </div>
    </div>
  )
}


