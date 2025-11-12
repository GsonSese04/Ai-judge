import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { caseId } = await req.json()
    if (!caseId) return NextResponse.json({ error: 'Missing caseId' }, { status: 400 })
    
    const supabase = supabaseAdmin()
    
    // Get current stage
    const { data: caseRow, error: caseErr } = await supabase
      .from('cases')
      .select('current_stage')
      .eq('id', caseId)
      .single()
    
    if (caseErr || !caseRow) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }
    
    const order = ['opening_statement','plaintiff_argument','cross_examination','defendant_argument','closing_submission']
    const idx = order.indexOf(caseRow.current_stage)
    const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : 'verdict'
    
    // Update stage
    const { error: updateErr } = await supabase
      .from('cases')
      .update({ current_stage: next })
      .eq('id', caseId)
    
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 })
    }
    
    // If advancing to verdict, trigger verdict generation
    if (next === 'verdict') {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      fetch(`${baseUrl}/api/verdict/${caseId}`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(res => {
        if (!res.ok) {
          console.error('Verdict API error:', res.status, res.statusText)
        }
        return res.json()
      })
      .then(data => {
        if (data.error) {
          console.error('Verdict generation error:', data.error)
        }
      })
      .catch(err => {
        console.error('Failed to trigger verdict:', err)
      })
    }
    
    return NextResponse.json({ success: true, nextStage: next })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

