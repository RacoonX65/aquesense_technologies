"use client"

import { useState, useEffect, useRef } from "react"
import type { WaterQualityAnalysis } from "@/lib/water-quality-lstm"
import { SensorCard } from "./sensor-card"
import { AnomalyScoreGauge } from "./anomaly-score-gauge"
import { ClassificationBadge } from "./classification-badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, AlertTriangle, Activity, Wifi, WifiOff, Zap } from "lucide-react"
import { ref, onValue, query, limitToLast } from "firebase/database"
import { db } from "@/lib/firebase"

const Dashboard = () => {
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [waterQualityAnalysis, setWaterQualityAnalysis] = useState<WaterQualityAnalysis | null>(null)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [updateCount, setUpdateCount] = useState<number>(0)
  const [dataSource, setDataSource] = useState<string>("Connecting...")
  const [totalReadings, setTotalReadings] = useState<number>(0)

  // Direct Firebase values
  const [directValues, setDirectValues] = useState({
    ph: 0,
    tds: 0,
    temperature: 0,
    ec: 0,
    turbidity: 0,
    timestamp: "",
  })

  const unsubscribeRef = useRef<(() => void) | null>(null)
  const updateIndicatorRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef<boolean>(true)

  const formatSATimestamp = (timestamp: string | Date) => {
    try {
      const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp
      return date.toLocaleString("en-ZA", {
        timeZone: "Africa/Johannesburg",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    } catch (e) {
      return "Invalid timestamp"
    }
  }

  const flashUpdateIndicator = () => {
    if (updateIndicatorRef.current) {
      updateIndicatorRef.current.classList.add("animate-pulse", "bg-green-100", "border-green-300")
      setTimeout(() => {
        if (updateIndicatorRef.current) {
          updateIndicatorRef.current.classList.remove("animate-pulse", "bg-green-100", "border-green-300")
        }
      }, 1000)
    }
  }

  const setupFirebaseListener = () => {
    if (!db) {
      console.error("❌ Firebase database not available")
      setError(new Error("Firebase database not available"))
      setLoading(false)
      setDataSource("No Database")
      return () => {}
    }

    try {
      const sensorRef = ref(db, "sensor_readings")
      const recentReadingsQuery = query(sensorRef, limitToLast(50))

      const unsubscribe = onValue(
        recentReadingsQuery,
        (snapshot) => {
          if (!mountedRef.current) return

          console.log("📡 Dashboard DIRECT Firebase update")

          if (!snapshot.exists()) {
            console.log("❌ No data found in Firebase")
            setError(new Error("No data found in Firebase"))
            setIsConnected(false)
            setLoading(false)
            setDataSource("No Data")
            return
          }

          const allReadings: any[] = []

          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val()
            if (data && typeof data === "object") {
              allReadings.push(data)
            }
          })

          console.log(`📊 Dashboard - Total readings:`, allReadings.length)
          setTotalReadings(allReadings.length)

          if (allReadings.length === 0) {
            setError(new Error("No valid readings found"))
            setLoading(false)
            setDataSource("Invalid Data")
            return
          }

          const latestReading = allReadings[allReadings.length - 1]
          console.log(`📊 Dashboard - Latest reading:`, latestReading)

          if (latestReading) {
            const newValues = {
              ph: Number.parseFloat(latestReading.ph) || 0,
              tds: Number.parseFloat(latestReading.tds) || 0,
              temperature: Number.parseFloat(latestReading.temperature) || 0,
              ec: Number.parseFloat(latestReading.ec) || 0,
              turbidity: Number.parseFloat(latestReading.turbidity) || 0,
              timestamp: new Date().toISOString(),
            }

            console.log("📊 Dashboard DIRECT VALUES:", newValues)

            setDirectValues(newValues)
            setIsConnected(true)
            setLoading(false)
            setError(null)
            setDataSource("Firebase Live")
            setLastUpdate(new Date())
            setUpdateCount((prev) => prev + 1)
            flashUpdateIndicator()
          }
        },
        (error) => {
          if (!mountedRef.current) return

          console.log("❌ Dashboard Firebase error:", error)
          setError(error)
          setLoading(false)
          setDataSource("Connection Error")
          setIsConnected(false)
        },
      )

      return unsubscribe
    } catch (error) {
      console.error("❌ Error setting up Dashboard Firebase listener:", error)
      setError(error instanceof Error ? error : new Error("Setup failed"))
      setLoading(false)
      setDataSource("Setup Error")
      return () => {}
    }
  }

  useEffect(() => {
    console.log("🚀 Dashboard setting up DIRECT Firebase listener")
    setLoading(true)

    const unsubscribe = setupFirebaseListener()
    unsubscribeRef.current = unsubscribe

    return () => {
      mountedRef.current = false
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  const handleRefresh = () => {
    console.log("🔄 Manual refresh triggered")
    setRefreshing(true)
    flashUpdateIndicator()

    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    setTimeout(() => {
      const unsubscribe = setupFirebaseListener()
      unsubscribeRef.current = unsubscribe
      setRefreshing(false)
    }, 1000)
  }

  const currentAnomalyScore = waterQualityAnalysis?.anomalyScore || 0
  const currentClassification = waterQualityAnalysis?.classificationCode || 1

  // Show error state if there's a critical error
  if (error && !isConnected && !loading) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <Card className="border-red-200 dark:border-red-700">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Dashboard Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">⚠️ Unable to connect to Firebase</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error.message}</div>
              <div className="space-x-2">
                <Button onClick={handleRefresh} disabled={refreshing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Retry Connection
                </Button>
                <Button variant="outline" onClick={() => (window.location.href = "/dashboard/debug")}>
                  Debug Connection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Water Quality Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time monitoring showing DIRECT Firebase values (Last {totalReadings} readings)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/dashboard/debug")} className="ml-2">
            Debug Connection
          </Button>
        </div>
      </div>

      {/* Real-time Status */}
      <div className="mb-6" ref={updateIndicatorRef}>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge
            variant={isConnected ? "default" : "outline"}
            className={isConnected ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {isConnected ? (
              <>
                <Wifi className="mr-1 h-3 w-3" /> Live Data
              </>
            ) : loading ? (
              <>
                <Wifi className="mr-1 h-3 w-3 animate-pulse" /> Connecting...
              </>
            ) : (
              <>
                <WifiOff className="mr-1 h-3 w-3" /> Offline
              </>
            )}
          </Badge>

          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
            <Zap className="mr-1 h-3 w-3" /> {updateCount} Updates
          </Badge>

          <Badge variant="outline">{totalReadings} Data Points</Badge>

          <Badge variant={dataSource.includes("Error") ? "destructive" : "default"}>{dataSource}</Badge>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Last updated: {lastUpdate ? formatSATimestamp(lastUpdate) : "No data"}
        </div>
      </div>

      {/* Individual Sensor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <SensorCard
          type="ph"
          value={directValues.ph}
          min={0}
          max={14}
          loading={loading}
          timestamp={directValues.timestamp}
        />
        <SensorCard
          type="tds"
          value={directValues.tds}
          min={0}
          max={1000}
          loading={loading}
          timestamp={directValues.timestamp}
        />
        <SensorCard
          type="temperature"
          value={directValues.temperature}
          min={0}
          max={40}
          loading={loading}
          timestamp={directValues.timestamp}
        />
        <SensorCard
          type="conductivity"
          value={directValues.ec}
          min={0}
          max={2000}
          loading={loading}
          timestamp={directValues.timestamp}
        />
        <SensorCard
          type="turbidity"
          value={directValues.turbidity}
          min={0}
          max={1000}
          loading={loading}
          timestamp={directValues.timestamp}
        />
      </div>

      {/* Water Quality Analysis */}
      <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center text-gray-900 dark:text-white">
            <Activity className="mr-2 h-4 w-4" /> Water Quality Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <AnomalyScoreGauge value={currentAnomalyScore} loading={loading} />
            </div>
            <div>
              <ClassificationBadge value={currentClassification} loading={loading} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Water Quality Summary */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Water Quality Summary</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            DIRECT Firebase values - no processing or conversion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Latest DIRECT Readings</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">pH:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{directValues.ph.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">TDS:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{directValues.tds.toFixed(2)} ppm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Temperature:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {directValues.temperature.toFixed(2)} °C
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">EC:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{directValues.ec.toFixed(2)} µS/cm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Turbidity:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {directValues.turbidity.toFixed(2)} NTU
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">System Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Connection:</span>
                  <Badge variant={isConnected ? "default" : "outline"}>
                    {isConnected ? "Live" : loading ? "Connecting" : "Offline"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Updates:</span>
                  <span className="font-medium text-green-600 dark:text-green-400 text-lg">{updateCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Data Points:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{totalReadings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Data Source:</span>
                  <Badge variant={dataSource.includes("Error") ? "destructive" : "default"}>{dataSource}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ✅ Ready for deployment! Dashboard and individual sensor pages use identical DIRECT Firebase values.
            {isConnected ? " 🟢 Live data active." : loading ? " 🟡 Connecting..." : " 🔴 Connection failed."}
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Dashboard
