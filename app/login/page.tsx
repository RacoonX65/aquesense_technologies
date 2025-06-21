"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Droplets, Shield, BarChart3, Zap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { PublicHeader } from "@/components/public-header"
import { Footer } from "@/components/footer"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { signIn, isLoading, session } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect")

  // Redirect if already authenticated
  useEffect(() => {
    if (session) {
      if (redirectPath) {
        router.push(redirectPath)
      } else {
        router.push("/dashboard")
      }
    }
  }, [session, router, redirectPath])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const { error } = await signIn(email, password, redirectPath || undefined)
      if (error) {
        setError(error.message)
      }
    } catch (err: any) {
      setError("An error occurred during login")
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-gray-950">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Column - Welcome Card */}
          <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-800 shadow-xl">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Droplets className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome Back!
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                Access your water quality monitoring dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <Shield className="h-6 w-6 text-blue-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Secure Access</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Protected authentication system</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                  <BarChart3 className="h-6 w-6 text-green-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Real-time Data</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Live sensor monitoring and analytics</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  <Zap className="h-6 w-6 text-purple-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Smart Insights</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered water quality analysis</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Login Form */}
          <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-800 shadow-xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sign In</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4 backdrop-blur-md bg-red-50/50 dark:bg-red-950/50">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                        Password
                      </Label>
                      <Link href="/forgot-password">
                        <Button variant="link" className="text-xs text-blue-500 dark:text-blue-400 p-0 h-auto">
                          Forgot password?
                        </Button>
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p className="w-full">
                Don't have an account?{" "}
                <Link href="/signup" className="text-blue-500 hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}
