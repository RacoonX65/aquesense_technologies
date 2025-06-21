"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Droplets, Thermometer, Zap, Eye, TestTube, Clock } from "lucide-react"
import { ref, onValue, query, limitToLast } from "firebase/database"
import { db } from "@/lib/firebase"

interface SensorCardProps {
  type: "ph" | "tds" | "temperature" | "conductivity" | "turbidity"
  unit: string
}

const sensorConfig = {
  ph: {
    icon: TestTube,
    title: "pH Level",
    color: "#3b82f6",
    firebaseField: "ph",
  },
  tds: {
    icon: Droplets,
    title: "TDS",
    color: "#06b6d4",
    firebaseField: "tds",
  },
  temperature: {
    icon: Thermometer,
    title: "Temperature",
    color: "#f59e0b",
    firebaseField: "temperature",
  },
  conductivity: {
    icon: Zap,
    title: "Conductivity",
    color: "#10b981",
    firebaseField: "ec",
  },
  turbidity: {
    icon: Eye,
    title: "Turbidity",
    color: "#8b5cf6",
    firebaseField: "turbidity",
  },
}

export function IndividualSensorCard({ type, unit }: SensorCardProps) {
  const [currentValue, setCurrentValue] = useState<number>(0)
  const [timestamp, setTimestamp] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])
  const [showChart, setShowChart] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const config = sensorConfig[type]
  const Icon = config.icon

  useEffect(() => {
    console.log(`🔴 Setting up DIRECT Firebase listener for ${type}`)
    setLoading(true)
    setError(null)

    if (!db) {
      console.error("❌ Firebase database not available")
      setError("Firebase database not available")
      setLoading(false)
      return
    }

    try {
      const sensorRef = ref(db, "sensor_readings")
      const recentReadingsQuery = query(sensorRef, limitToLast(50))

      const unsubscribe = onValue(
        recentReadingsQuery,
        (snapshot) => {
          console.log(`📡 DIRECT Firebase update for ${type}`)

          if (!snapshot.exists()) {
            console.log(`❌ No data found for ${type}`)
            setError("No data found in Firebase")
            setIsConnected(false)
            setLoading(false)
            return
          }

          const allReadings: any[] = []

          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val()
            const key = childSnapshot.key

            if (data && typeof data === "object") {
              const reading = {
                ...data,
                firebaseKey: key,
                timestamp: new Date().toISOString(),
              }
              allReadings.push(reading)
            }
          })

          console.log(`📊 ${type} - Total readings:`, allReadings.length)

          if (allReadings.length === 0) {
            setError("No valid readings found")
            setLoading(false)
            return
          }

          // Get the LATEST reading
          const latestReading = allReadings[allReadings.length - 1]

          if (latestReading && latestReading[config.firebaseField] !== undefined) {
            const rawValue = latestReading[config.firebaseField]
            const value = Number.parseFloat(rawValue)

            console.log(`📊 ${type} DIRECT VALUE:`, {
              firebaseField: config.firebaseField,
              rawValue: rawValue,
              parsedValue: value,
            })

            if (!isNaN(value) && isFinite(value)) {
              setCurrentValue(value)
              setTimestamp(latestReading.timestamp)
              setIsConnected(true)
              setLoading(false)
              setError(null)

              console.log(`✅ ${type} updated to DIRECT value:`, value)
            } else {
              console.warn(`⚠️ Invalid ${type} value:`, value)
              setError(`Invalid ${type} value: ${rawValue}`)
              setLoading(false)
            }
          } else {
            console.warn(`⚠️ No ${config.firebaseField} field found in latest reading`)
            setError(`Field '${config.firebaseField}' not found in data`)
            setLoading(false)
          }

          setChartData(allReadings)
        },
        (error) => {
          console.error(`❌ Firebase error for ${type}:`, error)
          setError(`Firebase error: ${error.message}`)
          setIsConnected(false)
          setLoading(false)
        },
      )

      return () => {
        console.log(`🛑 Cleaning up ${type} DIRECT listener`)
        unsubscribe()
      }
    } catch (error) {
      console.error(`❌ Error setting up ${type} DIRECT listener:`, error)
      setError(`Setup error: ${error instanceof Error ? error.message : "Unknown error"}`)
      setLoading(false)
      setIsConnected(false)
    }
  }, [type, config.firebaseField])

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString("en-ZA", {
        timeZone: "Africa/Johannesburg",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    } catch (e) {
      return "Invalid time"
    }
  }

  if (error && !isConnected) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-red-200 dark:border-red-700">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400 flex items-center">
            <Icon className="h-5 w-5 mr-2" />
            {config.title} - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">⚠️ Connection Error</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{error}</div>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
              Retry Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${config.color}20` }}>
                <Icon className="h-5 w-5" style={{ color: config.color }} />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">{config.title}</CardTitle>
                {timestamp && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTimestamp(timestamp)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
              <span
                className={`text-xs font-medium ${
                  isConnected ? "text-green-600 dark:text-green-400" : "text-gray-500"
                }`}
              >
                {isConnected ? "LIVE" : loading ? "CONNECTING" : "OFFLINE"}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2" style={{ color: config.color }}>
              {loading ? "---" : currentValue.toFixed(2)}
            </div>
            <div className="text-lg text-gray-600 dark:text-gray-400 font-medium">{unit}</div>
            {error && <div className="text-xs text-red-500 mt-2">⚠️ {error}</div>}
          </div>

          <div className="flex items-center justify-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant={showChart ? "default" : "outline"}
              size="sm"
              onClick={() => setShowChart(!showChart)}
              className="text-xs px-4 py-2"
              disabled={loading || !isConnected}
            >
              {showChart ? "Hide Chart" : "Show Chart"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showChart && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {config.title} - Last {chartData.length} Readings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <div className="text-sm text-gray-500 mb-2">Showing {chartData.length} readings from Firebase</div>
              <div className="text-center text-gray-400 mt-20">Chart visualization available in full dashboard</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
