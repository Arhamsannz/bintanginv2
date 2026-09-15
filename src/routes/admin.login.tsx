import { useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { adminLogin, checkAdminSession } from '@/server/auth.functions'
import { Card, PageShell } from '@/components/PageShell'
import { Wordmark } from '@/components/Wordmark'

export const Route = createFileRoute('/admin/login')({
  component: AdminLoginPage,
  // Already logged in? Skip straight to the dashboard instead of showing
  // the form again.
  beforeLoad: async () => {
    const { authenticated } = await checkAdminSession()
    if (authenticated) {
      throw redirect({ to: '/admin' })
    }
  },
})

function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await adminLogin({ data: { password } })
      // Re-run beforeLoad/loader across the app so /admin's guard sees the
      // fresh session cookie, then land on the dashboard.
      await router.invalidate()
      await router.navigate({ to: '/admin' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal login.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell>
      <div className="text-center">
        <Wordmark className="text-2xl" />
        <p className="mt-2 text-[15px] font-medium text-gray-700">Login Admin</p>

        <Card className="mt-6 text-left">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-gray-600">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                autoFocus
                autoComplete="current-password"
              />
            </label>

            {error && (
              <p className="text-[13px] leading-relaxed text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !password}
              className="mt-2 w-full rounded-xl bg-black py-3.5 text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? 'MASUK…' : 'MASUK'}
            </button>
          </form>
        </Card>
      </div>
    </PageShell>
  )
}
