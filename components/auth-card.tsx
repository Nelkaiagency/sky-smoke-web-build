import type { ReactNode } from 'react'
import Link from 'next/link'
import { Cloud } from 'lucide-react'

export function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(77,220,255,0.2),_transparent_40%),linear-gradient(135deg,_#04070d_0%,_#090d16_55%,_#03050a_100%)] px-4 py-10 text-zinc-100">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-slate-950 shadow-lg shadow-cyan-500/20">
            <Cloud className="size-5" aria-hidden />
          </span>
          <span className="font-display text-base font-bold tracking-tight text-white">
            Sky Smoke <span className="text-cyan-300">1</span>
          </span>
        </Link>

        <div className="rounded-[2rem] border border-white/10 bg-black/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur sm:p-8">
          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200">
            {eyebrow}
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-zinc-400">{subtitle}</p> : null}

          <div className="mt-6">{children}</div>
        </div>

        {footer ? <p className="mt-6 text-center text-sm text-zinc-400">{footer}</p> : null}
      </div>
    </main>
  )
}

export function AuthField({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor={props.id}>
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-400/40 focus:outline-none"
      />
    </div>
  )
}

export function AuthSubmitButton({ children, pending }: { children: ReactNode; pending?: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Please wait…' : children}
    </button>
  )
}

export function AuthError({ message }: { message: string }) {
  return <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{message}</div>
}

export function AuthSuccess({ message }: { message: string }) {
  return <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</div>
}
