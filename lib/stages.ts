export type CourtStage =
  | 'opening_statement'
  | 'plaintiff_argument'
  | 'cross_examination'
  | 'defendant_argument'
  | 'closing_submission'
  | 'verdict'

export const STAGES: CourtStage[] = [
  'opening_statement',
  'plaintiff_argument',
  'cross_examination',
  'defendant_argument',
  'closing_submission',
]

export function getNextStage(current: CourtStage): CourtStage {
  const i = STAGES.indexOf(current)
  if (i === -1 || i === STAGES.length - 1) return 'verdict'
  return STAGES[i + 1]
}

export function stageLabel(stage: CourtStage): string {
  switch (stage) {
    case 'opening_statement':
      return 'Opening Statements'
    case 'plaintiff_argument':
      return 'Plaintiff Case Presentation'
    case 'cross_examination':
      return 'Cross-examination'
    case 'defendant_argument':
      return 'Defendant Case Presentation'
    case 'closing_submission':
      return 'Closing Submissions'
    case 'verdict':
      return 'Verdict'
    default:
      return stage
  }
}

/**
 * Determines whose turn it is to submit for a given stage
 * Returns 'A', 'B', 'both', or null
 */
export function getTurnForStage(stage: CourtStage, hasASubmitted: boolean, hasBSubmitted: boolean): 'A' | 'B' | 'both' | null {
  switch (stage) {
    case 'opening_statement':
      // Both submit, but A typically goes first
      if (!hasASubmitted) return 'A'
      if (!hasBSubmitted) return 'B'
      return null // Both have submitted
    case 'plaintiff_argument':
      // Lawyer A (plaintiff) goes first
      if (!hasASubmitted) return 'A'
      return null
    case 'cross_examination':
      // Usually the other side responds - if A just argued, B responds
      // For simplicity, if A submitted in plaintiff_argument, B responds here
      if (!hasBSubmitted && hasASubmitted) return 'B'
      if (!hasASubmitted && hasBSubmitted) return 'A'
      // If neither has submitted, default to B (cross-examining plaintiff's argument)
      if (!hasASubmitted && !hasBSubmitted) return 'B'
      return null
    case 'defendant_argument':
      // Lawyer B (defendant) presents
      if (!hasBSubmitted) return 'B'
      return null
    case 'closing_submission':
      // Both submit, typically A then B
      if (!hasASubmitted) return 'A'
      if (!hasBSubmitted) return 'B'
      return null
    case 'verdict':
      return null
    default:
      return null
  }
}

/**
 * Gets a human-readable message about whose turn it is
 */
export function getTurnMessage(stage: CourtStage, turn: 'A' | 'B' | 'both' | null, userRole: 'A' | 'B' | null): string {
  if (!turn) return 'Waiting for both sides to complete...'
  if (turn === 'both') return 'Both sides can submit'
  
  const isYourTurn = turn === userRole
  const roleName = turn === 'A' ? 'Lawyer A (Plaintiff)' : 'Lawyer B (Defendant)'
  
  if (isYourTurn) {
    return `👤 It's your turn to submit`
  } else {
    return `⏳ Waiting for ${roleName} to submit`
  }
}


