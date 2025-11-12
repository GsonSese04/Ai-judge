import { createClient } from '@supabase/supabase-js'

// Helper function to get the redirect URL for email magic links
// Always use production URL for magic links to ensure they work correctly
export function getEmailRedirectUrl() {
  // In production, always use the production URL
  // In development, you can use localhost if needed, but for magic links we want production
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-judge-sage.vercel.app'
}

export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { 
      persistSession: true, 
      autoRefreshToken: true, 
      detectSessionInUrl: true,
    },
  }
)


