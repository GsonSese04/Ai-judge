import './globals.css'
import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { ModalProvider } from '@/components/ModalProvider'

export const metadata: Metadata = {
  title: 'AI Judge Ghana',
  description: 'Virtual courtroom following Ghanaian court procedures',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <ModalProvider>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 relative">
            <Header />
            {children}
          </div>
        </ModalProvider>
      </body>
    </html>
  )
}


