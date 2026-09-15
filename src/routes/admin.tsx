import { useEffect, useState } from 'react'
import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import type { CardDto } from '@/server/cards.functions'
import { deactivateCard, listCards, updateCard } from '@/server/cards.functions'
import { adminLogout, checkAdminSession } from '@/server/auth.functions'
import { Wordmark } from '@/components/Wordmark'
import { CardsTable } from '@/components/CardsTable'
import { QrGenerator } from '@/components/QrGenerator'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
  beforeLoad: async () => {
    const { authenticated } = await checkAdminSession()
    if (!authenticated) {
      throw redirect({ to: '/admin/login' })
    }
  },
  loader: () => listCards(),
})

// Hook untuk jam & tanggal WIB yang diperbarui setiap detik
function useWIBClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const formatted = now.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return formatted
}

function AdminPage() {
  const initial = Route.useLoaderData()
  const [cards, setCards] = useState<Array<CardDto>>(initial)
  const router = useRouter()
  const clock = useWIBClock()

  useEffect(() => {
    setCards(initial)
  }, [initial])

  // Auto-refresh data setiap 30 detik untuk tampilan live kartu aktif
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const refreshed = await listCards()
        setCards(refreshed)
      } catch {
        // Abaikan error refresh otomatis
      }
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  const total = cards.length
  const active = cards.filter((c) => c.status === 'ACTIVE').length
  const inactive = total - active

  async function saveCard(
    code: string,
    patch: { shopName: string; reviewUrl: string; whatsapp: string },
  ) {
    const updated = await updateCard({ data: { code, ...patch } })
    setCards((prev) => prev.map((card) => (card.code === code ? updated : card)))
  }

  async function handleDeactivate(code: string) {
    const updated = await deactivateCard({ data: { code } })
    setCards((prev) => prev.map((card) => (card.code === code ? updated : card)))
  }

  async function handleGenerated() {
    const refreshed = await listCards()
    setCards(refreshed)
    router.invalidate()
  }

  async function handleLogout() {
    await adminLogout()
    router.navigate({ to: '/admin/login' })
  }

  return (
    <div className="min-h-screen w-full px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Wordmark className="text-xl" />
            <p className="mt-1 text-sm text-gray-500">Dashboard Admin</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">
              &larr; Beranda
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Jam & Tanggal WIB Live */}
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3.5">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-sm text-gray-700">
            <span className="font-medium">WIB</span>
            <span className="mx-2 text-gray-300">|</span>
            <span className="tabular-nums">{clock}</span>
          </span>
        </div>

        {/* Statistik Kartu */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Kartu" value={total} />
          <StatCard label="Kartu Aktif" value={active} tone="active" />
          <StatCard label="Kartu Belum Aktif" value={inactive} tone="inactive" />
        </div>

        {/* Tabel Daftar Kartu */}
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Daftar Kartu
          </h2>
          <CardsTable cards={cards} onSave={saveCard} onDeactivate={handleDeactivate} />
        </section>

        {/* Generator QR */}
        <section className="mt-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Generator QR Massal
          </h2>
          <QrGenerator existingCards={cards} onGenerated={handleGenerated} />
        </section>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'active' | 'inactive'
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={`mt-1 text-3xl font-bold ${
          tone === 'active'
            ? 'text-green-700'
            : tone === 'inactive'
              ? 'text-gray-400'
              : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
