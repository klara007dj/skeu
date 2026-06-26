import type { Metadata } from 'next'
import './globals.css'
import ReferralCapture from '@/components/ReferralCapture'

export const metadata: Metadata = {
  title: 'skeu - Your Skin, Your Glow',
  description: 'Cosmetiques premium pour sublimer votre peau. Livraison rapide au Cameroun.',
  keywords: 'cosmetiques, skincare, beaute, Cameroun, FCFA',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: ['/favicon.svg'],
    apple: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    other: [{ rel: 'mask-icon', url: '/favicon.svg', color: '#4C1D95' }],
  },
  openGraph: {
    title: 'skeu - Your Skin, Your Glow',
    description: 'Cosmetiques premium pour sublimer votre peau.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <ReferralCapture />
        {children}
      </body>
    </html>
  )
}
