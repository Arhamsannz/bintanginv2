import type { ReactNode } from 'react'

// The one layout every customer-facing BINTANGIN screen uses: a single
// column, centered both ways, capped at phone-friendly width. Per the
// product brief this is deliberately plain — no sidebars, no multi-column
// layouts — because the only device that matters here is the one someone
// just used to scan a printed QR code.
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-[380px]">{children}</div>
    </div>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}
