"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { supabaseConfig } from "./config"

// Create a server-side Supabase client with service role
export async function createAdminClient() {
  const cookieStore = cookies()

  const supabaseUrl = supabaseConfig.url
  const supabaseServiceKey = supabaseConfig.serviceRoleKey

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase credentials missing in admin server action.")
    return null
  }

  return createServerClient(supabaseUrl, supabaseServiceKey, {
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

export async function getAdminUsers() {
  try {
    const supabase = await createAdminClient()
    if (!supabase) {
      return { data: null, error: "Admin client could not be created" }
    }

    // Get profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (profilesError) {
      return { data: null, error: profilesError.message }
    }

    // Get auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error("Error fetching auth users:", authError)
      // Return just profiles if we can't get auth data
      return {
        data: profiles.map((profile) => ({
          ...profile,
          email: "N/A", // We don't have emails without auth data
          last_sign_in_at: null,
        })),
        error: null,
      }
    }

    // Combine the data
    const users = profiles.map((profile) => {
      const authUser = authData.users.find((user) => user.id === profile.id)
      return {
        ...profile,
        email: authUser?.email || "N/A",
        last_sign_in_at: authUser?.last_sign_in_at,
        created_at: profile.created_at || authUser?.created_at,
      }
    })

    return { data: users, error: null }
  } catch (error: any) {
    console.error("Error in getAdminUsers:", error)
    return { data: null, error: error.message }
  }
}

export async function updateUserRole(userId: string, newRole: string) {
  try {
    const supabase = await createAdminClient()
    if (!supabase) {
      return { success: false, error: "Admin client could not be created" }
    }

    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteUser(userId: string) {
  try {
    const supabase = await createAdminClient()
    if (!supabase) {
      return { success: false, error: "Admin client could not be created" }
    }

    // Delete user from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      return { success: false, error: authError.message }
    }

    // Delete user from profiles
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId)

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
