"use client"
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

export function AuthButton() {
  const [email, setEmail] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
    const { error } = await supabaseBrowser.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    setLoading(false)
    if (error) return alert(error.message)
    alert('Check your email for the magic link')
  }

  async function signOut() {
    await supabaseBrowser.auth.signOut()
  }

  if (userEmail) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm opacity-80">{userEmail}</span>
        <button className="btn-secondary" onClick={signOut}>Sign out</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input className="border rounded p-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <button className="btn" onClick={signIn} disabled={loading || !email}>{loading ? 'Sending...' : 'Sign in'}</button>
    </div>
  )
}


