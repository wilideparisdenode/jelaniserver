import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

// Applies supabase/setup_all.sql (all migrations) using a direct Postgres connection.
// Requires DATABASE_URL in server/.env — from Supabase: Connect -> Session pooler URI.
// Then run: node scripts/db-setup.js && node scripts/seed.js

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set in server/.env.')
  console.error('Supabase Dashboard -> Connect -> Session pooler -> copy the URI and put it in server/.env as DATABASE_URL=...')
  process.exit(1)
}

const here = path.dirname(fileURLToPath(import.meta.url))
const sqlPath = path.resolve(here, '..', 'supabase', 'setup_all.sql')
const sql = await readFile(sqlPath, 'utf8')

const useSsl = !/localhost|127\.0\.0\.1/.test(connectionString)
const client = new pg.Client({ connectionString, ssl: useSsl ? { rejectUnauthorized: false } : false })

try {
  await client.connect()
  console.log('Connected to Postgres. Applying schema from supabase/setup_all.sql…')
  await client.query(sql)
  const { rows } = await client.query("select table_name from information_schema.tables where table_schema = 'public' order by table_name")
  console.log(`Schema applied. Public tables: ${rows.map((r) => r.table_name).join(', ')}`)
} catch (error) {
  console.error('Schema setup failed:', error.message)
  process.exitCode = 1
} finally {
  await client.end()
}
