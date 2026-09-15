import { Link, createFileRoute } from '@tanstack/react-router'
import { Wordmark } from '@/components/Wordmark'
import { Card, PageShell } from '@/components/PageShell'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <PageShell>
      <div className="text-center">
        <Wordmark className="text-3xl" />
        <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
          QR pintar untuk bisnis kamu.
        </p>

        <Card className="mt-8 text-left">
          <p className="text-sm leading-relaxed text-gray-600">
            Setiap kartu BINTANGIN punya QR permanen. Pelanggan cukup scan
            sekali untuk memberi review atau mengirim WhatsApp — tanpa
            aplikasi, tanpa ribet.
          </p>

          <Link
            to="/q/$code"
            params={{ code: 'BGN0002' }}
            className="mt-6 block w-full rounded-xl bg-black py-3.5 text-center text-[15px] font-semibold text-white transition active:scale-[0.98]"
          >
            AKTIVASI KARTU
          </Link>

          <p className="mt-3 text-center text-xs text-gray-400">
            Sudah punya kartu? Pindai kode QR di kartu kamu untuk membuka
            halaman aktivasi.
          </p>
        </Card>

        <Link
          to="/admin"
          className="mt-8 inline-block text-xs text-gray-400 underline-offset-4 hover:underline"
        >
          Admin
        </Link>
      </div>
    </PageShell>
  )
}
