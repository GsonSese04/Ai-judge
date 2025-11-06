import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex flex-col items-center text-center gap-8 py-20">
      <h1 className="text-5xl font-serif">AI Judge Ghana</h1>
      <p className="max-w-2xl text-lg opacity-80">
        A virtual courtroom where lawyers argue cases in voice or text and an AI judge delivers verdicts following Ghanaian court procedures.
      </p>
      <div className="flex gap-4">
        <Link className="btn" href="/start">Start Case</Link>
        <Link className="btn-secondary" href="/join">Join Case</Link>
      </div>
      <Link href="/history" className="underline opacity-70 hover:opacity-100">View Case History</Link>
    </main>
  )
}


