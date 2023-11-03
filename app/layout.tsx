import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import NavBar from "@/components/layout/navbar";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Brisualizer',
  description: 'Bridge Visualizer - See details of all the deposits and withdraws happening between Mainnet and Optimism chain',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <NavBar />

      <main className="flex min-h-screen w-full flex-col items-center justify-center py-32">
        {children}
      </main>
      </body>
    </html>
  )
}
