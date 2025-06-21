"use client"

import type React from "react"
import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/protected-route"
import { Footer } from "@/components/footer"
import FloatingAIAvatar from "@/components/floating-ai-avatar"
import { Suspense } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      }
    >
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
          <Header />
          <main className="container px-4 py-6 mx-auto flex-1">{children}</main>
          <Footer />
          <FloatingAIAvatar />
        </div>
      </ProtectedRoute>
    </Suspense>
  )
}
