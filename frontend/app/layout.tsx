import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Spacebar Game',
  description: 'Real-time spacebar tapping game',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
