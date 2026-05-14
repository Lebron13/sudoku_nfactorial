import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import RadioPlayer from '@/components/RadioPlayer'
import SeniorMode from '@/components/SeniorMode'
import { LangProvider } from '@/lib/i18n'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', weight: ['400'], style: ['normal', 'italic'] })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm', weight: ['300', '400'] })

export const metadata: Metadata = {
  title: 'ZenSudoku ✦ The sudoku experience, reimagined',
  description: 'Premium web Sudoku with AI coaching, daily mosaic challenges, and global leaderboards.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'ZenSudoku ✦',
    description: 'Premium web Sudoku with AI coaching and daily mosaic challenges.',
    url: 'https://leronti.site',
    siteName: 'ZenSudoku',
    images: [{ url: '/icon.svg' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZenSudoku ✦',
    description: 'Premium web Sudoku with AI coaching and daily mosaic challenges.',
    images: ['/icon.svg'],
  },
}
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('zen_theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`
          }}
        />
      </head>
      <body className={`${playfair.variable} ${dmSans.variable}`} style={{ margin: 0, padding: 0 }}>
        <LangProvider>
          {children}
          <RadioPlayer />
          <SeniorMode />
        </LangProvider>
      </body>
    </html>
  )
}
