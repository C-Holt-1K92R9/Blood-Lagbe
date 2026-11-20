import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { projectRoot } from './env.js'
import { pool, query } from './db.js'

const schema = await readFile(path.join(projectRoot, 'server', 'schema.sql'), 'utf8')

try {
  await query(schema)
  const { rows } = await query(
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
