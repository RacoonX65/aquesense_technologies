"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SensorChart } from "@/components/sensor-chart"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, WifiOff, Radio, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SensorData } from "@/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ExportButton } from "@/components/export-button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CircularGauge } from "./circular-gauge"

// Add imports at the top
import { waterQualityEngine, type WaterQualityReading } from "@/lib/water-quality-lstm"

// Firebase imports - use existing setup
import { ref, onValue, query, limitToLast } from "firebase/database"
import { db } from "@/lib/firebase"

// Sensor type definitions
const sensorTypes = {
  ph: {
    title: "pH Level",
    description: "pH is a measure of how acidic/basic water is. The range goes from 0 to 14, with 7 being neutral.",
    field: "field1",
    color: "#3b82f6",
    icon: "TestTube",
    unit: "",
    min: 0,
    max: 14,
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
    color: "#06b6d4",
    icon: "Droplets",
    unit: "ppm",
    min: 0,
    max: 1000,
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
    color: "#3b82f6",
    icon: "Thermometer",
    unit: "°C",
    min: 0,
    max: 50,
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
    color: "#10b981",
    icon: "Zap",
    unit: "μS/cm",
    min: 0,
    max: 2000,
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
    color: "#8b5cf6",
    icon: "Eye",
    unit: "NTU",
    min: 0,
    max: 1000,
    idealRange: "< 50 NTU",
    effects: [
      { range: "< 50 NTU", effect: "Very clear water, excellent for drinking and aquatic life." },
      { range: "50 - 100 NTU", effect: "Slightly cloudy but still acceptable for most uses." },
      { range: "100 - 500 NTU", effect: "Cloudy water, may affect aquatic life and require treatment for drinking." },
      { range: "> 500 NTU", effect: "Very cloudy water, harmful to aquatic life and requires significant treatment." },
    ],
  },
}

// Format timestamp for South Africa timezone
const formatSATimestamp = (timestamp: string | Date) => {
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
}

