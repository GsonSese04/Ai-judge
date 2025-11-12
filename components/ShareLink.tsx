"use client"
import { useState } from 'react'

interface ShareLinkProps {
  caseId: string
  title?: string
}

export function ShareLink({ caseId, title = "Share Case Link" }: ShareLinkProps) {
  const [copied, setCopied] = useState(false)
  const caseUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/case/${caseId}`
  const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join?case=${caseId}`

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="card p-3 sm:p-4 space-y-3">
      <h4 className="font-medium text-sm sm:text-base">{title}</h4>
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            readOnly
            value={joinUrl}
            className="flex-1 border rounded p-2 text-xs sm:text-sm bg-gray-50"
          />
          <button
            onClick={() => copyToClipboard(joinUrl)}
            className="btn text-sm px-3 sm:px-4 w-full sm:w-auto"
          >
            {copied ? '✓ Copied' : 'Copy Link'}
          </button>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs sm:text-sm opacity-70">
          <span>Or share Case ID:</span>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs break-all">{caseId}</code>
            <button
              onClick={() => copyToClipboard(caseId)}
              className="text-court-brown hover:underline whitespace-nowrap"
            >
              Copy ID
            </button>
          </div>
        </div>
        <p className="text-xs opacity-60">
          Send this link to your opponent. They can click it to join the case as the other lawyer.
        </p>
      </div>
    </div>
  )
}


