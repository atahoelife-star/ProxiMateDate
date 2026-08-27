import type { ReactNode } from 'react'

type PageShellProps = {
  kicker?: string
  title: string
  children: ReactNode
}

export function PageShell({ kicker, title, children }: PageShellProps) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {kicker && <div className="text-[#C9A962] text-sm tracking-[3px] mb-3">{kicker}</div>}
      <h1 className="text-[#F8F4ED] mb-8">{title}</h1>
      <div className="space-y-5 text-[#EDE4D9]/90 leading-relaxed">{children}</div>
    </div>
  )
}
