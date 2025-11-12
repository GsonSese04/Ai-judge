import Link from 'next/link'

export default function StartPage() {
  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-12 px-4">
      <h2 className="text-2xl sm:text-3xl font-serif mb-6">Choose Case Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Link href="/create-case" className="card p-6 hover:shadow-lg transition">
          <div className="text-2xl mb-2">🏛️ Custom Case</div>
          <p className="opacity-80">Bring your own case. Provide title, summary, and type.</p>
        </Link>
        <Link href="/scenarios" className="card p-6 hover:shadow-lg transition">
          <div className="text-2xl mb-2">⚖️ Predefined Case Scenario</div>
          <p className="opacity-80">Pick from ready-made mock trials with sample evidence.</p>
        </Link>
      </div>
    </div>
  )
}


