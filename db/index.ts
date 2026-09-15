import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema.js'

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    throw new Error('DATABASE_URL belum diatur. Tambahkan DATABASE_URL di Railway Variables.')
  }
  return url
}

/** Create the database client lazily at request time, not during the build. */
export function getDb() {
  const sql = neon(getDatabaseUrl())
  return drizzle({ client: sql, schema })
}
