// Firebase configuration and helper functions with public read access
import { initializeApp, getApps, getApp } from "firebase/app"
import { getDatabase, ref, query, limitToLast, onValue, push, serverTimestamp, get } from "firebase/database"
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth"

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

// Initialize Firebase with error handling
let app
let db
let auth
let currentUser: User | null = null
let authInitialized = false
let authCheckPromise: Promise<User | null> | null = null

try {
  // Initialize Firebase app
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

  // Initialize Firebase Auth
  if (app) {
    auth = getAuth(app)
    console.log("Firebase Auth initialized successfully")
  }

  // Check if databaseURL is available before initializing database
  if (!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) {
    console.warn("Firebase Database URL is not configured. Using mock data.")
    db = null
  } else {
    // Initialize Realtime Database
    db = getDatabase(app)
    console.log("Firebase Realtime Database initialized successfully")
  }
} catch (error) {
  console.error("Error initializing Firebase:", error)
  app = null
  db = null
  auth = null
}

// Interface for sensor data
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

// Check if Firebase database is available
const isFirebaseDbAvailable = () => {
  return !!db
}

// Initialize authentication state listener (for write operations only)
function initializeAuthListener(): Promise<User | null> {
  if (authCheckPromise) {
    return authCheckPromise
  }

  authCheckPromise = new Promise((resolve) => {
    if (!auth) {
      console.warn("Firebase Auth not available")
      authInitialized = true
      resolve(null)
      return
    }

    if (authInitialized) {
      resolve(currentUser)
      return
    }

    console.log("Setting up auth state listener...")

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? `SIGNED_IN ${user.uid}` : "SIGNED_OUT")

      currentUser = user
      authInitialized = true

      if (user) {
        console.log("✅ User authenticated for write operations:", user.uid)
        resolve(user)
      } else {
        console.log("❌ No authenticated user for write operations")
        resolve(null)
      }
    })

    // Set a timeout to resolve if auth takes too long
    setTimeout(() => {
      if (!authInitialized) {
        console.log("Auth initialization timeout, proceeding without auth")
        authInitialized = true
        resolve(null)
      }
    }, 3000)
  })

  return authCheckPromise
}

// Check if user is authenticated (for write operations)
async function checkWriteAuthentication(): Promise<boolean> {
  if (!auth) {
    console.log("Firebase Auth not available")
    return false
  }

  if (currentUser) {
    console.log("User already authenticated for write operations:", currentUser.uid)
    return true
  }

  console.log("Checking authentication status for write operations...")
  const user = await initializeAuthListener()

  if (user) {
    console.log("Authentication confirmed for write operations:", user.uid)
    return true
  } else {
    console.log("No authenticated user for write operations")
    return false
  }
}

// Extract key functions from firebase.ts to fix the data processing issues

// Update the part that processes readings to handle invalid values
function processReading(data: any, key: string): SensorReading {
  // Use safe number parsing that handles Infinity, NaN, and null values
  const safeParseFloat = (value: any): string => {
    if (value === undefined || value === null) return "0.00"
    const parsed = Number.parseFloat(value)
    if (isNaN(parsed) || !isFinite(parsed)) return "0.00" // Handle NaN and Infinity
    return parsed.toFixed(2)
  }

  // Handle potential undefined data
  if (!data) {
    console.warn(`Invalid data entry for key ${key}`)
    return {
      created_at: new Date(key || Date.now()).toISOString(),
      entry_id: Date.parse(key || Date.now().toString()),
      field1: "7.0", // Default pH
      field2: "0.0", // Default TDS
      field3: "25.0", // Default Temperature
      field4: "0.0", // Default Conductivity
      field5: "0.0", // Default Turbidity
    }
  }

  // Create timestamp from key or data
  let timestamp: Date
  try {
    timestamp = new Date(key || data.timestamp || Date.now())
  } catch (e) {
    timestamp = new Date()
  }

  // Apply safe parsing to every sensor value
  return {
    created_at: timestamp.toISOString(),
    entry_id: Date.parse(key || Date.now().toString()),
    field1: safeParseFloat(data.ph || data.field1),
    field2: safeParseFloat(data.tds || data.field2),
    field3: safeParseFloat(data.temperature || data.field3),
    field4: safeParseFloat(data.ec || data.conductivity || data.field4),
    field5: safeParseFloat(data.turbidity || data.field5),
  }
}

