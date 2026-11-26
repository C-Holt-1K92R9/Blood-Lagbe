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

async function cleanupExpiredRequests() {
  await pool.query(`
    do $$
    begin
      if to_regclass('public.emergency_posts') is not null then
        execute 'delete from public.emergency_posts where needed_at is not null and needed_at <= now()';
      end if;
      if to_regclass('public.blood_requests') is not null then
        execute 'update public.blood_requests
                    set status = ''expired''
                  where situation = ''later''
                    and needed_at is not null
                    and needed_at <= now() - interval ''4 hours''
                    and status not in (''fulfilled'', ''expired'', ''cancelled'')';
        execute 'delete from public.blood_requests
                  where situation = ''later''
                    and needed_at is not null
                    and needed_at <= now() - interval ''30 days''
                    and status in (''fulfilled'', ''expired'', ''cancelled'')';
      end if;
      if to_regclass('public.request_donor_holds') is not null then
        execute 'update public.request_donor_holds
                    set status = ''expired'', released_at = now()
                  where status = ''held'' and hold_expires_at <= now()';
        if to_regclass('public.blood_requests') is not null then
          execute 'update public.blood_requests r
                      set status = ''searched''
                    where r.situation = ''immediate''
                      and r.status = ''active''
                      and not exists (
                        select 1 from public.request_donor_holds h
                         where h.request_id = r.id
                           and h.status = ''held''
                           and h.hold_expires_at > now()
                      )';
        end if;
      end if;
      if to_regclass('public.donors') is not null then
        execute 'update public.donors
                    set locked_until = null, locked_by_request_id = null
                  where locked_until is not null and locked_until <= now()';
        execute 'update public.donors
                    set available = restore_available_after_recovery,
                        restore_available_after_recovery = false,
                        recovery_until = null
                  where recovery_until is not null and recovery_until <= now()';
      end if;
    end;
    $$
  `)
}

export async function query(text, params) {
  await cleanupExpiredRequests()
  return pool.query(text, params)
}

export async function withTransaction(fn) {
  await cleanupExpiredRequests()
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
