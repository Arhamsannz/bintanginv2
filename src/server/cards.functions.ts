import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { cards, scans } from '../../db/schema.js'
import type { CardStatus } from '@/data/cards'
import { requireAdmin } from './adminMiddleware'

export interface CardDto {
  id: string
  code: string
  status: CardStatus
  shopName: string | null
  reviewUrl: string | null
  whatsapp: string | null
  createdAt: string
  activatedAt: string | null
  scanCount: number
}

function toDto(row: typeof cards.$inferSelect, scanCount = 0): CardDto {
  return {
    id: String(row.id),
    code: row.code,
    status: row.status as CardStatus,
    shopName: row.shopName,
    reviewUrl: row.reviewUrl,
    whatsapp: row.whatsapp,
    createdAt: row.createdAt.toISOString(),
    activatedAt: row.activatedAt ? row.activatedAt.toISOString() : null,
    scanCount,
  }
}

async function scanCountFor(cardId: number): Promise<number> {
  const rows = await getDb().select({ id: scans.id }).from(scans).where(eq(scans.cardId, cardId))
  return rows.length
}

export const getCard = createServerFn({ method: 'GET' })
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const code = data.code.trim().toUpperCase()
    const [row] = await getDb().select().from(cards).where(eq(cards.code, code))
    if (!row) return null
    return toDto(row, await scanCountFor(row.id))
  })

export const listCards = createServerFn({ method: 'GET' })
  .middleware([requireAdmin])
  .handler(async () => {
    const rows = await getDb().select().from(cards).orderBy(cards.code)
    const counts = await getDb().select().from(scans)
    const countByCard = new Map<number, number>()
    for (const scan of counts) {
      countByCard.set(scan.cardId, (countByCard.get(scan.cardId) ?? 0) + 1)
    }
    return rows.map((row) => toDto(row, countByCard.get(row.id) ?? 0))
  })

export const activateCard = createServerFn({ method: 'POST' })
  .inputValidator((data: { code: string; shopName: string; reviewUrl: string; whatsapp: string }) => data)
  .handler(async ({ data }) => {
    const code = data.code.trim().toUpperCase()
    const shopName = data.shopName.trim()
    const reviewUrl = data.reviewUrl.trim()
    const whatsapp = data.whatsapp.trim()

    const [row] = await getDb().select().from(cards).where(eq(cards.code, code))
    if (!row) {
      throw new Error('Kartu tidak ditemukan.')
    }
    if (row.status === 'ACTIVE') {
      throw new Error('Kartu sudah diaktivasi.')
    }
    if (!shopName) {
      throw new Error('Nama toko wajib diisi.')
    }
    if (!reviewUrl && !whatsapp) {
      throw new Error('Isi minimal salah satu: Link Review atau Nomor WhatsApp.')
    }

    const [updated] = await db
      .update(cards)
      .set({
        status: 'ACTIVE',
        shopName,
        reviewUrl: reviewUrl || null,
        whatsapp: whatsapp || null,
        activatedAt: new Date(),
      })
      .where(eq(cards.id, row.id))
      .returning()

    return toDto(updated, await scanCountFor(updated.id))
  })

export const updateCard = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((data: { code: string; shopName: string; reviewUrl: string; whatsapp: string }) => data)
  .handler(async ({ data }) => {
    const code = data.code.trim().toUpperCase()
    const shopName = data.shopName.trim()
    const reviewUrl = data.reviewUrl.trim()
    const whatsapp = data.whatsapp.trim()

    const [row] = await getDb().select().from(cards).where(eq(cards.code, code))
    if (!row) {
      throw new Error('Kartu tidak ditemukan.')
    }
    if (!shopName) {
      throw new Error('Nama toko wajib diisi.')
    }
    if (!reviewUrl && !whatsapp) {
      throw new Error('Isi minimal salah satu: Link Review atau Nomor WhatsApp.')
    }

    const [updated] = await db
      .update(cards)
      .set({
        shopName,
        reviewUrl: reviewUrl || null,
        whatsapp: whatsapp || null,
      })
      .where(eq(cards.id, row.id))
      .returning()

    return toDto(updated, await scanCountFor(updated.id))
  })

export const deactivateCard = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const code = data.code.trim().toUpperCase()
    const [row] = await getDb().select().from(cards).where(eq(cards.code, code))
    if (!row) {
      throw new Error('Kartu tidak ditemukan.')
    }

    const [updated] = await db
      .update(cards)
      .set({ status: 'INACTIVE' })
      .where(eq(cards.id, row.id))
      .returning()

    return toDto(updated, await scanCountFor(updated.id))
  })

export const recordScan = createServerFn({ method: 'POST' })
  .inputValidator((data: { code: string; userAgent: string | null }) => data)
  .handler(async ({ data }) => {
    const code = data.code.trim().toUpperCase()
    const [row] = await getDb().select().from(cards).where(eq(cards.code, code))
    if (!row || row.status !== 'ACTIVE') {
      return { recorded: false }
    }

    await getDb().insert(scans).values({
      cardId: row.id,
      userAgent: data.userAgent,
    })

    return { recorded: true }
  })

export const generateCards = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((data: { count: number; prefix: string; startNumber: number }) => data)
  .handler(async ({ data }) => {
    const count = Math.min(Math.max(Math.trunc(data.count), 1), 2000)
    const prefix = (data.prefix.trim().toUpperCase() || 'BGN').slice(0, 6)
    const startNumber = Math.max(Math.trunc(data.startNumber), 1)

    const codes = Array.from({ length: count }, (_, i) =>
      `${prefix}${String(startNumber + i).padStart(4, '0')}`,
    )

    const existing = await getDb().select().from(cards)
    const existingCodes = new Set(existing.map((row) => row.code))
    const newCodes = codes.filter((code) => !existingCodes.has(code))

    if (newCodes.length > 0) {
      await getDb().insert(cards).values(newCodes.map((code) => ({ code, status: 'INACTIVE' })))
    }

    return { codes, created: newCodes.length, skipped: codes.length - newCodes.length }
  })
