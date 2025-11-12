"use client"
import { useState, useEffect } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { useModal } from './ModalProvider'

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  message?: string
}

export function SignInModal({ isOpen, onClose, onSuccess, message }: SignInModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { showModal } = useModal()

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSent(false)
      setEmail('')
      return
    }

    // Listen for auth state changes to detect successful sign-in
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user && sent) {
        // User successfully signed in, call onSuccess
        if (onSuccess) {
          onSuccess()
        }
        setSent(false)
        setEmail('')
        onClose()
      }
    })

    return () => subscription.unsubscribe()
  }, [isOpen, sent, onSuccess, onClose])

  async function handleSignIn() {
    if (!email.trim()) return
    
    setLoading(true)
    const { error } = await supabaseBrowser.auth.signInWithOtp({ 
      email: email.trim(), 
      options: { 
        shouldCreateUser: true,
        emailRedirectTo: 'https://ai-judge-sage.vercel.app'
      } 
    })
    setLoading(false)
    
    if (error) {
      showModal(error.message, 'Sign In Error', 'error')
      return
    }
    
    setSent(true)
  }

  if (!isOpen) return null

  if (sent) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        
        {/* Success Modal */}
        <div 
          className="relative bg-green-50 border-2 border-green-200 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-2xl mb-2">✅</div>
              <h3 className="text-xl font-semibold mb-2">Check Your Email</h3>
              <p className="text-sm opacity-80 mb-4">
                We've sent a magic link to <strong className="break-all">{email}</strong>. Click the link in the email to sign in.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          
          <div className="flex justify-end gap-2">
            <button 
              className="btn-secondary text-sm" 
              onClick={() => { setSent(false); setEmail('') }}
            >
              Use Different Email
            </button>
            <button 
              className="btn text-sm" 
              onClick={onClose}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-xl shadow-xl border-2 max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">🔐 Sign In Required</h3>
            <p className="text-sm opacity-80 mb-4">
              {message || "You need to sign in to start a case. Enter your email to receive a magic link."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-3">
          <input
            type="email"
            className="border rounded p-3 w-full text-sm sm:text-base"
            placeholder="your.email@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSignIn()}
            disabled={loading}
            autoFocus
          />
          <button 
            className="btn w-full text-sm sm:text-base" 
            onClick={handleSignIn} 
            disabled={loading || !email.trim()}
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </div>
        
        <p className="text-xs opacity-60 text-center">
          We'll send you a secure login link. No password required.
        </p>
      </div>
    </div>
  )
}

