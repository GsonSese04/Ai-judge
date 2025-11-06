import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import OpenAI from 'openai'

export async function POST(_: NextRequest, { params }: { params: { caseId: string } }) {
  const supabase = supabaseAdmin()
  try {
    const caseId = params.caseId
    const { data: args } = await supabase
      .from('arguments')
      .select('stage, transcript, user_id, created_at')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })

    const byStage: Record<string, string[]> = {}
    for (const s of ['opening_statement','plaintiff_argument','cross_examination','defendant_argument','closing_submission']) {
      byStage[s] = []
    }
    for (const row of args || []) {
      byStage[row.stage] = [...(byStage[row.stage] || []), row.transcript]
    }

    const prompt = `You are Justice Mensah, an impartial Ghanaian High Court Judge.\nYou preside over a simulated case following Ghana’s court procedure and law (Evidence Act NRCD 323, 1992 Constitution).\n\nYou will receive transcripts for:\n1. Opening statements\n2. Plaintiff case presentation\n3. Cross-examination\n4. Defendant case presentation\n5. Closing submissions\n\nAnalyze each stage based on Ghanaian legal standards. Deliver your verdict strictly in valid JSON with keys: winner, reasoning, stage_analysis, citations, scores. Winner must be "Lawyer 1" or "Lawyer 2".\n\nTranscripts:\nOpening statements:\n${(byStage['opening_statement']||[]).join('\n---\n')}\n\nPlaintiff case presentation:\n${(byStage['plaintiff_argument']||[]).join('\n---\n')}\n\nCross-examination:\n${(byStage['cross_examination']||[]).join('\n---\n')}\n\nDefendant case presentation:\n${(byStage['defendant_argument']||[]).join('\n---\n')}\n\nClosing submissions:\n${(byStage['closing_submission']||[]).join('\n---\n')}\n\nJSON format:\n{\n  "winner": "Lawyer 1" | "Lawyer 2",\n  "reasoning": "Detailed explanation referencing Ghanaian law.",\n  "stage_analysis": {\n    "opening_statements": "...",\n    "plaintiff_case": "...",\n    "cross_examination": "...",\n    "defendant_case": "...",\n    "closing_submissions": "..."\n  },\n  "citations": ["Evidence Act (NRCD 323)", "Article 19(2)(c) of the 1992 Constitution"],\n  "scores": {\n    "legal_accuracy": 0-100,\n    "evidence_strength": 0-100,\n    "persuasion": 0-100\n  }\n}`

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a Ghanaian High Court Judge AI generating strictly valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' as any },
    })
    const text = resp.choices[0]?.message?.content || '{}'
    const json = JSON.parse(text)

    // Map Lawyer A/B to users from arguments order
    const distinctUsers: string[] = []
    for (const a of (args || [])) if (!distinctUsers.includes(a.user_id)) distinctUsers.push(a.user_id)
    const aUser = distinctUsers[0] || null
    const bUser = distinctUsers[1] || null

    // Store verdict
    await supabase.from('verdicts').insert({ case_id: caseId, result: json })
    // Also store in case_results with scores if present
    const scoreA = json.scoreA ?? json.scores?.plaintiff ?? null
    const scoreB = json.scoreB ?? json.scores?.defendant ?? null
    await supabase.from('case_results').insert({
      case_id: caseId,
      a_user_id: aUser,
      b_user_id: bUser,
      winner: json.winner,
      score_a: scoreA,
      score_b: scoreB,
      result: json,
    })

    // Leaderboard update
    const award = (userId: string | null, name: string | null, delta: number, won: boolean | null) => (
      userId ? supabase.rpc('noop') : null
    )
    // Upsert scores
    async function upsertBoard(userId: string | null, delta: number, won: boolean | null) {
      if (!userId) return
      // get name from users table
      const { data: u } = await supabase.from('users').select('name, email').eq('id', userId).single()
      const lawyer_name = u?.name || u?.email || null
      const { data: existing } = await supabase.from('leaderboard').select('*').eq('lawyer_id', userId).maybeSingle()
      if (!existing) {
        await supabase.from('leaderboard').insert({ lawyer_id: userId, lawyer_name, score: Math.max(0, delta), wins: won===true?1:0, losses: won===false?1:0 })
      } else {
        await supabase.from('leaderboard').update({
          lawyer_name,
          score: (existing.score || 0) + delta,
          wins: (existing.wins || 0) + (won===true?1:0),
          losses: (existing.losses || 0) + (won===false?1:0),
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id)
      }
    }

    const winner: string = json.winner || ''
    if (winner === 'Lawyer A') {
      await upsertBoard(aUser, 10, true)
      await upsertBoard(bUser, 3, false)
    } else if (winner === 'Lawyer B') {
      await upsertBoard(bUser, 10, true)
      await upsertBoard(aUser, 3, false)
    } else {
      await upsertBoard(aUser, 5, null)
      await upsertBoard(bUser, 5, null)
    }

    await supabase.from('cases').update({ status: 'completed' }).eq('id', caseId)
    return NextResponse.json({ ok: true, result: json })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}


