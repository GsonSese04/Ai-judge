import Link from 'next/link'

export default function StartPage() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <h2 className="text-3xl font-serif mb-6">Choose Case Type</h2>
      <div className="grid md:grid-cols-2 gap-6">
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


