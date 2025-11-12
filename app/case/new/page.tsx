"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'
import { useModal } from '@/components/ModalProvider'

export default function NewCasePage() {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { showModal } = useModal()

  async function createCase() {
    setLoading(true)
    const { data: { user } } = await supabaseBrowser.auth.getUser()
    if (!user) {
      showModal('Please sign in first', 'Sign In Required', 'warning')
      setLoading(false)
      return
    }
    const { data, error } = await supabaseBrowser
      .from('cases')
      .insert({ title, created_by: user.id })
      .select('id')
      .single()
    setLoading(false)
    if (error) {
      showModal(error.message, 'Error Creating Case', 'error')
      return
    }
    router.replace(`/case/${data!.id}`)
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <h2 className="text-3xl font-serif mb-6">Start a New Case</h2>
      <div className="card p-6 flex flex-col gap-4">
        <input
          className="border rounded p-3"
          placeholder="Case title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <button className="btn" onClick={createCase} disabled={loading || !title}>
          {loading ? 'Creating...' : 'Create Case'}
        </button>
      </div>
    </div>
  )
}


