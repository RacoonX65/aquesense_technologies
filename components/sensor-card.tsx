"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CircularGauge } from "./circular-gauge"
import { Droplets, Thermometer, Zap, Eye, TestTube, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

interface SensorCardProps {
  type: "ph" | "tds" | "temperature" | "conductivity" | "turbidity"
  value: number
  min: number
  max: number
  loading?: boolean
  timestamp?: string // Add timestamp prop
}

const sensorConfig = {
  ph: {
    title: "pH Level",
    unit: "pH",
    color: "#3b82f6", // blue
    icon: TestTube,
  },
  tds: {
    title: "TDS",
    unit: "ppm",
    color: "#06b6d4", // cyan
    icon: Droplets,
  },
  temperature: {
    title: "Temp",
    unit: "°C",
    color: "#3b82f6", // blue
    icon: Thermometer,
  },
  conductivity: {
    title: "EC",
    unit: "µS/cm",
    color: "#10b981", // green
    icon: Zap,
  },
  turbidity: {
    title: "Turbidity",
    unit: "NTU",
    color: "#8b5cf6", // purple
    icon: Eye,
  },
}

// Enhanced status evaluation with updated turbidity thresholds
const getStatusForValue = (type: string, value: number): { status: string; message: string; color: string } => {
  // Handle invalid values (NaN, Infinity)
  if (isNaN(value) || !isFinite(value)) {
    return {
      status: "Error",
      message: "Sensor error or disconnected",
      color: "text-red-600 dark:text-red-400",
    }
  }

  switch (type) {
    case "ph":
      if (value >= 6.5 && value <= 8.5)
        return { status: "Excellent", message: "Optimal pH range", color: "text-green-600 dark:text-green-400" }
      if (value >= 6.0 && value <= 9.0)
        return { status: "Good", message: "Acceptable pH range", color: "text-blue-600 dark:text-blue-400" }
      if (value >= 5.0 && value <= 9.5)
        return { status: "Fair", message: "pH outside ideal range", color: "text-yellow-600 dark:text-yellow-400" }
      return { status: "Critical", message: "Dangerous pH level", color: "text-red-600 dark:text-red-400" }

    case "tds":
      if (value >= 50 && value <= 300)
        return { status: "Excellent", message: "Optimal TDS range", color: "text-green-600 dark:text-green-400" }
      if (value >= 30 && value <= 400)
        return { status: "Good", message: "Acceptable TDS range", color: "text-blue-600 dark:text-blue-400" }
      if (value >= 0 && value <= 500)
        return { status: "Fair", message: "TDS outside ideal range", color: "text-yellow-600 dark:text-yellow-400" }
      return { status: "Critical", message: "Dangerous TDS level", color: "text-red-600 dark:text-red-400" }

    case "temperature":
      if (value >= 10 && value <= 25)
        return { status: "Excellent", message: "Optimal temperature", color: "text-green-600 dark:text-green-400" }
      if (value >= 5 && value <= 30)
        return { status: "Good", message: "Acceptable temperature", color: "text-blue-600 dark:text-blue-400" }
      if (value >= 0 && value <= 35)
        return {
          status: "Fair",
          message: "Temperature outside ideal range",
          color: "text-yellow-600 dark:text-yellow-400",
        }
      return { status: "Critical", message: "Dangerous temperature", color: "text-red-600 dark:text-red-400" }

    case "conductivity":
      if (value >= 200 && value <= 800)
        return { status: "Excellent", message: "Optimal conductivity", color: "text-green-600 dark:text-green-400" }
      if (value >= 100 && value <= 1000)
        return { status: "Good", message: "Acceptable conductivity", color: "text-blue-600 dark:text-blue-400" }
      if (value >= 50 && value <= 1200)
        return {
          status: "Fair",
          message: "Conductivity outside ideal range",
          color: "text-yellow-600 dark:text-yellow-400",
        }
      return { status: "Critical", message: "Dangerous conductivity level", color: "text-red-600 dark:text-red-400" }

    case "turbidity":
      // Updated turbidity thresholds for 0-1000 range
      if (value >= 0 && value <= 50)
        return { status: "Excellent", message: "Crystal clear water", color: "text-green-600 dark:text-green-400" }
      if (value >= 51 && value <= 100)
        return { status: "Good", message: "Slightly cloudy water", color: "text-blue-600 dark:text-blue-400" }
      if (value >= 101 && value <= 500)
        return { status: "Fair", message: "Moderately cloudy water", color: "text-yellow-600 dark:text-yellow-400" }
      if (value >= 501 && value <= 800)
        return { status: "Poor", message: "Very cloudy water", color: "text-orange-600 dark:text-orange-400" }
      return { status: "Critical", message: "Extremely turbid water", color: "text-red-600 dark:text-red-400" }

    default:
      return { status: "Unknown", message: "Unknown sensor type", color: "text-gray-600 dark:text-gray-400" }
  }
}

// Format timestamp for South Africa timezone
const formatSATimestamp = (timestamp: string | Date) => {
  if (!timestamp) return "No data"

  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp

  // Check if date is valid
  if (isNaN(date.getTime())) return "Invalid date"

  return date.toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

export function SensorCard({ type, value, min, max, loading = false, timestamp }: SensorCardProps) {
  const config = sensorConfig[type]
  const Icon = config.icon
  const router = useRouter()

  // Debug logging to verify values
  console.log(`🔍 SensorCard ${type}:`, { value, min, max, timestamp, loading })

  const handleClick = () => {
    router.push(`/dashboard/sensor/${type}`)
  }

  // Get status information
  const statusInfo = getStatusForValue(type, value)

  return (
    <Card
      className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-gray-900 dark:text-white">
          <Icon className="h-4 w-4" />
          {config.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CircularGauge
          value={value}
          min={min}
          max={max}
          title={config.title}
          unit={config.unit}
          color={config.color}
          loading={loading}
        />
        {/* Add status indicator */}
        <div className="mt-2 text-center">
          <div className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.status}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{statusInfo.message}</div>
          {timestamp && (
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center justify-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatSATimestamp(timestamp)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
