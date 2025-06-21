import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/lib/auth-context"
import FloatingAIAvatar from "@/components/floating-ai-avatar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Water Quality Dashboard by RaccoonX65",
  description: "Advanced water quality monitoring with real-time sensor data and AI-powered insights",
  author: "RaccoonX65"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster />
            {/* Floating AI Avatar - Available globally for logged-in users */}
            <FloatingAIAvatar />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
