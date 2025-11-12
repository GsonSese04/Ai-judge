import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const { caseId, stage } = await req.json()
    if (!caseId || !stage) return NextResponse.json({ error: 'Missing caseId or stage' }, { status: 400 })
    
    const supabase = supabaseAdmin()
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Get case details
    const { data: caseData, error: caseErr } = await supabase
      .from('cases')
      .select('title, summary, case_type, opponent_type, ai_opponent_role')
      .eq('id', caseId)
      .single()
    
    if (caseErr || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    if (caseData.opponent_type !== 'ai') {
      return NextResponse.json({ error: 'Case does not have AI opponent' }, { status: 400 })
    }

    // Determine AI role (should be opposite of user)
    // In AI cases, user is always A, AI is always B
    const aiRole = caseData.ai_opponent_role || 'B'
    const userRole = aiRole === 'A' ? 'B' : 'A'

    // Get all previous arguments to understand context
    const { data: allArgs } = await supabase
      .from('arguments')
      .select('stage, transcript, user_id, created_at')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })

    // Get user's participant info to identify their arguments
    const AI_USER_ID = '00000000-0000-0000-0000-000000000000'
    const { data: participants } = await supabase
      .from('case_participants')
      .select('user_id, role')
      .eq('case_id', caseId)

    // User is the participant with the role opposite to AI
    const userParticipant = participants?.find(p => p.role === userRole)
    const userArgs = allArgs?.filter(a => a.user_id === userParticipant?.user_id && a.user_id !== AI_USER_ID) || []
    const aiArgs = allArgs?.filter(a => a.user_id === AI_USER_ID) || []

    // Build context from previous arguments by stage
    const contextByStage: Record<string, { user: string[], ai: string[] }> = {}
    for (const s of ['opening_statement', 'plaintiff_argument', 'cross_examination', 'defendant_argument', 'closing_submission']) {
      contextByStage[s] = { user: [], ai: [] }
    }

    for (const arg of userArgs) {
      if (contextByStage[arg.stage]) {
        contextByStage[arg.stage].user.push(arg.transcript)
      }
    }

    for (const arg of aiArgs) {
      if (contextByStage[arg.stage]) {
        contextByStage[arg.stage].ai.push(arg.transcript)
      }
    }

    // Build prompt for AI lawyer
    const stageLabels: Record<string, string> = {
      opening_statement: 'Opening Statement',
      plaintiff_argument: 'Plaintiff Case Presentation',
      cross_examination: 'Cross-examination',
      defendant_argument: 'Defendant Case Presentation',
      closing_submission: 'Closing Submission'
    }

    let contextPrompt = `You are Lawyer ${aiRole}, representing ${aiRole === 'A' ? 'the Plaintiff' : 'the Defendant'} in a ${caseData.case_type} case under Ghanaian law.\n\n`
    contextPrompt += `Case Title: ${caseData.title}\n`
    contextPrompt += `Case Summary: ${caseData.summary || 'N/A'}\n\n`
    contextPrompt += `You must follow Ghanaian legal procedures and cite relevant laws (Evidence Act NRCD 323, 1992 Constitution).\n\n`

    // Add previous stage context
    const stageOrder = ['opening_statement', 'plaintiff_argument', 'cross_examination', 'defendant_argument', 'closing_submission']
    const currentStageIndex = stageOrder.indexOf(stage)
    
    for (let i = 0; i < currentStageIndex; i++) {
      const prevStage = stageOrder[i]
      const label = stageLabels[prevStage]
      if (contextByStage[prevStage].user.length > 0 || contextByStage[prevStage].ai.length > 0) {
        contextPrompt += `${label}:\n`
        if (contextByStage[prevStage].user.length > 0) {
          contextPrompt += `Opponent (Lawyer ${userRole}):\n${contextByStage[prevStage].user.join('\n---\n')}\n\n`
        }
        if (contextByStage[prevStage].ai.length > 0) {
          contextPrompt += `Your previous response:\n${contextByStage[prevStage].ai.join('\n---\n')}\n\n`
        }
      }
    }

    // Current stage context - opponent's argument if available
    if (contextByStage[stage]?.user.length > 0) {
      const opponentText = contextByStage[stage].user.join('\n---\n')
      contextPrompt += `Current Stage (${stageLabels[stage]}):\n`
      contextPrompt += `Opponent's argument:\n${opponentText}\n\n`
      contextPrompt += `CRITICAL QUOTING RULES:\n1. You may ONLY use quotation marks when quoting the EXACT words from your opponent's argument above\n2. NEVER make up quotes or paraphrase inside quotation marks\n3. If you want to reference something your opponent said but don't have their exact words, paraphrase WITHOUT quotation marks\n4. Only quote what is actually written in the opponent's argument text above\n5. When you quote, copy the exact words from the opponent's argument - do not modify or summarize inside quotes\n\nExample of CORRECT quoting: If your opponent wrote "The defendant was not present at the scene", you can quote: "As my opponent claims, 'The defendant was not present at the scene'."\n\nExample of INCORRECT (DO NOT DO THIS): If your opponent wrote about a witness, do NOT quote something like "The witness said X" unless those exact words appear in their argument above.\n\n`
    }

    contextPrompt += `Now provide your ${stageLabels[stage]} as Lawyer ${aiRole}. You MUST:\n1. ONLY quote exact words from your opponent's submission (if provided above) - never fabricate quotes\n2. If quoting, use quotation marks and copy the exact text from the opponent's argument\n3. If paraphrasing, do NOT use quotation marks\n4. Directly address and respond to your opponent's statements\n5. Be strategic, reference previous arguments, and present a compelling case following Ghanaian legal standards\n6. Keep it concise (2-4 paragraphs) but persuasive`

    // Generate AI response
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an experienced Ghanaian lawyer arguing a ${caseData.case_type} case. You are Lawyer ${aiRole} representing ${aiRole === 'A' ? 'the Plaintiff' : 'the Defendant'}. You must follow Ghanaian legal procedures and cite relevant laws when appropriate. Be strategic and persuasive. CRITICAL QUOTING RULE: You may ONLY use quotation marks when quoting the EXACT words from your opponent's submission. NEVER fabricate quotes or put paraphrased content inside quotation marks. If you want to reference something but don't have the exact words, paraphrase WITHOUT quotation marks.`
        },
        {
          role: 'user',
          content: contextPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    })

    const aiTranscript = response.choices[0]?.message?.content || ''

    // Save AI argument with special AI_USER_ID identifier
    const { error: argErr } = await supabase
      .from('arguments')
      .insert({
        case_id: caseId,
        user_id: AI_USER_ID, // Special identifier for AI
        stage,
        transcript: aiTranscript,
        audio_url: null // AI arguments don't have audio
      })
    
    if (argErr) {
      return NextResponse.json({ error: `Failed to save AI argument: ${argErr.message}` }, { status: 400 })
    }

    // Note: Stage progression is now manual - users click "Next Stage" button
    // This gives them time to read the AI's argument before moving on

    return NextResponse.json({ transcript: aiTranscript, success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

