import { STAGES, stageLabel, type CourtStage } from '@/lib/stages'

export function StageStepper({ current }: { current: CourtStage }) {
  return (
    <ol className="flex flex-wrap gap-3">
      {STAGES.map((s) => {
        const active = s === current
        const done = STAGES.indexOf(s) < STAGES.indexOf(current)
        return (
          <li key={s} className={`px-3 py-1 rounded-full border ${active ? 'bg-court-brown text-white' : done ? 'bg-court-beige' : 'bg-white'}`}>
            {stageLabel(s)}
          </li>
        )
      })}
    </ol>
  )
}


