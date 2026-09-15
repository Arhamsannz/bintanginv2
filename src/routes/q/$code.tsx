import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { Star } from 'lucide-react'
import { activateCard, getCard, recordScan } from '@/server/cards.functions'
import { whatsappLink } from '@/lib/whatsapp'
import { Card, PageShell } from '@/components/PageShell'
import { Wordmark } from '@/components/Wordmark'

// Rating >= this goes straight to Google Review; below it goes to the
// WhatsApp feedback path. Kept as a single constant so the split is
// impossible to get out of sync between the two branches below.
const POSITIVE_RATING_THRESHOLD = 4

export const Route = createFileRoute('/q/$code')({
  component: CardPage,
  loader: async ({ params }) => {
    const code = params.code.toUpperCase()
    const card = await getCard({ data: { code } })
    if (!card) {
      throw notFound()
    }
    return card
  },
  notFoundComponent: () => (
    <PageShell>
      <div className="text-center">
        <div className="mb-6">
          <Wordmark className="text-2xl" />
          <div className="mt-1 h-px w-8 bg-gray-300 mx-auto" />
        </div>
        <Card className="mt-8">
          <p className="text-[15px] text-gray-700">Kartu tidak ditemukan.</p>
        </Card>
      </div>
    </PageShell>
  ),
})

