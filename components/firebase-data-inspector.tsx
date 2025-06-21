"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, CheckCircle, AlertTriangle, Clock } from "lucide-react"
import { initializeFirebaseRealtime } from "@/lib/firebase-realtime"
import { ref, onValue, query, limitToLast, orderByKey } from "firebase/database"

export function FirebaseDataInspector() {
  const [rawData, setRawData] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [updateCount, setUpdateCount] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [latestTimestamp, setLatestTimestamp] = useState<string | null>(null)

  useEffect(() => {
    console.log("🔍 Starting Firebase Data Inspector (timestamp-based)...")

    const { db } = initializeFirebaseRealtime()

    if (!db) {
      setError("Firebase database not available")
      return
    }

    setConnectionStatus("Connecting...")

    try {
      const sensorRef = ref(db, "sensor_readings")
      // Order by key (timestamp) and get the most recent entries
      const recentReadingsQuery = query(sensorRef, orderByKey(), limitToLast(10))

      const unsubscribe = onValue(
        recentReadingsQuery,
        (snapshot) => {
          const now = new Date()
          console.log(`🔍 [${now.toISOString()}] Raw Firebase data received`)

          setConnectionStatus("Connected")
          setLastUpdate(now)
          setUpdateCount((prev) => prev + 1)
          setError(null)

          if (snapshot.exists()) {
            const data: any = {}
            let latest = ""

            snapshot.forEach((childSnapshot) => {
              const key = childSnapshot.key || "unknown"
              data[key] = childSnapshot.val()
              if (key > latest) latest = key // Get the latest timestamp
            })

            console.log("🔍 Raw Firebase data:", data)
            console.log("🔍 Latest timestamp:", latest)

            setRawData(data)
            setLatestTimestamp(latest)
          } else {
            console.log("🔍 No data in Firebase")
            setRawData(null)
            setLatestTimestamp(null)
          }
        },
        (error) => {
          console.error("🔍 Firebase inspector error:", error)
          setConnectionStatus("Error")
          setError(error.message)
        },
      )

      return () => {
        console.log("🔍 Cleaning up Firebase inspector")
        unsubscribe()
      }
    } catch (err) {
      console.error("🔍 Inspector setup error:", err)
      setError(err instanceof Error ? err.message : String(err))
      setConnectionStatus("Setup Error")
    }
  }, [])

  const formatTimestamp = (timestamp: string | Date) => {
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Firebase Data Inspector (Timestamp-Based Structure)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <Badge
                variant={connectionStatus === "Connected" ? "default" : "destructive"}
                className={connectionStatus === "Connected" ? "bg-green-600" : ""}
              >
                {connectionStatus === "Connected" ? (
                  <CheckCircle className="mr-1 h-3 w-3" />
                ) : (
                  <AlertTriangle className="mr-1 h-3 w-3" />
                )}
                {connectionStatus}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Updates</div>
              <div className="text-lg font-bold text-green-600">{updateCount}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Last Update</div>
              <div className="text-sm font-medium">{lastUpdate ? formatTimestamp(lastUpdate) : "Never"}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Records</div>
              <div className="text-lg font-bold">{rawData ? Object.keys(rawData).length : 0}</div>
            </div>
          </div>

          {latestTimestamp && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <div className="text-green-800 font-medium">Latest Data Timestamp:</div>
                <div className="text-green-700 font-mono text-sm">{latestTimestamp}</div>
              </div>
              <div className="text-green-600 text-sm mt-1">SAST: {formatTimestamp(latestTimestamp)}</div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-red-800 font-medium">Error:</div>
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          )}

          {rawData && (
            <div className="space-y-4">
              <h3 className="font-medium">Raw Firebase Data (Last 10 Records):</h3>
              <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-auto">
                <pre className="text-xs">{JSON.stringify(rawData, null, 2)}</pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Latest Record Analysis:</h4>
                {(() => {
                  const timestamps = Object.keys(rawData).sort().reverse()
                  if (timestamps.length === 0) return <div>No data available</div>

                  const latestTimestamp = timestamps[0]
                  const latestData = rawData[latestTimestamp]

                  return (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <strong>Timestamp Key:</strong> {latestTimestamp}
                        </div>
                        <div>
                          <strong>Entry ID:</strong> {latestData.entry_id || "N/A"}
                        </div>
                        <div>
                          <strong>pH:</strong> {latestData.ph || "N/A"}
                        </div>
                        <div>
                          <strong>TDS:</strong> {latestData.tds || "N/A"}
                        </div>
                        <div>
                          <strong>Temperature:</strong> {latestData.temperature || "N/A"}
                        </div>
                        <div>
                          <strong>EC:</strong> {latestData.ec || "N/A"}
                        </div>
                        <div>
                          <strong>Turbidity:</strong> {latestData.turbidity || "N/A"}
                        </div>
                        <div>
                          <strong>Data Timestamp:</strong> {latestData.timestamp || "N/A"}
                        </div>
                      </div>
                      <div className="mt-2 p-2 bg-white rounded border">
                        <div className="text-xs text-gray-600">
                          <strong>Expected Arduino Structure:</strong>
                        </div>
                        <pre className="text-xs mt-1 text-gray-700">
                          {`{
  "sensor_readings": {
    "${latestTimestamp}": {
      "entry_id": "${latestTimestamp}",
      "temperature": "${latestData.temperature || "25.50"}",
      "ph": "${latestData.ph || "7.20"}",
      "tds": "${latestData.tds || "350.00"}",
      "ec": "${latestData.ec || "700.00"}",
      "turbidity": "${latestData.turbidity || "5.00"}",
      "timestamp": "${latestTimestamp}"
    }
  }
}`}
                        </pre>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
