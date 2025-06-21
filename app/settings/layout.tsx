"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Settings, Key, Globe, Database } from "lucide-react"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navItems = [
    {
      title: "General",
      href: "/settings",
      icon: <Settings className="mr-2 h-4 w-4" />,
    },
    {
      title: "Environment Variables",
      href: "/settings/environment",
      icon: <Key className="mr-2 h-4 w-4" />,
    },
    {
      title: "Domains",
      href: "/settings/domains",
      icon: <Globe className="mr-2 h-4 w-4" />,
    },
    {
      title: "Integrations",
      href: "/settings/integrations",
      icon: <Database className="mr-2 h-4 w-4" />,
    },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <Header />
        <div className="container px-4 py-6 mx-auto flex-1">
          <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
            <aside className="lg:w-1/5">
              <div className="space-y-4">
                <div className="px-3 py-2">
                  <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Settings</h2>
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                          pathname === item.href
                            ? "bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-50"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
            <div className="flex-1 lg:max-w-4xl">
              <div className="space-y-6">{children}</div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
