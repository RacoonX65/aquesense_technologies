"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Droplets,
  BarChart2,
  Info,
  ArrowRight,
  User,
  LogOut,
  Shield,
  LineChart,
  AlertTriangle,
  CheckCircle,
  Menu,
  X,
  Bot,
  Sparkles,
  MessageCircle,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useRef, useEffect } from "react"
import FloatingAIAvatar from "@/components/floating-ai-avatar"

export default function WelcomePage() {
  const { session, user, profile, signOut, isAdmin } = useAuth()

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-gray-950">
      {/* Floating AI Avatar - Only shows when logged in */}
      <FloatingAIAvatar />

      {/* Header */}
      <header className="sticky top-0 z-10 w-full backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <Droplets className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">Water Quality Dashboard by RaccoonX65</h1>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium hover:text-blue-500 transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-sm font-medium hover:text-blue-500 transition-colors">
                About
              </Link>
              <Link href="/dashboard" className="text-sm font-medium hover:text-blue-500 transition-colors">
                Dashboard
              </Link>
              <Link href="/meet-team" className="text-sm font-medium hover:text-blue-500 transition-colors">
                Our Team
              </Link>
            </nav>
            <ThemeToggle />
            {session ? (
              <>
                <div className="md:block hidden">
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
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                          {isAdmin && (
                            <div className="flex items-center mt-1">
                              <Shield className="h-3 w-3 text-blue-500 mr-1" />
                              <span className="text-xs text-blue-500">Admin</span>
                            </div>
                          )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">
                          <BarChart2 className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
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
                </div>
                <div className="md:hidden block">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden md:block">
                  <Button className="backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80 text-white">Login</Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden rounded-full"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

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
            {/* User info section if logged in */}
            {session && user && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{profile?.full_name || "User"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation links */}
            <nav className="p-2">
              <div className="space-y-1">
                <Link
                  href="/"
                  className="flex items-center text-sm font-medium transition-colors px-3 py-2 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/about"
                  className="flex items-center text-sm font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center text-sm font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/meet-team"
                  className="flex items-center text-sm font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Our Team
                </Link>
                <Link
                  href="/dashboard/predictions"
                  className="flex items-center text-sm font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Predictions
                </Link>
              </div>

              <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-2 px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-medium">Theme</span>
                <ThemeToggle />
              </div>

              <div className="mt-2 px-2">
                {session ? (
                  <Button
                    onClick={signOut}
                    variant="ghost"
                    className="w-full justify-start text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-300"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </Button>
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

      {/* Hero Section */}
      <section className="container px-4 py-20 mx-auto">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300 rounded-full">
              Water Quality Monitoring Project
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              Real-time water quality monitoring system
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              AqueSense is a comprehensive water quality monitoring system featuring real-time data analysis, anomaly
              detection, and classification to monitor water quality parameters.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/about">
                <Button variant="outline" className="gap-2 backdrop-blur-md bg-white/40 dark:bg-gray-900/40">
                  <Info className="w-4 h-4" />
                  Project Details
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button className="gap-2 backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80 text-white">
                  <BarChart2 className="w-4 h-4" />
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative h-[400px] rounded-xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-600/20 backdrop-blur-sm glass"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Droplets className="w-32 h-32 text-blue-500/80" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-16 mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Key Features</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Real-time Monitoring",
              description:
                "Monitors critical water quality parameters in real-time using sensor technology and data visualization.",
              icon: <BarChart2 className="w-10 h-10 text-blue-500" />,
            },
            {
              title: "AI-Powered Predictions",
              description:
                "Advanced TensorFlow.js neural networks running in your browser. Our LSTM models analyze temporal patterns to forecast water quality up to 72 hours ahead.",
              icon: <LineChart className="w-10 h-10 text-purple-500" />,
              highlight: true,
            },
            {
              title: "AI Assistant",
              description:
                "Personal AI assistant that analyzes your real-time sensor data and answers questions about water quality parameters. Available 24/7 for logged-in users.",
              icon: <Bot className="w-10 h-10 text-green-500" />,
              highlight: true,
              aiFeature: true,
            },
            {
              title: "Anomaly Detection",
              description:
                "Utilizes statistical methods to automatically detect unusual patterns and potential issues in water quality data.",
              icon: <AlertTriangle className="w-10 h-10 text-orange-500" />,
            },
          ].map((feature, index) => (
            <div
              key={index}
              className={`p-6 rounded-xl backdrop-blur-md relative ${
                feature.highlight
                  ? feature.aiFeature
                    ? "bg-green-50/70 dark:bg-green-900/40 border border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    : "bg-purple-50/70 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  : "bg-white/40 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all"
              }`}
            >
              {feature.aiFeature && (
                <div className="absolute -top-2 -right-2">
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    NEW
                  </div>
                </div>
              )}
              <div
                className={`p-3 mb-4 rounded-full w-fit ${
                  feature.highlight
                    ? feature.aiFeature
                      ? "bg-green-100 dark:bg-green-900/50"
                      : "bg-purple-100 dark:bg-purple-900/50"
                    : "bg-blue-100 dark:bg-blue-900/50"
                }`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              {feature.aiFeature && (
                <div className="mt-4">
                  {session ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Available - Click the floating AI avatar!</span>
                    </div>
                  ) : (
                    <Link href="/login">
                      <Button
                        variant="outline"
                        className="gap-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/50"
                      >
                        <Bot className="w-4 h-4" />
                        Login to Access AI
                      </Button>
                    </Link>
                  )}
                </div>
              )}
              {feature.highlight && !feature.aiFeature && (
                <div className="mt-4">
                  <Link href="/dashboard/predictions">
                    <Button
                      variant="outline"
                      className="gap-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/50"
                    >
                      <LineChart className="w-4 h-4" />
                      View Predictions
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/meet-team">
            <Button className="gap-2 backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80 text-white">
              Meet Our Team
            </Button>
          </Link>
        </div>
      </section>

      {/* AI Assistant Showcase Section */}
      <section className="container px-4 py-16 mx-auto">
        <div className="p-8 rounded-xl backdrop-blur-md bg-gradient-to-r from-green-500/10 to-blue-500/10 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 shadow-lg">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <div className="inline-block px-3 py-1 text-sm font-medium text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300 rounded-full mb-4 flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                NEW: AI Assistant Feature
              </div>
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Your Personal Water Quality AI Assistant
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Meet your intelligent water quality companion! Our AI assistant analyzes your real-time sensor data and
                provides instant, personalized insights about your water quality parameters. Available 24/7 through the
                floating avatar when you're logged in.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Real-time analysis of your sensor readings",
                  "Natural language explanations of water quality parameters",
                  "Personalized safety recommendations",
                  "Instant responses to your water quality questions",
                  "Contextual insights based on your specific data",
                  "Available through convenient floating avatar interface",
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              {session ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                  <Bot className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">AI Assistant Active!</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Look for the floating avatar in the bottom-right corner
                    </p>
                  </div>
                </div>
              ) : (
                <Link href="/login">
                  <Button size="lg" className="gap-2 backdrop-blur-md bg-green-500/80 hover:bg-green-600/80 text-white">
                    <Bot className="w-4 h-4" />
                    Login to Access AI Assistant
                  </Button>
                </Link>
              )}
            </div>
            <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-blue-600/20 backdrop-blur-sm glass"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <Bot className="w-32 h-32 text-green-500/80" />
                  <div className="absolute -top-4 -right-4">
                    <MessageCircle className="w-8 h-8 text-blue-500/80 animate-bounce" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Predictions Showcase Section */}
      <section className="container px-4 py-16 mx-auto">
        <div className="p-8 rounded-xl backdrop-blur-md bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 shadow-lg">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <div className="inline-block px-3 py-1 text-sm font-medium text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300 rounded-full mb-4">
                TensorFlow.js Machine Learning Implementation
              </div>
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Browser-Based Neural Networks for Water Quality
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Our system implements sophisticated LSTM neural networks using TensorFlow.js that run entirely in your
                browser. The models use multi-layer architectures with dropout regularization to prevent overfitting,
                analyzing historical sensor patterns to generate accurate predictions with statistical confidence
                intervals.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "LSTM Neural Networks: Specialized for time-series water quality forecasting",
                  "Browser-Based Processing: No server required, complete privacy protection",
                  "Adaptive Learning: Models improve accuracy with more training data",
                  "Confidence Intervals: Statistical uncertainty quantification for predictions",
                  "Real-time Updates: Automatic model retraining with new sensor data",
                  "Multi-Parameter Support: Individual models for pH, temperature, TDS, conductivity, and turbidity",
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href={session ? "/dashboard/predictions" : "/login?redirect=/dashboard/predictions"}>
                <Button size="lg" className="gap-2 backdrop-blur-md bg-purple-500/80 hover:bg-purple-600/80 text-white">
                  <LineChart className="w-4 h-4" />
                  Explore Predictions
                </Button>
              </Link>
            </div>
            <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-blue-600/20 backdrop-blur-sm glass"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <LineChart className="w-32 h-32 text-purple-500/80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16 mx-auto">
        <div className="p-8 rounded-xl backdrop-blur-md bg-blue-500/10 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 shadow-lg text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Explore our water quality monitoring system
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Access the dashboard to view the monitoring interface and explore the features we've implemented.
          </p>
          {session ? (
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80 text-white">
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="lg" className="gap-2 backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80 text-white">
                View Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
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
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Water Quality Dashboard by RaccoonX65. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
