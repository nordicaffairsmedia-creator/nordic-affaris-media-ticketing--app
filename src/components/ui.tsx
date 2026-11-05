import type { ReactNode } from 'react'

export function Icon({ name, className = '', fill = false }: { name: string; className?: string; fill?: boolean }) {
  return (
    <span className={`material-symbols-outlined ${fill ? 'fill' : ''} ${className}`} aria-hidden="true">
      {name}
    </span>
  )
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-on-surface-variant" role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-container-highest border-t-primary" />
      <span className="font-body-sm text-body-sm">{label}</span>
    </div>
  )
}

export function Notice({
  icon = 'info',
  title,
  children,
  action,
}: {
  icon?: string
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mx-gutter my-space-lg flex flex-col items-center gap-2 rounded-xl bg-surface-container p-space-lg text-center">
      <Icon name={icon} className="text-[32px] text-primary" />
      <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
      {children ? <div className="font-body-sm text-body-sm text-on-surface-variant">{children}</div> : null}
      {action}
    </div>
  )
}

export function GoldButton({
  children,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-secondary to-primary px-6 font-label-lg text-label-lg font-bold text-on-primary shadow-lg shadow-primary/20 transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

/** Poster image with a tasteful fallback when the event has no picture (or it fails to load). */
export function Poster({ src, title, className = '' }: { src: string | null; title: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-surface-container-high ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-container-highest via-surface-container to-surface-container-lowest p-6 text-center">
        <span className="font-headline-md text-headline-md text-primary/60 line-clamp-2">{title}</span>
      </div>
      {src ? (
        <>
          {/* soft blurred copy fills the frame, the sharp picture sits on top uncropped */}
          <img
            src={src}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-2xl"
            onError={(ev) => {
              ev.currentTarget.style.display = 'none'
            }}
          />
          <img
            src={src}
            alt={title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain"
            onError={(ev) => {
              ev.currentTarget.style.display = 'none'
            }}
          />
        </>
      ) : null}
    </div>
  )
}

export function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 rounded-lg px-3.5 py-1.5 font-label-md text-label-md transition-all ${
        active
          ? 'bg-primary text-on-primary shadow-[0_2px_12px_rgba(242,202,80,0.25)]'
          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
      }`}
    >
      {children}
    </button>
  )
}
