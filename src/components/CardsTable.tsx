import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { CardDto } from '@/server/cards.functions'

interface EditState {
  shopName: string
  reviewUrl: string
  whatsapp: string
}

// Format ISO string ke tanggal & waktu WIB
function formatWIB(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function CardsTable({
  cards,
  onSave,
  onDeactivate,
}: {
  cards: Array<CardDto>
  onSave: (code: string, patch: EditState) => void
  onDeactivate: (code: string) => void
}) {
  const [search, setSearch] = useState('')
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [draft, setDraft] = useState<EditState>({
    shopName: '',
    reviewUrl: '',
    whatsapp: '',
  })

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase()
    if (!q) return cards
    return cards.filter((c) => c.code.includes(q))
  }, [cards, search])

  const editingCard = cards.find((c) => c.code === editingCode) ?? null

  function openEdit(card: CardDto) {
    setEditingCode(card.code)
    setDraft({
      shopName: card.shopName ?? '',
      reviewUrl: card.reviewUrl ?? '',
      whatsapp: card.whatsapp ?? '',
    })
  }

  function closeEdit() {
    setEditingCode(null)
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingCard) return
    if (!draft.shopName.trim()) return
    if (!draft.reviewUrl.trim() && !draft.whatsapp.trim()) return
    onSave(editingCard.code, draft)
    closeEdit()
  }

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari berdasarkan kode kartu, contoh: BGN0001"
        className="input mb-4 max-w-xs"
      />

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Nama Toko</th>
              <th className="px-4 py-3">Diaktivasi Pada</th>
              <th className="px-4 py-3">Scan</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((card) => (
              <tr key={card.code} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 font-medium text-gray-900">{card.code}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={card.status} />
                </td>
                <td className="px-4 py-3 text-gray-600">{card.shopName ?? '-'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs tabular-nums">
                  {card.status === 'ACTIVE' ? (
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                      {formatWIB(card.activatedAt)}
                    </span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{card.scanCount}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEdit(card)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-300"
                  >
                    {card.status === 'ACTIVE' ? 'Edit' : 'Aktivasi'}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  Tidak ada kartu dengan kode tersebut.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingCard && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[380px] rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Kode kartu
            </p>
            <p className="mb-4 text-lg font-bold text-gray-900">{editingCard.code}</p>

            <form onSubmit={submitEdit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-gray-600">
                  Nama Toko *
                </span>
                <input
                  type="text"
                  value={draft.shopName}
                  onChange={(e) => setDraft({ ...draft, shopName: e.target.value })}
                  className="input"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-gray-600">
                  Link Review Google
                </span>
                <input
                  type="url"
                  value={draft.reviewUrl}
                  onChange={(e) => setDraft({ ...draft, reviewUrl: e.target.value })}
                  className="input"
                  placeholder="https://g.page/r/..."
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-gray-600">
                  Nomor WhatsApp
                </span>
                <input
                  type="tel"
                  value={draft.whatsapp}
                  onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })}
                  className="input"
                  placeholder="08123456789"
                />
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-[15px] font-semibold text-gray-700 transition active:scale-[0.98]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-black py-3 text-[15px] font-semibold text-white transition active:scale-[0.98]"
                >
                  Simpan
                </button>
              </div>

              {editingCard.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => {
                    onDeactivate(editingCard.code)
                    closeEdit()
                  }}
                  className="w-full pt-1 text-center text-[13px] font-medium text-red-600"
                >
                  Nonaktifkan kartu ini
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: CardDto['status'] }) {
  if (status === 'ACTIVE') {
    return (
      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
        AKTIF
      </span>
    )
  }
  return (
    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
      BELUM AKTIF
    </span>
  )
}
