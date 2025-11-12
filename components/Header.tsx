"use client"
import { useState } from 'react'
import Link from 'next/link'
import { AuthButton } from './AuthButton'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex items-center justify-between mb-8">
      <Link href="/" className="text-xl font-serif">AI Judge Ghana</Link>
      
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-4">
        <Link href="/" className="underline opacity-80 hover:opacity-100">Home</Link>
        <Link href="/start" className="underline opacity-80 hover:opacity-100">Cases</Link>
        <Link href="/scenarios" className="underline opacity-80 hover:opacity-100">Scenarios</Link>
        <Link href="/leaderboard" className="underline opacity-80 hover:opacity-100">Leaderboard</Link>
        <Link href="/history" className="underline opacity-80 hover:opacity-100">History</Link>
        <AuthButton />
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden p-2"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {mobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="fixed top-16 left-0 right-0 bg-white border-b shadow-lg md:hidden z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex flex-col p-4 space-y-3 max-w-5xl mx-auto px-4 sm:px-6">
            <Link href="/" className="underline opacity-80 hover:opacity-100 py-1" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/start" className="underline opacity-80 hover:opacity-100 py-1" onClick={() => setMobileMenuOpen(false)}>Cases</Link>
            <Link href="/scenarios" className="underline opacity-80 hover:opacity-100 py-1" onClick={() => setMobileMenuOpen(false)}>Scenarios</Link>
            <Link href="/leaderboard" className="underline opacity-80 hover:opacity-100 py-1" onClick={() => setMobileMenuOpen(false)}>Leaderboard</Link>
            <Link href="/history" className="underline opacity-80 hover:opacity-100 py-1" onClick={() => setMobileMenuOpen(false)}>History</Link>
            <div className="pt-2 border-t">
              <AuthButton />
            </div>
          </div>
        </nav>
      )}
    </div>
  )
}


