"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase, getUserProfile, logUserAction } from "./supabase"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"

type UserProfile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string
}

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAdmin: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signIn: (email: string, password: string, redirectPath?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setProfile(null)
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function fetchUserProfile(userId: string) {
    if (!userId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn("Supabase credentials missing. Using mock profile.")
        setProfile({
          id: userId,
          full_name: "Demo User",
          avatar_url: null,
          role: "user",
        })
        setIsLoading(false)
        return
      }

      // Try to get user profile from Supabase
      const userProfile = await getUserProfile(userId)

      if (userProfile) {
        setProfile(userProfile)
      } else {
        // Create a basic profile from auth user data if no profile exists
        const { data: authUser } = await supabase.auth.getUser()
        const fallbackProfile = {
          id: userId,
          full_name: authUser.user?.user_metadata?.full_name || authUser.user?.email?.split("@")[0] || "User",
          avatar_url: authUser.user?.user_metadata?.avatar_url || null,
          role: "user",
        }
        setProfile(fallbackProfile)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      // Fallback profile
      setProfile({
        id: userId,
        full_name: "User",
        avatar_url: null,
        role: "user",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (!error && data.user) {
        // Log the signup action
        try {
          await logUserAction(data.user.id, "sign_up")
        } catch (logError) {
          console.warn("Could not log signup action:", logError)
        }
      }

      return { error }
    } catch (error: any) {
      console.error("Error during sign up:", error)
      return { error }
    }
  }

  const signIn = async (email: string, password: string, redirectPath?: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error && data.user) {
        // Log the signin action
        try {
          await logUserAction(data.user.id, "sign_in")
        } catch (logError) {
          console.warn("Could not log signin action:", logError)
        }

        // Handle redirect if provided
        if (redirectPath) {
          router.push(redirectPath)
        } else {
          router.push("/dashboard")
        }
      }

      return { error }
    } catch (error: any) {
      console.error("Error during sign in:", error)
      return { error }
    }
  }

  const signOut = async () => {
    if (user) {
      try {
        await logUserAction(user.id, "sign_out")
      } catch (error) {
        console.warn("Could not log signout action:", error)
      }
    }

    try {
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      setProfile(null)
      router.push("/")
    } catch (error) {
      console.error("Error during sign out:", error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error }
    } catch (error: any) {
      console.error("Error during password reset:", error)
      return { error }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (!error && user) {
        try {
          await logUserAction(user.id, "password_reset")
        } catch (logError) {
          console.warn("Could not log password reset action:", logError)
        }
      }

      return { error }
    } catch (error: any) {
      console.error("Error updating password:", error)
      return { error }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        isAdmin: profile?.role === "admin",
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
