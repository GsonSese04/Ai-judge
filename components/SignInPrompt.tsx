"use client"
import { useState } from 'react'
import { supabaseBrowser, getEmailRedirectUrl } from '@/lib/supabase/client'
import { useModal } from './ModalProvider'

interface SignInPromptProps {
  message?: string
  onSignInSuccess?: () => void
}

export function SignInPrompt({ message, onSignInSuccess }: SignInPromptProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { showModal } = useModal()

  async function handleSignIn() {
    if (!email.trim()) return
    
    setLoading(true)
    const redirectUrl = getEmailRedirectUrl()
    const { error } = await supabaseBrowser.auth.signInWithOtp({ 
      email: email.trim(), 
      options: { 
        shouldCreateUser: true,
        emailRedirectTo: redirectUrl
      } 
    })
    setLoading(false)
    
    if (error) {
      showModal(error.message, 'Sign In Error', 'error')
      return
    }
    
    setSent(true)
  }

  if (sent) {
    return (
      <div className="card p-4 sm:p-6 space-y-3 text-center">
        <div className="text-xl sm:text-2xl">📧</div>
        <h3 className="text-lg sm:text-xl font-medium">Check your email</h3>
        <p className="opacity-80 text-sm sm:text-base">
          We've sent a magic link to <strong className="break-all">{email}</strong>. Click the link in the email to sign in.
        </p>
        <button 
          className="btn-secondary text-xs sm:text-sm" 
          onClick={() => { setSent(false); setEmail('') }}
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="card p-4 sm:p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-medium">🔐 Sign in required</h3>
        <p className="opacity-80 text-sm sm:text-base">
          {message || "You need to sign in to participate in this case. Enter your email to receive a magic link."}
        </p>
      </div>
      <div className="space-y-3">
        <input
          type="email"
          className="border rounded p-2 sm:p-3 w-full text-sm sm:text-base"
          placeholder="your.email@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSignIn()}
          disabled={loading}
        />
        <button 
          className="btn w-full text-sm sm:text-base" 
          onClick={handleSignIn} 
          disabled={loading || !email.trim()}
        >
          {loading ? 'Sending...' : 'Send magic link'}
        </button>
      </div>
      <p className="text-xs opacity-60">
        We'll send you a secure login link. No password required.
      </p>
    </div>
  )
}


