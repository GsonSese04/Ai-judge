/**
 * Execute migration using Supabase admin client
 * This requires SUPABASE_SERVICE_ROLE_KEY to be set in environment
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

async function executeMigration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('❌ Missing environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
    console.error('\nPlease set these in your .env.local file or environment')
    process.exit(1)
  }

  const migrationFile = 'supabase/migrations/0005_opponent_type.sql'
  const migrationPath = join(process.cwd(), migrationFile)
  const sql = readFileSync(migrationPath, 'utf-8')

  console.log('='.repeat(70))
  console.log('Running Migration: 0005_opponent_type.sql')
  console.log('='.repeat(70))
  console.log('\nSQL:\n')
  console.log(sql)
  console.log('\n' + '='.repeat(70))

  try {
    // Use Supabase REST API to execute SQL
    // Note: This requires the sql function to be enabled in Supabase
    const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    })

    if (response.ok) {
      console.log('\n✅ Migration executed successfully!')
      return
    }

    // If RPC doesn't work, try direct PostgreSQL connection approach
    // This would require pg library, so we'll provide manual instructions instead
    console.log('\n⚠️  Automatic execution not available.')
    console.log('   Please run the migration manually in Supabase SQL Editor.\n')

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    console.log('\n📝 Manual execution required:\n')
  }

  // Provide manual instructions
  console.log('To run this migration manually:')
  console.log('1. Go to: https://app.supabase.com')
  console.log('2. Select your project')
  console.log('3. Click "SQL Editor" in the left sidebar')
  console.log('4. Click "New query"')
  console.log('5. Copy and paste the SQL shown above')
  console.log('6. Click "Run" (or press Cmd/Ctrl + Enter)\n')
  console.log('='.repeat(70))
}

executeMigration().catch(console.error)


