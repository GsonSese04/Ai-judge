import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import axios from 'axios'
import FormData from 'form-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const { caseId, userId, stage, storagePath } = await req.json()
    const supabase = supabaseAdmin()

    // Get a signed URL for the audio file
    const { data: signed, error: signErr } = await supabase.storage
      .from('audio')
      .createSignedUrl(storagePath, 60 * 10)
    if (signErr || !signed) return NextResponse.json({ error: signErr?.message || 'No signed URL' }, { status: 400 })

    // Fetch the file and pass to OpenAI via Axios multipart
    const fileRes = await fetch(signed.signedUrl)
    if (!fileRes.ok) return NextResponse.json({ error: `Fetch audio failed: ${fileRes.status}` }, { status: 400 })
    const arrayBuffer = await fileRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const form = new FormData()
    form.append('file', buffer, { filename: 'audio.webm', contentType: 'audio/webm' })
    form.append('model', 'gpt-4o-mini-transcribe')
    form.append('response_format', 'text')
    form.append('language', 'en')

    const { Agent: HttpAgent } = await import('http')
    const { Agent: HttpsAgent } = await import('https')

    const ax = axios.create({
      baseURL: 'https://api.openai.com',
      timeout: 120000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders(),
      },
      httpAgent: new HttpAgent({ keepAlive: true }),
      httpsAgent: new HttpsAgent({ keepAlive: true }),
      validateStatus: () => true,
    })

    async function transcribeWithRetry(attempt = 1): Promise<string> {
      const res = await ax.post('/v1/audio/transcriptions', form, { responseType: 'text' })
      if (res.status >= 200 && res.status < 300 && typeof res.data === 'string') {
        return res.data
      }
      if (attempt < 3 && (res.status >= 500 || String(res.data || '').includes('ECONNRESET'))) {
        const delay = 700 * Math.pow(2, attempt - 1)
        await new Promise(r => setTimeout(r, delay))
        return transcribeWithRetry(attempt + 1)
      }
      throw new Error(`Transcription failed: ${res.status} ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`)
    }

    const transcript = await transcribeWithRetry()

    // Save argument
    const { error: argErr } = await supabase
      .from('arguments')
      .insert({ case_id: caseId, user_id: userId, stage, transcript, audio_url: storagePath })
    if (argErr) return NextResponse.json({ error: argErr.message }, { status: 400 })

    // Check if case has AI opponent
    const { data: caseData } = await supabase
      .from('cases')
      .select('opponent_type, ai_opponent_role')
      .eq('id', caseId)
      .single()

    // If AI opponent, get user's role and trigger AI response
    if (caseData?.opponent_type === 'ai') {
      const { data: participant } = await supabase
        .from('case_participants')
        .select('role')
        .eq('case_id', caseId)
        .eq('user_id', userId)
        .single()
      
      const userRole = participant?.role || 'A'
      
      // Trigger AI response asynchronously with better error handling
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      fetch(`${baseUrl}/api/ai-lawyer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, stage, userRole })
      })
      .then(res => {
        if (!res.ok) {
          console.error('AI lawyer API error:', res.status, res.statusText)
        }
        return res.json()
      })
      .then(data => {
        if (data.error) {
          console.error('AI lawyer error:', data.error)
        }
      })
      .catch(err => {
        console.error('Failed to trigger AI lawyer:', err)
      })
    }

    // Note: Stage progression is now manual - users click "Next Stage" button
    // This gives them time to read arguments before moving on

    return NextResponse.json({ transcript })
  } catch (e: any) {
    const msg = e?.message || 'Unknown error'
    const cause = e?.cause ? String(e.cause) : undefined
    return NextResponse.json({ error: msg, cause }, { status: 500 })
  }
}


