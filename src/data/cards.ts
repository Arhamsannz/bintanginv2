// Seed/demo fixture only. Production data lives in the Neon Postgres
// "cards" table (see db/schema.ts) and is read/written through
// src/server/cards.functions.ts. This file is no longer used by any route.

export type CardStatus = 'ACTIVE' | 'INACTIVE'

export interface Card {
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

export const initialCards: Array<Card> = [
  {
    id: '1',
    code: 'BGN0001',
    status: 'ACTIVE',
    shopName: 'Warung Maju',
    reviewUrl: 'https://g.page/r/warung-maju/review',
    whatsapp: '628123456789',
    createdAt: '2026-06-01T02:00:00.000Z',
    activatedAt: '2026-06-03T05:12:00.000Z',
    scanCount: 128,
  },
  {
    id: '2',
    code: 'BGN0002',
    status: 'INACTIVE',
    shopName: null,
    reviewUrl: null,
    whatsapp: null,
    createdAt: '2026-06-01T02:00:00.000Z',
    activatedAt: null,
    scanCount: 0,
  },
  {
    id: '3',
    code: 'BGN0003',
    status: 'ACTIVE',
    shopName: 'Toko Jaya',
    reviewUrl: 'https://g.page/r/toko-jaya/review',
    whatsapp: '628129876543',
    createdAt: '2026-06-01T02:00:00.000Z',
    activatedAt: '2026-06-05T09:40:00.000Z',
    scanCount: 46,
  },
  {
    id: '4',
    code: 'BGN0004',
    status: 'ACTIVE',
    shopName: 'Kedai Kopi Senja',
    reviewUrl: null,
    whatsapp: '628567123456',
    createdAt: '2026-06-02T02:00:00.000Z',
    activatedAt: '2026-06-06T11:05:00.000Z',
    scanCount: 302,
  },
  {
    id: '5',
    code: 'BGN0005',
    status: 'INACTIVE',
    shopName: null,
    reviewUrl: null,
    whatsapp: null,
    createdAt: '2026-06-02T02:00:00.000Z',
    activatedAt: null,
    scanCount: 0,
  },
  {
    id: '6',
    code: 'BGN0006',
    status: 'INACTIVE',
    shopName: null,
    reviewUrl: null,
    whatsapp: null,
    createdAt: '2026-06-02T02:00:00.000Z',
    activatedAt: null,
    scanCount: 0,
  },
  {
    id: '7',
    code: 'BGN0007',
    status: 'ACTIVE',
    shopName: 'Salon Cantika',
    reviewUrl: 'https://g.page/r/salon-cantika/review',
    whatsapp: '628198765432',
    createdAt: '2026-06-03T02:00:00.000Z',
    activatedAt: '2026-06-08T14:20:00.000Z',
    scanCount: 19,
  },
  {
    id: '8',
    code: 'BGN0008',
    status: 'INACTIVE',
    shopName: null,
    reviewUrl: null,
    whatsapp: null,
    createdAt: '2026-06-03T02:00:00.000Z',
    activatedAt: null,
    scanCount: 0,
  },
]
