"use client"
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useModal } from '@/components/ModalProvider'

function JoinCaseForm() {
  const [id, setId] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showModal } = useModal()
  
  useEffect(() => {
    // Check if case ID is in URL params
    const caseParam = searchParams?.get('case')
    if (caseParam) {
      setId(caseParam)
      // Auto-navigate to case page if case ID is provided
      router.push(`/case/${caseParam}`)
    }
  }, [searchParams, router])

  function extractCaseId(input: string): string {
    // Extract case ID from full URL or just the ID
    try {
      const url = new URL(input)
      // Extract from path like /case/{id}
      const match = url.pathname.match(/\/case\/([a-f0-9-]+)/i)
      if (match) return match[1]
    } catch {
      // Not a URL, might be just the ID
    }
    // If it's a UUID format, return as is
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.trim())) {
      return input.trim()
    }
    return input.trim()
  }

  function handleJoin() {
    const caseId = extractCaseId(id)
    if (caseId) {
      router.push(`/case/${caseId}`)
    } else {
      showModal('Please enter a valid case ID or case URL', 'Invalid Case ID', 'warning')
    }
  }

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 px-4">
      <h2 className="text-2xl sm:text-3xl font-serif mb-6">Join a Case</h2>
      <div className="card p-4 sm:p-6 space-y-4">
        <div>
          <p className="text-sm opacity-70 mb-2">
            Paste the case ID or the full case URL to join
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input
              className="border rounded p-3 flex-1 text-sm sm:text-base"
              placeholder="Paste case ID or URL (e.g., /case/abc-123...)"
              value={id}
              onChange={e => setId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <button className="btn w-full sm:w-auto" onClick={handleJoin} disabled={!id.trim()}>Join</button>
          </div>
        </div>
        <div className="text-xs opacity-60">
          💡 Tip: You can also share a direct link. The other lawyer will be automatically redirected to join.
        </div>
      </div>
    </div>
  )
}

export default function JoinCasePage() {
  return (
    <Suspense fallback={
      <div className="max-w-xl mx-auto py-10">
        <h2 className="text-3xl font-serif mb-6">Join a Case</h2>
        <div className="card p-6">
          <p className="opacity-70">Loading...</p>
        </div>
      </div>
    }>
      <JoinCaseForm />
    </Suspense>
  )
}


