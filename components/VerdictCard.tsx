type Verdict = {
  winner: string
  reasoning: string
  stage_analysis: Record<string, string>
  citations: string[]
  scores: { legal_accuracy: number; evidence_strength: number; persuasion: number }
}

export function VerdictCard({ result }: { result: Verdict }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-serif">AI Judge Verdict</h3>
        <span className="text-sm opacity-70">Ghana Coat of Arms</span>
      </div>
      <div className="text-lg"><strong>Winner:</strong> {result.winner}</div>
      <div>
        <strong>Reasoning</strong>
        <p className="whitespace-pre-wrap opacity-90 mt-1">{result.reasoning}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(result.stage_analysis).map(([k, v]) => (
          <div key={k} className="bg-court-beige/40 rounded p-4">
            <div className="font-medium mb-1">{k.replaceAll('_', ' ')}</div>
            <p className="text-sm opacity-90 whitespace-pre-wrap">{v}</p>
          </div>
        ))}
      </div>
      <div>
        <strong>Citations</strong>
        <ul className="list-disc pl-6 opacity-90">
          {result.citations.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </div>
      <div className="flex gap-6">
        <div><strong>Legal Accuracy:</strong> {result.scores.legal_accuracy}</div>
        <div><strong>Evidence Strength:</strong> {result.scores.evidence_strength}</div>
        <div><strong>Persuasion:</strong> {result.scores.persuasion}</div>
      </div>
    </div>
  )
}


