import { readFile } from 'node:fs/promises'
import path from 'node:path'
import pg from 'pg'
import { projectRoot } from './env.js'

const schema = await readFile(path.join(projectRoot, 'server', 'schema.sql'), 'utf8')
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL is required to run database setup.')
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 15_000,
})

try {
  await pool.query(schema)
  const { rows } = await pool.query(
    `select table_name from information_schema.tables
      where table_schema = 'public' order by table_name`,
  )
  console.log('Schema applied. Tables:', rows.map((r) => r.table_name).join(', '))
} catch (err) {
  console.error('Migration failed:', err.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
