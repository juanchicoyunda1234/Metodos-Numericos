function BrandMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="5" fill="var(--color-accent)" />
      <path
        d="M9 24V8h2.55L21.4 19.7V8H24v16h-2.55L12.15 12.3V24H9z"
        fill="var(--color-on-accent)"
      />
    </svg>
  )
}

export { BrandMark }
