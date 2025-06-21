"use server"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { fetchSensorData, fetchSensorDataByDateRange } from "@/lib/firebase"
import { supabaseConfig } from "./config"

// Create a server-side Supabase client
export async function createServerSupabaseClient() {
  const cookieStore = cookies()

  const supabaseUrl = supabaseConfig.url
  const supabaseAnonKey = supabaseConfig.anonKey

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials missing in server action.")
    // Return a minimal mock client for server actions
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      }),
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    } as any
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })
}

// Server action to get user profile using Supabase
export async function getServerUserProfile(userId: string) {
  if (!userId) return null

  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.warn("Server action: Profiles table not accessible:", error.message)

      // Try to get user from auth
      const { data: authData } = await supabase.auth.getUser()
      if (authData.user && authData.user.id === userId) {
        return {
          id: userId,
          full_name: authData.user.user_metadata?.full_name || authData.user.email?.split("@")[0] || "User",
          avatar_url: authData.user.user_metadata?.avatar_url || null,
          role: "user",
        }
      }

      return null
    }

    return data
  } catch (error) {
    console.error("Server action error fetching user profile:", error)
    return null
  }
}

// Server action to check if user is admin using Supabase
export async function checkUserIsAdmin(userId: string) {
  if (!userId) return false

  const profile = await getServerUserProfile(userId)
  return profile?.role === "admin"
}

// Get sensor data for a specific time range
export async function getSensorData(hours: number | string): Promise<any> {
  try {
    const hoursStr = hours.toString()
    const data = await fetchSensorData(hoursStr)
    return data
  } catch (error) {
    console.error("Error in getSensorData server action:", error)
    return {
      channel: { name: "Mock Data (Error)" },
      feeds: [],
    }
  }
}

// Get sensor data for a specific date range
export async function getSensorDataByDateRange(startDate: string, endDate: string): Promise<any> {
  try {
    const data = await fetchSensorDataByDateRange(startDate, endDate)
    return data
  } catch (error) {
    console.error("Error in getSensorDataByDateRange server action:", error)
    return {
      channel: { name: "Mock Data (Error)" },
      feeds: [],
    }
  }
}

// For backward compatibility
export const getThingSpeakData = getSensorData
export const getThingSpeakDataByDateRange = getSensorDataByDateRange

// Export the Firebase functions for backward compatibility
export { fetchSensorDataByDateRange }
