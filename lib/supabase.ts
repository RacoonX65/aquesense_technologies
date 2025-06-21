import { createClient } from "@supabase/supabase-js"
import { supabaseConfig } from "./config"

// Get values from config
const supabaseUrl = supabaseConfig.url
const supabaseAnonKey = supabaseConfig.anonKey

// Create a mock client when credentials are missing
const createMockClient = () => {
  console.warn("Supabase credentials missing. Using mock client.")

  // Return a mock client with the same interface but no-op functions
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: async () => ({ data: null, error: { message: "Mock client: Auth not available" } }),
      signInWithPassword: async () => ({ data: null, error: { message: "Mock client: Auth not available" } }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
      updateUser: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          order: () => ({ data: [], error: null }),
          limit: () => ({ data: [], error: null }),
        }),
        order: () => ({ data: [], error: null }),
        limit: () => ({ data: [], error: null }),
      }),
      insert: async () => ({ error: null }),
    }),
    rpc: async () => ({ error: null }),
  }
}

// Create a client only if credentials are available
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (createMockClient() as ReturnType<typeof createClient>)

// Create a service role client for admin operations
export const supabaseAdmin =
  supabaseConfig.serviceRoleKey && supabaseUrl
    ? createClient(supabaseUrl, supabaseConfig.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : supabase

// Get the user's profile with proper error handling
export async function getUserProfile(userId: string) {
  if (!userId) return null

  try {
    // Check if Supabase is properly configured
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase not configured. Returning mock profile.")
      return {
        id: userId,
        full_name: "Demo User",
        avatar_url: null,
        role: "user",
      }
    }

    // Try to get profile from profiles table
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.warn("Profiles table not accessible, using auth metadata:", error.message)

      // Try to get user metadata from auth
      const { data: authData } = await supabase.auth.getUser()
      if (authData.user && authData.user.id === userId) {
        return {
          id: userId,
          full_name: authData.user.user_metadata?.full_name || authData.user.email?.split("@")[0] || "User",
          avatar_url: authData.user.user_metadata?.avatar_url || null,
          role: "user",
        }
      }

      // Final fallback
      return {
        id: userId,
        full_name: "User",
        avatar_url: null,
        role: "user",
      }
    }

    return data
  } catch (error) {
    console.warn("Error accessing user profile, using fallback:", error)

    // Return fallback profile
    return {
      id: userId,
      full_name: "User",
      avatar_url: null,
      role: "user",
    }
  }
}

// Log user actions with proper error handling
export async function logUserAction(userId: string, action: string, ipAddress?: string, userAgent?: string) {
  if (!userId) return

  try {
    // Check if Supabase is properly configured
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase not configured. Skipping user action logging.")
      return
    }

    // Try to insert the log entry
    const { error } = await supabase.from("user_logs").insert({
      user_id: userId,
      action,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.warn("Could not log user action (table may not exist):", error.message)
    }
  } catch (error) {
    console.warn("Error in logUserAction (non-critical):", error)
  }
}
