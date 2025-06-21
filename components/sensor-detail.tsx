"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SensorChart } from "@/components/sensor-chart"
import { AnomalyScoreGauge } from "@/components/anomaly-score-gauge"
import { ClassificationBadge } from "@/components/classification-badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, RefreshCw, WifiOff, History, Download, Filter, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SensorData } from "@/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExportButton } from "@/components/export-button"
import { SensorGauge } from "@/components/sensor-gauge"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

// Add imports at the top
import { waterQualityEngine, type WaterQualityReading } from "@/lib/water-quality-lstm"

// Firebase imports
import { ref, onValue, query, limitToLast } from "firebase/database"
import { useFirebase } from "@/components/firebase-provider"

// Sensor type definitions
const sensorTypes = {
  ph: {
    title: "pH Level",
    description: "pH is a measure of how acidic/basic water is. The range goes from 0 to 14, with 7 being neutral.",
    field: "field1",
    color: "#3b82f6",
    icon: "Droplets",
    unit: "",
    min: 0,
    max: 14,
    thresholds: [
      { value: 0, color: "red" },
      { value: 5, color: "red" },
      { value: 6, color: "yellow" },
      { value: 6.5, color: "green" },
      { value: 8.5, color: "yellow" },
      { value: 9, color: "red" },
      { value: 14, color: "red" },
    ],
    idealRange: "6.5 - 8.5",
    effects: [
      { range: "< 6.5", effect: "Acidic water can corrode pipes and fixtures, and may contain toxic metals." },
      { range: "6.5 - 8.5", effect: "Ideal range for most aquatic life and drinking water." },
      { range: "> 8.5", effect: "Alkaline water can cause scale buildup and give water a bitter taste." },
    ],
  },
  tds: {
    title: "Total Dissolved Solids",
    description: "TDS is a measure of all inorganic and organic substances dissolved in water.",
    field: "field2",
    color: "#22c55e",
    icon: "Droplets",
    unit: "ppm",
    min: 0,
    max: 1000,
    thresholds: [
      { value: 0, color: "blue" },
      { value: 50, color: "blue" },
      { value: 150, color: "green" },
      { value: 300, color: "green" },
      { value: 500, color: "yellow" },
      { value: 800, color: "red" },
      { value: 1000, color: "red" },
    ],
    idealRange: "50 - 300 ppm",
    effects: [
      { range: "< 50 ppm", effect: "Very low mineral content, may taste flat and lack essential minerals." },
      { range: "50 - 300 ppm", effect: "Ideal range for drinking water with good taste and mineral content." },
      { range: "300 - 500 ppm", effect: "Acceptable but may start to taste minerally." },
      { range: "> 500 ppm", effect: "High mineral content, may taste salty and cause scale buildup." },
    ],
  },
  temperature: {
    title: "Temperature",
    description: "Water temperature affects many biological and chemical processes in water bodies.",
    field: "field3",
    color: "#ef4444",
    icon: "Thermometer",
    unit: "°C",
    min: 0,
    max: 50,
    thresholds: [
      { value: 0, color: "blue" },
      { value: 10, color: "blue" },
      { value: 15, color: "green" },
      { value: 25, color: "green" },
      { value: 35, color: "orange" },
      { value: 40, color: "red" },
      { value: 50, color: "red" },
    ],
    idealRange: "10 - 25°C",
    effects: [
      { range: "< 10°C", effect: "Cold water holds more oxygen but slows biological processes." },
      { range: "10 - 25°C", effect: "Ideal range for most aquatic life and biological processes." },
      { range: "> 25°C", effect: "Warm water holds less oxygen and can accelerate algae growth." },
    ],
  },
  conductivity: {
    title: "Conductivity",
    description: "Electrical conductivity indicates the amount of dissolved solids in water.",
    field: "field4",
    color: "#eab308",
    icon: "Zap",
    unit: "μS/cm",
    min: 0,
    max: 2000,
    thresholds: [
      { value: 0, color: "blue" },
      { value: 200, color: "blue" },
      { value: 300, color: "green" },
      { value: 800, color: "green" },
      { value: 1000, color: "yellow" },
      { value: 1500, color: "red" },
      { value: 2000, color: "red" },
    ],
    idealRange: "200 - 800 μS/cm",
    effects: [
      { range: "< 200 μS/cm", effect: "Low mineral content, typical of rainwater or distilled water." },
      { range: "200 - 800 μS/cm", effect: "Normal range for freshwater, good for most uses." },
      { range: "> 800 μS/cm", effect: "High mineral content, may indicate pollution or saltwater intrusion." },
    ],
  },
  turbidity: {
    title: "Turbidity",
    description: "Turbidity measures the cloudiness or haziness of water caused by suspended particles.",
    field: "field5",
    color: "#6b7280",
    icon: "Droplets",
    unit: "NTU",
    min: 0,
    max: 100,
    thresholds: [
      { value: 0, color: "green" },
      { value: 1, color: "green" },
      { value: 5, color: "green" },
      { value: 20, color: "yellow" },
      { value: 50, color: "red" },
      { value: 100, color: "red" },
    ],
    idealRange: "< 5 NTU",
    effects: [
      { range: "< 1 NTU", effect: "Very clear water, excellent for drinking and aquatic life." },
      { range: "1 - 5 NTU", effect: "Slightly cloudy but still acceptable for most uses." },
      { range: "5 - 20 NTU", effect: "Cloudy water, may affect aquatic life and require treatment for drinking." },
      { range: "> 20 NTU", effect: "Very cloudy water, harmful to aquatic life and requires significant treatment." },
    ],
  },
  anomaly: {
    title: "Anomaly Score",
    description: "Anomaly score indicates how unusual the current readings are compared to normal patterns.",
    field: "field6",
    color: "#f97316",
    icon: "AlertTriangle",
    unit: "",
    min: 0,
    max: 1,
    thresholds: [],
    idealRange: "< 0.3",
    effects: [
      { range: "< 0.3", effect: "Normal readings, no significant anomalies detected." },
      { range: "0.3 - 0.6", effect: "Minor anomalies detected, may warrant monitoring." },
      { range: "0.6 - 0.8", effect: "Significant anomalies detected, investigation recommended." },
      { range: "> 0.8", effect: "Critical anomalies detected, immediate action required." },
    ],
  },
  classification: {
    title: "Classification Code",
    description: "Classification codes categorize water quality into different classes based on multiple parameters.",
    field: "field7",
    color: "#a855f7",
    icon: "Tag",
    unit: "",
    min: 1,
    max: 5,
    thresholds: [],
    idealRange: "Class 1-2",
    effects: [
      { range: "Class 1", effect: "Excellent water quality, suitable for all uses." },
      { range: "Class 2", effect: "Good water quality, suitable for most uses." },
      { range: "Class 3", effect: "Fair water quality, may require treatment for some uses." },
      { range: "Class 4", effect: "Poor water quality, requires treatment before use." },
      { range: "Class 5", effect: "Very poor water quality, unsuitable for most uses without significant treatment." },
    ],
  },
}

