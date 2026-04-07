import type { PropsWithChildren, ReactNode } from 'react'

interface AuthShellProps extends PropsWithChildren {
  eyebrow: string
  title: string
  description: string
  footer?: ReactNode
}

export function AuthShell({ eyebrow, title, description, footer, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(255,107,74,0.18),_transparent_30%)]" />
      <div className="w-full max-w-md rounded-[28px] border border-white/50 bg-white/90 p-8 shadow-[0_24px_80px_rgba(30,58,138,0.18)] backdrop-blur">
        <div className="mb-8 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-secondary-500">{eyebrow}</p>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </div>
        {children}
        {footer ? <div className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-600">{footer}</div> : null}
      </div>
    </div>
  )
}
