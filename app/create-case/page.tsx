"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function CreateCasePage() {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [caseType, setCaseType] = useState<'Civil' | 'Criminal' | ''>('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onSubmit() {
    setLoading(true)
    const { data: { user } } = await supabaseBrowser.auth.getUser()
    if (!user) { setLoading(false); alert('Sign in first'); return }
    const { data, error } = await supabaseBrowser.from('cases').insert({
      title, summary, case_type: caseType, created_by: user.id
    }).select('id').single()
    setLoading(false)
    if (error) return alert(error.message)
    router.push(`/case/${data!.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <h2 className="text-3xl font-serif">Create Custom Case</h2>
      <div className="card p-6 space-y-4">
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
        <button className="btn" onClick={onSubmit} disabled={loading || !title || !caseType}>
          {loading ? 'Creating...' : 'Create Case'}
        </button>
      </div>
    </div>
  )
}


