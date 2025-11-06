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


