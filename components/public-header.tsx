"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./theme-toggle"
import { Droplets, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useState, useEffect, useRef } from "react"

export function PublicHeader() {
  const pathname = usePathname()
  const { session, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [mobileMenuOpen])

  // Helper function to determine if a link is active
  const isLinkActive = (path: string) => {
    if (path === "/" && pathname === "/") {
      return true
    }
    if (path === "/" && pathname !== "/") {
      return false
    }
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <header className="sticky top-0 z-10 w-full backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Droplets className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
            <span className="hidden sm:inline">Water Quality Dashboard by RaccoonX65</span>
            <span className="sm:hidden">WQ Dashboard</span>
          </h1>
        </Link>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-[55] md:hidden flex items-start justify-end pt-20 pr-4"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              ref={mobileMenuRef}
              className="w-[280px] bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Navigation links */}
              <nav className="p-2">
                <div className="space-y-1">
                  <Link
                    href="/"
                    className={`flex items-center text-sm font-medium transition-colors px-3 py-2 rounded-md ${
                      isLinkActive("/")
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    href="/about"
                    className={`flex items-center text-sm font-medium transition-colors px-3 py-2 rounded-md ${
                      isLinkActive("/about")
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    href="/dashboard"
                    className={`flex items-center text-sm font-medium transition-colors px-3 py-2 rounded-md ${
                      isLinkActive("/dashboard")
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </div>

                <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-2 px-3 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Theme</span>
                  <ThemeToggle />
                </div>

                <div className="mt-2 px-2">
                  {session ? (
                    <Link
                      href="/dashboard"
                      className="flex items-center justify-center text-sm font-medium bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Go to Dashboard
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center justify-center text-sm font-medium bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                  )}
                </div>
              </nav>
            </div>
          </div>
        )}

        <div className="hidden md:flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                isLinkActive("/") ? "text-blue-600 dark:text-blue-400" : "hover:text-blue-500"
              }`}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`text-sm font-medium transition-colors ${
                isLinkActive("/about") ? "text-blue-600 dark:text-blue-400" : "hover:text-blue-500"
              }`}
            >
              About
            </Link>
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors ${
                isLinkActive("/dashboard") ? "text-blue-600 dark:text-blue-400" : "hover:text-blue-500"
              }`}
            >
              Dashboard
            </Link>
          </nav>
          <ThemeToggle />
          {session ? (
            <Link href="/dashboard">
              <Button className="backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80 text-white">Dashboard</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button className="backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80 text-white">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