// Real-time listener for sensor data with public read access
export function subscribeToSensorData(
  hours: string,
  callback: (data: SensorData) => void,
  onError?: (error: Error) => void,
): () => void {
  console.log("🚀 Starting subscribeToSensorData with hours:", hours)

  const setupListener = async () => {
    try {
      console.log(`Setting up real-time listener for the last ${hours} hours`)
      console.log("Firebase config check:", {
        hasApp: !!app,
        hasDb: !!db,
        hasAuth: !!auth,
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ? "✅ Set" : "❌ Missing",
      })

      // If Firebase database is not available, use mock data
      if (!isFirebaseDbAvailable()) {
        console.log("❌ Firebase database not available, using mock data")
        callback(generateMockData(Number.parseInt(hours)))
        return () => {}
      }

      console.log("🔥 Setting up Firebase Realtime Database listener (public read access)...")

      try {
        // Query Firebase Realtime Database for sensor readings
        const sensorRef = ref(db, "sensor_readings")
        console.log("📍 Database reference created:", sensorRef.toString())

        const recentReadingsQuery = query(sensorRef, limitToLast(100))
        console.log("📊 Query created for last 100 readings")

        // Set up real-time listener
        const unsubscribe = onValue(
          recentReadingsQuery,
          (snapshot) => {
            console.log("📊 Real-time update received from Firebase")
            console.log("📊 Snapshot exists:", snapshot.exists())
            console.log("📊 Snapshot size:", snapshot.size)

            if (!snapshot.exists()) {
              console.log("No data found in Firebase, using mock data")
              callback(generateMockData(Number.parseInt(hours)))
              return
            }

            // Process Firebase data - Updated to be more flexible with field names
            const feeds: SensorReading[] = []
            let lastEntryId = 0
            const now = new Date()
            const startTime = now.getTime() - Number.parseInt(hours) * 60 * 60 * 1000

            snapshot.forEach((childSnapshot) => {
              const data = childSnapshot.val()
              console.log("📊 Child data:", data)

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
                // Handle different field naming conventions - PRIORITIZE DIRECT NAMES
                const reading = {
                  created_at: timestamp.toISOString(),
                  entry_id: data.entry_id || feeds.length + 1,
                  // Prioritize direct field names from ESP32, fallback to generic field names
                  field1: data.ph?.toString() || data.field1?.toString() || "7.0", // pH
                  field2: data.tds?.toString() || data.field2?.toString() || "250", // TDS
                  field3: data.temperature?.toString() || data.field3?.toString() || "25.0", // Temperature
                  field4: data.ec?.toString() || data.conductivity?.toString() || data.field4?.toString() || "500", // EC/Conductivity
                  field5: data.turbidity?.toString() || data.field5?.toString() || "5.0", // Turbidity
                }

                feeds.push(reading)
                lastEntryId = Math.max(lastEntryId, reading.entry_id)
              }
            })

            feeds.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

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

            console.log(`✅ Successfully loaded ${feeds.length} real sensor readings from Firebase`)
            callback(sensorData)
          },
          (error) => {
            console.error("❌ Error in Firebase real-time listener:", error)
            console.error("❌ Error code:", error.code)
            console.error("❌ Error message:", error.message)
            if (onError) {
              onError(error)
            }
            callback(generateMockData(Number.parseInt(hours)))
          },
        )

        console.log("✅ Firebase listener set up successfully")
        return unsubscribe
      } catch (innerError) {
        console.error("❌ Error setting up Firebase listener:", innerError)
        console.error("❌ Inner error details:", {
          name: innerError.name,
          message: innerError.message,
          stack: innerError.stack,
        })
        if (onError) {
          onError(innerError instanceof Error ? innerError : new Error(String(innerError)))
        }
        callback(generateMockData(Number.parseInt(hours)))
        return () => {}
      }
    } catch (outerError) {
      console.error("❌ Error in subscribeToSensorData:", outerError)
      console.error("❌ Outer error details:", {
        name: outerError.name,
        message: outerError.message,
        stack: outerError.stack,
      })
      if (onError) {
        onError(outerError instanceof Error ? outerError : new Error(String(outerError)))
      }
      callback(generateMockData(Number.parseInt(hours)))
      return () => {}
    }
  }

  // Setup listener and return cleanup function
  let cleanup = () => {}
  setupListener()
    .then((unsubscribe) => {
      if (typeof unsubscribe === "function") {
        cleanup = unsubscribe
      }
    })
    .catch((error) => {
      console.error("❌ Error in setupListener promise:", error)
      callback(generateMockData(Number.parseInt(hours)))
    })

  return () => cleanup()
}

