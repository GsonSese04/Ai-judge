"use client"
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase/client'
import { StageStepper } from '@/components/StageStepper'
import { Recorder } from '@/components/Recorder'
import { VerdictCard } from '@/components/VerdictCard'
import { ShareLink } from '@/components/ShareLink'
import { SignInPrompt } from '@/components/SignInPrompt'
import { useModal } from '@/components/ModalProvider'
import { STAGES, stageLabel, getNextStage, getTurnForStage, getTurnMessage, type CourtStage } from '@/lib/stages'

export default function CasePage() {
  const params = useParams<{ id: string }>()
  const caseId = params.id
  const [currentStage, setCurrentStage] = useState<CourtStage>('opening_statement')
  const [caseMeta, setCaseMeta] = useState<{ title?: string|null; summary?: string|null; case_type?: string|null; opponent_type?: string|null }|null>(null)
  const [transcript, setTranscript] = useState('')
  const [opponentTranscript, setOpponentTranscript] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [awaitingOpp, setAwaitingOpp] = useState(false)
  const [verdict, setVerdict] = useState<any | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'A' | 'B' | null>(null)
  const [isParticipant, setIsParticipant] = useState(false)
  const [needsJoin, setNeedsJoin] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [participants, setParticipants] = useState<{role: 'A' | 'B', email: string | null, name: string | null}[]>([])
  const [hasASubmitted, setHasASubmitted] = useState(false)
  const [hasBSubmitted, setHasBSubmitted] = useState(false)
  const [joinNotification, setJoinNotification] = useState<string | null>(null)
  const [allStageArguments, setAllStageArguments] = useState<Record<string, { user: string, opponent: string }>>({})
  const [viewingStage, setViewingStage] = useState<CourtStage | null>(null) // For viewing previous stages
  const [advancingStage, setAdvancingStage] = useState(false)
  const AI_USER_ID = '00000000-0000-0000-0000-000000000000' // Special UUID for AI
  const { showModal } = useModal()

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabaseBrowser.auth.getUser()
      setUserId(data.user?.id ?? null)
      setIsCheckingAuth(false)
    }
    checkAuth()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
      setIsCheckingAuth(false)
    })
    
    return () => subscription.unsubscribe()
  }, [])

  // Load case metadata (can be done without auth)
  useEffect(() => {
    const loadCaseMeta = async () => {
      const { data } = await supabaseBrowser
        .from('cases')
        .select('current_stage, title, summary, case_type, opponent_type, created_by')
        .eq('id', caseId)
        .single()
      if (data?.current_stage) setCurrentStage(data.current_stage)
      setCaseMeta({ 
        title: data?.title ?? null, 
        summary: data?.summary ?? null, 
        case_type: data?.case_type ?? null,
        opponent_type: data?.opponent_type ?? null
      })
    }
    loadCaseMeta()
  }, [caseId])

  // Load participants (works for all users to see who's in the case)
  const loadParticipants = async () => {
    const { data: parts } = await supabaseBrowser
      .from('case_participants')
      .select('user_id, role')
      .eq('case_id', caseId)
    
    if (parts) {
      // Get user details for each participant
      const partsWithDetails = await Promise.all(
        parts.map(async (p) => {
          const { data: user } = await supabaseBrowser
            .from('users')
            .select('email, name')
            .eq('id', p.user_id)
            .single()
          return {
            role: p.role as 'A' | 'B',
            email: user?.email || null,
            name: user?.name || null
          }
        })
      )
      setParticipants(partsWithDetails)
    }
  }

  useEffect(() => {
    loadParticipants()
    
    // Set up realtime subscription for participants (works without auth)
    const channel = supabaseBrowser
      .channel(`participants-${caseId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'case_participants', 
        filter: `case_id=eq.${caseId}` 
      }, async () => {
        // Reload participants when someone joins
        await loadParticipants()
      })
      .subscribe()
    
    return () => { supabaseBrowser.removeChannel(channel) }
  }, [caseId])

  // Load user-specific data (requires auth)
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) return
      
      const { data } = await supabaseBrowser
        .from('cases')
        .select('opponent_type, created_by')
        .eq('id', caseId)
        .single()
      
      if (!data) return
      
      // Check if user is a participant
      const { data: participant } = await supabaseBrowser
        .from('case_participants')
        .select('role')
        .eq('case_id', caseId)
        .eq('user_id', userId)
        .maybeSingle()
      
      if (participant) {
        setUserRole(participant.role as 'A' | 'B')
        setIsParticipant(true)
        setNeedsJoin(false)
      } else if (data?.opponent_type === 'ai' && data?.created_by === userId) {
        // For AI cases, creator is automatically participant
        setUserRole('A')
        setIsParticipant(true)
        setNeedsJoin(false)
      } else if (data?.opponent_type === 'human') {
        // For human opponent cases, user needs to join if not already a participant
        setNeedsJoin(true)
        setIsParticipant(false)
      }
      
      // Load current stage arguments (only if participant)
      const shouldLoadArgs = participant || (data?.opponent_type === 'ai' && data?.created_by === userId)
      
      if (currentStage && currentStage !== 'verdict' && shouldLoadArgs) {
        const { data: args } = await supabaseBrowser
          .from('arguments')
          .select('user_id, transcript')
          .eq('case_id', caseId)
          .eq('stage', currentStage)
        
        if (args) {
          // Get participant roles to check A vs B
          const { data: parts } = await supabaseBrowser
            .from('case_participants')
            .select('user_id, role')
            .eq('case_id', caseId)
          
          const aUserId = parts?.find(p => p.role === 'A')?.user_id
          const bUserId = parts?.find(p => p.role === 'B')?.user_id
          
          const aArg = args.find(a => a.user_id === aUserId && a.user_id !== AI_USER_ID)
          const bArg = args.find(a => a.user_id === bUserId && a.user_id !== AI_USER_ID)
          const aiArg = args.find(a => a.user_id === AI_USER_ID)
          const userArg = args.find(a => a.user_id === userId && a.user_id !== AI_USER_ID)
          
          if (data.opponent_type === 'ai') {
            const opponentArg = aiArg
            
            if (userArg) setTranscript(userArg.transcript)
            if (opponentArg) {
              setOpponentTranscript(opponentArg.transcript)
              setAwaitingOpp(false)
            } else {
              setOpponentTranscript('')
              if (userArg) setAwaitingOpp(true)
            }
          } else {
            // Human opponent - check based on user role
            if (participant?.role === 'A') {
              if (aArg) setTranscript(aArg.transcript)
              if (bArg) {
                setOpponentTranscript(bArg.transcript)
                setAwaitingOpp(false)
              } else {
                setOpponentTranscript('')
                if (aArg) setAwaitingOpp(true)
              }
            } else if (participant?.role === 'B') {
              if (bArg) setTranscript(bArg.transcript)
              if (aArg) {
                setOpponentTranscript(aArg.transcript)
                setAwaitingOpp(false)
              } else {
                setOpponentTranscript('')
                if (bArg) setAwaitingOpp(true)
              }
            }
          }
          
          // Track submissions for turn indicator
          if (data.opponent_type === 'ai') {
            // For AI cases, user is A, AI is B (or vice versa based on ai_opponent_role)
            const userIsA = participant?.role === 'A' || (data.created_by === userId && !participant)
            if (userIsA) {
              setHasASubmitted(!!userArg)
              setHasBSubmitted(!!aiArg)
            } else {
              setHasASubmitted(!!aiArg)
              setHasBSubmitted(!!userArg)
            }
          } else {
            // For human cases, track A and B separately
            setHasASubmitted(!!aArg)
            setHasBSubmitted(!!bArg)
          }
        } else {
          setHasASubmitted(false)
          setHasBSubmitted(false)
        }
      }
    }
    if (userId) {
      loadUserData()
    }
  }, [caseId, userId, currentStage])

  // Set up realtime subscriptions for arguments and verdicts (works for all users)
  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`case-args-${caseId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verdicts', filter: `case_id=eq.${caseId}` }, async () => {
        const { data } = await supabaseBrowser.from('verdicts').select('*').eq('case_id', caseId).single()
        if (data?.result) {
          setVerdict(data.result)
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'arguments', filter: `case_id=eq.${caseId}` }, async (payload) => {
        const arg: any = payload.new
        // Reload all stage arguments when a new argument is added
        if (userId && isParticipant) {
          const { data: allArgs } = await supabaseBrowser
            .from('arguments')
            .select('user_id, transcript, stage')
            .eq('case_id', caseId)
          
          if (allArgs) {
            const { data: parts } = await supabaseBrowser
              .from('case_participants')
              .select('user_id, role')
              .eq('case_id', caseId)
            
            const aUserId = parts?.find(p => p.role === 'A')?.user_id
            const bUserId = parts?.find(p => p.role === 'B')?.user_id
            
            const { data: caseData } = await supabaseBrowser
              .from('cases')
              .select('opponent_type')
              .eq('id', caseId)
              .single()
            
            const stageArgs: Record<string, { user: string, opponent: string }> = {}
            
            for (const stage of STAGES) {
              const stageArgsList = allArgs.filter(a => a.stage === stage)
              const aArg = stageArgsList.find(a => a.user_id === aUserId && a.user_id !== AI_USER_ID)
              const bArg = stageArgsList.find(a => a.user_id === bUserId && a.user_id !== AI_USER_ID)
              const aiArg = stageArgsList.find(a => a.user_id === AI_USER_ID)
              const userArg = stageArgsList.find(a => a.user_id === userId && a.user_id !== AI_USER_ID)
              
              if (caseData?.opponent_type === 'ai') {
                stageArgs[stage] = {
                  user: userArg?.transcript || '',
                  opponent: aiArg?.transcript || ''
                }
              } else {
                if (userRole === 'A') {
                  stageArgs[stage] = {
                    user: aArg?.transcript || '',
                    opponent: bArg?.transcript || ''
                  }
                } else if (userRole === 'B') {
                  stageArgs[stage] = {
                    user: bArg?.transcript || '',
                    opponent: aArg?.transcript || ''
                  }
                }
              }
            }
            
            setAllStageArguments(stageArgs)
          }
        }
        
        // If this is for current stage, update UI
        if (arg.stage === currentStage) {
          // Get participant roles
          const { data: parts } = await supabaseBrowser
            .from('case_participants')
            .select('user_id, role')
            .eq('case_id', caseId)
          const aUserId = parts?.find(p => p.role === 'A')?.user_id
          const bUserId = parts?.find(p => p.role === 'B')?.user_id
          
          if (userId && isParticipant) {
            if (arg.user_id === userId && arg.user_id !== AI_USER_ID) {
              setTranscript(arg.transcript)
            } else if (
              (caseMeta?.opponent_type === 'ai' && arg.user_id === AI_USER_ID) ||
              (caseMeta?.opponent_type === 'human' && arg.user_id !== userId && arg.user_id !== AI_USER_ID)
            ) {
              setOpponentTranscript(arg.transcript)
              setAwaitingOpp(false)
            }
          } else if (caseMeta?.opponent_type === 'ai' && arg.user_id === AI_USER_ID) {
            // Show AI response even if user is viewing
            setOpponentTranscript(arg.transcript)
            setAwaitingOpp(false)
          }
          
          // Update submission status for current stage
          if (caseMeta?.opponent_type === 'ai') {
            // For AI cases, determine if this is A or B submission
            if (userId) {
              const userIsA = userRole === 'A'
              if (arg.user_id === userId && arg.user_id !== AI_USER_ID) {
                // User submitted
                if (userIsA) setHasASubmitted(true)
                else setHasBSubmitted(true)
              } else if (arg.user_id === AI_USER_ID) {
                // AI submitted
                if (userIsA) setHasBSubmitted(true)
                else setHasASubmitted(true)
              }
            } else {
              // Not logged in, but track AI submissions
              if (arg.user_id === AI_USER_ID) {
                // Determine which role AI is
                const { data: caseData } = await supabaseBrowser
                  .from('cases')
                  .select('ai_opponent_role')
                  .eq('id', caseId)
                  .single()
                if (caseData?.ai_opponent_role === 'A') {
                  setHasASubmitted(true)
                } else {
                  setHasBSubmitted(true)
                }
              }
            }
          } else {
            // For human cases
            if (arg.user_id === aUserId) setHasASubmitted(true)
            if (arg.user_id === bUserId) setHasBSubmitted(true)
          }
        }
      })
      .subscribe()
    return () => { supabaseBrowser.removeChannel(channel) }
  }, [caseId, currentStage, userId, isParticipant, userRole, caseMeta?.opponent_type])
  
  // Set up realtime subscriptions for user-specific updates (only when authenticated)
  useEffect(() => {
    if (!userId) return
    
    const channel = supabaseBrowser
      .channel(`case-user-${caseId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases', filter: `id=eq.${caseId}` }, async (payload) => {
        const row: any = payload.new
        if (row.current_stage && row.current_stage !== currentStage) {
          setCurrentStage(row.current_stage)
          // Reset submission status when stage changes
          setHasASubmitted(false)
          setHasBSubmitted(false)
          setTranscript('')
          setOpponentTranscript('')
          setAwaitingOpp(false)
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'case_participants', filter: `case_id=eq.${caseId}` }, async (payload) => {
        // Someone joined the case
        const newParticipant: any = payload.new
        if (newParticipant.user_id !== userId) {
          // Another lawyer joined - show notification
          const { data: user } = await supabaseBrowser
            .from('users')
            .select('email, name')
            .eq('id', newParticipant.user_id)
            .single()
          const lawyerName = user?.name || user?.email || `Lawyer ${newParticipant.role}`
          setJoinNotification(`${lawyerName} joined as Lawyer ${newParticipant.role}!`)
          setTimeout(() => setJoinNotification(null), 5000)
        }
        
        // Reload participant status
        const { data: participant } = await supabaseBrowser
          .from('case_participants')
          .select('role')
          .eq('case_id', caseId)
          .eq('user_id', userId)
          .maybeSingle()
        if (participant) {
          setUserRole(participant.role as 'A' | 'B')
          setIsParticipant(true)
          setNeedsJoin(false)
        }
        
        // Reload participants list - reload all participants
        const { data: parts } = await supabaseBrowser
          .from('case_participants')
          .select('user_id, role')
          .eq('case_id', caseId)
        if (parts) {
          const partsWithDetails = await Promise.all(
            parts.map(async (p) => {
              const { data: user } = await supabaseBrowser
                .from('users')
                .select('email, name')
                .eq('id', p.user_id)
                .single()
              return {
                role: p.role as 'A' | 'B',
                email: user?.email || null,
                name: user?.name || null
              }
            })
          )
          setParticipants(partsWithDetails)
        }
      })
      .subscribe()
    return () => { supabaseBrowser.removeChannel(channel) }
  }, [caseId, userId, currentStage])

  // Set up case metadata realtime subscription (works without auth)
  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`case-meta-${caseId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases', filter: `id=eq.${caseId}` }, (payload) => {
        const row: any = payload.new
        const oldStage = currentStage
        if (row.current_stage && row.current_stage !== oldStage) {
          setCurrentStage(row.current_stage)
          // Reset submission status when stage changes
          setHasASubmitted(false)
          setHasBSubmitted(false)
          setTranscript('')
          setOpponentTranscript('')
        }
        setCaseMeta({ 
          title: row.title ?? caseMeta?.title ?? null, 
          summary: row.summary ?? caseMeta?.summary ?? null, 
          case_type: row.case_type ?? caseMeta?.case_type ?? null,
          opponent_type: row.opponent_type ?? caseMeta?.opponent_type ?? null
        })
      })
      .subscribe()
    return () => { supabaseBrowser.removeChannel(channel) }
  }, [caseId, currentStage])

  useEffect(() => {
    const fetchVerdict = async () => {
      const { data } = await supabaseBrowser.from('verdicts').select('*').eq('case_id', caseId).maybeSingle()
      if (data?.result) setVerdict(data.result)
    }
    if (currentStage === 'verdict') fetchVerdict()
  }, [currentStage, caseId])

  async function joinCase(role: 'A' | 'B') {
    if (!userId) {
      showModal('Please sign in first', 'Sign In Required', 'warning')
      return
    }
    const { error } = await supabaseBrowser
      .from('case_participants')
      .insert({ case_id: caseId, user_id: userId, role })
    
    if (error) {
      if (error.code === '23505') { // Unique violation - role already taken
        showModal('This role is already taken. Please choose the other role.', 'Role Unavailable', 'warning')
      } else {
        showModal(`Failed to join case: ${error.message}`, 'Error', 'error')
      }
      return
    }
    
    setUserRole(role)
    setIsParticipant(true)
    setNeedsJoin(false)
  }

  async function onUploaded(path: string) {
    setSubmitting(true)
    const { data: { user } } = await supabaseBrowser.auth.getUser()
    if (!user) {
      setSubmitting(false)
      showModal('Please sign in first', 'Sign In Required', 'warning')
      return
    }
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, userId: user.id, stage: currentStage, storagePath: path }),
    })
    if (!res.ok) {
      setSubmitting(false)
      showModal('Transcription failed', 'Error', 'error')
      return
    }
    const json = await res.json()
    setTranscript(json.transcript)
    setAwaitingOpp(true)
    setSubmitting(false)
    
    // Update submission status after successful submission
    if (userRole === 'A') {
      setHasASubmitted(true)
    } else if (userRole === 'B') {
      setHasBSubmitted(true)
    }
  }

  const stageReadable = useMemo(() => stageLabel(currentStage), [currentStage])
  
  // Calculate whose turn it is
  const currentTurn = useMemo(() => {
    if (currentStage === 'verdict' || !caseMeta?.opponent_type) return null
    return getTurnForStage(currentStage, hasASubmitted, hasBSubmitted)
  }, [currentStage, hasASubmitted, hasBSubmitted, caseMeta?.opponent_type])
  
  const turnMessage = useMemo(() => {
    if (!currentTurn) return null
    return getTurnMessage(currentStage, currentTurn, userRole)
  }, [currentStage, currentTurn, userRole])
  
  // Check if case needs opponent (for human cases)
  const [availableRoles, setAvailableRoles] = useState<('A' | 'B')[]>([])
  
  useEffect(() => {
    if (caseMeta?.opponent_type === 'human' && userId) {
      // Check which roles are available
      const checkRoles = async () => {
        const { data } = await supabaseBrowser
          .from('case_participants')
          .select('role')
          .eq('case_id', caseId)
        const takenRoles = new Set(data?.map(p => p.role) || [])
        const avail: ('A' | 'B')[] = []
        if (!takenRoles.has('A')) avail.push('A')
        if (!takenRoles.has('B')) avail.push('B')
        setAvailableRoles(avail)
      }
      checkRoles()
    } else if (caseMeta?.opponent_type !== 'human') {
      setAvailableRoles([])
    }
  }, [caseId, caseMeta?.opponent_type, userId, isParticipant])

  return (
    <div className="space-y-6">
      {/* Join notification */}
      {joinNotification && (
        <div className="card p-3 sm:p-4 bg-green-50 border-green-200 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl">🎉</span>
            <span className="font-medium text-green-800 text-sm sm:text-base break-words">{joinNotification}</span>
          </div>
        </div>
      )}

      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-serif break-words">{caseMeta?.title || `Case #${caseId}`}</h1>
        <div className="flex flex-col items-start sm:items-end gap-1">
          <div className="opacity-80 text-sm sm:text-base">Current Stage: <strong>{stageReadable}</strong></div>
          {caseMeta?.opponent_type === 'ai' && (
            <div className="text-xs sm:text-sm opacity-60">🤖 AI Opponent</div>
          )}
        </div>
      </header>

      {/* Participants info */}
      {caseMeta?.opponent_type === 'human' && participants.length > 0 && (
        <div className="card p-4">
          <div className="text-sm uppercase opacity-60 mb-2">Participants</div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {participants.map((p) => (
              <div key={p.role} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-medium text-sm sm:text-base">Lawyer {p.role} ({p.role === 'A' ? 'Plaintiff' : 'Defendant'}):</span>
                <span className="opacity-80 text-sm sm:text-base break-words">{p.name || p.email || 'Anonymous'}</span>
                {userRole === p.role && <span className="text-xs opacity-60">(You)</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Turn indicator */}
      {userId && isParticipant && currentStage !== 'verdict' && turnMessage && (
        <div className={`card p-3 sm:p-4 ${currentTurn === userRole ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl">{currentTurn === userRole ? '👤' : '⏳'}</span>
            <span className="font-medium text-sm sm:text-base">{turnMessage}</span>
          </div>
        </div>
      )}
      {caseMeta?.summary && (
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm uppercase opacity-60">Case Details</div>
          <div className="mt-1 text-xs sm:text-sm opacity-90">Type: {caseMeta.case_type || '—'}</div>
          <p className="mt-2 whitespace-pre-wrap text-sm sm:text-base">{caseMeta.summary}</p>
        </div>
      )}
      <StageStepper current={currentStage} />

      {/* Show sign-in prompt if user is not logged in */}
      {!isCheckingAuth && !userId && (
        <SignInPrompt 
          message="You need to sign in to join or participate in this case. Enter your email to receive a magic link."
        />
      )}

      {/* Show join options if user needs to join */}
      {!isCheckingAuth && userId && needsJoin && caseMeta?.opponent_type === 'human' && (
        <div className="card p-4 sm:p-6 space-y-4">
          <h3 className="text-lg sm:text-xl font-medium">Join This Case</h3>
          <p className="opacity-80 text-sm sm:text-base">This case is waiting for an opponent. Choose your role:</p>
          <div className="flex flex-col sm:flex-row gap-3">
            {availableRoles.includes('A') && (
              <button className="btn w-full sm:w-auto" onClick={() => joinCase('A')}>
                Join as Lawyer A
              </button>
            )}
            {availableRoles.includes('B') && (
              <button className="btn-secondary w-full sm:w-auto" onClick={() => joinCase('B')}>
                Join as Lawyer B
              </button>
            )}
            {availableRoles.length === 0 && (
              <p className="opacity-70 text-sm sm:text-base">Both roles are taken. This case is full.</p>
            )}
          </div>
        </div>
      )}

      {/* Show share link if user is participant and waiting for opponent */}
      {userId && isParticipant && caseMeta?.opponent_type === 'human' && availableRoles.length > 0 && currentStage !== 'verdict' && (
        <ShareLink caseId={caseId} title="📤 Share Case Link - Waiting for Opponent" />
      )}

      {/* Stage Navigation */}
      {userId && isParticipant && currentStage !== 'verdict' && (
        <div className="card p-3 sm:p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {STAGES.map((stage) => {
                const stageArgs = allStageArguments[stage]
                const hasArgs = stageArgs && (stageArgs.user || stageArgs.opponent)
                const isCurrent = stage === currentStage
                const isPast = STAGES.indexOf(stage) < STAGES.indexOf(currentStage)
                
                return (
                  <button
                    key={stage}
                    onClick={() => {
                      if (isPast || isCurrent) {
                        setViewingStage(isCurrent ? null : stage)
                        // Load arguments for viewed stage
                        if (stage !== currentStage) {
                          const args = allStageArguments[stage]
                          if (args) {
                            setTranscript(args.user)
                            setOpponentTranscript(args.opponent)
                          }
                        } else {
                          // Reset to current stage arguments
                          const args = allStageArguments[currentStage]
                          if (args) {
                            setTranscript(args.user)
                            setOpponentTranscript(args.opponent)
                          }
                        }
                      }
                    }}
                    className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
                      isCurrent && !viewingStage
                        ? 'bg-blue-500 text-white'
                        : viewingStage === stage
                        ? 'bg-blue-200 text-blue-900'
                        : isPast && hasArgs
                        ? 'bg-gray-200 hover:bg-gray-300'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!isPast && !isCurrent}
                  >
                    {stageLabel(stage)}
                    {hasArgs && <span className="ml-1">✓</span>}
                  </button>
                )
              })}
            </div>
            {viewingStage && viewingStage !== currentStage && (
              <button
                onClick={() => {
                  setViewingStage(null)
                  const args = allStageArguments[currentStage]
                  if (args) {
                    setTranscript(args.user)
                    setOpponentTranscript(args.opponent)
                  }
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                ← Back to Current Stage
              </button>
            )}
          </div>
        </div>
      )}

      {/* Next Stage Button */}
      {userId && isParticipant && currentStage !== 'verdict' && hasASubmitted && hasBSubmitted && !viewingStage && (
        <div className="card p-4 bg-green-50 border-green-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex-1">
              <p className="font-medium text-green-800 text-sm sm:text-base">✓ Both sides have submitted for this stage</p>
              <p className="text-xs sm:text-sm text-green-700 mt-1">Review the arguments above, then proceed to the next stage when ready.</p>
            </div>
            <button
              onClick={async () => {
                setAdvancingStage(true)
                try {
                  const res = await fetch('/api/case/advance-stage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ caseId }),
                  })
                  if (!res.ok) {
                    const error = await res.json()
                    showModal(error.error || 'Failed to advance stage', 'Error', 'error')
                  } else {
                    // Stage will update via realtime subscription
                    setHasASubmitted(false)
                    setHasBSubmitted(false)
                    setTranscript('')
                    setOpponentTranscript('')
                  }
                } catch (err) {
                  showModal('Failed to advance stage', 'Error', 'error')
                } finally {
                  setAdvancingStage(false)
                }
              }}
              disabled={advancingStage}
              className="btn bg-green-600 hover:bg-green-700 disabled:opacity-50 w-full sm:w-auto text-sm sm:text-base"
            >
              {advancingStage ? 'Advancing...' : `Next: ${stageLabel(getNextStage(currentStage))} →`}
            </button>
          </div>
        </div>
      )}

      {userId && currentStage !== 'verdict' && isParticipant && !viewingStage ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="card p-4 sm:p-6 space-y-4">
            <h3 className="text-lg sm:text-xl font-medium">Your Submission</h3>
            <Recorder 
              caseId={caseId as string} 
              stage={currentStage} 
              onUploaded={onUploaded}
              disabled={!!transcript || submitting}
            />
            {!!transcript && (
              <div>
                <div className="font-medium mb-1 text-sm sm:text-base">Transcript</div>
                <p className="opacity-90 whitespace-pre-wrap text-sm sm:text-base">{transcript}</p>
              </div>
            )}
            {submitting && <div className="opacity-70 text-sm sm:text-base">Processing...</div>}
          </div>
          <div className="card p-6 space-y-4">
            <h3 className="text-xl font-medium">
              {caseMeta?.opponent_type === 'ai' ? '🤖 AI Lawyer' : 'Opponent'}
            </h3>
            {opponentTranscript ? (
              <div>
                <div className="font-medium mb-1">Transcript</div>
                <p className="opacity-90 whitespace-pre-wrap">{opponentTranscript}</p>
              </div>
            ) : (
              <p className="opacity-70">
                {awaitingOpp 
                  ? (caseMeta?.opponent_type === 'ai' ? 'AI is generating response...' : 'Awaiting opponent submission...')
                  : 'No submission yet'}
              </p>
            )}
          </div>
        </div>
      ) : viewingStage && viewingStage !== currentStage ? (
        <div className="card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
            <h3 className="text-lg sm:text-xl font-medium">Viewing: {stageLabel(viewingStage)}</h3>
            <button
              onClick={() => {
                setViewingStage(null)
                const args = allStageArguments[currentStage]
                if (args) {
                  setTranscript(args.user)
                  setOpponentTranscript(args.opponent)
                }
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back to Current Stage
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-sm sm:text-base">Your Submission</h4>
              <p className="opacity-90 whitespace-pre-wrap text-sm sm:text-base">{allStageArguments[viewingStage]?.user || 'No submission'}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm sm:text-base">{caseMeta?.opponent_type === 'ai' ? '🤖 AI Lawyer' : 'Opponent'}</h4>
              <p className="opacity-90 whitespace-pre-wrap text-sm sm:text-base">{allStageArguments[viewingStage]?.opponent || 'No submission'}</p>
            </div>
          </div>
        </div>
      ) : currentStage === 'verdict' ? (
        <div className="space-y-4">
          {!verdict ? (
            <div className="card p-4 sm:p-6 text-center">
              <p className="opacity-70 text-sm sm:text-base">AI Judge delivering verdict...</p>
            </div>
          ) : (
            <>
              <VerdictCard result={verdict} />
              <div className="flex justify-center pt-4">
                <Link href="/start" className="btn text-sm sm:text-base">
                  ← Back to Cases
                </Link>
              </div>
            </>
          )}
          {/* Optional: subtle animation or sound could be added here */}
        </div>
      ) : userId && !isParticipant && !needsJoin ? (
        <div className="card p-4 sm:p-6 text-center">
          <p className="opacity-70 text-sm sm:text-base">Please join the case to participate.</p>
        </div>
      ) : null}
    </div>
  )
}


