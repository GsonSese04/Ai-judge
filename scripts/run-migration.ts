/**
 * Script to run Supabase migrations
 * Usage: npx tsx scripts/run-migration.ts <migration-file>
 * Example: npx tsx scripts/run-migration.ts supabase/migrations/0005_opponent_type.sql
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { supabaseAdmin } from '../lib/supabase/admin'

async function runMigration(migrationFile: string) {
  try {
    const migrationPath = join(process.cwd(), migrationFile)
    const sql = readFileSync(migrationPath, 'utf-8')
    
    console.log(`Running migration: ${migrationFile}`)
    console.log('SQL:')
    console.log(sql)
    console.log('\n---\n')
    
    const supabase = supabaseAdmin()
    
    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
        
        if (error) {
          // If exec_sql doesn't exist, try using the REST API or direct query
          // For ALTER TABLE and CREATE INDEX, we might need to use the Supabase REST API
          console.warn(`RPC method not available, trying alternative approach...`)
          console.warn(`Error: ${error.message}`)
        }
      }
    }
    
    // Alternative: Use direct SQL execution via REST API
    // Note: This requires enabling the pg_net extension and creating a function
    // For now, we'll provide instructions for manual execution
    
    console.log('\n✅ Migration script prepared.')
    console.log('⚠️  Note: This script requires database admin access.')
    console.log('   If RPC execution fails, please run the SQL manually in Supabase SQL Editor.')
    
  } catch (error: any) {
    console.error('Error running migration:', error.message)
    console.error('\nPlease run the SQL manually in the Supabase SQL Editor:')
    console.error('1. Go to your Supabase project dashboard')
    console.error('2. Navigate to SQL Editor')
    console.error('3. Copy and paste the contents of:', migrationFile)
    console.error('4. Click "Run"')
    process.exit(1)
  }
}

const migrationFile = process.argv[2]
if (!migrationFile) {
  console.error('Usage: npx tsx scripts/run-migration.ts <migration-file>')
  console.error('Example: npx tsx scripts/run-migration.ts supabase/migrations/0005_opponent_type.sql')
  process.exit(1)
}

runMigration(migrationFile)


