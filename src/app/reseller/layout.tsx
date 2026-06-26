import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Espace revendeur - skeu',
  robots: 'noindex,nofollow',
}

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
