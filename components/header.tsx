"use client"

import { ThemeToggle } from "./theme-toggle"
import { Droplets, LogOut, User, Shield, Menu, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const { user, profile, signOut } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Simplified admin check to avoid circular dependency
  const isAdmin = profile?.role === "admin"

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

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
    <header className="sticky top-0 z-[60] w-full backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        <Link href="/" className="flex items-center gap-2 z-10">
          <Droplets className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
            <span className="hidden sm:inline">Water Quality Dashboard by RaccoonX65</span>
            <span className="sm:hidden">WQ Dashboard</span>
          </h1>
        </Link>

        {/* Mobile menu button */}
        <button
          className="md:hidden z-50"
          onClick={toggleMobileMenu}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          ) : (
            <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          )}
        </button>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-[55] md:hidden flex items-start justify-end pt-20 pr-4"
            onClick={toggleMobileMenu}
          >
            <div
              ref={mobileMenuRef}
              className="w-[280px] bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* User info section if logged in */}
              {user && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{profile?.full_name || "User"}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <ThemeToggle />
                  </div>
                </div>
              )}

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
                  <Link
                    href="/dashboard/predictions"
                    className={`flex items-center text-sm font-medium transition-colors px-3 py-2 rounded-md ${
                      isLinkActive("/dashboard/predictions")
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Predictions
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className={`flex items-center text-sm font-medium transition-colors px-3 py-2 rounded-md ${
                        isLinkActive("/admin")
                          ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                </div>

                {/* Only show theme toggle if user is not logged in */}
                {!user && (
                  <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-2 px-3 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Theme</span>
                    <ThemeToggle />
                  </div>
                )}

                {/* Logout button if user is logged in */}
                {user && (
                  <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-2">
                    <Button
                      onClick={signOut}
                      variant="ghost"
                      className="w-full justify-start text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-300"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </Button>
                  </div>
                )}
              </nav>
            </div>
          </div>
        )}

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-4">
          <nav className="flex items-center gap-6">
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
            <Link
              href="/dashboard/predictions"
              className={`text-sm font-medium transition-colors ${
                isLinkActive("/dashboard/predictions") ? "text-blue-600 dark:text-blue-400" : "hover:text-blue-500"
              }`}
            >
              Predictions
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className={`text-sm font-medium transition-colors ${
                  isLinkActive("/admin") ? "text-blue-600 dark:text-blue-400" : "hover:text-blue-500"
                }`}
              >
                Admin
              </Link>
            )}
          </nav>
          <ThemeToggle />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    {isAdmin && (
                      <div className="flex items-center mt-1">
                        <Shield className="h-3 w-3 text-blue-500 mr-1" />
                        <span className="text-xs text-blue-500">Admin</span>
                      </div>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={signOut} className="text-red-500 dark:text-red-400 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
