/**
 * Direct migration runner using Supabase REST API
 * This script reads the migration file and executes it via Supabase
 */

import { readFileSync } from 'fs'
import { join } from 'path'

async function runMigration() {
  const migrationFile = 'supabase/migrations/0006_ai_user.sql'
  const migrationPath = join(process.cwd(), migrationFile)
  const sql = readFileSync(migrationPath, 'utf-8')
  
  console.log('='.repeat(60))
  console.log('MIGRATION: 0006_ai_user.sql')
  console.log('='.repeat(60))
  console.log('\nSQL to execute:\n')
  console.log(sql)
  console.log('\n' + '='.repeat(60))
  console.log('\nTo run this migration:')
  console.log('\n1. Go to your Supabase project dashboard: https://app.supabase.com')
  console.log('2. Select your project')
  console.log('3. Navigate to SQL Editor (left sidebar)')
  console.log('4. Click "New query"')
  console.log('5. Copy and paste the SQL above')
  console.log('6. Click "Run" (or press Cmd/Ctrl + Enter)')
  console.log('\nAlternatively, if you have Supabase CLI linked:')
  console.log('  supabase db push')
  console.log('\n' + '='.repeat(60))
}

runMigration()

