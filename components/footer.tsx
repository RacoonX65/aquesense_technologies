import Link from "next/link"
import { Droplets } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 backdrop-blur-md bg-white/70 dark:bg-gray-900/70">
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Droplets className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">Water Quality Dashboard by RaccoonX65</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors">
              Home
            </Link>
            <Link
              href="/about"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
            >
              About
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/meet-team"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
            >
              Our Team
            </Link>
          </div>
        </div>
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Water Quality Dashboard by RaccoonX65. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
