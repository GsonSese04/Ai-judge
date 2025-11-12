type Verdict = {
  winner: string
  reasoning: string
  stage_analysis: Record<string, string>
  citations: string[]
  scores: {
    lawyer_a?: { legal_accuracy: number; evidence_strength: number; persuasion: number }
    lawyer_b?: { legal_accuracy: number; evidence_strength: number; persuasion: number }
    // Legacy format support (for backwards compatibility)
    legal_accuracy?: number
    evidence_strength?: number
    persuasion?: number
  }
}

export function VerdictCard({ result }: { result: Verdict }) {
  return (
    <div className="card p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <h3 className="text-xl sm:text-2xl font-serif">AI Judge Verdict</h3>
        <span className="text-xs sm:text-sm opacity-70">Ghana Coat of Arms</span>
      </div>
      <div className="text-base sm:text-lg"><strong>Winner:</strong> {result.winner}</div>
      <div>
        <strong className="text-sm sm:text-base">Reasoning</strong>
        <p className="whitespace-pre-wrap opacity-90 mt-1 text-sm sm:text-base">{result.reasoning}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {Object.entries(result.stage_analysis).map(([k, v]) => (
          <div key={k} className="bg-court-beige/40 rounded p-3 sm:p-4">
            <div className="font-medium mb-1 text-sm sm:text-base">{k.replaceAll('_', ' ')}</div>
            <p className="text-xs sm:text-sm opacity-90 whitespace-pre-wrap">{v}</p>
          </div>
        ))}
      </div>
      <div>
        <strong className="text-sm sm:text-base">Citations</strong>
        <ul className="list-disc pl-4 sm:pl-6 opacity-90 text-sm sm:text-base">
          {result.citations.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </div>
      {/* Scores Section */}
      <div>
        <strong className="text-base sm:text-lg mb-3 block">Performance Scores</strong>
        {result.scores.lawyer_a && result.scores.lawyer_b ? (
          // New format: Separate scores for both lawyers
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Lawyer A Scores */}
            <div className={`card p-3 sm:p-4 ${result.winner === 'Lawyer A' ? 'bg-green-50 border-green-300 border-2' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h4 className="font-semibold text-base sm:text-lg">Lawyer A (Plaintiff)</h4>
                {result.winner === 'Lawyer A' && (
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded whitespace-nowrap">Winner 🏆</span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="opacity-70">Legal Accuracy:</span>
                  <span className="font-medium">{result.scores.lawyer_a.legal_accuracy}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Evidence Strength:</span>
                  <span className="font-medium">{result.scores.lawyer_a.evidence_strength}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Persuasion:</span>
                  <span className="font-medium">{result.scores.lawyer_a.persuasion}/100</span>
                </div>
              </div>
            </div>
            
            {/* Lawyer B Scores */}
            <div className={`card p-3 sm:p-4 ${result.winner === 'Lawyer B' ? 'bg-green-50 border-green-300 border-2' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h4 className="font-semibold text-base sm:text-lg">Lawyer B (Defendant)</h4>
                {result.winner === 'Lawyer B' && (
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded whitespace-nowrap">Winner 🏆</span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="opacity-70">Legal Accuracy:</span>
                  <span className="font-medium">{result.scores.lawyer_b.legal_accuracy}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Evidence Strength:</span>
                  <span className="font-medium">{result.scores.lawyer_b.evidence_strength}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Persuasion:</span>
                  <span className="font-medium">{result.scores.lawyer_b.persuasion}/100</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Legacy format: Single set of scores (for backwards compatibility)
          <div className="flex gap-6">
            <div><strong>Legal Accuracy:</strong> {result.scores.legal_accuracy || 'N/A'}</div>
            <div><strong>Evidence Strength:</strong> {result.scores.evidence_strength || 'N/A'}</div>
            <div><strong>Persuasion:</strong> {result.scores.persuasion || 'N/A'}</div>
          </div>
        )}
      </div>
    </div>
  )
}


