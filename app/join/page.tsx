"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinCasePage() {
  const [id, setId] = useState('')
  const router = useRouter()
  return (
    <div className="max-w-xl mx-auto py-10">
      <h2 className="text-3xl font-serif mb-6">Join a Case</h2>
      <div className="card p-6 flex gap-4">
        <input
          className="border rounded p-3 flex-1"
          placeholder="Paste case ID"
          value={id}
          onChange={e => setId(e.target.value)}
        />
        <button className="btn" onClick={() => router.push(`/case/${id}`)} disabled={!id}>Join</button>
      </div>
    </div>
  )
}


