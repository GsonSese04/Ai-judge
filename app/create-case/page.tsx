"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'
import { useModal } from '@/components/ModalProvider'

export default function CreateCasePage() {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [caseType, setCaseType] = useState<'Civil' | 'Criminal' | ''>('')
  const [opponentType, setOpponentType] = useState<'human' | 'ai'>('human')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { showModal } = useModal()

  async function onSubmit() {
    setLoading(true)
    const { data: { user } } = await supabaseBrowser.auth.getUser()
    if (!user) { 
      setLoading(false)
      showModal('Sign in first', 'Sign In Required', 'warning')
      return 
    }
    
    // Determine user role based on opponent type
    // For AI opponent, user is always Lawyer A, AI is Lawyer B
    const userRole = opponentType === 'ai' ? 'A' : null
    const aiOpponentRole = opponentType === 'ai' ? 'B' : null
    
    const { data, error } = await supabaseBrowser.from('cases').insert({
      title, 
      summary, 
      case_type: caseType, 
      created_by: user.id,
      opponent_type: opponentType,
      ai_opponent_role: aiOpponentRole
    }).select('id').single()
    
    if (error) {
      setLoading(false)
      showModal(error.message, 'Error Creating Case', 'error')
      return
    }
    
    // Assign user to a role based on opponent type
    if (data) {
      if (opponentType === 'ai') {
        // For AI opponent, assign user to role A
        const { error: partErr } = await supabaseBrowser
          .from('case_participants')
          .insert({ case_id: data.id, user_id: user.id, role: 'A' })
        if (partErr) {
          setLoading(false)
          showModal(partErr.message, 'Error', 'error')
          return
        }
      } else {
        // For human opponent, assign user to role A (first lawyer)
        // The second lawyer will join as role B
        const { error: partErr } = await supabaseBrowser
          .from('case_participants')
          .insert({ case_id: data.id, user_id: user.id, role: 'A' })
        if (partErr) {
          setLoading(false)
          showModal(partErr.message, 'Error', 'error')
          return
        }
      }
    }
    
    setLoading(false)
    router.push(`/case/${data!.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 space-y-6 px-4">
      <h2 className="text-2xl sm:text-3xl font-serif">Create Custom Case</h2>
      <div className="card p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-sm mb-1">Case Title</label>
          <input className="border rounded p-3 w-full" value={title} onChange={e=>setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Case Summary</label>
          <textarea className="border rounded p-3 w-full h-32" value={summary} onChange={e=>setSummary(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Case Type</label>
          <select className="border rounded p-3 w-full" value={caseType} onChange={e=>setCaseType(e.target.value as any)}>
            <option value="">Select...</option>
            <option value="Civil">Civil</option>
            <option value="Criminal">Criminal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Opponent Type</label>
          <select className="border rounded p-3 w-full" value={opponentType} onChange={e=>setOpponentType(e.target.value as 'human' | 'ai')}>
            <option value="human">Real Lawyer</option>
            <option value="ai">AI Lawyer</option>
          </select>
          {opponentType === 'ai' && (
            <p className="text-sm opacity-70 mt-1">You'll play as Plaintiff against an AI opponent (Defendant)</p>
          )}
          {opponentType === 'human' && (
            <p className="text-sm opacity-70 mt-1">You'll play as Plaintiff. Share the case link for another lawyer to join as Defendant.</p>
          )}
        </div>
        <button className="btn" onClick={onSubmit} disabled={loading || !title || !caseType}>
          {loading ? 'Creating...' : 'Create Case'}
        </button>
      </div>
    </div>
  )
}


