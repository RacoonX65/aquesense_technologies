"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { isSupabaseConfigured } from "@/lib/config"

export function EnvWarning() {
  const [show, setShow] = useState(false)
  const [missingServices, setMissingServices] = useState<{ name: string; vars: string[] }[]>([])

  useEffect(() => {
    // Only check for Supabase - we're using hardcoded values for ThingSpeak
    const missingServices = []

    if (!isSupabaseConfigured) {
      missingServices.push({
        name: "Supabase",
        vars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
      })
    }

    if (missingServices.length > 0) {
      setMissingServices(missingServices)
      setShow(true)
    }
  }, [])

  if (!show || missingServices.length === 0) return null

  return (
    <Alert className="fixed bottom-4 right-4 w-auto max-w-md z-50 bg-yellow-50 dark:bg-yellow-900/50 border-yellow-200 dark:border-yellow-800">
      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <div className="flex-1">
        <AlertTitle className="text-yellow-800 dark:text-yellow-300">Environment Variables Notice</AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-400">
          <p className="mb-2">Using default configuration for:</p>
          {missingServices.map((service) => (
            <div key={service.name} className="mb-2">
              <p className="font-medium">{service.name}</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                {service.vars.map((variable) => (
                  <li key={variable}>{variable}</li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs mt-2">
            The application will work with default values, but you may want to set these in your Vercel project
            settings.
          </p>
        </AlertDescription>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-800/50"
        onClick={() => setShow(false)}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>
    </Alert>
  )
}
