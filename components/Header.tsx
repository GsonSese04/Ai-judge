import Link from 'next/link'
import { AuthButton } from './AuthButton'

export function Header() {
  return (
    <div className="flex items-center justify-between mb-8">
      <Link href="/" className="text-xl font-serif">AI Judge Ghana</Link>
      <nav className="flex items-center gap-4">
        <Link href="/" className="underline opacity-80 hover:opacity-100">Home</Link>
        <Link href="/start" className="underline opacity-80 hover:opacity-100">Cases</Link>
        <Link href="/scenarios" className="underline opacity-80 hover:opacity-100">Scenarios</Link>
        <Link href="/leaderboard" className="underline opacity-80 hover:opacity-100">Leaderboard</Link>
        <Link href="/history" className="underline opacity-80 hover:opacity-100">History</Link>
        <AuthButton />
      </nav>
    </div>
  )
}


