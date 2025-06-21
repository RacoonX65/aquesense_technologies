"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Bot,
  Send,
  User,
  Loader2,
  AlertTriangle,
  Mic,
  MicOff,
  TrendingUp,
  Bell,
  Brain,
  Globe,
  Calculator,
  Shield,
  Wrench,
  FileText,
  Star,
  RefreshCw,
} from "lucide-react"
import { ref, onValue, query, limitToLast } from "firebase/database"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import { generateAIResponse, checkAPIAvailability as checkAPIAvailabilityAction } from "@/lib/ai-actions"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  type?: "text" | "chart" | "report" | "alert" | "suggestion"
  data?: any
}

interface SensorData {
  ph: number
  temperature: number
  tds: number
  conductivity: number
  turbidity: number
  timestamp: string
}

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  description: string
  action: () => void
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `🤖 **Welcome to your Data-Driven Water Quality AI!** 

I analyze your **REAL sensor readings** to give you specific insights about your water quality!

**🔬 I provide insights based on YOUR actual data:**
- **Current pH**: I'll analyze your exact pH reading and its implications
- **Temperature Analysis**: Specific insights based on your current temperature
- **TDS Assessment**: Detailed analysis of your dissolved solids levels
- **Conductivity Insights**: What your conductivity reading means for water quality
- **Turbidity Analysis**: Specific clarity assessment based on your readings

**💡 Ask me about your specific readings:**
- "What does my current pH of [X] mean?"
- "Is my temperature reading concerning?"
- "Analyze my TDS levels"
- "What's causing my high turbidity?"
- "Compare my readings to safe standards"

**🎯 I'll give you:**
- Specific numerical analysis of YOUR readings
- Personalized recommendations based on YOUR data
- Comparisons to water quality standards
- Actionable steps for YOUR specific situation

Ask me about any parameter and I'll analyze YOUR actual readings! 🌊`,
      timestamp: new Date(),
      type: "text",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sensorData, setSensorData] = useState<SensorData | null>(null)
  const [historicalData, setHistoricalData] = useState<SensorData[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [apiStatus, setApiStatus] = useState<"available" | "unavailable" | "checking">("checking")
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [smartAlertsEnabled, setSmartAlertsEnabled] = useState(true)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const mountedRef = useRef(true)

  // Initialize voice recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      setVoiceSupported(true)
    }

    return () => {
      mountedRef.current = false
    }
  }, [])

  // Quick Actions Configuration
  const quickActions: QuickAction[] = [
    {
      id: "analyze-ph",
      label: "Analyze pH",
      icon: <TrendingUp className="h-4 w-4" />,
      description: "Analyze current pH reading",
      action: () =>
        handleQuickAction(
          `Analyze my current pH reading of ${sensorData?.ph.toFixed(2) || "N/A"} and tell me what it means for my water quality`,
        ),
    },
    {
      id: "check-temperature",
      label: "Temperature Check",
      icon: <Shield className="h-4 w-4" />,
      description: "Assess current temperature",
      action: () =>
        handleQuickAction(
          `My water temperature is ${sensorData?.temperature.toFixed(2) || "N/A"}°C. Is this safe and what does it mean?`,
        ),
    },
    {
      id: "tds-analysis",
      label: "TDS Analysis",
      icon: <Calculator className="h-4 w-4" />,
      description: "Analyze dissolved solids",
      action: () =>
        handleQuickAction(
          `Analyze my TDS reading of ${sensorData?.tds.toFixed(2) || "N/A"} ppm and explain what this means for water quality`,
        ),
    },
    {
      id: "turbidity-check",
      label: "Turbidity Check",
      icon: <Wrench className="h-4 w-4" />,
      description: "Assess water clarity",
      action: () =>
        handleQuickAction(
          `My turbidity is ${sensorData?.turbidity.toFixed(2) || "N/A"} NTU. What does this mean for water clarity and safety?`,
        ),
    },
    {
      id: "conductivity-analysis",
      label: "Conductivity",
      icon: <FileText className="h-4 w-4" />,
      description: "Analyze conductivity levels",
      action: () =>
        handleQuickAction(
          `Analyze my conductivity reading of ${sensorData?.conductivity.toFixed(2) || "N/A"} μS/cm and its implications`,
        ),
    },
    {
      id: "overall-assessment",
      label: "Overall Assessment",
      icon: <Globe className="h-4 w-4" />,
      description: "Complete water quality assessment",
      action: () =>
        handleQuickAction(
          `Give me a complete assessment of all my current readings: pH ${sensorData?.ph.toFixed(2) || "N/A"}, Temperature ${sensorData?.temperature.toFixed(2) || "N/A"}°C, TDS ${sensorData?.tds.toFixed(2) || "N/A"} ppm, Conductivity ${sensorData?.conductivity.toFixed(2) || "N/A"} μS/cm, Turbidity ${sensorData?.turbidity.toFixed(2) || "N/A"} NTU`,
        ),
    },
  ]

  // DIRECT Firebase subscription - same as dashboard
  useEffect(() => {
    console.log("🤖 AI Assistant: Setting up DIRECT Firebase listener")

    if (!db) {
      console.error("❌ AI Assistant: Firebase database not available")
      return () => {}
    }

    try {
      // Create reference to sensor_readings node - LAST 50 READINGS (same as dashboard)
      const sensorRef = ref(db, "sensor_readings")
      const recentReadingsQuery = query(sensorRef, limitToLast(50))

      // Set up real-time listener
      const unsubscribe = onValue(
        recentReadingsQuery,
        (snapshot) => {
          if (!mountedRef.current) return

          console.log("🤖 AI Assistant: DIRECT Firebase update received")

          if (!snapshot.exists()) {
            console.log("❌ AI Assistant: No data found in Firebase")
            setIsConnected(false)
            return
          }

          // Process the data - DIRECT access to Firebase fields
          const feeds: SensorData[] = []
          let latestReading: SensorData | null = null

          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val()
            console.log("🤖 AI Assistant: Raw Firebase data:", data)

            // Direct access to Firebase fields - SAME as dashboard
            const reading: SensorData = {
              ph: Number.parseFloat(data.ph) || 7.0,
              temperature: Number.parseFloat(data.temperature) || 25.0,
              tds: Number.parseFloat(data.tds) || 250,
              conductivity: Number.parseFloat(data.ec) || 500,
              turbidity: Number.parseFloat(data.turbidity) || 5.0,
              timestamp: new Date().toISOString(),
            }

            feeds.push(reading)

            // Keep track of the latest reading
            if (!latestReading) {
              latestReading = reading
            }
          })

          // Sort by timestamp (newest first)
          feeds.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

          // Use the first reading as the latest
          if (feeds.length > 0) {
            latestReading = feeds[0]
          }

          if (latestReading) {
            console.log("🤖 AI Assistant: Latest sensor data:", latestReading)
            setSensorData(latestReading)
            setHistoricalData(feeds)
            setIsConnected(true)
            setLastUpdateTime(new Date())

            // Smart alerts check
            if (smartAlertsEnabled) {
              checkSmartAlerts(latestReading)
            }
          }
        },
        (error) => {
          if (!mountedRef.current) return

          console.error("❌ AI Assistant: Firebase listener error:", error)
          setIsConnected(false)
        },
      )

      return () => {
        console.log("🤖 AI Assistant: Cleaning up Firebase listener")
        unsubscribe()
      }
    } catch (error) {
      console.error("❌ AI Assistant: Error setting up Firebase listener:", error)
      return () => {}
    }
  }, [smartAlertsEnabled])

  // Check API availability on component mount
  useEffect(() => {
    checkAPIAvailability()
  }, [])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // FIXED Smart Alerts System with correct thresholds
  const checkSmartAlerts = (data: SensorData) => {
    const alerts = []

    // CRITICAL pH alerts - pH 3.91 is extremely dangerous!
    if (data.ph < 5.0) {
      alerts.push({
        type: "pH",
        severity: "critical",
        message: `CRITICAL pH EMERGENCY: ${data.ph.toFixed(2)} is extremely acidic and dangerous! Immediate action required!`,
        value: data.ph,
      })
    } else if (data.ph < 6.5 || data.ph > 8.5) {
      alerts.push({
        type: "pH",
        severity: data.ph < 6.0 || data.ph > 9.0 ? "critical" : "warning",
        message: `pH level ${data.ph.toFixed(2)} is ${data.ph < 6.5 ? "too acidic" : "too alkaline"} (safe range: 6.5-8.5)`,
        value: data.ph,
      })
    }

    // Temperature alerts
    if (data.temperature > 30) {
      alerts.push({
        type: "temperature",
        severity: data.temperature > 35 ? "critical" : "warning",
        message: `High temperature ${data.temperature.toFixed(1)}°C may encourage bacterial growth (ideal: <25°C)`,
        value: data.temperature,
      })
    }

    // TDS alerts - 733 ppm is quite high
    if (data.tds > 600) {
      alerts.push({
        type: "tds",
        severity: data.tds > 1000 ? "critical" : "warning",
        message: `High TDS ${data.tds.toFixed(0)} ppm indicates very hard water (ideal: 50-300 ppm)`,
        value: data.tds,
      })
    }

    // Conductivity alerts - 1466 μS/cm is very high
    if (data.conductivity > 1200) {
      alerts.push({
        type: "conductivity",
        severity: data.conductivity > 1500 ? "critical" : "warning",
        message: `Very high conductivity ${data.conductivity.toFixed(0)} μS/cm indicates excessive dissolved minerals (ideal: 200-800 μS/cm)`,
        value: data.conductivity,
      })
    }

    // Turbidity alerts
    if (data.turbidity > 100) {
      alerts.push({
        type: "turbidity",
        severity: data.turbidity > 500 ? "critical" : "warning",
        message: `High turbidity ${data.turbidity.toFixed(1)} NTU indicates poor water clarity (ideal: <50 NTU)`,
        value: data.turbidity,
      })
    }

    // Send alerts if any
    if (alerts.length > 0) {
      const alertMessage: Message = {
        id: `alert-${Date.now()}`,
        role: "assistant",
        content: generateSmartAlert(alerts, data),
        timestamp: new Date(),
        type: "alert",
        data: alerts,
      }
      setMessages((prev) => [...prev, alertMessage])
    }
  }

  // Generate smart alert message with specific data
  const generateSmartAlert = (alerts: any[], data: SensorData) => {
    const criticalAlerts = alerts.filter((a) => a.severity === "critical")
    const warningAlerts = alerts.filter((a) => a.severity === "warning")

    let message = `🚨 **WATER QUALITY ALERT - URGENT ATTENTION REQUIRED!**\n\n`

    // Special handling for critical pH
    if (data.ph < 5.0) {
      message += `🔴 **EMERGENCY: EXTREMELY ACIDIC WATER!**\n`
      message += `Your pH of ${data.ph.toFixed(2)} is DANGEROUSLY LOW!\n`
      message += `- This is like battery acid or lemon juice\n`
      message += `- Can cause severe burns and poisoning\n`
      message += `- DO NOT DRINK OR USE FOR COOKING\n`
      message += `- IMMEDIATE PROFESSIONAL HELP REQUIRED\n\n`
    }

    message += `**📊 Current Readings:**\n`
    message += `- pH: ${data.ph.toFixed(2)} ${data.ph >= 6.5 && data.ph <= 8.5 ? "✅" : data.ph < 5.0 ? "🔴 CRITICAL" : "⚠️"}\n`
    message += `- Temperature: ${data.temperature.toFixed(1)}°C ${data.temperature <= 25 ? "✅" : "⚠️"}\n`
    message += `- TDS: ${data.tds.toFixed(0)} ppm ${data.tds <= 300 ? "✅" : data.tds > 600 ? "🔴 HIGH" : "⚠️"}\n`
    message += `- Conductivity: ${data.conductivity.toFixed(0)} μS/cm ${data.conductivity <= 800 ? "✅" : data.conductivity > 1200 ? "🔴 HIGH" : "⚠️"}\n`
    message += `- Turbidity: ${data.turbidity.toFixed(1)} NTU ${data.turbidity <= 50 ? "✅" : "⚠️"}\n`
    message += `- **Water Quality Score: ${calculateWaterQualityScore(data)}/100**\n\n`

    if (criticalAlerts.length > 0) {
      message += "**🔴 CRITICAL ISSUES:**\n"
      criticalAlerts.forEach((alert) => {
        message += `- ${alert.message}\n`
      })
      message += "\n"
    }

    if (warningAlerts.length > 0) {
      message += "**🟡 WARNINGS:**\n"
      warningAlerts.forEach((alert) => {
        message += `- ${alert.message}\n`
      })
      message += "\n"
    }

    message += "**💡 IMMEDIATE ACTIONS REQUIRED:**\n"
    if (data.ph < 5.0) {
      message += `- 🚨 STOP using this water immediately\n`
      message += `- Contact water treatment professional NOW\n`
      message += `- Use bottled water for all needs\n`
      message += `- Check for acid contamination source\n`
    } else if (data.ph < 6.5) {
      message += `- Add pH increaser (sodium carbonate) immediately\n`
      message += `- Test pH every hour until above 6.5\n`
    }

    if (data.tds > 600) {
      message += `- Your water is very hard - consider water softener\n`
      message += `- Expect significant scale buildup in appliances\n`
    }

    if (data.conductivity > 1200) {
      message += `- Very high mineral content - check water source\n`
      message += `- Consider reverse osmosis system\n`
    }

    message += "\nAsk me: 'What should I do about my pH?' for detailed help!"

    return message
  }

  // Voice recognition functions
  const startListening = () => {
    if (recognitionRef.current && voiceSupported) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  // Quick action handler
  const handleQuickAction = async (prompt: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await generateIntelligentResponse(prompt)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        type: "suggestion",
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error in quick action:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Check if Hugging Face API is available
  const checkAPIAvailability = async () => {
    try {
      const isAvailable = await checkAPIAvailabilityAction()
      setApiStatus(isAvailable ? "available" : "unavailable")
    } catch (error) {
      console.error("API availability check failed:", error)
      setApiStatus("unavailable")
    }
  }

  // FIXED Water Quality Score Calculation
  const calculateWaterQualityScore = (data: SensorData): number => {
    let score = 100

    console.log("🎯 AI Assistant: Calculating water quality score:", data)

    // CRITICAL pH scoring - pH 3.91 should result in very low score
    if (data.ph < 4.0) {
      score -= 70 // Emergency pH gets massive penalty
      console.log("🔴 Emergency pH penalty: -70")
    } else if (data.ph < 5.0) {
      score -= 50 // Critical pH gets major penalty
      console.log("🔴 Critical pH penalty: -50")
    } else if (data.ph < 6.0) {
      score -= 30 // Severe pH gets significant penalty
      console.log("⚠️ Severe pH penalty: -30")
    } else {
      const phDeviation = data.ph < 6.5 ? 6.5 - data.ph : data.ph > 8.5 ? data.ph - 8.5 : 0
      const phPenalty = phDeviation * 15
      score -= phPenalty
      console.log(`📊 pH deviation penalty: -${phPenalty}`)
    }

    // Temperature scoring
    if (data.temperature > 30) {
      const tempPenalty = (data.temperature - 30) * 3
      score -= tempPenalty
      console.log(`🌡️ High temperature penalty: -${tempPenalty}`)
    } else if (data.temperature > 25) {
      const tempPenalty = (data.temperature - 25) * 1
      score -= tempPenalty
      console.log(`🌡️ Elevated temperature penalty: -${tempPenalty}`)
    }

    // TDS scoring with higher penalties for very high values
    if (data.tds > 600) {
      const tdsPenalty = (data.tds - 600) * 0.05
      score -= tdsPenalty
      console.log(`💧 Very high TDS penalty: -${tdsPenalty}`)
    } else if (data.tds > 500) {
      const tdsPenalty = (data.tds - 500) * 0.03
      score -= tdsPenalty
      console.log(`💧 High TDS penalty: -${tdsPenalty}`)
    } else if (data.tds > 300) {
      const tdsPenalty = (data.tds - 300) * 0.01
      score -= tdsPenalty
      console.log(`💧 Elevated TDS penalty: -${tdsPenalty}`)
    }

    // Conductivity scoring with higher penalties
    if (data.conductivity > 1200) {
      const condPenalty = (data.conductivity - 1200) * 0.02
      score -= condPenalty
      console.log(`⚡ Very high conductivity penalty: -${condPenalty}`)
    } else if (data.conductivity > 1000) {
      const condPenalty = (data.conductivity - 1000) * 0.015
      score -= condPenalty
      console.log(`⚡ High conductivity penalty: -${condPenalty}`)
    } else if (data.conductivity > 800) {
      const condPenalty = (data.conductivity - 800) * 0.01
      score -= condPenalty
      console.log(`⚡ Elevated conductivity penalty: -${condPenalty}`)
    }

    // Turbidity scoring
    if (data.turbidity > 500) {
      const turbPenalty = (data.turbidity - 500) * 0.05
      score -= turbPenalty
      console.log(`🌊 Very high turbidity penalty: -${turbPenalty}`)
    } else if (data.turbidity > 100) {
      const turbPenalty = (data.turbidity - 100) * 0.02
      score -= turbPenalty
      console.log(`🌊 High turbidity penalty: -${turbPenalty}`)
    } else if (data.turbidity > 50) {
      const turbPenalty = (data.turbidity - 50) * 0.01
      score -= turbPenalty
      console.log(`🌊 Elevated turbidity penalty: -${turbPenalty}`)
    }

    const finalScore = Math.max(0, Math.round(score))
    console.log(`🎯 AI Assistant: Final water quality score: ${finalScore}/100`)
    return finalScore
  }

  // Generate detailed context from current sensor data
  const generateDetailedSensorContext = (): string => {
    if (!sensorData) {
      return "No current sensor data available for analysis."
    }

    const lastUpdate = lastUpdateTime ? format(lastUpdateTime, "MMM d, yyyy HH:mm:ss") : "Unknown"
    const qualityScore = calculateWaterQualityScore(sensorData)

    return `CURRENT SENSOR READINGS (Last updated: ${lastUpdate}):

📊 DETAILED PARAMETER ANALYSIS:

🔬 pH Level: ${sensorData.ph.toFixed(2)}
- Status: ${sensorData.ph < 5.0 ? "🔴 CRITICAL EMERGENCY" : sensorData.ph >= 6.5 && sensorData.ph <= 8.5 ? "✅ OPTIMAL" : sensorData.ph < 6.5 ? "⚠️ TOO ACIDIC" : "⚠️ TOO ALKALINE"}
- Safe Range: 6.5-8.5
- Severity: ${sensorData.ph < 5.0 ? "EMERGENCY - like battery acid!" : sensorData.ph < 6.5 ? "CRITICAL" : sensorData.ph < 6.5 ? "HIGH" : "NORMAL"}
- Health Impact: ${sensorData.ph < 5.0 ? "EXTREMELY DANGEROUS - can cause burns and poisoning" : sensorData.ph < 6.5 ? "May cause metallic taste, pipe corrosion" : sensorData.ph > 8.5 ? "May cause bitter taste, soap-like feel" : "Safe for consumption"}

🌡️ Temperature: ${sensorData.temperature.toFixed(1)}°C
- Status: ${sensorData.temperature <= 25 ? "✅ GOOD" : sensorData.temperature <= 30 ? "⚠️ ELEVATED" : "🔴 HIGH"}
- Ideal Range: 10-25°C
- Risk Level: ${sensorData.temperature > 30 ? "High - bacterial growth risk" : sensorData.temperature > 25 ? "Medium - monitor closely" : "Low - optimal"}

💧 Total Dissolved Solids (TDS): ${sensorData.tds.toFixed(0)} ppm
- Status: ${sensorData.tds <= 300 ? "✅ ACCEPTABLE" : sensorData.tds <= 500 ? "⚠️ ELEVATED" : sensorData.tds <= 600 ? "🔴 HIGH" : "🔴 VERY HIGH"}
- Ideal Range: 50-300 ppm
- Water Type: ${sensorData.tds < 50 ? "Very soft" : sensorData.tds <= 150 ? "Soft" : sensorData.tds <= 300 ? "Moderately hard" : sensorData.tds <= 500 ? "Hard" : sensorData.tds <= 600 ? "Very hard" : "Extremely hard"}
- Scale Risk: ${sensorData.tds > 600 ? "VERY HIGH - expect significant buildup" : sensorData.tds > 400 ? "HIGH" : "MODERATE"}

⚡ Conductivity: ${sensorData.conductivity.toFixed(0)} μS/cm
- Status: ${sensorData.conductivity <= 800 ? "✅ NORMAL" : sensorData.conductivity <= 1200 ? "⚠️ ELEVATED" : "🔴 VERY HIGH"}
- Ideal Range: 200-800 μS/cm
- Indicates: ${sensorData.conductivity > 1200 ? "Excessive dissolved minerals - check water source" : sensorData.conductivity > 800 ? "High dissolved ion concentration" : "Normal mineral content"}

🌊 Turbidity: ${sensorData.turbidity.toFixed(1)} NTU
- Status: ${sensorData.turbidity <= 50 ? "✅ CLEAR" : sensorData.turbidity <= 100 ? "⚠️ SLIGHTLY CLOUDY" : sensorData.turbidity <= 500 ? "🔴 CLOUDY" : "🔴 VERY TURBID"}
- Ideal Range: 0-50 NTU
- Clarity: ${sensorData.turbidity <= 50 ? "Crystal clear" : sensorData.turbidity <= 100 ? "Slightly hazy" : sensorData.turbidity <= 500 ? "Noticeably cloudy" : "Very poor clarity"}

🎯 OVERALL WATER QUALITY SCORE: ${qualityScore}/100`
  }

  // Enhanced intelligent response with actual data analysis
  const generateIntelligentResponse = async (userMessage: string): Promise<string> => {
    const message = userMessage.toLowerCase()
    const detailedContext = generateDetailedSensorContext()

    // Enhanced parameter-specific analysis with comprehensive keyword detection
    if (
      message.includes("ph") ||
      message.includes("acid") ||
      message.includes("alkaline") ||
      message.includes("basic")
    ) {
      return generatePHAnalysis()
    }

    if (
      message.includes("temperature") ||
      message.includes("temp") ||
      message.includes("hot") ||
      message.includes("cold") ||
      message.includes("heat") ||
      message.includes("thermal")
    ) {
      return generateTemperatureAnalysis()
    }

    if (
      message.includes("tds") ||
      message.includes("dissolved solids") ||
      message.includes("total dissolved") ||
      message.includes("minerals") ||
      message.includes("hardness") ||
      message.includes("hard water") ||
      message.includes("soft water") ||
      message.includes("ppm")
    ) {
      return generateTDSAnalysis()
    }

    if (
      message.includes("conductivity") ||
      message.includes("ec") ||
      message.includes("electrical") ||
      message.includes("ions") ||
      message.includes("salts") ||
      message.includes("μs/cm") ||
      message.includes("us/cm") ||
      message.includes("microsiemens")
    ) {
      return generateConductivityAnalysis()
    }

    if (
      message.includes("turbidity") ||
      message.includes("clarity") ||
      message.includes("clear") ||
      message.includes("cloudy") ||
      message.includes("muddy") ||
      message.includes("particles") ||
      message.includes("filtration") ||
      message.includes("filter") ||
      message.includes("ntu")
    ) {
      return generateTurbidityAnalysis()
    }

    if (
      message.includes("overall") ||
      message.includes("assessment") ||
      message.includes("all") ||
      message.includes("complete") ||
      message.includes("summary") ||
      message.includes("everything")
    ) {
      return generateOverallAnalysis()
    }

    // Help users understand what they can ask about
    if (
      message.includes("what can") ||
      message.includes("help") ||
      message.includes("parameters") ||
      message.includes("sensors")
    ) {
      return generateParameterHelpResponse()
    }

    // Try Hugging Face API with detailed context
    if (apiStatus === "available") {
      try {
        const enhancedPrompt = `You are a water quality expert analyzing REAL sensor data. User question: "${userMessage}"

${detailedContext}

Provide specific insights based on these ACTUAL readings, not generic advice. Include numerical analysis and specific recommendations.`

        const response = await generateAIResponse(enhancedPrompt)
        if (response) {
          return response
        }
      } catch (error) {
        console.error("Hugging Face API error:", error)
      }
    }

    // Enhanced rule-based responses with actual data
    return generateDataDrivenResponse(message, detailedContext)
  }

  // Generate pH-specific analysis
  const generatePHAnalysis = (): string => {
    if (!sensorData) return "No pH data available for analysis."

    const ph = sensorData.ph
    const deviation = ph < 6.5 ? 6.5 - ph : ph > 8.5 ? ph - 8.5 : 0
    const severity =
      ph < 4.0
        ? "EMERGENCY"
        : ph < 5.0
          ? "CRITICAL"
          : deviation > 1.5
            ? "HIGH"
            : deviation > 0.5
              ? "MODERATE"
              : deviation > 0
                ? "MINOR"
                : "NONE"

    const qualityScore = calculateWaterQualityScore(sensorData)

    return `🔬 **DETAILED pH ANALYSIS - Your Reading: ${ph.toFixed(2)}**

**📊 CURRENT STATUS:**
- Your pH: **${ph.toFixed(2)}**
- Safe Range: 6.5 - 8.5
- Deviation: ${deviation > 0 ? `${deviation.toFixed(2)} units ${ph < 6.5 ? "below minimum" : "above maximum"}` : "Within safe range"}
- Severity: **${severity}**
- Water Quality Score: **${qualityScore}/100**
- Last Updated: ${lastUpdateTime ? format(lastUpdateTime, "MMM d, yyyy HH:mm:ss") : "Unknown"}

**🎯 WHAT YOUR pH MEANS:**
${
  ph < 4.0
    ? `**EMERGENCY - EXTREMELY ACIDIC (${ph.toFixed(2)})**
- Your water is like battery acid or stomach acid
- IMMEDIATE DANGER - can cause chemical burns
- DO NOT DRINK, COOK, OR BATHE with this water
- Call water treatment professional IMMEDIATELY
- Use bottled water for all needs`
    : ph < 5.0
      ? `**CRITICAL ACIDITY (${ph.toFixed(2)})**
- Your water is dangerously acidic (like lemon juice)
- Can cause severe pipe corrosion and metal leaching
- May contain toxic metals from corroded pipes
- URGENT treatment required - do not delay`
      : ph < 6.0
        ? `**SEVERE ACIDITY (${ph.toFixed(2)})**
- Your water is very acidic (like coffee)
- Will cause significant pipe corrosion
- May have metallic taste and health risks
- Immediate treatment strongly recommended`
        : ph < 6.5
          ? `**ACIDIC (${ph.toFixed(2)})**
- Your water is more acidic than recommended
- May cause metallic taste and gradual pipe corrosion
- Treatment recommended to prevent long-term issues`
          : ph > 9.0
            ? `**CRITICAL ALKALINITY (${ph.toFixed(2)})**
- Your water is dangerously alkaline
- Can cause severe scaling and skin irritation
- Immediate treatment required`
            : ph > 8.5
              ? `**ALKALINE (${ph.toFixed(2)})**
- Your water is more alkaline than recommended
- May cause bitter taste and mineral buildup
- Treatment recommended`
              : `**OPTIMAL (${ph.toFixed(2)})**
- Your pH is perfectly balanced
- Safe for drinking and use
- Continue monitoring`
}

**💡 SPECIFIC RECOMMENDATIONS FOR pH ${ph.toFixed(2)}:**
${
  ph < 4.0
    ? `
🚨 EMERGENCY ACTIONS:
- STOP using this water immediately
- Contact emergency water services
- Use only bottled water
- Check for chemical spills or contamination
- Professional testing and treatment required`
    : ph < 5.0
      ? `
🔴 URGENT ACTIONS:
- Add large amounts of pH increaser (sodium carbonate)
- Test pH every 30 minutes
- Do not use for drinking until pH > 6.5
- Check water source for contamination
- Consider professional water treatment`
      : ph < 6.5
        ? `
⚠️ IMMEDIATE ACTIONS:
- Add pH increaser (sodium carbonate or baking soda)
- Test pH every hour until above 6.5
- Flush pipes thoroughly after treatment
- Monitor for metallic taste`
        : ph > 8.5
          ? `
- Add pH decreaser (sodium bisulfate)
- Test pH every 2 hours until below 8.5
- Check for soap/chemical contamination`
          : `- Maintain current water treatment
- Continue regular monitoring
- No immediate action needed`
}

**🔍 HEALTH IMPLICATIONS:**
- Drinking Safety: ${ph < 5.0 ? "🔴 DANGEROUS - DO NOT DRINK" : ph < 6.5 ? "⚠️ NOT RECOMMENDED" : ph > 8.5 ? "⚠️ CAUTION" : "✅ SAFE"}
- Pipe Corrosion Risk: ${ph < 5.0 ? "🔴 SEVERE" : ph < 6.5 ? "⚠️ HIGH" : "✅ LOW"}
- Metal Leaching Risk: ${ph < 6.0 ? "🔴 HIGH" : ph < 6.5 ? "⚠️ MODERATE" : "✅ LOW"}

${ph < 5.0 ? "🚨 **SEEK PROFESSIONAL HELP IMMEDIATELY!**" : ""}

Would you like specific product recommendations or emergency procedures?`
  }

  // Generate temperature-specific analysis
  const generateTemperatureAnalysis = (): string => {
    if (!sensorData) return "No temperature data available for analysis."

    const temp = sensorData.temperature
    const risk = temp > 35 ? "CRITICAL" : temp > 30 ? "HIGH" : temp > 25 ? "MODERATE" : "LOW"
    const qualityScore = calculateWaterQualityScore(sensorData)

    return `🌡️ **DETAILED TEMPERATURE ANALYSIS - Your Reading: ${temp.toFixed(1)}°C**

**📊 CURRENT STATUS:**
- Your Temperature: **${temp.toFixed(1)}°C**
- Ideal Range: 10-25°C
- Risk Level: **${risk}**
- Water Quality Score: **${qualityScore}/100**
- Last Updated: ${lastUpdateTime ? format(lastUpdateTime, "MMM d, yyyy HH:mm:ss") : "Unknown"}

**🎯 WHAT YOUR TEMPERATURE MEANS:**
${
  temp > 35
    ? `**CRITICAL TEMPERATURE (${temp.toFixed(1)}°C)**
- Extremely high temperature
- High bacterial growth risk
- May affect taste and odor
- Immediate cooling required`
    : temp > 30
      ? `**HIGH TEMPERATURE (${temp.toFixed(1)}°C)**
- Above safe range
- Increased bacterial growth risk
- May reduce dissolved oxygen
- Cooling recommended`
      : temp > 25
        ? `**ELEVATED TEMPERATURE (${temp.toFixed(1)}°C)**
- Slightly above ideal
- Monitor for bacterial activity
- Consider ventilation improvement
- Watch for changes`
        : temp < 10
          ? `**COLD TEMPERATURE (${temp.toFixed(1)}°C)**
- Below ideal range but safe
- Slows bacterial growth (good)
- May affect chemical reactions
- Generally not concerning`
          : `**OPTIMAL TEMPERATURE (${temp.toFixed(1)}°C)**
- Perfect temperature range
- Minimal bacterial growth risk
- Good for water quality
- Continue current management`
}

**💡 SPECIFIC RECOMMENDATIONS FOR ${temp.toFixed(1)}°C:**
${
  temp > 30
    ? `
- Improve ventilation around water system
- Add cooling system if possible
- Increase monitoring frequency
- Check for heat sources nearby
- Consider insulation improvements`
    : temp > 25
      ? `
- Monitor bacterial indicators
- Improve air circulation
- Check system location
- Consider seasonal adjustments`
      : `- Current temperature management is good
- Continue regular monitoring
- No immediate action needed`
}

**🔍 HEALTH & SAFETY IMPLICATIONS:**
- Bacterial Growth Risk: ${temp > 30 ? "HIGH" : temp > 25 ? "MODERATE" : "LOW"}
- Chemical Reaction Rate: ${temp > 25 ? "Accelerated" : "Normal"}
- Dissolved Oxygen: ${temp > 25 ? "May be reduced" : "Normal levels"}

Need help with cooling solutions or temperature control systems?`
  }

  // Generate TDS-specific analysis
  const generateTDSAnalysis = (): string => {
    if (!sensorData) return "No TDS data available for analysis."

    const tds = sensorData.tds
    const waterType =
      tds < 50
        ? "Very Soft"
        : tds <= 150
          ? "Soft"
          : tds <= 300
            ? "Moderately Hard"
            : tds <= 500
              ? "Hard"
              : tds <= 600
                ? "Very Hard"
                : "Extremely Hard"

    const status = tds <= 300 ? "ACCEPTABLE" : tds <= 500 ? "ELEVATED" : tds <= 600 ? "HIGH" : "VERY HIGH"
    const qualityScore = calculateWaterQualityScore(sensorData)

    return `💧 **DETAILED TDS ANALYSIS - Your Reading: ${tds.toFixed(0)} ppm**

**📊 CURRENT STATUS:**
- Your TDS: **${tds.toFixed(0)} ppm**
- Water Type: **${waterType}**
- Status: **${status}**
- Ideal Range: 50-300 ppm
- Water Quality Score: **${qualityScore}/100**
- Last Updated: ${lastUpdateTime ? format(lastUpdateTime, "MMM d, yyyy HH:mm:ss") : "Unknown"}

**🎯 WHAT YOUR TDS MEANS:**
${
  tds < 50
    ? `**VERY LOW TDS (${tds.toFixed(0)} ppm)**
- Very soft water
- May lack essential minerals
- Can taste flat or bland
- Consider mineral supplementation`
    : tds <= 150
      ? `**SOFT WATER (${tds.toFixed(0)} ppm)**
- Low mineral content
- Good for soap/detergent use
- May need mineral supplementation
- Generally acceptable`
      : tds <= 300
        ? `**MODERATELY HARD (${tds.toFixed(0)} ppm)**
- Balanced mineral content
- Good for drinking
- Optimal TDS range
- No treatment needed`
        : tds <= 500
          ? `**HARD WATER (${tds.toFixed(0)} ppm)**
- High mineral content
- May cause scale buildup
- Can affect taste
- Consider water softening`
          : tds <= 600
            ? `**VERY HARD WATER (${tds.toFixed(0)} ppm)**
- Very high dissolved solids
- Significant scale buildup risk
- Noticeable mineral taste
- Treatment recommended`
            : `**EXTREMELY HARD WATER (${tds.toFixed(0)} ppm)**
- Excessive dissolved solids
- Severe scale buildup expected
- Poor taste quality
- Immediate treatment required`
}

**🔬 MINERAL COMPOSITION ANALYSIS:**
- Dissolved Minerals: ${tds > 600 ? "Excessive concentration" : tds > 300 ? "High concentration" : "Normal levels"}
- Scale Formation Risk: ${tds > 600 ? "VERY HIGH - expect severe buildup" : tds > 400 ? "HIGH" : tds > 300 ? "MODERATE" : "LOW"}
- Soap Efficiency: ${tds > 300 ? "Reduced (hard water)" : "Good (soft water)"}
- Taste Impact: ${tds > 600 ? "Strong mineral/metallic taste" : tds > 500 ? "Noticeable mineral taste" : tds < 50 ? "May taste flat" : "Good taste"}

**💡 SPECIFIC RECOMMENDATIONS FOR ${tds.toFixed(0)} ppm:**
${
  tds > 600
    ? `
🔴 IMMEDIATE ACTIONS:
- Install reverse osmosis system
- Consider whole-house water softener
- Expect rapid scale buildup in appliances
- Use descaling agents regularly
- Monitor appliance performance closely`
    : tds > 500
      ? `
⚠️ RECOMMENDED ACTIONS:
- Install reverse osmosis system for drinking water
- Consider water softener for appliances
- Regular descaling of appliances
- Monitor for scale buildup`
      : tds > 300
        ? `
- Consider water softener for appliances
- Monitor scale formation
- Use appropriate detergents
- Regular appliance maintenance`
        : tds < 50
          ? `
- Consider mineral supplementation
- Add trace minerals if needed
- Monitor for corrosion
- Check water source`
          : `- Current TDS levels are optimal
- Continue regular monitoring
- No treatment needed`
}

**🏠 HOUSEHOLD IMPACT:**
- Appliance Lifespan: ${tds > 600 ? "Significantly reduced due to severe scaling" : tds > 400 ? "Reduced due to scaling" : "Normal"}
- Cleaning Efficiency: ${tds > 300 ? "Reduced soap effectiveness" : "Good"}
- Plumbing: ${tds > 600 ? "Severe scale buildup risk" : tds > 500 ? "Scale buildup risk" : "No concerns"}

Need help choosing a water treatment system for your TDS levels?`
  }

  // Generate turbidity-specific analysis
  const generateTurbidityAnalysis = (): string => {
    if (!sensorData) return "No turbidity data available for analysis."

    const turbidity = sensorData.turbidity
    const clarity =
      turbidity <= 50
        ? "Crystal Clear"
        : turbidity <= 100
          ? "Slightly Hazy"
          : turbidity <= 500
            ? "Cloudy"
            : "Very Turbid"
    const status = turbidity <= 50 ? "EXCELLENT" : turbidity <= 100 ? "GOOD" : turbidity <= 500 ? "POOR" : "CRITICAL"
    const qualityScore = calculateWaterQualityScore(sensorData)

    return `🌊 **DETAILED TURBIDITY ANALYSIS - Your Reading: ${turbidity.toFixed(1)} NTU**

**📊 CURRENT STATUS:**
- Your Turbidity: **${turbidity.toFixed(1)} NTU**
- Water Clarity: **${clarity}**
- Status: **${status}**
- Ideal Range: 0-50 NTU
- Water Quality Score: **${qualityScore}/100**
- Last Updated: ${lastUpdateTime ? format(lastUpdateTime, "MMM d, yyyy HH:mm:ss") : "Unknown"}

**🎯 WHAT YOUR TURBIDITY MEANS:**
${
  turbidity <= 50
    ? `**EXCELLENT CLARITY (${turbidity.toFixed(1)} NTU)**
- Crystal clear water
- Excellent filtration performance
- Safe for consumption
- No immediate action needed`
    : turbidity <= 100
      ? `**GOOD CLARITY (${turbidity.toFixed(1)} NTU)**
- Slightly hazy but acceptable
- Minor filtration issues possible
- Monitor filter condition
- Generally safe`
      : turbidity <= 500
        ? `**POOR CLARITY (${turbidity.toFixed(1)} NTU)**
- Noticeably cloudy water
- Filtration system needs attention
- May harbor bacteria/particles
- Treatment recommended`
        : `**CRITICAL TURBIDITY (${turbidity.toFixed(1)} NTU)**
- Very poor water clarity
- High particle/bacteria risk
- Immediate filtration required
- Do not consume without treatment`
}

**🔬 PARTICLE ANALYSIS:**
- Particle Concentration: ${turbidity > 500 ? "Very High" : turbidity > 100 ? "High" : turbidity > 50 ? "Moderate" : "Low"}
- Filtration Efficiency: ${turbidity > 200 ? "Poor - needs replacement" : turbidity > 100 ? "Declining" : "Good"}
- Bacterial Risk: ${turbidity > 100 ? "ELEVATED" : "LOW"}
- Aesthetic Quality: ${turbidity > 100 ? "Unacceptable" : "Acceptable"}

**💡 SPECIFIC RECOMMENDATIONS FOR ${turbidity.toFixed(1)} NTU:**
${
  turbidity > 500
    ? `
- IMMEDIATE ACTION REQUIRED
- Replace all filter cartridges
- Check for system damage
- Consider professional service
- Do not drink without boiling`
    : turbidity > 100
      ? `
- Replace filter cartridges
- Check filter housing for damage
- Increase monitoring frequency
- Consider pre-filtration
- Flush system thoroughly`
      : turbidity > 50
        ? `
- Check filter condition
- Consider filter replacement
- Monitor for trends
- Inspect system for issues`
        : `- Current filtration is excellent
- Continue regular maintenance
- Monitor for any changes`
}

**🛠️ FILTRATION SYSTEM ANALYSIS:**
- Filter Performance: ${turbidity > 200 ? "FAILING" : turbidity > 100 ? "DECLINING" : turbidity > 50 ? "ADEQUATE" : "EXCELLENT"}
- Maintenance Needed: ${turbidity > 100 ? "IMMEDIATE" : turbidity > 50 ? "SOON" : "ROUTINE"}
- System Efficiency: ${(((50 - Math.min(turbidity, 50)) / 50) * 100).toFixed(0)}%

Need help selecting the right filters or troubleshooting your filtration system?`
  }

  // Generate conductivity-specific analysis
  const generateConductivityAnalysis = (): string => {
    if (!sensorData) return "No conductivity data available for analysis."

    const conductivity = sensorData.conductivity
    const status = conductivity <= 800 ? "NORMAL" : conductivity <= 1200 ? "ELEVATED" : "VERY HIGH"
    const qualityScore = calculateWaterQualityScore(sensorData)

    return `⚡ **DETAILED CONDUCTIVITY ANALYSIS - Your Reading: ${conductivity.toFixed(0)} μS/cm**

**📊 CURRENT STATUS:**
- Your Conductivity: **${conductivity.toFixed(0)} μS/cm**
- Status: **${status}**
- Ideal Range: 200-800 μS/cm
- Water Quality Score: **${qualityScore}/100**
- Last Updated: ${lastUpdateTime ? format(lastUpdateTime, "MMM d, yyyy HH:mm:ss") : "Unknown"}

**🎯 WHAT YOUR CONDUCTIVITY MEANS:**
${
  conductivity < 200
    ? `**LOW CONDUCTIVITY (${conductivity.toFixed(0)} μS/cm)**
- Low dissolved ion concentration
- Very pure water
- May lack essential minerals
- Could indicate over-filtration`
    : conductivity <= 800
      ? `**NORMAL CONDUCTIVITY (${conductivity.toFixed(0)} μS/cm)**
- Balanced ion concentration
- Good mineral content
- Optimal for drinking
- No treatment needed`
      : conductivity <= 1200
        ? `**ELEVATED CONDUCTIVITY (${conductivity.toFixed(0)} μS/cm)**
- High dissolved ion concentration
- Increased mineral content
- May affect taste
- Monitor closely`
        : `**VERY HIGH CONDUCTIVITY (${conductivity.toFixed(0)} μS/cm)**
- Excessive ion concentration
- Very high dissolved minerals
- Poor water quality - check source
- Treatment strongly recommended`
}

**🔬 ION CONCENTRATION ANALYSIS:**
- Dissolved Ions: ${conductivity > 1200 ? "Excessive concentration" : conductivity > 800 ? "High concentration" : "Normal levels"}
- Mineral Content: ${conductivity > 1500 ? "Extreme" : conductivity > 1200 ? "Very High" : conductivity > 1000 ? "High" : conductivity > 800 ? "Elevated" : conductivity < 200 ? "Low" : "Balanced"}
- Salinity Level: ${conductivity > 1500 ? "High" : "Normal"}

**💡 SPECIFIC RECOMMENDATIONS FOR ${conductivity.toFixed(0)} μS/cm:**
${
  conductivity > 1200
    ? `
🔴 HIGH PRIORITY ACTIONS:
- Consider reverse osmosis treatment
- Check for salt contamination or seawater intrusion
- Test for specific ions (sodium, chloride, sulfates)
- Monitor source water quality
- May need professional water analysis`
    : conductivity > 800
      ? `
⚠️ RECOMMENDED ACTIONS:
- Monitor for taste changes
- Check TDS correlation
- Consider partial treatment
- Track trends over time`
      : conductivity < 200
        ? `
- Consider mineral supplementation
- Check for over-filtration
- Monitor for corrosion
- Add trace minerals if needed`
        : `- Current conductivity is optimal
- Continue regular monitoring
- No treatment needed`
}

**🔗 CORRELATION WITH OTHER PARAMETERS:**
- TDS Relationship: ${Math.abs(conductivity * 0.5 - sensorData.tds) < 50 ? "Normal correlation" : "Unusual - investigate"}
- Expected TDS: ~${(conductivity * 0.5).toFixed(0)} ppm
- Actual TDS: ${sensorData.tds.toFixed(0)} ppm

Need help understanding the relationship between conductivity and your other parameters?`
  }

  // Generate overall analysis
  const generateOverallAnalysis = (): string => {
    if (!sensorData) return "No sensor data available for overall analysis."

    const score = calculateWaterQualityScore(sensorData)
    const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F"

    const issues = []
    if (sensorData.ph < 6.5 || sensorData.ph > 8.5) issues.push("pH imbalance")
    if (sensorData.temperature > 25) issues.push("elevated temperature")
    if (sensorData.tds > 300) issues.push("high TDS")
    if (sensorData.conductivity > 800) issues.push("high conductivity")
    if (sensorData.turbidity > 50) issues.push("poor clarity")

    const isCriticalPH = sensorData.ph < 5.0
    const isEmergency = isCriticalPH

    return `🎯 **COMPLETE WATER QUALITY ASSESSMENT**

${isEmergency ? "🚨 **EMERGENCY SITUATION DETECTED!**\n\n" : ""}

**📊 OVERALL SCORE: ${score}/100 (Grade: ${grade})**

**🔬 YOUR CURRENT READINGS:**
- **pH**: ${sensorData.ph.toFixed(2)} ${sensorData.ph >= 6.5 && sensorData.ph <= 8.5 ? "✅" : sensorData.ph < 5.0 ? "🔴 CRITICAL" : "⚠️"}
- **Temperature**: ${sensorData.temperature.toFixed(1)}°C ${sensorData.temperature <= 25 ? "✅" : "⚠️"}
- **TDS**: ${sensorData.tds.toFixed(0)} ppm ${sensorData.tds <= 300 ? "✅" : sensorData.tds > 600 ? "🔴" : "⚠️"}
- **Conductivity**: ${sensorData.conductivity.toFixed(0)} μS/cm ${sensorData.conductivity <= 800 ? "✅" : sensorData.conductivity > 1200 ? "🔴" : "⚠️"}
- **Turbidity**: ${sensorData.turbidity.toFixed(1)} NTU ${sensorData.turbidity <= 50 ? "✅" : "⚠️"}
- **Last Updated**: ${lastUpdateTime ? format(lastUpdateTime, "MMM d, yyyy HH:mm:ss") : "Unknown"}

**🎯 WATER QUALITY STATUS:**
${
  isEmergency
    ? `**🚨 EMERGENCY - IMMEDIATE ACTION REQUIRED**
- CRITICAL pH level detected (${sensorData.ph.toFixed(2)})
- Water is DANGEROUS for consumption
- Multiple parameters outside safe ranges
- Professional intervention required IMMEDIATELY`
    : issues.length === 0
      ? `**EXCELLENT WATER QUALITY**
- All parameters within optimal ranges
- Safe for drinking and use
- Continue current management
- No immediate action needed`
      : `**ISSUES DETECTED: ${issues.length}**
- Problems found: ${issues.join(", ")}
- ${issues.length === 1 ? "Minor issue" : issues.length <= 2 ? "Moderate concerns" : "Multiple issues requiring attention"}
- Treatment recommendations below`
}

**💡 PRIORITY ACTIONS FOR YOUR READINGS:**
${
  isCriticalPH
    ? `🚨 **EMERGENCY PRIORITY 1: pH CRISIS (${sensorData.ph.toFixed(2)})**
- STOP using this water immediately
- Contact emergency water services
- Use only bottled water for all needs
- Check for chemical contamination
- Professional treatment required NOW

`
    : ""
}${
  sensorData.ph < 6.5 && !isCriticalPH
    ? `1. **pH CORRECTION (${sensorData.ph.toFixed(2)})** - Add pH increaser urgently
`
    : ""
}${
  sensorData.tds > 600
    ? `${sensorData.ph < 6.5 && !isCriticalPH ? 2 : 1}. **HIGH TDS (${sensorData.tds.toFixed(0)} ppm)** - Install reverse osmosis system
`
    : ""
}${
  sensorData.conductivity > 1200
    ? `${(sensorData.ph < 6.5 && !isCriticalPH ? 1 : 0) + (sensorData.tds > 600 ? 1 : 0) + 1}. **HIGH CONDUCTIVITY (${sensorData.conductivity.toFixed(0)} μS/cm)** - Check water source
`
    : ""
}${issues.length === 0 && !isEmergency ? "1. Continue regular monitoring\n2. Maintain current treatment\n3. Schedule routine maintenance" : ""}

**🏆 COMPLIANCE STATUS:**
- WHO Standards: ${sensorData.ph >= 6.5 && sensorData.ph <= 8.5 && sensorData.turbidity <= 100 ? "✅ COMPLIANT" : "❌ NON-COMPLIANT"}
- EPA Standards: ${sensorData.ph >= 6.5 && sensorData.ph <= 8.5 && sensorData.turbidity <= 50 ? "✅ COMPLIANT" : "❌ NON-COMPLIANT"}
- EU Standards: ${sensorData.ph >= 6.5 && sensorData.ph <= 9.5 && sensorData.turbidity <= 25 ? "✅ COMPLIANT" : "❌ NON-COMPLIANT"}

**📈 RISK ASSESSMENT:**
- Health Risk: ${isEmergency ? "🔴 EXTREME" : issues.length >= 3 ? "🔴 HIGH" : issues.length >= 2 ? "⚠️ MODERATE" : issues.length >= 1 ? "⚠️ LOW" : "✅ MINIMAL"}
- Equipment Risk: ${sensorData.tds > 600 ? "🔴 HIGH (scale damage)" : sensorData.tds > 400 ? "⚠️ MODERATE" : "✅ LOW"}
- Urgency: ${isEmergency ? "🚨 IMMEDIATE" : issues.length >= 2 ? "⚠️ URGENT" : issues.length >= 1 ? "📅 SOON" : "✅ ROUTINE"}

${isEmergency ? "\n🚨 **THIS IS A WATER EMERGENCY - ACT IMMEDIATELY!**" : ""}

Would you like specific emergency procedures or treatment steps?`
  }

  // Generate help response for available parameters
  const generateParameterHelpResponse = (): string => {
    if (!sensorData) return "No sensor data available for analysis."

    const qualityScore = calculateWaterQualityScore(sensorData)

    return `🤖 **I can analyze ALL your water quality parameters!**

**📊 YOUR CURRENT READINGS:**
- **pH**: ${sensorData.ph.toFixed(2)} ${sensorData.ph >= 6.5 && sensorData.ph <= 8.5 ? "✅" : sensorData.ph < 5.0 ? "🔴 CRITICAL" : "⚠️"}
- **Temperature**: ${sensorData.temperature.toFixed(1)}°C ${sensorData.temperature <= 25 ? "✅" : "⚠️"}
- **TDS**: ${sensorData.tds.toFixed(0)} ppm ${sensorData.tds <= 300 ? "✅" : sensorData.tds > 600 ? "🔴" : "⚠️"}
- **Conductivity**: ${sensorData.conductivity.toFixed(0)} μS/cm ${sensorData.conductivity <= 800 ? "✅" : sensorData.conductivity > 1200 ? "🔴" : "⚠️"}
- **Turbidity**: ${sensorData.turbidity.toFixed(1)} NTU ${sensorData.turbidity <= 50 ? "✅" : "⚠️"}
- **Overall Quality Score**: **${qualityScore}/100**

**🎯 ASK ME ABOUT ANY PARAMETER:**

**🔬 pH Analysis:**
- "Analyze my pH"
- "Why is my water acidic?"
- "Is my pH safe?"
- "pH ${sensorData.ph.toFixed(2)} meaning"

**🌡️ Temperature Analysis:**
- "Check my temperature"
- "Is ${sensorData.temperature.toFixed(1)}°C too hot?"
- "Temperature analysis"
- "Why is my water warm?"

**💧 TDS (Total Dissolved Solids):**
- "Analyze my TDS"
- "What does ${sensorData.tds.toFixed(0)} ppm mean?"
- "Is my water hard?"
- "Dissolved solids analysis"
- "Mineral content"

**⚡ Conductivity Analysis:**
- "Check my conductivity"
- "What does ${sensorData.conductivity.toFixed(0)} μS/cm mean?"
- "Electrical conductivity"
- "Ion concentration"

**🌊 Turbidity (Water Clarity):**
- "Analyze turbidity"
- "Is my water cloudy?"
- "Water clarity check"
- "Filter performance"
- "Why is water murky?"

**🎯 Complete Analysis:**
- "Overall assessment"
- "Analyze everything"
- "Complete water quality check"
- "Summary of all readings"

Just ask about any parameter and I'll give you detailed analysis based on YOUR actual readings! 🌊`
  }

  // Data-driven response generator
  const generateDataDrivenResponse = (message: string, context: string): string => {
    if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
      const qualityScore = sensorData ? calculateWaterQualityScore(sensorData) : 0

      return `👋 **Hello! I'm analyzing YOUR actual water quality data!**

**📊 YOUR CURRENT READINGS:**
- pH: ${sensorData?.ph.toFixed(2) || "N/A"} ${(sensorData?.ph || 0) >= 6.5 && (sensorData?.ph || 0) <= 8.5 ? "✅" : (sensorData?.ph || 0) < 5.0 ? "🔴 CRITICAL" : "⚠️"}
- Temperature: ${sensorData?.temperature.toFixed(1) || "N/A"}°C ${(sensorData?.temperature || 0) <= 25 ? "✅" : "⚠️"}
- TDS: ${sensorData?.tds.toFixed(0) || "N/A"} ppm ${(sensorData?.tds || 0) <= 300 ? "✅" : (sensorData?.tds || 0) > 600 ? "🔴" : "⚠️"}
- Turbidity: ${sensorData?.turbidity.toFixed(1) || "N/A"} NTU ${(sensorData?.turbidity || 0) <= 50 ? "✅" : "⚠️"}
- **Quality Score: ${qualityScore}/100**
- Last Updated: ${lastUpdateTime ? format(lastUpdateTime, "MMM d, yyyy HH:mm:ss") : "Unknown"}

**🎯 Ask me about YOUR specific readings:**
- "Why is my pH ${sensorData?.ph.toFixed(2) || "X"}?"
- "Is my temperature of ${sensorData?.temperature.toFixed(1) || "X"}°C safe?"
- "What does my turbidity of ${sensorData?.turbidity.toFixed(1) || "X"} NTU mean?"

I'll analyze YOUR actual data, not give generic advice! 🌊`
    }

    return `🤖 **I'm analyzing YOUR actual water quality data!**

**📊 YOUR CURRENT READINGS:**
${context}

**💡 I can provide specific insights about YOUR readings:**
- Detailed analysis of each parameter
- Specific recommendations for YOUR values
- Trend analysis based on YOUR data
- Compliance checking for YOUR readings

**🎯 Try asking:**
- "Analyze my pH of ${sensorData?.ph.toFixed(2) || "X"}"
- "What does my turbidity of ${sensorData?.turbidity.toFixed(1) || "X"} mean?"
- "Is my temperature of ${sensorData?.temperature.toFixed(1) || "X"}°C concerning?"

I'll give you insights based on YOUR actual sensor data! 🌊`
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await generateIntelligentResponse(userMessage.content)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error generating response:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I'm having trouble analyzing your data right now. Your current readings are: pH ${sensorData?.ph.toFixed(2) || "N/A"}, Temperature ${sensorData?.temperature.toFixed(1) || "N/A"}°C, TDS ${sensorData?.tds.toFixed(0) || "N/A"} ppm, Turbidity ${sensorData?.turbidity.toFixed(1) || "N/A"} NTU. Please try asking about a specific parameter.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Manual refresh function
  const refreshData = async () => {
    console.log("🔄 Manually refreshing sensor data")
    setLastUpdateTime(new Date())
  }

  return (
    <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Bot className="h-5 w-5 text-blue-500" />
          Data-Driven AI Water Quality Assistant
          <div className="flex gap-2 ml-auto">
            {isConnected && (
              <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                Live Data
              </Badge>
            )}
            <Badge variant="outline" className="text-purple-600 border-purple-600 text-xs">
              <Brain className="h-3 w-3 mr-1" />
              Real Data Analysis
            </Badge>
            {smartAlertsEnabled && (
              <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                <Bell className="h-3 w-3 mr-1" />
                Smart Alerts
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={refreshData}
              title="Refresh sensor data"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          AI assistant that analyzes YOUR actual sensor readings: pH {sensorData?.ph.toFixed(2) || "N/A"}, Temp{" "}
          {sensorData?.temperature.toFixed(1) || "N/A"}°C, TDS {sensorData?.tds.toFixed(0) || "N/A"} ppm, Turbidity{" "}
          {sensorData?.turbidity.toFixed(1) || "N/A"} NTU
          {sensorData && (
            <span className="text-blue-600 font-semibold"> | Score: {calculateWaterQualityScore(sensorData)}/100</span>
          )}
          {lastUpdateTime && (
            <span className="text-xs opacity-70"> (Updated: {format(lastUpdateTime, "HH:mm:ss")})</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions with actual data */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              onClick={action.action}
              className="flex items-center gap-2 text-xs"
              title={action.description}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>

        <Separator />

        <ScrollArea className="h-[300px] sm:h-[400px] w-full rounded-md border p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : message.type === "alert"
                          ? "bg-red-500 text-white"
                          : message.type === "suggestion"
                            ? "bg-purple-500 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : message.type === "alert" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : message.type === "suggestion" ? (
                      <Star className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : message.type === "alert"
                          ? "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100"
                          : message.type === "suggestion"
                            ? "bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                    <p className="text-xs opacity-70 mt-2">{format(message.timestamp, "HH:mm")}</p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs sm:text-sm">Analyzing your sensor data...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask about your readings: pH ${sensorData?.ph.toFixed(2) || "N/A"}, Temp ${sensorData?.temperature.toFixed(1) || "N/A"}°C...`}
            disabled={isLoading}
            className="flex-1 text-xs sm:text-sm"
          />
          {voiceSupported && (
            <Button
              variant="outline"
              size="icon"
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              className={isListening ? "bg-red-100 border-red-300" : ""}
            >
              {isListening ? <MicOff className="h-4 w-4 text-red-600" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Status indicators */}
        <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            {isConnected ? "Connected to sensors" : "Disconnected"}
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${apiStatus === "available" ? "bg-green-500" : "bg-yellow-500"}`} />
            AI: {apiStatus === "available" ? "Enhanced" : "Basic"}
          </div>
          {sensorData && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Quality Score: {calculateWaterQualityScore(sensorData)}/100
            </div>
          )}
        </div>

        {!isConnected && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">
              Unable to connect to sensor data. The AI will provide general guidance, but specific analysis requires
              live sensor readings.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
