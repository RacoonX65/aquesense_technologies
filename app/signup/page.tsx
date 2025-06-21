"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Droplets, Users, Zap, Shield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { PublicHeader } from "@/components/public-header"
import { Footer } from "@/components/footer"

export default function SignUpPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validate inputs
    if (!fullName || !email || !password) {
      setError("All fields are required")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await signUp(email, password, fullName)

      if (error) {
        setError(error.message)
      } else {
        setSuccess(
          "Registration successful! Please check your email to confirm your account. You will be redirected to our main site after confirmation.",
        )
        // Clear form
        setFullName("")
        setEmail("")
        setPassword("")
        setConfirmPassword("")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during registration")
    } finally {
      setIsLoading(false)
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
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Join Water Quality Dashboard by RaccoonX65!
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                Start monitoring water quality with our advanced IoT platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                  <Droplets className="h-6 w-6 text-green-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Water Quality Monitoring</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Real-time pH, TDS, temperature tracking</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <Zap className="h-6 w-6 text-blue-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Smart Analytics</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered insights and predictions</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  <Shield className="h-6 w-6 text-purple-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Secure Platform</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Enterprise-grade security and privacy</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Signup Form */}
          <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-800 shadow-xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Account</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Enter your information to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4 backdrop-blur-md bg-red-50/50 dark:bg-red-950/50">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="mb-4 backdrop-blur-md bg-green-50/50 dark:bg-green-950/50">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-700 dark:text-gray-300">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border-gray-300 dark:border-gray-600"
                    />
                  </div>
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
                    <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                      Password
                    </Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Sign Up"}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p className="w-full">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-500 hover:underline font-medium">
                  Sign in
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