export function subscribeToSensorDataByDateRange(
  startDate: string,
  endDate: string,
  callback: (data: SensorData) => void,
  onError?: (error: Error) => void,
): () => void {
  const setupListener = async () => {
    try {
      console.log(`Setting up real-time listener from ${startDate} to ${endDate}`)

      if (!isFirebaseDbAvailable()) {
        console.log("Firebase database not available, using mock data")
        callback(generateMockDataForDateRange(startDate, endDate))
        return () => {}
      }

      console.log("Setting up Firebase date range listener (public read access)...")

      try {
        const sensorRef = ref(db, "sensor_readings")
        const dateRangeQuery = query(sensorRef, limitToLast(100))

        const unsubscribe = onValue(
          dateRangeQuery,
          (snapshot) => {
            console.log("Real-time update received from Firebase for date range")

            if (!snapshot.exists()) {
              console.log("No data found in Firebase for date range, using mock data")
              callback(generateMockDataForDateRange(startDate, endDate))
              return
            }

            // Process Firebase data
            const feeds: SensorReading[] = []
            let lastEntryId = 0
            const start = new Date(startDate).getTime()
            const end = new Date(endDate).getTime()

            snapshot.forEach((childSnapshot) => {
              const data = childSnapshot.val()
              const timestamp = new Date(data.timestamp || Date.now())

              if (timestamp.getTime() >= start && timestamp.getTime() <= end) {
                const reading: SensorReading = {
                  created_at: timestamp.toISOString(),
                  entry_id: data.entry_id || feeds.length + 1,
                  field1: data.ph?.toString() || "7.0", // ESP32 sends 'ph'
                  field2: data.tds?.toString() || "250", // ESP32 sends 'tds'
                  field3: data.temperature?.toString() || "25.0", // ESP32 sends 'temperature'
                  field4: data.ec?.toString() || "500", // ESP32 sends 'ec' (electrical conductivity)
                  field5: data.turbidity?.toString() || "5.0", // ESP32 sends 'turbidity'
                }

                feeds.push(reading)
                lastEntryId = Math.max(lastEntryId, reading.entry_id)
              }
            })

            feeds.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

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

            console.log(`Successfully loaded ${feeds.length} sensor readings from Firebase for date range`)
            callback(sensorData)
          },
          (error) => {
            console.error("Error in real-time listener for date range:", error)
            if (onError) {
              onError(error)
            }
            callback(generateMockDataForDateRange(startDate, endDate))
          },
        )

        return unsubscribe
      } catch (innerError) {
        console.error("Error setting up Firebase date range listener:", innerError)
        if (onError) {
          onError(innerError instanceof Error ? innerError : new Error(String(innerError)))
        }
        callback(generateMockDataForDateRange(startDate, endDate))
        return () => {}
      }
    } catch (outerError) {
      console.error("Error in subscribeToSensorDataByDateRange:", outerError)
      if (onError) {
        onError(outerError instanceof Error ? outerError : new Error(String(outerError)))
      }
      callback(generateMockDataForDateRange(startDate, endDate))
      return () => {}
    }
  }

  let cleanup = () => {}
  setupListener().then((unsubscribe) => {
    if (typeof unsubscribe === "function") {
      cleanup = unsubscribe
    }
  })

  return () => cleanup()
}

