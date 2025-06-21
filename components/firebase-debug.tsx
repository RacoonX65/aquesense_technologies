"use client"

import { useEffect, useState } from "react"
import { getDatabase, ref, onValue, query, limitToLast } from "firebase/database"
import { initializeApp, getApps, getApp } from "firebase/app"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react"

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export function FirebaseDebug() {
  const [rawData, setRawData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [updateCount, setUpdateCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Initialize Firebase
  const initFirebase = () => {
    try {
      return !getApps().length ? initializeApp(firebaseConfig) : getApp()
    } catch (error) {
      console.error("Error initializing Firebase:", error)
      setError(`Firebase initialization error: ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }

  // Set up real-time listener
  useEffect(() => {
    setLoading(true)
    setError(null)

    const app = initFirebase()
    if (!app) {
      setLoading(false)
      return
    }

    try {
      const db = getDatabase(app)
      console.log("🔍 DEBUG: Firebase database initialized")

      // Try different paths to find where your data is stored
      const paths = [
        "sensor_readings", // Current path
        "/sensor_readings", // With leading slash
        "sensorReadings", // Camel case
        "readings", // Simple name
        "/", // Root path to see all data
      ]

      let successfulPath = ""
      let unsubscribe: () => void | undefined

      // Try each path
      const tryPath = (index: number) => {
        if (index >= paths.length) {
          setError("Could not find data in any of the expected paths")
          setLoading(false)
          return
        }

        const path = paths[index]
        console.log(`🔍 DEBUG: Trying Firebase path: "${path}"`)

        const dataRef = ref(db, path)
        const dataQuery = query(dataRef, limitToLast(10))

        // Set up listener
        unsubscribe = onValue(
          dataQuery,
          (snapshot) => {
            console.log(`🔍 DEBUG: Got data from path "${path}":`, snapshot.exists())

            if (snapshot.exists()) {
              // We found data!
              successfulPath = path
              const data = snapshot.val()
              console.log(`✅ Found data at path "${path}":`, data)

              setRawData(data)
              setConnected(true)
              setUpdateCount((prev) => prev + 1)
              setLastUpdate(new Date())
              setLoading(false)
              setError(null)
            } else if (index === paths.length - 1) {
              // Last path and still no data
              console.log("❌ No data found in any path")
              setError("No data found in Firebase. Make sure your ESP32 is sending data.")
              setLoading(false)
            } else {
              // Try next path
              if (unsubscribe) unsubscribe()
              tryPath(index + 1)
            }
          },
          (err) => {
            console.error(`❌ Error with path "${path}":`, err)
            // Try next path
            if (index < paths.length - 1) {
              if (unsubscribe) unsubscribe()
              tryPath(index + 1)
            } else {
              setError(`Firebase error: ${err.message}`)
              setLoading(false)
            }
          },
        )
      }

      // Start with the first path
      tryPath(0)

      return () => {
        if (unsubscribe) unsubscribe()
      }
    } catch (err) {
      console.error("Error setting up Firebase listener:", err)
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    setRawData(null)
    setError(null)

    // Re-initialize the component
    const app = initFirebase()
    if (!app) {
      setLoading(false)
      return
    }

    try {
      const db = getDatabase(app)
      const dataRef = ref(db, "sensor_readings")
      const dataQuery = query(dataRef, limitToLast(10))

      onValue(
        dataQuery,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            setRawData(data)
            setConnected(true)
            setUpdateCount((prev) => prev + 1)
            setLastUpdate(new Date())
          } else {
            setError("No data found in Firebase")
          }
          setLoading(false)
        },
        (err) => {
          setError(`Firebase error: ${err.message}`)
          setLoading(false)
        },
      )
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  if (loading && !rawData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Firebase Raw Data
            <Badge variant="outline" className="animate-pulse">
              Connecting...
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Firebase Raw Data
          {connected ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="w-3 h-3 mr-1" /> Connected
            </Badge>
          ) : (
            <Badge variant="destructive">Disconnected</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Updates received: <span className="font-medium">{updateCount}</span>
            </p>
            {lastUpdate && (
              <p className="text-sm text-muted-foreground">
                Last update: <span className="font-medium">{lastUpdate.toLocaleString()}</span>
              </p>
            )}
          </div>
          <Button onClick={handleRefresh} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4 overflow-auto max-h-[400px]">
          <pre className="text-xs">{rawData ? JSON.stringify(rawData, null, 2) : "No data available"}</pre>
        </div>
      </CardContent>
    </Card>
  )
}
