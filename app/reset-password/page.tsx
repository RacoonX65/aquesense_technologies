"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Droplets } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { PublicHeader } from "@/components/public-header"
import { Footer } from "@/components/footer"
import { useAuth } from "@/lib/auth-context"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { updatePassword, session } = useAuth()
  const router = useRouter()

  // Check if user is authenticated via the reset link
  useEffect(() => {
    if (!session) {
      // If no session, the user might not have clicked the reset link
      setError("Invalid or expired password reset link. Please try again.")
    }
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validate inputs
    if (!password || !confirmPassword) {
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
      const { error } = await updatePassword(password)

      if (error) {
        setError(error.message)
      } else {
        setSuccess("Password has been reset successfully")
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-gray-950">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-800 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Droplets className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
            <CardDescription>Create a new password for your account</CardDescription>
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
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="backdrop-blur-md bg-white/40 dark:bg-gray-800/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="backdrop-blur-md bg-white/40 dark:bg-gray-800/40"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80"
                  disabled={isLoading || !session}
                >
                  {isLoading ? "Updating..." : "Reset Password"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p className="w-full">
              Remember your password?{" "}
              <Link href="/login" className="text-blue-500 hover:underline">
                Back to login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