export async function addSensorReading(reading: {
  ph: number
  tds: number
  temperature: number
  conductivity: number
  turbidity: number
}) {
  try {
    if (!isFirebaseDbAvailable()) {
      console.log("Firebase database not available")
      return
    }

    // For write operations, we still need authentication
    const isAuth = await checkWriteAuthentication()
    if (!isAuth) {
      console.log("Authentication required for writing sensor data")
      // Try to sign in anonymously for write operations
      try {
        console.log("Attempting anonymous sign-in for write operation...")
        const result = await signInAnonymously(auth)
        console.log("Anonymous sign-in successful for write operation:", result.user.uid)
      } catch (authError) {
        console.error("Anonymous sign-in failed:", authError)
        return
      }
    }

    const sensorRef = ref(db, "sensor_readings")
    await push(sensorRef, {
      ...reading,
      timestamp: serverTimestamp(),
      entry_id: Date.now(),
    })
    console.log("Sensor reading added successfully")
  } catch (error) {
    console.error("Error adding sensor reading:", error)
  }
}

export async function fetchSensorData(hours: string): Promise<SensorData> {
  try {
    console.log(`Fetching sensor data for the last ${hours} hours`)

    if (!isFirebaseDbAvailable()) {
      console.log("Firebase database not available, using mock data")
      return generateMockData(Number.parseInt(hours))
    }

    console.log("Fetching from Firebase with public read access")

    try {
      const sensorRef = ref(db, "sensor_readings")
      const recentReadingsQuery = query(sensorRef, limitToLast(100))

      const snapshot = await get(recentReadingsQuery)

      if (!snapshot.exists()) {
        console.log("No data found in Firebase, using mock data")
        return generateMockData(Number.parseInt(hours))
      }

      const feeds: SensorReading[] = []
      let lastEntryId = 0
      const now = new Date()
      const startTime = now.getTime() - Number.parseInt(hours) * 60 * 60 * 1000

      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val()
        const timestamp = new Date(data.timestamp || Date.now())

        if (timestamp.getTime() >= startTime) {
          const reading: SensorReading = {
            created_at: timestamp.toISOString(),
            entry_id: data.entry_id || feeds.length + 1,
            field1: data.ph?.toString() || "7.0", // ESP32 sends 'ph'
            field2: data.tds?.toString() || "250", // ESP32 sends 'tds'
            field3: data.temperature?.toString() || "25.0", // ESP32 sends 'temperature'
            field4: data.ec?.toString() || "500", // ESP32 sends 'ec' (electrical conductivity)
            field5: data.turbidity?.toString() || "5.0", // ESP32 sends 'turbidity'
          }

          feeds.push(reading)
          lastEntryId = Math.max(lastEntryId, reading.entry_id)
        }
      })

      feeds.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      console.log(`Successfully fetched ${feeds.length} sensor readings from Firebase`)

      return {
        channel: {
          id: 1,
          name: "Water Quality Monitoring",
          description: "Real-time water quality sensor readings",
          created_at: new Date(2023, 0, 1).toISOString(),
          updated_at: new Date().toISOString(),
          last_entry_id: lastEntryId,
        },
        feeds,
      }
    } catch (innerError) {
      console.error("Error fetching data from Firebase:", innerError)
      return generateMockData(Number.parseInt(hours))
    }
  } catch (error) {
    console.error("Error fetching data:", error)
    return generateMockData(Number.parseInt(hours))
  }
}