export default function EnhancedSensorDetail({ type }: { type: string }) {
  const router = useRouter()
  const sensorType = type

  const [data, setData] = useState<SensorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  const [hasRealData, setHasRealData] = useState(false)
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)

  const [isValidSensorType, setIsValidSensorType] = useState(!!sensorTypes[sensorType as keyof typeof sensorTypes])

  // Add state for computed scores
  const [computedAnomalyScore, setComputedAnomalyScore] = useState<number>(0)
  const [computedClassificationCode, setComputedClassificationCode] = useState<number>(1)
  const [waterQualityScore, setWaterQualityScore] = useState<number>(0)

  // Add state for the latest valid reading
  const [latestReading, setLatestReading] = useState<{ value: number; timestamp: string } | null>(null)

  // Ref for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null)

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

  // FIXED Water Quality Score Calculation
  const calculateWaterQualityScore = (readings: any): number => {
    if (!readings) return 0

    let score = 100
    const ph = Number.parseFloat(readings.ph) || 7.0
    const temperature = Number.parseFloat(readings.temperature) || 25.0
    const tds = Number.parseFloat(readings.tds) || 250
    const conductivity = Number.parseFloat(readings.ec) || 500
    const turbidity = Number.parseFloat(readings.turbidity) || 5.0

    console.log("🎯 Calculating water quality score:", { ph, temperature, tds, conductivity, turbidity })

    // CRITICAL pH scoring - pH 3.91 should result in very low score
    if (ph < 4.0) {
      score -= 70 // Emergency pH gets massive penalty
      console.log("🔴 Emergency pH penalty: -70")
    } else if (ph < 5.0) {
      score -= 50 // Critical pH gets major penalty
      console.log("🔴 Critical pH penalty: -50")
    } else if (ph < 6.0) {
      score -= 30 // Severe pH gets significant penalty
      console.log("⚠️ Severe pH penalty: -30")
    } else {
      const phDeviation = ph < 6.5 ? 6.5 - ph : ph > 8.5 ? ph - 8.5 : 0
      const phPenalty = phDeviation * 15
      score -= phPenalty
      console.log(`📊 pH deviation penalty: -${phPenalty}`)
    }

    // Temperature scoring
    if (temperature > 30) {
      const tempPenalty = (temperature - 30) * 3
      score -= tempPenalty
      console.log(`🌡️ High temperature penalty: -${tempPenalty}`)
    } else if (temperature > 25) {
      const tempPenalty = (temperature - 25) * 1
      score -= tempPenalty
      console.log(`🌡️ Elevated temperature penalty: -${tempPenalty}`)
    }

    // TDS scoring with higher penalties for very high values
    if (tds > 600) {
      const tdsPenalty = (tds - 600) * 0.05
      score -= tdsPenalty
      console.log(`💧 Very high TDS penalty: -${tdsPenalty}`)
    } else if (tds > 500) {
      const tdsPenalty = (tds - 500) * 0.03
      score -= tdsPenalty
      console.log(`💧 High TDS penalty: -${tdsPenalty}`)
    } else if (tds > 300) {
      const tdsPenalty = (tds - 300) * 0.01
      score -= tdsPenalty
      console.log(`💧 Elevated TDS penalty: -${tdsPenalty}`)
    }

    // Conductivity scoring with higher penalties
    if (conductivity > 1200) {
      const condPenalty = (conductivity - 1200) * 0.02
      score -= condPenalty
      console.log(`⚡ Very high conductivity penalty: -${condPenalty}`)
    } else if (conductivity > 1000) {
      const condPenalty = (conductivity - 1000) * 0.015
      score -= condPenalty
      console.log(`⚡ High conductivity penalty: -${condPenalty}`)
    } else if (conductivity > 800) {
      const condPenalty = (conductivity - 800) * 0.01
      score -= condPenalty
      console.log(`⚡ Elevated conductivity penalty: -${condPenalty}`)
    }

    // Turbidity scoring
    if (turbidity > 500) {
      const turbPenalty = (turbidity - 500) * 0.05
      score -= turbPenalty
      console.log(`🌊 Very high turbidity penalty: -${turbPenalty}`)
    } else if (turbidity > 100) {
      const turbPenalty = (turbidity - 100) * 0.02
      score -= turbPenalty
      console.log(`🌊 High turbidity penalty: -${turbPenalty}`)
    } else if (turbidity > 50) {
      const turbPenalty = (turbidity - 50) * 0.01
      score -= turbPenalty
      console.log(`🌊 Elevated turbidity penalty: -${turbPenalty}`)
    }

    const finalScore = Math.max(0, Math.round(score))
    console.log(`🎯 Final water quality score: ${finalScore}/100`)
    return finalScore
  }

  // Set up real-time listener using SAME LOGIC as working dashboard
  useEffect(() => {
    if (!sensor) return

    console.log(`🔴 Setting up SIMPLIFIED listener for ${sensorType} (same as dashboard)`)
    setLoading(true)
    setError(null)

    // Clean up previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    // Check if Firebase is available
    if (!db) {
      console.error("Firebase database not available")
      setError("Firebase database not available")
      setLoading(false)
      return
    }

    try {
      // Use EXACT same Firebase setup as working dashboard
      const sensorRef = ref(db, "sensor_readings")
      const recentReadingsQuery = query(sensorRef, limitToLast(50)) // Same as dashboard

      const unsubscribe = onValue(
        recentReadingsQuery,
        (snapshot) => {
          console.log(`📡 ${sensorType} update - using DASHBOARD logic`)

          if (!snapshot.exists()) {
            console.log(`❌ No data found for ${sensorType}`)
            setIsRealTimeConnected(false)
            setLoading(false)
            return
          }

          // Use EXACT same processing as dashboard
          const allReadings: any[] = []
          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val()
            if (data && typeof data === "object") {
              allReadings.push(data)
            }
          })

          console.log(`📊 ${sensorType} - Total readings:`, allReadings.length)

          if (allReadings.length === 0) {
            setError("No valid readings found")
            setLoading(false)
            return
          }

          // Get latest reading using SAME logic as dashboard
          const latestReading = allReadings[allReadings.length - 1]
          console.log(`📊 ${sensorType} - Latest reading:`, latestReading)

          if (latestReading) {
            // Extract the specific sensor value using SAME logic as dashboard
            let currentValue = 0
            switch (sensorType) {
              case "ph":
                currentValue = Number.parseFloat(latestReading.ph) || 0
                break
              case "tds":
                currentValue = Number.parseFloat(latestReading.tds) || 0
                break
              case "temperature":
                currentValue = Number.parseFloat(latestReading.temperature) || 0
                break
              case "conductivity":
                currentValue = Number.parseFloat(latestReading.ec) || 0 // Note: ec field
                break
              case "turbidity":
                currentValue = Number.parseFloat(latestReading.turbidity) || 0
                break
            }

            console.log(`✅ ${sensorType} DIRECT VALUE:`, currentValue)

            // Update state with the direct value
            setLatestReading({
              value: currentValue,
              timestamp: new Date().toISOString(),
            })

            // Calculate water quality score
            const qualityScore = calculateWaterQualityScore(latestReading)
            setWaterQualityScore(qualityScore)

            // Create sensor data for charts (convert to expected format with proper timestamps)
            const feeds = allReadings.map((reading, index) => {
              // Create timestamps that are spaced out for better chart visualization
              const baseTime = new Date()
              const timeOffset = (allReadings.length - index - 1) * 5 * 60 * 1000 // 5 minutes apart
              const timestamp = new Date(baseTime.getTime() - timeOffset)

              return {
                created_at: timestamp.toISOString(),
                entry_id: index + 1,
                field1: reading.ph?.toString() || "7.0",
                field2: reading.tds?.toString() || "250",
                field3: reading.temperature?.toString() || "25.0",
                field4: reading.ec?.toString() || "500",
                field5: reading.turbidity?.toString() || "5.0",
              }
            })

            // Sort feeds by timestamp (oldest first for proper chart display)
            feeds.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

            console.log(`📈 ${sensorType} - Chart data prepared:`, feeds.length, "points")

            const sensorData = {
              channel: {
                id: 1,
                name: "Water Quality Monitoring",
                description: `Real-time ${sensor.title} readings`,
                created_at: new Date(2023, 0, 1).toISOString(),
                updated_at: new Date().toISOString(),
                last_entry_id: feeds.length,
              },
              feeds,
            }

            setData(sensorData)
            setIsRealTimeConnected(true)
            setLoading(false)
            setError(null)
            setLastUpdated(new Date())
          }
        },
        (error) => {
          console.error(`❌ ${sensorType} Firebase error:`, error)
          setError(`Connection error: ${error.message}`)
          setIsRealTimeConnected(false)
          setLoading(false)
        },
      )

      unsubscribeRef.current = unsubscribe
      console.log(`✅ SIMPLIFIED listener set up for ${sensorType}`)
    } catch (err) {
      console.error(`❌ Error setting up ${sensorType} listener:`, err)
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
      setIsRealTimeConnected(false)
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [sensorType, sensor])

  // Add effect to compute scores when data changes
  useEffect(() => {
    if (data?.feeds && data.feeds.length > 0) {
      const computeScores = async () => {
        try {
          const recentReadings: WaterQualityReading[] = data.feeds.slice(0, 50).map((feed) => ({
            ph: Number.parseFloat(feed.field1),
            tds: Number.parseFloat(feed.field2),
            temperature: Number.parseFloat(feed.field3),
            conductivity: Number.parseFloat(feed.field4),
            turbidity: Number.parseFloat(feed.field5),
            timestamp: feed.created_at,
          }))

          waterQualityEngine.setRecentReadings(recentReadings)

          const latestValue = latestReading?.value || Number.parseFloat(data.feeds[0][sensor.field]) || 0

          const reading: WaterQualityReading = {
            ph: sensorType === "ph" ? latestValue : Number.parseFloat(data.feeds[0].field1),
            tds: sensorType === "tds" ? latestValue : Number.parseFloat(data.feeds[0].field2),
            temperature: sensorType === "temperature" ? latestValue : Number.parseFloat(data.feeds[0].field3),
            conductivity: sensorType === "conductivity" ? latestValue : Number.parseFloat(data.feeds[0].field4),
            turbidity: sensorType === "turbidity" ? latestValue : Number.parseFloat(data.feeds[0].field5),
            timestamp: latestReading?.timestamp || data.feeds[0].created_at,
          }

          const analysis = await waterQualityEngine.analyzeReading(reading)
          setComputedAnomalyScore(analysis.anomalyScore)
          setComputedClassificationCode(analysis.classificationCode)
        } catch (error) {
          console.error("Error computing scores:", error)
        }
      }

      computeScores()
    }
  }, [data, sensorType, latestReading, sensor.field])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  // Get current value using latest reading
  const currentValue = latestReading ? latestReading.value : 0

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

  // Calculate trend
  const calculateTrend = () => {
    if (!data?.feeds || data.feeds.length < 2) return null

    const recent = data.feeds.slice(-5).map((feed: any) => Number.parseFloat(feed[sensor.field]))
    const older = data.feeds.slice(-10, -5).map((feed: any) => Number.parseFloat(feed[sensor.field]))

    if (recent.length === 0 || older.length === 0) return null

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length

    const change = recentAvg - olderAvg
    const percentChange = ((change / olderAvg) * 100).toFixed(1)

    return {
      direction: change > 0.1 ? "up" : change < -0.1 ? "down" : "stable",
      change: Math.abs(change).toFixed(2),
      percentChange: Math.abs(Number.parseFloat(percentChange)),
    }
  }

  // Calculate quality assessment
  const calculateQualityAssessment = () => {
    if (!data?.feeds || data.feeds.length === 0) return null

    const values = data.feeds
      .map((feed: any) => Number.parseFloat(feed[sensor.field]))
      .filter((val: number) => !isNaN(val))

    if (values.length === 0) return null

    const idealRanges: Record<string, { min: number; max: number }> = {
      ph: { min: 6.5, max: 8.5 },
      tds: { min: 50, max: 300 },
      temperature: { min: 10, max: 25 },
      conductivity: { min: 200, max: 800 },
      turbidity: { min: 0, max: 50 },
    }

    const range = idealRanges[sensorType]
    if (!range) return null

    const inRangeCount = values.filter((val) => val >= range.min && val <= range.max).length
    const percentage = (inRangeCount / values.length) * 100

    return {
      percentage: percentage.toFixed(1),
      status: percentage >= 80 ? "excellent" : percentage >= 60 ? "good" : percentage >= 40 ? "fair" : "poor",
    }
  }

  const stats = calculateStats()
  const trend = calculateTrend()
  const quality = calculateQualityAssessment()

  if (error && !data) {
    return (
      <Alert
        variant="destructive"
        className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border border-red-200 dark:border-red-900"
      >
        <AlertCircle className="w-4 h-4" />
        <AlertTitle>Connection Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-white p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
              className="rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to dashboard</span>
            </Button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold">{sensor.title}</h1>
                {isRealTimeConnected ? (
                  <Badge className="bg-green-600 hover:bg-green-700">
                    <Radio className="w-3 h-3 mr-1 animate-pulse" />
                    Live
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Disconnected
                  </Badge>
                )}
                {isUsingMockData && <Badge variant="secondary">Mock Data</Badge>}
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  Score: {waterQualityScore}/100
                </Badge>
              </div>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">{sensor.description}</p>
              {lastUpdated && (
                <p className="text-xs sm:text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>
              )}
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <Alert className="bg-yellow-900/50 border-yellow-600">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <AlertTitle className="text-yellow-300">Connection Warning</AlertTitle>
            <AlertDescription className="text-yellow-200">
              {error} The dashboard will continue to show the last received data.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="bg-gray-800 w-full sm:w-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="charts" className="text-xs sm:text-sm">
              Charts
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs sm:text-sm">
              Analysis
            </TabsTrigger>
            <TabsTrigger value="raw-data" className="text-xs sm:text-sm">
              Raw Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Current Reading & Quick Stats */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-900 dark:text-white text-lg">Current Reading</CardTitle>
                  {latestReading && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatSATimestamp(latestReading.timestamp)}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <CircularGauge
                      value={currentValue || 0}
                      min={sensor.min}
                      max={sensor.max}
                      title={sensor.title}
                      unit={sensor.unit}
                      color={sensor.color}
                      loading={loading}
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-400">
                      Ideal Range: <span className="font-semibold text-white">{sensor.idealRange}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-900 dark:text-white text-lg">Trend Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-20 w-full bg-gray-200 dark:bg-gray-700" />
                  ) : trend ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {trend.direction === "up" && <TrendingUp className="h-6 w-6 text-green-400" />}
                        {trend.direction === "down" && <TrendingDown className="h-6 w-6 text-red-400" />}
                        {trend.direction === "stable" && <Minus className="h-6 w-6 text-gray-400" />}
                        <span className="text-lg font-semibold text-white">
                          {trend.direction === "up"
                            ? "Increasing"
                            : trend.direction === "down"
                              ? "Decreasing"
                              : "Stable"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        <p>
                          Change: ±{trend.change} {sensor.unit}
                        </p>
                        <p>Percentage: {trend.percentChange}%</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400">Insufficient data for trend analysis</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-900 dark:text-white text-lg">Quality Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-20 w-full bg-gray-200 dark:bg-gray-700" />
                  ) : quality ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">{quality.percentage}%</div>
                        <div className="text-sm text-gray-400">readings in ideal range</div>
                      </div>
                      <Progress value={Number.parseFloat(quality.percentage)} className="h-2" />
                      <Badge
                        className={
                          quality.status === "excellent"
                            ? "bg-green-600"
                            : quality.status === "good"
                              ? "bg-blue-600"
                              : quality.status === "fair"
                                ? "bg-yellow-600"
                                : "bg-red-600"
                        }
                      >
                        {quality.status.toUpperCase()}
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-gray-400">No data available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Statistics Grid */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Statistics</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Statistical analysis for the selected time period
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full bg-gray-200 dark:bg-gray-700" />
                    ))}
                  </div>
                ) : stats ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Minimum</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.min} {sensor.unit}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Maximum</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.max} {sensor.unit}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Average</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.avg} {sensor.unit}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Std Dev</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.stdDev} {sensor.unit}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-400">No data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts" className="space-y-4 sm:space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg sm:text-xl">
                  {sensor.title} History - Recent Readings
                </CardTitle>
                <CardDescription className="text-gray-400">Real-time sensor readings over time</CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                <div className="h-[300px] sm:h-[400px] w-full">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Skeleton className="h-full w-full bg-gray-700" />
                    </div>
                  ) : data?.feeds && data.feeds.length > 0 ? (
                    <SensorChart
                      data={data.feeds}
                      dataKey={sensor.field}
                      name={sensor.title}
                      color={sensor.color}
                      loading={false}
                      timeKey="created_at"
                      unit={sensor.unit}
                      isClassification={sensorType === "classification"}
                      formatTime={(timestamp) => {
                        const date = new Date(timestamp)
                        return date.toLocaleTimeString("en-ZA", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Africa/Johannesburg",
                        })
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">No chart data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 sm:space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Effects and Interpretation</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Understanding the impact of different {sensor.title.toLowerCase()} levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sensor.effects.map((effect, index) => (
                    <div key={index} className="p-4 rounded-lg bg-gray-700">
                      <h3 className="text-lg font-semibold mb-2 text-white">{effect.range}</h3>
                      <p className="text-gray-300 text-sm sm:text-base">{effect.effect}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="raw-data" className="space-y-4 sm:space-y-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Raw Data</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Recent sensor readings ({data?.feeds?.length || 0} entries)
                    </CardDescription>
                  </div>
                  {data?.feeds && (
                    <ExportButton
                      data={data.feeds.map((feed: any) => ({
                        timestamp: new Date(feed.created_at).toLocaleString(),
                        value: feed[sensor.field],
                      }))}
                      filename={`${sensorType}-data.csv`}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="text-left p-2 text-gray-700 dark:text-gray-300">Timestamp</th>
                        <th className="text-left p-2 text-gray-700 dark:text-gray-300">Value</th>
                        <th className="text-left p-2 text-gray-700 dark:text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.feeds?.slice(0, 50).map((feed: any, index) => {
                        const value = Number.parseFloat(feed[sensor.field])
                        const timestamp = new Date(feed.created_at)

                        let status = "Normal"
                        let statusColor = "text-green-400"

                        if (sensorType === "ph") {
                          if (value < 6.5 || value > 8.5) {
                            status = "Warning"
                            statusColor = "text-yellow-400"
                          }
                          if (value < 5 || value > 9) {
                            status = "Critical"
                            statusColor = "text-red-400"
                          }
                        }

                        return (
                          <tr key={index} className="border-b border-gray-200 dark:border-gray-600">
                            <td className="p-2 text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                              {timestamp.toLocaleString()}
                            </td>
                            <td className="p-2 text-gray-900 dark:text-white font-mono text-xs sm:text-sm">
                              {value.toFixed(2)} {sensor.unit}
                            </td>
                            <td className={`p-2 ${statusColor} text-xs sm:text-sm`}>{status}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
