import './globals.css'
import type { Metadata } from 'next'
import { Header } from '@/components/Header'

export const metadata: Metadata = {
  title: 'AI Judge Ghana',
  description: 'Virtual courtroom following Ghanaian court procedures',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Header />
          {children}
        </div>
      </body>
    </html>
  )
}


