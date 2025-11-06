"use client"
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'
import { StageStepper } from '@/components/StageStepper'
import { Recorder } from '@/components/Recorder'
import { VerdictCard } from '@/components/VerdictCard'
import { STAGES, stageLabel, type CourtStage, getNextStage } from '@/lib/stages'

export default function CasePage() {
  const params = useParams<{ id: string }>()
  const caseId = params.id
  const [currentStage, setCurrentStage] = useState<CourtStage>('opening_statement')
  const [caseMeta, setCaseMeta] = useState<{ title?: string|null; summary?: string|null; case_type?: string|null }|null>(null)
  const [transcript, setTranscript] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [awaitingOpp, setAwaitingOpp] = useState(false)
  const [verdict, setVerdict] = useState<any | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabaseBrowser.from('cases').select('current_stage, title, summary, case_type').eq('id', caseId).single()
      if (data?.current_stage) setCurrentStage(data.current_stage)
      setCaseMeta({ title: data?.title ?? null, summary: data?.summary ?? null, case_type: data?.case_type ?? null })
    }
    load()
    const channel = supabaseBrowser
      .channel(`case-${caseId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases', filter: `id=eq.${caseId}` }, (payload) => {
        const row: any = payload.new
        if (row.current_stage) setCurrentStage(row.current_stage)
        setCaseMeta({ title: row.title ?? caseMeta?.title ?? null, summary: row.summary ?? caseMeta?.summary ?? null, case_type: row.case_type ?? caseMeta?.case_type ?? null })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verdicts', filter: `case_id=eq.${caseId}` }, async () => {
        const { data } = await supabaseBrowser.from('verdicts').select('*').eq('case_id', caseId).single()
        if (data?.result) setVerdict(data.result)
      })
      .subscribe()
    return () => { supabaseBrowser.removeChannel(channel) }
  }, [caseId])

  useEffect(() => {
    const fetchVerdict = async () => {
      const { data } = await supabaseBrowser.from('verdicts').select('*').eq('case_id', caseId).maybeSingle()
      if (data?.result) setVerdict(data.result)
    }
    if (currentStage === 'verdict') fetchVerdict()
  }, [currentStage, caseId])

  async function onUploaded(path: string) {
    setSubmitting(true)
    const { data: { user } } = await supabaseBrowser.auth.getUser()
    if (!user) {
      setSubmitting(false)
      return alert('Please sign in first')
    }
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, userId: user.id, stage: currentStage, storagePath: path }),
    })
    if (!res.ok) {
      setSubmitting(false)
      return alert('Transcription failed')
    }
    const json = await res.json()
    setTranscript(json.transcript)
    setAwaitingOpp(true)
    setSubmitting(false)
  }

  const stageReadable = useMemo(() => stageLabel(currentStage), [currentStage])

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-serif">{caseMeta?.title || `Case #${caseId}`}</h1>
        <div className="opacity-80">Current Stage: <strong>{stageReadable}</strong></div>
      </header>
      {caseMeta?.summary && (
        <div className="card p-4">
          <div className="text-sm uppercase opacity-60">Case Details</div>
          <div className="mt-1 text-sm opacity-90">Type: {caseMeta.case_type || '—'}</div>
          <p className="mt-2 whitespace-pre-wrap">{caseMeta.summary}</p>
        </div>
      )}
      <StageStepper current={currentStage} />

      {currentStage !== 'verdict' ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-xl font-medium">Your Submission</h3>
            <Recorder caseId={caseId as string} stage={currentStage} onUploaded={onUploaded} />
            {!!transcript && (
              <div>
                <div className="font-medium mb-1">Transcript</div>
                <p className="opacity-90 whitespace-pre-wrap">{transcript}</p>
              </div>
            )}
            {submitting && <div className="opacity-70">Processing...</div>}
          </div>
          <div className="card p-6 space-y-4">
            <h3 className="text-xl font-medium">Opponent</h3>
            <p className="opacity-70">{awaitingOpp ? 'Awaiting opponent submission...' : 'No submission yet'}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {!verdict ? (
            <div className="card p-6">AI Judge delivering verdict...</div>
          ) : (
            <VerdictCard result={verdict} />
          )}
          {/* Optional: subtle animation or sound could be added here */}
        </div>
      )}
    </div>
  )
}


