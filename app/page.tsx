"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'
import { SignInModal } from '@/components/SignInModal'

export default function HomePage() {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      setIsSignedIn(!!user)
    }
    checkAuth()

    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  function handleStartCase(e: React.MouseEvent) {
    e.preventDefault()
    if (isSignedIn === null) {
      // Still checking auth, wait a bit
      setTimeout(() => handleStartCase(e), 100)
      return
    }
    if (!isSignedIn) {
      setShowSignInModal(true)
    } else {
      router.push('/start')
    }
  }

  return (
    <main className="flex flex-col items-center text-center gap-6 sm:gap-8 py-12 sm:py-20 px-4">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif">AI Judge Ghana</h1>
      <p className="max-w-2xl text-base sm:text-lg opacity-80 px-4">
        A virtual courtroom where lawyers argue cases in voice or text and an AI judge delivers verdicts following Ghanaian court procedures.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
        <button 
          className="btn w-full sm:w-auto" 
          onClick={handleStartCase}
        >
          Start Case
        </button>
        <Link className="btn-secondary w-full sm:w-auto" href="/join">Join Case</Link>
      </div>
      <Link href="/history" className="underline opacity-70 hover:opacity-100 text-sm sm:text-base">View Case History</Link>
      
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSuccess={() => router.push('/start')}
        message="You need to sign in to start a case. Enter your email to receive a magic link."
      />
    </main>
  )
}