export default function SensorDetail({ type }: { type: string }) {
  const router = useRouter()
  const sensorType = type

  const [data, setData] = useState<SensorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("24")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  const [hasRealData, setHasRealData] = useState(false)
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)
  const [chartView, setChartView] = useState<"line" | "bar">("line")

  const [isValidSensorType, setIsValidSensorType] = useState(!!sensorTypes[sensorType as keyof typeof sensorTypes])

  // Add state for computed scores
  const [computedAnomalyScore, setComputedAnomalyScore] = useState<number>(0)
  const [computedClassificationCode, setComputedClassificationCode] = useState<number>(1)

  // Ref for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Get Firebase database instance
  const { db } = useFirebase()

  useEffect(() => {
    setIsValidSensorType(!!sensorTypes[sensorType as keyof typeof sensorTypes])
  }, [sensorType])

  // Check if sensor type is valid
  useEffect(() => {
    if (!isValidSensorType) {
      router.push("/dashboard")
    }
  }, [isValidSensorType, router])

  // Check if we've had real data before
  useEffect(() => {
    const hadRealData = localStorage.getItem("hasRealFirebaseData") === "true"
    setHasRealData(hadRealData)
  }, [])

  const sensor = sensorTypes[sensorType as keyof typeof sensorTypes]

  // Set up real-time listener
  useEffect(() => {
    if (!sensor) return

    console.log("Setting up real-time listener for sensor detail:", sensorType)
    setLoading(true)
    setError(null)

    // Clean up previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    // Check if Firebase is available
    if (!db) {
      console.error("Firebase database not available")
      setError("Firebase database not available. Using mock data.")
      setIsUsingMockData(true)
      setLoading(false)
      return
    }

    try {
      // Create reference to sensor_readings node
      const sensorRef = ref(db, "sensor_readings")
      console.log("Database reference created:", sensorRef.toString())

      // Create query for the most recent readings
      const recentReadingsQuery = query(sensorRef, limitToLast(100))
      console.log("Query created for last 100 readings")

      // Set up real-time listener with error handling
      const unsubscribe = onValue(
        recentReadingsQuery,
        (snapshot) => {
          console.log("Real-time update received for sensor detail")
          console.log("Snapshot exists:", snapshot.exists())
          console.log("Snapshot size:", snapshot.size)

          if (!snapshot.exists()) {
            console.log("No data found in Firebase, using mock data")
            setIsUsingMockData(true)
            setIsRealTimeConnected(false)
            setLoading(false)
            return
          }

          // Process Firebase data
          const feeds = []
          let lastEntryId = 0
          const now = new Date()
          const startTime = now.getTime() - Number.parseInt(timeRange) * 60 * 60 * 1000

          console.log("Processing snapshot data for sensor detail")
          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val()

            // Try to get timestamp from various possible fields
            let timestamp
            if (data.timestamp) {
              // If timestamp is a Firebase server timestamp object
              if (typeof data.timestamp === "object" && data.timestamp !== null) {
                timestamp = new Date(data.timestamp.seconds * 1000 || Date.now())
              } else {
                timestamp = new Date(data.timestamp || Date.now())
              }
            } else if (data.created_at) {
              timestamp = new Date(data.created_at)
            } else {
              timestamp = new Date()
            }

            if (timestamp.getTime() >= startTime) {
              // Handle different field naming conventions
              const reading = {
                created_at: timestamp.toISOString(),
                entry_id: data.entry_id || feeds.length + 1,
                field1: data.ph?.toString() || data.field1?.toString() || "7.0",
                field2: data.tds?.toString() || data.field2?.toString() || "250",
                field3: data.temperature?.toString() || data.field3?.toString() || "25.0",
                field4: data.ec?.toString() || data.conductivity?.toString() || data.field4?.toString() || "500",
                field5: data.turbidity?.toString() || data.field5?.toString() || "5.0",
              }

              feeds.push(reading)
              lastEntryId = Math.max(lastEntryId, reading.entry_id)
            }
          })

          feeds.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

          const sensorData = {
            channel: {
              id: 1,
              name: "Water Quality Monitoring",
              description: "Real-time water quality sensor readings from Firebase",
              created_at: new Date(2023, 0, 1).toISOString(),
              updated_at: new Date().toISOString(),
              last_entry_id: lastEntryId,
            },
            feeds,
          }

          console.log(`Successfully loaded ${feeds.length} real sensor readings from Firebase for sensor detail`)

          // Check if we're using mock data
          const isMock = feeds.length === 0
          setIsUsingMockData(isMock)
          setIsRealTimeConnected(true)

          // If we ever get real data, remember that
          if (!isMock) {
            setHasRealData(true)
            localStorage.setItem("hasRealFirebaseData", "true")
          } else if (!hasRealData) {
            // Check if we've had real data before
            const hadRealData = localStorage.getItem("hasRealFirebaseData") === "true"
            setHasRealData(hadRealData)
          }

          setData(sensorData)
          setLastUpdated(new Date())
          setLoading(false)
          setError(null)
        },
        (error) => {
          console.error("Real-time sensor detail listener error:", error)
          setError(`Real-time connection error: ${error.message}`)
          setIsRealTimeConnected(false)
          setLoading(false)
        },
      )

      unsubscribeRef.current = unsubscribe
      console.log("Direct Firebase listener set up successfully for sensor detail")
    } catch (err) {
      console.error("Error setting up direct Firebase connection for sensor detail:", err)
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
      setIsRealTimeConnected(false)
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [timeRange, sensorType, sensor, hasRealData, db])

  // Add effect to compute scores when data changes
  useEffect(() => {
    if (data?.feeds && data.feeds.length > 0) {
      const computeScores = async () => {
        try {
          // Convert recent readings to WaterQualityReading format
          const recentReadings: WaterQualityReading[] = data.feeds.slice(0, 50).map((feed) => ({
            ph: Number.parseFloat(feed.field1),
            tds: Number.parseFloat(feed.field2),
            temperature: Number.parseFloat(feed.field3),
            conductivity: Number.parseFloat(feed.field4),
            turbidity: Number.parseFloat(feed.field5),
            timestamp: feed.created_at,
          }))

          // Set context for the engine
          waterQualityEngine.setRecentReadings(recentReadings)

          // Analyze the latest reading
          const latestReading = recentReadings[0]
          const analysis = await waterQualityEngine.analyzeReading(latestReading)

          setComputedAnomalyScore(analysis.anomalyScore)
          setComputedClassificationCode(analysis.classificationCode)
        } catch (error) {
          console.error("Error computing scores:", error)
        }
      }

      computeScores()
    }
  }, [data, sensorType])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  const handleForceRefresh = () => {
    // Force reconnection by changing timeRange temporarily
    const currentTimeRange = timeRange
    setTimeRange("0") // Temporary value
    setTimeout(() => setTimeRange(currentTimeRange), 100)
  }

  const handleViewHistorical = () => {
    // Navigate to the historical data page with this sensor pre-selected
    router.push(`/dashboard/historical?sensor=${sensorType}`)
  }

  // Get current value
  const currentValue = data?.feeds[0]?.[sensor.field] ? Number.parseFloat(data.feeds[0][sensor.field]) : null

  // Calculate statistics
  const calculateStats = () => {
    if (!data?.feeds || data.feeds.length === 0) return null

    const values = data.feeds
      .map((feed: any) => Number.parseFloat(feed[sensor.field]))
      .filter((val: number) => !isNaN(val))

    if (values.length === 0) return null

    const min = Math.min(...values)
    const max = Math.max(...values)
    const sum = values.reduce((a: number, b: number) => a + b, 0)
    const avg = sum / values.length

    // Calculate standard deviation
    const squareDiffs = values.map((value: number) => {
      const diff = value - avg
      return diff * diff
    })
    const avgSquareDiff = squareDiffs.reduce((a: number, b: number) => a + b, 0) / values.length
    const stdDev = Math.sqrt(avgSquareDiff)

    return {
      min: min.toFixed(2),
      max: max.toFixed(2),
      avg: avg.toFixed(2),
      stdDev: stdDev.toFixed(2),
      count: values.length,
    }
  }

  const stats = calculateStats()

  if (error && !data) {
    return (
      <Alert
        variant="destructive"
        className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border border-red-200 dark:border-red-900"
      >
        <AlertCircle className="w-4 h-4" />
        <AlertTitle>Connection Error</AlertTitle>
        <AlertDescription>
          {error}
          <Button onClick={handleForceRefresh} className="ml-2" size="sm">
            Retry Connection
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Update the renderGauge function to use computed scores for anomaly and classification
  const renderGauge = () => {
    if (loading) return <Skeleton className="h-[200px] w-full" />

    if (sensorType === "anomaly") {
      return <AnomalyScoreGauge value={computedAnomalyScore} loading={loading} />
    }

    if (sensorType === "classification") {
      return <ClassificationBadge value={computedClassificationCode} loading={loading} />
    }

    return (
      <SensorGauge
        value={currentValue || 0}
        min={sensor.min}
        max={sensor.max}
        title={sensor.title}
        loading={loading}
        thresholds={sensor.thresholds}
      />
    )
  }

  // Mobile options component
  const MobileOptions = () => (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Time Range</label>
        <Tabs defaultValue={timeRange} onValueChange={setTimeRange} className="w-full">
          <TabsList className="w-full bg-white/40 dark:bg-gray-900/40 backdrop-blur-md">
            <TabsTrigger value="1">1h</TabsTrigger>
            <TabsTrigger value="6">6h</TabsTrigger>
            <TabsTrigger value="24">24h</TabsTrigger>
            <TabsTrigger value="168">Week</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Chart View</label>
        <Tabs
          defaultValue={chartView}
          onValueChange={(value) => setChartView(value as "line" | "bar")}
          className="w-full"
        >
          <TabsList className="w-full bg-white/40 dark:bg-gray-900/40 backdrop-blur-md">
            <TabsTrigger value="line">Line Chart</TabsTrigger>
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="pt-4 space-y-2">
        <Button
          onClick={handleForceRefresh}
          disabled={loading}
          className="w-full backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80 text-white border-none"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Force Refresh
        </Button>

        {data?.feeds && (
          <Button
            variant="outline"
            className="w-full backdrop-blur-md bg-white/40 dark:bg-gray-900/40"
            onClick={() => {
              const exportData = data.feeds.map((feed: any) => ({
                timestamp: new Date(feed.created_at).toLocaleString(),
                value: feed[sensor.field],
              }))

              // Create a CSV string
              const headers = Object.keys(exportData[0]).join(",")
              const rows = exportData.map((item: any) =>
                Object.values(item)
                  .map((value) => (typeof value === "string" && value.includes(",") ? `"${value}"` : value))
                  .join(","),
              )
              const csv = [headers, ...rows].join("\n")

              // Create download link
              const blob = new Blob([csv], { type: "text/csv" })
              const url = URL.createObjectURL(blob)
              const link = document.createElement("a")
              link.href = url
              link.download = `${sensorType}-data.csv`
              link.click()

              // Clean up
              URL.revokeObjectURL(url)
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full backdrop-blur-md bg-white/40 dark:bg-gray-900/40"
          onClick={handleViewHistorical}
        >
          <History className="w-4 h-4 mr-2" />
          Historical Data
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to dashboard</span>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{sensor.title} (Real-time)</h2>
              {isRealTimeConnected ? (
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-800"
                >
                  <Radio className="w-3 h-3 mr-1 animate-pulse" />
                  Live
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-300 dark:border-red-800"
                >
                  <WifiOff className="w-3 h-3 mr-1" />
                  Disconnected
                </Badge>
              )}
              {isUsingMockData && (
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800"
                >
                  Mock Data
                </Badge>
              )}
            </div>
            {lastUpdated && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex justify-end gap-2">
          <Button
            onClick={handleForceRefresh}
            disabled={loading}
            className="backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80 text-white border-none"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Options
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[80vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Sensor Options</SheetTitle>
                <SheetDescription>Adjust time range and view options</SheetDescription>
              </SheetHeader>
              <MobileOptions />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop controls */}
        <div className="hidden md:flex flex-wrap gap-2">
          <Tabs defaultValue={timeRange} onValueChange={setTimeRange} className="w-full sm:w-auto">
            <TabsList className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md">
              <TabsTrigger value="1">1h</TabsTrigger>
              <TabsTrigger value="6">6h</TabsTrigger>
              <TabsTrigger value="24">24h</TabsTrigger>
              <TabsTrigger value="168">Week</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            onClick={handleForceRefresh}
            disabled={loading}
            className="w-full sm:w-auto backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80 text-white border-none"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Force Refresh
          </Button>
          {data?.feeds && (
            <ExportButton
              data={data.feeds.map((feed: any) => ({
                timestamp: new Date(feed.created_at).toLocaleString(),
                value: feed[sensor.field],
              }))}
              filename={`${sensorType}-data.csv`}
            />
          )}

          <Button
            variant="outline"
            className="w-full sm:w-auto backdrop-blur-md bg-white/40 dark:bg-gray-900/40"
            onClick={handleViewHistorical}
          >
            <History className="w-4 h-4 mr-2" />
            Historical Data
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto backdrop-blur-md bg-white/40 dark:bg-gray-900/40"
            onClick={() => router.push("/dashboard/debug")}
          >
            Debug Connection
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="backdrop-blur-md bg-yellow-50/50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-300">Connection Warning</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-400">
            {error} The dashboard will continue to show the last received data.
          </AlertDescription>
        </Alert>
      )}

      {isUsingMockData && !hasRealData && (
        <Alert className="backdrop-blur-md bg-blue-50/50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-300">Using Mock Data</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            No Firebase data is available for this sensor. Displaying real-time mock data for demonstration purposes.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle>Current Reading (Real-time)</CardTitle>
            <CardDescription>{sensor.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              {renderGauge()}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Ideal Range: <span className="font-semibold">{sensor.idealRange}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle>Statistics (Real-time)</CardTitle>
            <CardDescription>Statistical analysis for the selected time period with live updates</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Minimum</p>
                  <p className="text-xl font-semibold">
                    {stats.min} {sensor.unit}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Maximum</p>
                  <p className="text-xl font-semibold">
                    {stats.max} {sensor.unit}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Average</p>
                  <p className="text-xl font-semibold">
                    {stats.avg} {sensor.unit}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Standard Deviation</p>
                  <p className="text-xl font-semibold">
                    {stats.stdDev} {sensor.unit}
                  </p>
                </div>
                <div className="col-span-1 sm:col-span-2 p-3 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Data Points</p>
                  <p className="text-xl font-semibold">{stats.count}</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
        <CardHeader>
          <CardTitle>{sensor.title} History (Real-time)</CardTitle>
          <CardDescription>{sensor.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] sm:h-[400px]">
            <SensorChart
              data={data?.feeds || []}
              dataKey={sensor.field}
              name={sensor.title}
              color={sensor.color}
              loading={loading}
              timeKey="created_at"
              unit={sensor.unit}
              isClassification={sensorType === "classification"}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
        <CardHeader>
          <CardTitle>Effects and Interpretation</CardTitle>
          <CardDescription>Understanding the impact of different {sensor.title.toLowerCase()} levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sensor.effects.map((effect, index) => (
              <div key={index} className="p-4 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                <h3 className="text-md font-semibold mb-1">{effect.range}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{effect.effect}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
