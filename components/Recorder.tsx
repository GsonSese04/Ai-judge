"use client"
import { useEffect, useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { useModal } from './ModalProvider'

type Props = {
  caseId: string
  stage: string
  onUploaded: (storagePath: string) => void
  disabled?: boolean
}

export function Recorder({ caseId, stage, onUploaded, disabled = false }: Props) {
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef<number | null>(null)
  const { showModal } = useModal()

  useEffect(() => {
    return () => { mediaRecorder.current?.stream.getTracks().forEach(t => t.stop()) }
  }, [])

  async function start() {
    if (disabled) return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    chunks.current = []
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data) }
    mr.onstop = handleStop
    mr.start()
    mediaRecorder.current = mr
    setSeconds(0)
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= 60) {
          mr.stop()
          return 60
        }
        return s + 1
      })
    }, 1000)
    setRecording(true)
  }

  async function stop() {
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  async function handleStop() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    const blob = new Blob(chunks.current, { type: 'audio/webm' })
    if (blob.size > 20 * 1024 * 1024) {
      showModal('Audio too large. Please keep recordings under 60s.', 'Recording Too Long', 'warning')
      return
    }
    const file = new File([blob], `${caseId}-${stage}-${Date.now()}.webm`, { type: 'audio/webm' })
    setUploading(true)
    const path = `arguments/${caseId}/${file.name}`
    const { error } = await supabaseBrowser.storage.from('audio').upload(path, file, { upsert: true, contentType: file.type })
    setUploading(false)
    if (error) {
      showModal(error.message, 'Upload Error', 'error')
      return
    }
    onUploaded(path)
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
      {!recording ? (
        <button 
          className="btn w-full sm:w-auto text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={start} 
          disabled={uploading || disabled}
        >
          {disabled ? 'Already Submitted' : 'Record'}
        </button>
      ) : (
        <button className="btn-secondary w-full sm:w-auto text-sm sm:text-base" onClick={stop}>Stop</button>
      )}
      {recording && <span className="text-xs sm:text-sm opacity-70 text-center sm:text-left">{seconds}s</span>}
      {uploading && <span className="opacity-70 text-xs sm:text-sm text-center sm:text-left">Uploading...</span>}
      {disabled && !recording && !uploading && (
        <span className="text-xs sm:text-sm opacity-70 text-center sm:text-left">You have already submitted for this stage</span>
      )}
    </div>
  )
}


