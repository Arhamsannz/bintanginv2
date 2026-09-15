import { useState } from 'react'
import JSZip from 'jszip'
import type { CardDto } from '@/server/cards.functions'
import { generateCards } from '@/server/cards.functions'
import {
  cardUrl,
  dataUrlToBlob,
  downloadBlob,
  generateQrPngDataUrl,
  generateQrSvgString,
} from '@/lib/qr'

interface GeneratedQr {
  code: string
  url: string
  pngDataUrl: string
}

export function QrGenerator({
  existingCards,
  onGenerated,
}: {
  existingCards: Array<CardDto>
  onGenerated?: () => void
}) {
  const [count, setCount] = useState(100)
  const [prefix, setPrefix] = useState('BGN')
  const [startNumber, setStartNumber] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [zipping, setZipping] = useState(false)
  const [items, setItems] = useState<Array<GeneratedQr>>([])
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null)

  async function handleGenerate() {
    if (count < 1 || count > 2000) return
    setGenerating(true)
    setItems([])
    setResult(null)

    const normalizedPrefix = prefix.trim().toUpperCase() || 'BGN'
    const { codes, created, skipped } = await generateCards({
      data: { count, prefix: normalizedPrefix, startNumber },
    })
    setResult({ created, skipped })
    await onGenerated?.()

    const origin = window.location.origin
    const generated: Array<GeneratedQr> = await Promise.all(
      codes.map(async (code) => {
        const url = cardUrl(origin, code)
        const pngDataUrl = await generateQrPngDataUrl(url, 512)
        return { code, url, pngDataUrl }
      }),
    )

    setItems(generated)
    setGenerating(false)
  }


  async function downloadPng(item: GeneratedQr) {
    downloadBlob(dataUrlToBlob(item.pngDataUrl), `${item.code}.png`)
  }

  async function downloadSvg(item: GeneratedQr) {
    const svg = await generateQrSvgString(item.url)
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${item.code}.svg`)
  }

  async function downloadAllZip() {
    if (items.length === 0) return
    setZipping(true)
    const zip = new JSZip()
    for (const item of items) {
      zip.file(`${item.code}.png`, dataUrlToBlob(item.pngDataUrl))
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(blob, `bintangin-qr-${prefix.trim().toUpperCase() || 'BGN'}.zip`)
    setZipping(false)
  }

  function statusFor(code: string): CardDto['status'] {
    return existingCards.find((c) => c.code === code)?.status ?? 'INACTIVE'
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-gray-200 bg-white p-5">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-gray-600">
            Jumlah QR
          </span>
          <input
            type="number"
            min={1}
            max={2000}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="input w-32"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-gray-600">
            Prefix
          </span>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            maxLength={6}
            className="input w-28"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-gray-600">
            Nomor awal
          </span>
          <input
            type="number"
            min={1}
            value={startNumber}
            onChange={(e) => setStartNumber(Number(e.target.value))}
            className="input w-28"
          />
        </label>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-xl bg-black px-6 py-3 text-[14px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {generating ? 'MEMBUAT QR…' : 'GENERATE QR'}
        </button>
      </div>

      {result && (
        <p className="mt-4 text-[13px] text-gray-500">
          {result.created} kartu baru dibuat di database
          {result.skipped > 0 ? `, ${result.skipped} kode sudah ada dan dilewati.` : '.'}
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {items.length} QR dibuat: {items[0].code} — {items[items.length - 1].code}
            </p>
            <button
              onClick={downloadAllZip}
              disabled={zipping}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-[13px] font-semibold text-gray-800 transition active:scale-[0.98] disabled:opacity-60"
            >
              {zipping ? 'MENYIAPKAN ZIP…' : 'DOWNLOAD SEMUA (ZIP)'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item) => (
              <div
                key={item.code}
                className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-4"
              >
                <img
                  src={item.pngDataUrl}
                  alt={`QR ${item.code}`}
                  className="h-32 w-32 object-contain"
                />
                <p className="mt-2 text-sm font-semibold text-gray-900">{item.code}</p>
                <StatusBadge status={statusFor(item.code)} />
                <p className="mt-1 line-clamp-1 max-w-full text-[11px] text-gray-400">
                  {item.url}
                </p>
                <div className="mt-3 flex w-full gap-2">
                  <button
                    onClick={() => downloadPng(item)}
                    className="flex-1 rounded-lg border border-gray-200 py-1.5 text-[11px] font-semibold text-gray-700"
                  >
                    PNG
                  </button>
                  <button
                    onClick={() => downloadSvg(item)}
                    className="flex-1 rounded-lg border border-gray-200 py-1.5 text-[11px] font-semibold text-gray-700"
                  >
                    SVG
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: CardDto['status'] }) {
  if (status === 'ACTIVE') {
    return (
      <span className="mt-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
        AKTIF
      </span>
    )
  }
  return (
    <span className="mt-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
      BELUM AKTIF
    </span>
  )
}
