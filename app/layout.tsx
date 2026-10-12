import React, { Suspense } from 'react'
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import TopHeader from '@/components/TopHeader'
import AdminLockGate from '@/components/AdminLockGate'
import { ThemeProvider } from '@/components/ThemeProvider'
import { DataProvider } from '@/context/DataContext'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'LeadGen CRM — AI Outreach Engine',
  description: 'Autonomous B2B Lead Gen & AI WhatsApp Outreach CRM',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 font-sans selection:bg-indigo-500/20 selection:text-indigo-600">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <DataProvider>
            <AdminLockGate />
            <Suspense fallback={null}>
              <Sidebar />
            </Suspense>
            <div className="flex-1 lg:pl-64 min-h-screen flex flex-col bg-[var(--background)] w-full transition-colors duration-300">
              <TopHeader />
              <main className="flex-1 w-full">
                {children}
              </main>
            </div>
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