function CardPage() {
  const card = Route.useLoaderData()
  const [status, setStatus] = useState(card.status)
  const [shopName, setShopName] = useState(card.shopName ?? '')
  const [reviewUrl, setReviewUrl] = useState(card.reviewUrl ?? '')
  const [whatsapp, setWhatsapp] = useState(card.whatsapp ?? '')

  useEffect(() => {
    if (status !== 'ACTIVE') return
    recordScan({
      data: {
        code: card.code,
        userAgent: typeof navigator === 'undefined' ? null : navigator.userAgent,
      },
    }).catch(() => {})
    // Only record once per page load, on mount / when the card becomes active.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'ACTIVE') {
    return <BusinessCardView code={card.code} shopName={shopName} reviewUrl={reviewUrl} whatsapp={whatsapp} />
  }

  return (
    <ActivationForm
      code={card.code}
      shopName={shopName}
      reviewUrl={reviewUrl}
      whatsapp={whatsapp}
      onShopNameChange={setShopName}
      onReviewUrlChange={setReviewUrl}
      onWhatsappChange={setWhatsapp}
      onActivated={(activated) => {
        setStatus(activated.status)
        setShopName(activated.shopName ?? '')
        setReviewUrl(activated.reviewUrl ?? '')
        setWhatsapp(activated.whatsapp ?? '')
      }}
    />
  )
}

function ActivationForm({
  code,
  shopName,
  reviewUrl,
  whatsapp,
  onShopNameChange,
  onReviewUrlChange,
  onWhatsappChange,
  onActivated,
}: {
  code: string
  shopName: string
  reviewUrl: string
  whatsapp: string
  onShopNameChange: (value: string) => void
  onReviewUrlChange: (value: string) => void
  onWhatsappChange: (value: string) => void
  onActivated: (card: Awaited<ReturnType<typeof activateCard>>) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!shopName.trim()) {
      setError('Nama toko wajib diisi.')
      return
    }
    if (!reviewUrl.trim() && !whatsapp.trim()) {
      setError('Isi minimal salah satu: Link Review atau Nomor WhatsApp.')
      return
    }

    setSubmitting(true)
    try {
      const updated = await activateCard({
        data: { code, shopName, reviewUrl, whatsapp },
      })
      onActivated(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengaktifkan kartu.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell>
      <div className="text-center">
        <div className="mb-6">
          <Wordmark className="text-2xl" />
          <div className="mt-1 h-px w-8 bg-gray-300 mx-auto" />
        </div>
        <p className="mt-2 text-[15px] font-medium text-gray-700">
          Kartu belum diaktivasi
        </p>
        <p className="mt-1 text-xs tracking-wide text-gray-400">
          Kode kartu: <span className="font-semibold text-gray-600">{code}</span>
        </p>

        <Card className="mt-6 text-left">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nama Toko" required>
              <input
                type="text"
                value={shopName}
                onChange={(e) => onShopNameChange(e.target.value)}
                placeholder="Contoh: Warung Maju"
                className="input"
                autoComplete="organization"
              />
            </Field>

            <Field label="Link Review Google">
              <input
                type="url"
                value={reviewUrl}
                onChange={(e) => onReviewUrlChange(e.target.value)}
                placeholder="https://g.page/r/..."
                className="input"
              />
            </Field>

            <Field label="Nomor WhatsApp">
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => onWhatsappChange(e.target.value)}
                placeholder="08123456789"
                className="input"
                autoComplete="tel"
              />
            </Field>

            {error && (
              <p className="text-[13px] leading-relaxed text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl bg-black py-3.5 text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? 'MENGAKTIFKAN…' : 'AKTIFKAN KARTU'}
            </button>
          </form>
        </Card>
      </div>
    </PageShell>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-gray-600">
        {label}
        {required && <span className="text-gray-400"> *</span>}
      </span>
      {children}
    </label>
  )
}

function BusinessCardView({
  code,
  shopName,
  reviewUrl,
  whatsapp,
}: {
  code: string
  shopName: string
  reviewUrl: string
  whatsapp: string
}) {
  const [rating, setRating] = useState<number | null>(null)
  const displayName = shopName || code

  let content: ReactNode
  if (rating === null) {
    content = <RatingPrompt shopName={displayName} onRate={setRating} />
  } else if (rating >= POSITIVE_RATING_THRESHOLD) {
    content = <ReviewRedirect reviewUrl={reviewUrl} />
  } else {
    content = (
      <FeedbackView
        shopName={displayName}
        whatsapp={whatsapp}
        rating={rating}
        onChangeRating={() => setRating(null)}
      />
    )
  }

  return (
    <PageShell>
      <div className="fade-in text-center" key={rating ?? 'prompt'}>
        <div className="mb-2">
          <Wordmark className="text-2xl" />
          <div className="mt-1 h-px w-8 bg-gray-300 mx-auto" />
        </div>
        {content}
      </div>
    </PageShell>
  )
}

function RatingPrompt({
  shopName,
  onRate,
}: {
  shopName: string
  onRate: (rating: number) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <Card className="mt-6">
      <h1 className="text-xl font-bold text-gray-900">{shopName}</h1>
      <p className="mt-2 text-[15px] font-medium text-gray-600">
        Bagaimana pengalaman Anda?
      </p>

      <div
        className="mt-6 flex items-center justify-center gap-1"
        onMouseLeave={() => setHovered(null)}
      >
        {[1, 2, 3, 4, 5].map((value) => {
          const filled = hovered !== null ? value <= hovered : false
          return (
            <button
              key={value}
              type="button"
              aria-label={`${value} bintang`}
              onClick={() => onRate(value)}
              onMouseEnter={() => setHovered(value)}
              className="flex h-14 w-14 items-center justify-center rounded-xl transition active:scale-90"
            >
              <Star
                className={`h-9 w-9 transition-colors ${
                  filled ? 'fill-black text-black' : 'fill-transparent text-gray-300'
                }`}
                strokeWidth={1.5}
              />
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function ReviewRedirect({ reviewUrl }: { reviewUrl: string }) {
  useEffect(() => {
    if (!reviewUrl) return
    const timer = setTimeout(() => {
      window.location.href = reviewUrl
    }, 500)
    return () => clearTimeout(timer)
  }, [reviewUrl])

  return (
    <Card className="mt-6">
      <p className="text-2xl">⭐️⭐️⭐️⭐️⭐️</p>
      <h1 className="mt-3 text-xl font-bold text-gray-900">Terima kasih!</h1>
      {reviewUrl ? (
        <>
          <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
            Mengalihkan ke Google Review…
          </p>
          <a
            href={reviewUrl}
            className="mt-6 block w-full rounded-xl bg-black py-3.5 text-[15px] font-semibold text-white transition active:scale-[0.98]"
          >
            Buka Google Review
          </a>
        </>
      ) : (
        <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
          Senang mendengarnya! Toko ini belum mengatur link Google Review.
        </p>
      )}
    </Card>
  )
}

function FeedbackView({
  shopName,
  whatsapp,
  rating,
  onChangeRating,
}: {
  shopName: string
  whatsapp: string
  rating: number
  onChangeRating: () => void
}) {
  const message = `Halo ${shopName}, saya ingin memberikan masukan (rating ${rating}/5 bintang) agar pelayanan bisa lebih baik lagi.`

  return (
    <Card className="mt-6">
      <p className="text-lg tracking-wide text-gray-800" aria-label={`${rating} dari 5 bintang`}>
        {'★'.repeat(rating)}
        <span className="text-gray-300">{'★'.repeat(5 - rating)}</span>
      </p>
      <h1 className="mt-3 text-xl font-bold text-gray-900">
        Maaf pengalaman Anda kurang memuaskan
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
        Ceritakan langsung ke {shopName} lewat WhatsApp supaya bisa segera diperbaiki.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {whatsapp ? (
          <a
            href={whatsappLink(whatsapp, message)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3.5 text-[15px] font-semibold text-white transition active:scale-[0.98]"
          >
            Sampaikan Masukan via WhatsApp
          </a>
        ) : (
          <p className="text-[13px] leading-relaxed text-gray-400">
            Toko ini belum mengatur nomor WhatsApp untuk menerima masukan.
          </p>
        )}
        <button
          type="button"
          onClick={onChangeRating}
          className="text-[13px] text-gray-400 underline-offset-4 transition hover:underline"
        >
          Ubah rating
        </button>
      </div>
    </Card>
  )
}
