"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { subscribeToSensorData, type SensorData } from "@/lib/firebase"

interface SensorValueDebugProps {
  sensorType: "ph" | "temperature" | "tds" | "conductivity" | "turbidity"
}

export function SensorValueDebug({ sensorType }: SensorValueDebugProps) {
  const [dashboardValue, setDashboardValue] = useState<number>(0)
  const [dashboardTimestamp, setDashboardTimestamp] = useState<string>("")
  const [rawData, setRawData] = useState<any>(null)

  const fieldMap = {
    ph: "field1",
    tds: "field2",
    temperature: "field3",
    conductivity: "field4",
    turbidity: "field5",
  }

  const field = fieldMap[sensorType]

  useEffect(() => {
    const unsubscribe = subscribeToSensorData(
      "1",
      (data: SensorData) => {
        if (data.feeds && data.feeds.length > 0) {
          // USE EXACT SAME LOGIC AS MAIN DASHBOARD
          const feeds = data.feeds
          const sortedFeeds = [...feeds].sort((a, b) => {
            const dateA = new Date(a.created_at).getTime()
            const dateB = new Date(b.created_at).getTime()
            return dateB - dateA
          })

          const safeParseFloat = (value: string | undefined, defaultValue: number) => {
            if (!value) return defaultValue
            const parsed = Number.parseFloat(value)
            return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed
          }

          const findLatestValidReading = (fieldName: string, defaultValue: number) => {
            for (const feed of sortedFeeds) {
              const fieldValue = feed[fieldName as keyof typeof feed]
              if (fieldValue) {
                const parsed = safeParseFloat(fieldValue as string, defaultValue)
                if (!isNaN(parsed) && isFinite(parsed)) {
                  return { value: parsed, timestamp: feed.created_at }
                }
              }
            }
            return { value: defaultValue, timestamp: new Date().toISOString() }
          }

          const defaultValues = { ph: 7.0, tds: 250, temperature: 25, conductivity: 500, turbidity: 5 }
          const reading = findLatestValidReading(field, defaultValues[sensorType])

          setDashboardValue(reading.value)
          setDashboardTimestamp(reading.timestamp)
          setRawData(sortedFeeds[0])
        }
      },
      (error) => console.error("Debug error:", error),
    )

    return unsubscribe
  }, [sensorType, field])

  return (
    <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
      <CardHeader>
        <CardTitle className="text-yellow-800 dark:text-yellow-200">
          🐛 Debug: {sensorType.toUpperCase()} Value Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>
          <strong>Dashboard Logic Value:</strong> {dashboardValue}
        </div>
        <div>
          <strong>Field:</strong> {field}
        </div>
        <div>
          <strong>Timestamp:</strong> {dashboardTimestamp}
        </div>
        <div>
          <strong>Raw Latest Data:</strong>
        </div>
        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
          {JSON.stringify(rawData, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}
