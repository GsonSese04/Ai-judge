"use client"
import { useEffect, useState } from 'react'
import { supabaseBrowser, getEmailRedirectUrl } from '@/lib/supabase/client'
import { useModal } from './ModalProvider'

export function AuthButton() {
  const [email, setEmail] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { showModal } = useModal()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      setUserEmail(user?.email ?? null)
    }
    load()
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_e, s) => setUserEmail(s?.user?.email ?? null))
    return () => { sub?.subscription.unsubscribe() }
  }, [])

  async function signIn() {
    setLoading(true)
    const redirectUrl = getEmailRedirectUrl()
    const { error } = await supabaseBrowser.auth.signInWithOtp({ 
      email, 
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
    showModal('Check your email for the magic link', 'Magic Link Sent', 'success')
  }

  async function signOut() {
    await supabaseBrowser.auth.signOut()
  }

  if (userEmail) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <span className="text-xs sm:text-sm opacity-80 break-all">{userEmail}</span>
        <button className="btn-secondary text-xs sm:text-sm whitespace-nowrap" onClick={signOut}>Sign out</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <input className="border rounded p-2 text-xs sm:text-sm flex-1 min-w-0" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <button className="btn text-xs sm:text-sm whitespace-nowrap" onClick={signIn} disabled={loading || !email}>{loading ? 'Sending...' : 'Sign in'}</button>
    </div>
  )
}


