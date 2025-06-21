import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  // Only run this in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ message: "This endpoint is only available in development mode" }, { status: 403 })
  }

  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Drop the problematic policy
    await supabaseAdmin.rpc("drop_policy_if_exists", {
      table_name: "profiles",
      policy_name: "Admins can view all profiles",
    })

    // Create a simpler policy for admins
    // This avoids the circular dependency by not querying the profiles table
    await supabaseAdmin.rpc("create_policy", {
      table_name: "profiles",
      policy_name: "Service role can view all profiles",
      definition: "true",
      check_type: "USING",
      operation: "SELECT",
      role_name: "service_role",
    })

    return NextResponse.json({ message: "RLS policies updated successfully" })
  } catch (error) {
    console.error("Error updating RLS policies:", error)
    return NextResponse.json({ error: "Failed to update RLS policies" }, { status: 500 })
  }
}