export async function fetchSensorDataByDateRange(startDate: string, endDate: string): Promise<SensorData> {
  try {
    console.log(`Fetching sensor data from ${startDate} to ${endDate}`)

    if (!isFirebaseDbAvailable()) {
      console.log("Firebase database not available, using mock data")
      return generateMockDataForDateRange(startDate, endDate)
    }

    console.log("Fetching date range from Firebase with public read access")

    try {
      const sensorRef = ref(db, "sensor_readings")
      const dateRangeQuery = query(sensorRef, limitToLast(100))

      const snapshot = await get(dateRangeQuery)

      if (!snapshot.exists()) {
        console.log("No data found in Firebase for date range, using mock data")
        return generateMockDataForDateRange(startDate, endDate)
      }

      const feeds: SensorReading[] = []
      let lastEntryId = 0
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime()

      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val()
        const timestamp = new Date(data.timestamp || Date.now())

        if (timestamp.getTime() >= start && timestamp.getTime() <= end) {
          const reading: SensorReading = {
            created_at: timestamp.toISOString(),
            entry_id: data.entry_id || feeds.length + 1,
            field1: data.ph?.toString() || "7.0", // ESP32 sends 'ph'
            field2: data.tds?.toString() || "250", // ESP32 sends 'tds'
            field3: data.temperature?.toString() || "25.0", // ESP32 sends 'temperature'
            field4: data.ec?.toString() || "500", // ESP32 sends 'ec' (electrical conductivity)
            field5: data.turbidity?.toString() || "5.0", // ESP32 sends 'turbidity'
          }

          feeds.push(reading)
          lastEntryId = Math.max(lastEntryId, reading.entry_id)
        }
      })

      feeds.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      console.log(`Successfully fetched ${feeds.length} sensor readings from Firebase for date range`)

      return {
        channel: {
          id: 1,
          name: "Water Quality Monitoring",
          description: "Real-time water quality sensor readings",
          created_at: new Date(2023, 0, 1).toISOString(),
          updated_at: new Date().toISOString(),
          last_entry_id: lastEntryId,
        },
        feeds,
      }
    } catch (innerError) {
      console.error("Error fetching date range data from Firebase:", innerError)
      return generateMockDataForDateRange(startDate, endDate)
    }
  } catch (error) {
    console.error("Error fetching date range data:", error)
    return generateMockDataForDateRange(startDate, endDate)
  }
}

// Mock data generation functions
function generateMockData(hours: number): SensorData {
  const feeds: SensorReading[] = []
  const now = new Date()
  const intervalMinutes = Math.max(1, Math.floor((hours * 60) / 50)) // Generate up to 50 data points

  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(now.getTime() - i * intervalMinutes * 60 * 1000)

    // Generate realistic sensor values with some variation
    const ph = (6.5 + Math.random() * 2).toFixed(2) // pH between 6.5-8.5
    const tds = (200 + Math.random() * 300).toFixed(0) // TDS between 200-500 ppm
    const temperature = (20 + Math.random() * 15).toFixed(1) // Temperature between 20-35°C
    const conductivity = (400 + Math.random() * 400).toFixed(0) // Conductivity between 400-800 µS/cm
    const turbidity = (1 + Math.random() * 10).toFixed(1) // Turbidity between 1-11 NTU

    feeds.push({
      created_at: timestamp.toISOString(),
      entry_id: i + 1,
      field1: ph,
      field2: tds,
      field3: temperature,
      field4: conductivity,
      field5: turbidity,
    })
  }

  return {
    channel: {
      id: 1,
      name: "Mock Water Quality Monitoring",
      description: "Mock sensor data for testing purposes",
      created_at: new Date(2023, 0, 1).toISOString(),
      updated_at: new Date().toISOString(),
      last_entry_id: feeds.length,
    },
    feeds,
  }
}

function generateMockDataForDateRange(startDate: string, endDate: string): SensorData {
  const feeds: SensorReading[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffHours = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60)
  const intervalMinutes = Math.max(1, Math.floor((diffHours * 60) / 50))

  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(start.getTime() + i * intervalMinutes * 60 * 1000)
    if (timestamp > end) break

    const ph = (6.5 + Math.random() * 2).toFixed(2)
    const tds = (200 + Math.random() * 300).toFixed(0)
    const temperature = (20 + Math.random() * 15).toFixed(1)
    const conductivity = (400 + Math.random() * 400).toFixed(0)
    const turbidity = (1 + Math.random() * 10).toFixed(1)

    feeds.push({
      created_at: timestamp.toISOString(),
      entry_id: i + 1,
      field1: ph,
      field2: tds,
      field3: temperature,
      field4: conductivity,
      field5: turbidity,
    })
  }

  return {
    channel: {
      id: 1,
      name: "Mock Water Quality Monitoring",
      description: "Mock sensor data for testing purposes",
      created_at: new Date(2023, 0, 1).toISOString(),
      updated_at: new Date().toISOString(),
      last_entry_id: feeds.length,
    },
    feeds,
  }
}

// Export Firebase instances for direct use
export { app, db, auth, ref, query, limitToLast, onValue, push, serverTimestamp, get }
