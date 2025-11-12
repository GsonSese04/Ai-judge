import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { scenarioId, userId, role, opponentType } = await req.json()
    if (!scenarioId || !userId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const supabase = supabaseAdmin()

    const { data: scen, error: scenErr } = await supabase.from('scenarios').select('*').eq('id', scenarioId).single()
    if (scenErr || !scen) return NextResponse.json({ error: scenErr?.message || 'Scenario not found' }, { status: 404 })

    const caseType = (scen.category === 'Criminal' || (scen.law_type||'').toLowerCase().includes('criminal')) ? 'Criminal' : 'Civil'
    
    // Handle opponent type: if AI, user is always A, AI is B. If human, use provided role.
    const finalOpponentType = opponentType || 'human'
    const userRole = finalOpponentType === 'ai' ? 'A' : role
    const aiOpponentRole = finalOpponentType === 'ai' ? 'B' : null
    
    if (!userRole) return NextResponse.json({ error: 'Role required for human opponent' }, { status: 400 })
    
    const { data: c, error: caseErr } = await supabase
      .from('cases')
      .insert({ 
        title: scen.title, 
        summary: scen.facts || scen.summary, 
        case_type: caseType, 
        created_by: userId,
        opponent_type: finalOpponentType,
        ai_opponent_role: aiOpponentRole
      })
      .select('id')
      .single()
    if (caseErr) return NextResponse.json({ error: caseErr.message }, { status: 400 })

    const { error: partErr } = await supabase.from('case_participants').insert({ case_id: c.id, user_id: userId, role: userRole })
    if (partErr) return NextResponse.json({ error: partErr.message }, { status: 400 })

    return NextResponse.json({ id: c.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}


