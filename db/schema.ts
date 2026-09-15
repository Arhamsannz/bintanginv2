import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core'

export const cards = pgTable('cards', {
  id: serial().primaryKey(),
  code: text().notNull().unique(),
  status: text().notNull().default('INACTIVE'),
  shopName: text('shop_name'),
  reviewUrl: text('review_url'),
  whatsapp: text(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  activatedAt: timestamp('activated_at'),
})

export const scans = pgTable('scans', {
  id: serial().primaryKey(),
  cardId: integer('card_id')
    .notNull()
    .references(() => cards.id),
  scannedAt: timestamp('scanned_at').defaultNow().notNull(),
  userAgent: text('user_agent'),
})
