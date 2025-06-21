"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode
  adminOnly?: boolean
}) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { session, isLoading, isAdmin } = useAuth()

  // Check if Supabase is configured
  const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Safely access auth context only after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Use a separate effect for the auth check - but don't block rendering
  useEffect(() => {
    // Skip auth check if Supabase is not configured
    if (!isSupabaseConfigured) return

    if (mounted && !isLoading) {
      if (!session) {
        // Redirect to login with current path as redirect parameter (but don't block)
        setTimeout(() => {
          const currentPath = window.location.pathname
          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
        }, 100)
        return
      }

      if (adminOnly && !isAdmin) {
        // Redirect to dashboard if user is not admin (but don't block)
        setTimeout(() => {
          router.push("/dashboard")
        }, 100)
        return
      }
    }
  }, [mounted, router, session, isLoading, isSupabaseConfigured, adminOnly, isAdmin])

  // Always render children immediately - no loading states
  if (!mounted) {
    // Even during mount, show the content
    return <>{children}</>
  }

  // If Supabase is not configured, allow access without authentication
  if (!isSupabaseConfigured) {
    return <>{children}</>
  }

  // Always render children - auth happens in background
  return <>{children}</>
}
