'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/dashboard', label: 'בית', icon: '🏠' },
  { href: '/checkout', label: 'תשלום חכם', icon: '💳' },
  { href: '/benefits', label: 'הטבות', icon: '🎁' },
  { href: '/points', label: 'נקודות', icon: '⭐' },
  { href: '/chat', label: 'עוזר AI', icon: '💬' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto max-w-lg flex items-stretch justify-between px-2 pt-2 pb-safe">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-xs ${
                active ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
