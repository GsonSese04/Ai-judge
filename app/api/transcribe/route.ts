import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import OpenAI from 'openai'
import { toFile } from 'openai/uploads'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { caseId, userId, stage, storagePath } = await req.json()
    const supabase = supabaseAdmin()

    // Get a signed URL for the audio file
    const { data: signed, error: signErr } = await supabase.storage
      .from('audio')
      .createSignedUrl(storagePath, 60 * 10)
    if (signErr || !signed) return NextResponse.json({ error: signErr?.message || 'No signed URL' }, { status: 400 })

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 120000 })
    // Fetch the file and pass to Whisper
    const fileRes = await fetch(signed.signedUrl)
    if (!fileRes.ok) return NextResponse.json({ error: `Fetch audio failed: ${fileRes.status}` }, { status: 400 })
    const arrayBuffer = await fileRes.arrayBuffer()
    const nodeFile = await toFile(Buffer.from(arrayBuffer), 'audio.webm', { type: 'audio/webm' })

    // Retry transient network errors (e.g., ECONNRESET)
    async function transcribeWithRetry(attempt = 1): Promise<string> {
      try {
        const resp = await openai.audio.transcriptions.create({
          model: 'whisper-1',
          file: nodeFile,
          response_format: 'text',
          language: 'en',
        })
        return typeof resp === 'string' ? resp : (resp as any).text || ''
      } catch (err: any) {
        if (attempt < 3) {
          const delay = 500 * Math.pow(2, attempt - 1)
          await new Promise(r => setTimeout(r, delay))
          return transcribeWithRetry(attempt + 1)
        }
        throw err
      }
    }

    const transcript = await transcribeWithRetry()

    // Save argument
    const { error: argErr } = await supabase
      .from('arguments')
      .insert({ case_id: caseId, user_id: userId, stage, transcript, audio_url: storagePath })
    if (argErr) return NextResponse.json({ error: argErr.message }, { status: 400 })

    // Check if both sides submitted for this stage
    const { data: stageRows } = await supabase
      .from('arguments')
      .select('id, user_id')
      .eq('case_id', caseId)
      .eq('stage', stage)

    const uniqueUsers = new Set((stageRows || []).map(r => r.user_id))
    if (uniqueUsers.size >= 2) {
      // Progress to next stage
      const { data: caseRow } = await supabase.from('cases').select('current_stage').eq('id', caseId).single()
      if (caseRow) {
        const order = ['opening_statement','plaintiff_argument','cross_examination','defendant_argument','closing_submission']
        const idx = order.indexOf(caseRow.current_stage)
        const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : 'verdict'
        await supabase.from('cases').update({ current_stage: next }).eq('id', caseId)
        if (next === 'verdict') {
          // trigger verdict generation async
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/verdict/${caseId}`, { method: 'POST' }).catch(() => {})
        }
      }
    }

    return NextResponse.json({ transcript })
  } catch (e: any) {
    const msg = e?.message || 'Unknown error'
    const cause = e?.cause ? String(e.cause) : undefined
    return NextResponse.json({ error: msg, cause }, { status: 500 })
  }
}


