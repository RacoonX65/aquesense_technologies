// Shared sensor data processing to ensure dashboard and individual pages show identical values
import { ref, onValue, query, limitToLast } from "firebase/database"
import { db } from "@/lib/firebase"

export interface SensorReading {
  created_at: string
  entry_id: number
  field1: string // pH
  field2: string // TDS
  field3: string // Temperature
  field4: string // Conductivity
  field5: string // Turbidity
}

export interface SensorData {
  channel: {
    id: number
    name: string
    description: string
    created_at: string
    updated_at: string
    last_entry_id: number
  }
  feeds: SensorReading[]
}

export interface LatestSensorValues {
  ph: { value: number; timestamp: string }
  tds: { value: number; timestamp: string }
  temperature: { value: number; timestamp: string }
  conductivity: { value: number; timestamp: string }
  turbidity: { value: number; timestamp: string }
}

// SHARED PROCESSING FUNCTION - Used by both dashboard and individual pages
export function processFirebaseData(snapshot: any): { sensorData: SensorData; latestValues: LatestSensorValues } {
  console.log("🔄 Processing Firebase data with SHARED logic")

  const feeds: SensorReading[] = []
  let lastEntryId = 0

  // Process each Firebase entry
  snapshot.forEach((childSnapshot: any) => {
    const data = childSnapshot.val()

    // Get timestamp - CONSISTENT LOGIC
    let timestamp: Date
    if (data.timestamp) {
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

    // Map Firebase fields - CONSISTENT MAPPING
    const reading: SensorReading = {
      created_at: timestamp.toISOString(),
      entry_id: data.entry_id || feeds.length + 1,
      field1: data.ph?.toString() || data.field1?.toString() || "7.0", // pH
      field2: data.tds?.toString() || data.field2?.toString() || "250", // TDS
      field3: data.temperature?.toString() || data.field3?.toString() || "25.0", // Temperature
      field4: data.ec?.toString() || data.conductivity?.toString() || data.field4?.toString() || "500", // EC/Conductivity
      field5: data.turbidity?.toString() || data.field5?.toString() || "5.0", // Turbidity
    }

    feeds.push(reading)
    lastEntryId = Math.max(lastEntryId, reading.entry_id)
  })

  // Sort by timestamp - CONSISTENT SORTING
  feeds.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  console.log(`✅ Processed ${feeds.length} readings, sorted by timestamp`)

  // Get latest values using CONSISTENT LOGIC
  const latestValues = getLatestValues(feeds)

  const sensorData: SensorData = {
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

  return { sensorData, latestValues }
}

// SHARED LATEST VALUES FUNCTION - Ensures both dashboard and individual pages get same values
function getLatestValues(feeds: SensorReading[]): LatestSensorValues {
  console.log("🎯 Getting latest values with SHARED logic")

  // Safe parsing function
  const safeParseFloat = (value: string | undefined, defaultValue: number): number => {
    if (!value) return defaultValue
    const parsed = Number.parseFloat(value)
    return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed
  }

  // Find latest valid reading for each sensor type
  const findLatestValidReading = (
    fieldName: keyof SensorReading,
    defaultValue: number,
  ): { value: number; timestamp: string } => {
    for (const feed of feeds) {
      const fieldValue = feed[fieldName]
      if (fieldValue) {
        const parsed = safeParseFloat(fieldValue as string, defaultValue)
        if (!isNaN(parsed) && isFinite(parsed)) {
          console.log(`📊 Latest ${fieldName}:`, parsed, "at", feed.created_at)
          return { value: parsed, timestamp: feed.created_at }
        }
      }
    }
    return { value: defaultValue, timestamp: new Date().toISOString() }
  }

  const latestValues: LatestSensorValues = {
    ph: findLatestValidReading("field1", 7.0),
    tds: findLatestValidReading("field2", 250),
    temperature: findLatestValidReading("field3", 25),
    conductivity: findLatestValidReading("field4", 500),
    turbidity: findLatestValidReading("field5", 5),
  }

  console.log("🎯 Latest values extracted:", latestValues)
  return latestValues
}

// SHARED FIREBASE LISTENER - Used by both dashboard and individual pages
export function setupSharedSensorListener(
  callback: (sensorData: SensorData, latestValues: LatestSensorValues) => void,
  onError?: (error: Error) => void,
  onConnectionChange?: (connected: boolean) => void,
): () => void {
  console.log("🔥 Setting up SHARED Firebase listener (last 50 readings)")

  if (!db) {
    console.error("❌ Firebase database not available")
    if (onError) {
      onError(new Error("Firebase database not available"))
    }
    return () => {}
  }

  try {
    // Create reference to sensor_readings node - LAST 50 READINGS
    const sensorRef = ref(db, "sensor_readings")
    const recentReadingsQuery = query(sensorRef, limitToLast(50)) // Changed from 100 to 50

    // Set up real-time listener
    const unsubscribe = onValue(
      recentReadingsQuery,
      (snapshot) => {
        console.log("📡 SHARED Firebase update received")

        if (!snapshot.exists()) {
          console.log("❌ No data found in Firebase")
          if (onConnectionChange) onConnectionChange(false)
          return
        }

        // Process data using SHARED logic
        const { sensorData, latestValues } = processFirebaseData(snapshot)

        console.log("✅ SHARED processing complete:", {
          totalReadings: sensorData.feeds.length,
          latestPH: latestValues.ph.value,
          latestTemp: latestValues.temperature.value,
        })

        if (onConnectionChange) onConnectionChange(true)
        callback(sensorData, latestValues)
      },
      (error) => {
        console.error("❌ SHARED Firebase listener error:", error)
        if (onConnectionChange) onConnectionChange(false)
        if (onError) {
          onError(error)
        }
      },
    )

    console.log("✅ SHARED Firebase listener set up successfully")
    return unsubscribe
  } catch (error) {
    console.error("❌ Error setting up SHARED Firebase listener:", error)
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)))
    }
    return () => {}
  }
}
