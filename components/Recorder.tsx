"use client"
import { useEffect, useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

type Props = {
  caseId: string
  stage: string
  onUploaded: (storagePath: string) => void
}

export function Recorder({ caseId, stage, onUploaded }: Props) {
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    return () => { mediaRecorder.current?.stream.getTracks().forEach(t => t.stop()) }
  }, [])

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    chunks.current = []
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data) }
    mr.onstop = handleStop
    mr.start()
    mediaRecorder.current = mr
    setRecording(true)
  }

  async function stop() {
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  async function handleStop() {
    const blob = new Blob(chunks.current, { type: 'audio/webm' })
    const file = new File([blob], `${caseId}-${stage}-${Date.now()}.webm`, { type: 'audio/webm' })
    setUploading(true)
    const path = `arguments/${caseId}/${file.name}`
    const { error } = await supabaseBrowser.storage.from('audio').upload(path, file, { upsert: true, contentType: file.type })
    setUploading(false)
    if (error) return alert(error.message)
    onUploaded(path)
  }

  return (
    <div className="flex items-center gap-3">
      {!recording ? (
        <button className="btn" onClick={start} disabled={uploading}>Record</button>
      ) : (
        <button className="btn-secondary" onClick={stop}>Stop</button>
      )}
      {uploading && <span className="opacity-70">Uploading...</span>}
    </div>
  )
}


