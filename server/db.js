import pg from 'pg'

const { Pool } = pg

// Keep SQL `date` values as plain YYYY-MM-DD strings so timezone shifts can
// never move a donation date by a day.
pg.types.setTypeParser(1082, (value) => value)

const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is missing. Add it to .env before starting the server.')
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
})

pool.on('error', (err) => {
  console.error('[db] idle client error:', err.message)
})

export const query = (text, params) => pool.query(text, params)

export async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('begin')
    const result = await fn(client)
    await client.query('commit')
    return result
  } catch (err) {
    await client.query('rollback').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}
