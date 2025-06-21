"use client"

import { useEffect, useState, useRef } from "react"
import { getDatabase, ref, onValue, query, limitToLast } from "firebase/database"
import { initializeApp, getApps, getApp } from "firebase/app"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, AlertCircle, Wifi, Radio } from "lucide-react"
import { SensorGauge } from "@/components/sensor-gauge"

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

export function SimpleDashboard() {
  const [sensorData, setSensorData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [updateCount, setUpdateCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const unsubscribeRef = useRef<(() => void) | null>(null)
  const flashRef = useRef<HTMLDivElement>(null)

  // Flash animation when new data arrives
  const flashUpdate = () => {
    if (flashRef.current) {
      flashRef.current.classList.add("bg-green-100", "dark:bg-green-900/30")
      setTimeout(() => {
        if (flashRef.current) {
          flashRef.current.classList.remove("bg-green-100", "dark:bg-green-900/30")
        }
      }, 1000)
    }
  }

  // Initialize Firebase and set up listener
  useEffect(() => {
    setLoading(true)
    setError(null)

    try {
      // Initialize Firebase
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
      const db = getDatabase(app)

      console.log("🔄 Setting up direct Firebase connection")

      // Clean up previous listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }

      // Create reference to sensor_readings node
      const sensorRef = ref(db, "sensor_readings")
      const recentReadingsQuery = query(sensorRef, limitToLast(20))

      // Set up real-time listener
      const unsubscribe = onValue(
        recentReadingsQuery,
        (snapshot) => {
          console.log("📊 Real-time update received:", snapshot.exists())

          if (snapshot.exists()) {
            const data: any[] = []

            snapshot.forEach((childSnapshot) => {
              // Get the key and data for each reading
              const key = childSnapshot.key
              const val = childSnapshot.val()

              // Add to our array
              data.push({
                key,
                ...val,
                timestamp: val.timestamp || Date.now(),
              })
            })

            // Sort by timestamp (newest first)
            data.sort((a, b) => b.timestamp - a.timestamp)

            console.log(`✅ Received ${data.length} readings from Firebase`)
            setSensorData(data)
            setConnected(true)
            setUpdateCount((prev) => prev + 1)
            setLastUpdate(new Date())
            flashUpdate()
          } else {
            console.log("❌ No data found in Firebase")
            setSensorData([])
          }

          setLoading(false)
        },
        (err) => {
          console.error("❌ Firebase error:", err)
          setError(`Firebase error: ${err.message}`)
          setConnected(false)
          setLoading(false)
        },
      )

      unsubscribeRef.current = unsubscribe

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current()
        }
      }
    } catch (err) {
      console.error("❌ Error setting up Firebase:", err)
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }, [])

  // Get the latest reading
  const latestReading = sensorData.length > 0 ? sensorData[0] : null

  if (loading && !latestReading) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connecting to Firebase</AlertTitle>
          <AlertDescription>Establishing real-time connection to your sensor data...</AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[150px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4" ref={flashRef}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Sensor Data</h2>
          <p className="text-muted-foreground">Direct connection to Firebase Realtime Database</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={connected ? "default" : "destructive"} className={connected ? "bg-green-600" : ""}>
            {connected ? (
              <>
                <Radio className="w-3 h-3 mr-1 animate-pulse" /> Live
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 mr-1" /> Disconnected
              </>
            )}
          </Badge>

          <Button size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>
          Updates received: <span className="font-medium">{updateCount}</span>
        </span>
        {lastUpdate && (
          <span>
            Last update: <span className="font-medium">{lastUpdate.toLocaleString()}</span>
          </span>
        )}
        <span>
          Data points: <span className="font-medium">{sensorData.length}</span>
        </span>
      </div>

      {latestReading ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>pH Level</CardTitle>
              </CardHeader>
              <CardContent>
                <SensorGauge
                  value={Number.parseFloat(latestReading.ph || "7.0")}
                  min={0}
                  max={14}
                  title="pH"
                  loading={false}
                  thresholds={[
                    { value: 4, color: "red" },
                    { value: 6, color: "yellow" },
                    { value: 7, color: "green" },
                    { value: 8, color: "yellow" },
                    { value: 10, color: "red" },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>TDS</CardTitle>
              </CardHeader>
              <CardContent>
                <SensorGauge
                  value={Number.parseFloat(latestReading.tds || "250")}
                  min={0}
                  max={1000}
                  title="TDS (ppm)"
                  loading={false}
                  thresholds={[
                    { value: 50, color: "blue" },
                    { value: 150, color: "green" },
                    { value: 500, color: "yellow" },
                    { value: 800, color: "red" },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Temperature</CardTitle>
              </CardHeader>
              <CardContent>
                <SensorGauge
                  value={Number.parseFloat(latestReading.temperature || "25.0")}
                  min={0}
                  max={40}
                  title="Temp (°C)"
                  loading={false}
                  thresholds={[
                    { value: 10, color: "blue" },
                    { value: 20, color: "green" },
                    { value: 30, color: "yellow" },
                    { value: 35, color: "red" },
                  ]}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Latest Reading (Raw Data)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4 overflow-auto">
                <pre className="text-xs">{JSON.stringify(latestReading, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            No sensor readings found in Firebase. Make sure your ESP32 is sending data to the correct path.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
