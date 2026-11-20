export default function Logo({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
      <path
        d="M32 5c-8.4 10.6-14.8 19.4-14.8 28a14.8 14.8 0 0 0 29.6 0C46.8 24.4 40.4 15.6 32 5z"
        fill="var(--brand-solid)"
      />
      <circle cx="32" cy="35.5" r="5.2" fill="var(--bg)" />
    </svg>
  )
}
