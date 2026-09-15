export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-semibold text-black ${className}`}
      style={{ letterSpacing: '0.12em', fontWeight: 600 }}
    >
      BINTANGIN
    </span>
  )
}
