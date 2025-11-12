import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import OpenAI from 'openai'

export async function POST(_: NextRequest, { params }: { params: { caseId: string } }) {
  const supabase = supabaseAdmin()
  try {
    const caseId = params.caseId
    const AI_USER_ID = '00000000-0000-0000-0000-000000000000'
    
    // Check if verdict already exists
    const { data: existingVerdict } = await supabase
      .from('verdicts')
      .select('id')
      .eq('case_id', caseId)
      .maybeSingle()
    
    if (existingVerdict) {
      return NextResponse.json({ ok: true, message: 'Verdict already exists' })
    }
    
    const { data: args } = await supabase
      .from('arguments')
      .select('stage, transcript, user_id, created_at')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })
    
    if (!args || args.length === 0) {
      return NextResponse.json({ error: 'No arguments found for this case' }, { status: 400 })
    }

    // Get participants to map user_ids to Lawyer A/B
    const { data: participants } = await supabase
      .from('case_participants')
      .select('user_id, role')
      .eq('case_id', caseId)
    
    // Get case data to check opponent type
    const { data: caseData } = await supabase
      .from('cases')
      .select('opponent_type, ai_opponent_role')
      .eq('id', caseId)
      .single()
    
    const aUserId = participants?.find(p => p.role === 'A')?.user_id
    const bUserId = participants?.find(p => p.role === 'B')?.user_id
    
    // For human cases, we need both participants
    // For AI cases, we need at least the user participant
    if (caseData?.opponent_type === 'human' && (!aUserId || !bUserId)) {
      return NextResponse.json({ error: 'Both lawyers must participate before verdict can be generated' }, { status: 400 })
    }

    // Group arguments by stage and by lawyer
    const byStage: Record<string, { a: string[], b: string[] }> = {}
    for (const s of ['opening_statement','plaintiff_argument','cross_examination','defendant_argument','closing_submission']) {
      byStage[s] = { a: [], b: [] }
    }
    
    for (const row of args || []) {
      if (!byStage[row.stage]) continue
      
      // Determine if this argument is from Lawyer A or B
      if (row.user_id === AI_USER_ID) {
        // For AI arguments, check the case's ai_opponent_role
        // Only process AI arguments if this is an AI case
        if (caseData?.opponent_type === 'ai') {
          if (caseData?.ai_opponent_role === 'A') {
            byStage[row.stage].a.push(row.transcript)
          } else {
            byStage[row.stage].b.push(row.transcript)
          }
        }
      } else if (aUserId && row.user_id === aUserId) {
        byStage[row.stage].a.push(row.transcript)
      } else if (bUserId && row.user_id === bUserId) {
        byStage[row.stage].b.push(row.transcript)
      }
    }
    
    // Convert to format expected by prompt (combine A and B for each stage)
    const byStageCombined: Record<string, string[]> = {}
    for (const stage of ['opening_statement','plaintiff_argument','cross_examination','defendant_argument','closing_submission']) {
      const combined = [
        ...(byStage[stage].a.length > 0 ? [`Lawyer A: ${byStage[stage].a.join('\n---\n')}`] : []),
        ...(byStage[stage].b.length > 0 ? [`Lawyer B: ${byStage[stage].b.join('\n---\n')}`] : [])
      ]
      byStageCombined[stage] = combined
    }

    const prompt = `You are Justice Mensah, an impartial Ghanaian High Court Judge.\nYou preside over a simulated case following Ghana's court procedure and law (Evidence Act NRCD 323, 1992 Constitution).\n\nYou will receive transcripts for:\n1. Opening statements\n2. Plaintiff case presentation (Lawyer A)\n3. Cross-examination\n4. Defendant case presentation (Lawyer B)\n5. Closing submissions\n\nAnalyze each stage based on Ghanaian legal standards. Deliver your verdict strictly in valid JSON with keys: winner, reasoning, stage_analysis, citations, scores. Winner must be "Lawyer A" or "Lawyer B" (not "Lawyer 1" or "Lawyer 2").\n\nYou must provide separate scores for BOTH Lawyer A and Lawyer B in three categories: legal_accuracy, evidence_strength, and persuasion (each 0-100).\n\nTranscripts:\nOpening statements:\n${(byStageCombined['opening_statement']||[]).join('\n\n')}\n\nPlaintiff case presentation (Lawyer A):\n${(byStageCombined['plaintiff_argument']||[]).join('\n\n')}\n\nCross-examination:\n${(byStageCombined['cross_examination']||[]).join('\n\n')}\n\nDefendant case presentation (Lawyer B):\n${(byStageCombined['defendant_argument']||[]).join('\n\n')}\n\nClosing submissions:\n${(byStageCombined['closing_submission']||[]).join('\n\n')}\n\nJSON format:\n{\n  "winner": "Lawyer A" | "Lawyer B",\n  "reasoning": "Detailed explanation referencing Ghanaian law.",\n  "stage_analysis": {\n    "opening_statements": "...",\n    "plaintiff_case": "...",\n    "cross_examination": "...",\n    "defendant_case": "...",\n    "closing_submissions": "..."\n  },\n  "citations": ["Evidence Act (NRCD 323)", "Article 19(2)(c) of the 1992 Constitution"],\n  "scores": {\n    "lawyer_a": {\n      "legal_accuracy": 0-100,\n      "evidence_strength": 0-100,\n      "persuasion": 0-100\n    },\n    "lawyer_b": {\n      "legal_accuracy": 0-100,\n      "evidence_strength": 0-100,\n      "persuasion": 0-100\n    }\n  }\n}`

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

    // Map Lawyer A/B to users - use participants data we already fetched
    const aUser = aUserId || null
    const bUser = bUserId || null

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

    // Leaderboard update - ONLY for human vs human cases
    // Skip leaderboard updates for AI opponent cases
    if (caseData?.opponent_type === 'human') {
      // Upsert scores - only for real human users (not AI)
      async function upsertBoard(userId: string | null, delta: number, won: boolean | null) {
        // Skip AI user
        if (!userId || userId === AI_USER_ID) return
        
        // Get email from users table (use email as display name)
        const { data: u } = await supabase.from('users').select('email, role').eq('id', userId).single()
        
        // Skip if user is AI (role === 'ai')
        if (u?.role === 'ai') return
        
        const lawyer_email = u?.email || null
        if (!lawyer_email) return // Skip if no email
        
        const { data: existing } = await supabase.from('leaderboard').select('*').eq('lawyer_id', userId).maybeSingle()
        if (!existing) {
          await supabase.from('leaderboard').insert({ 
            lawyer_id: userId, 
            lawyer_name: lawyer_email, // Store email as lawyer_name
            score: Math.max(0, delta), 
            wins: won===true?1:0, 
            losses: won===false?1:0 
          })
        } else {
          await supabase.from('leaderboard').update({
            lawyer_name: lawyer_email, // Update email as lawyer_name
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
    }
    // If opponent_type is 'ai', skip leaderboard updates entirely

    await supabase.from('cases').update({ status: 'completed' }).eq('id', caseId)
    return NextResponse.json({ ok: true, result: json })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}


