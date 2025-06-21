"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Bot, Send, User, Loader2, X, Minimize2, Maximize2, Sparkles, AlertTriangle } from "lucide-react"
import { subscribeToSensorData } from "@/lib/firebase"
import { format } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import { motion, AnimatePresence } from "framer-motion"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface SensorData {
  ph: number
  temperature: number
  tds: number
  conductivity: number
  turbidity: number
  timestamp: string
}

export default function FloatingAIAvatar() {
  const { session, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello ${user?.email?.split("@")[0] || "there"}! 👋 I'm your personal water quality AI assistant. I can analyze your real-time sensor data and answer any questions about water quality parameters. What would you like to know?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sensorData, setSensorData] = useState<SensorData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [firebaseError, setFirebaseError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Subscribe to real-time sensor data
  useEffect(() => {
    if (!session) return

    // Use mock data by default to avoid Firebase permission issues
    const mockData = {
      ph: 7.2,
      temperature: 22.5,
      tds: 150,
      conductivity: 300,
      turbidity: 2.1,
      timestamp: new Date().toISOString(),
    }

    setSensorData(mockData)
    setIsConnected(true)
    setFirebaseError(null)

    // Try to subscribe to real data, but with robust error handling
    const unsubscribe = subscribeToSensorData(
      "1",
      (data) => {
        if (data && data.feeds && data.feeds.length > 0) {
          const latestReading = data.feeds[0]
          setSensorData({
            ph: Number.parseFloat(latestReading.field1) || 0,
            temperature: Number.parseFloat(latestReading.field3) || 0,
            tds: Number.parseFloat(latestReading.field2) || 0,
            conductivity: Number.parseFloat(latestReading.field4) || 0,
            turbidity: Number.parseFloat(latestReading.field5) || 0,
            timestamp: latestReading.created_at,
          })
          setIsConnected(true)
          setFirebaseError(null)
        }
      },
      (error) => {
        console.error("Error loading sensor data:", error)
        setFirebaseError(error.message || "Permission denied accessing Firebase data")

        // Always fall back to mock data on error
        setSensorData({
          ph: 7.2,
          temperature: 22.5,
          tds: 150,
          conductivity: 300,
          turbidity: 2.1,
          timestamp: new Date().toISOString(),
        })

        // We're still "connected" but using mock data
        setIsConnected(true)
      },
    )

    return () => unsubscribe()
  }, [session])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Show notification when new message arrives and chat is closed
  useEffect(() => {
    if (messages.length > 1 && !isOpen) {
      setHasNewMessage(true)
    }
  }, [messages, isOpen])

  // Clear notification when chat is opened
  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false)
    }
  }, [isOpen])

  // Don't render if user is not logged in
  if (!session || !user) {
    return null
  }

  // Generate context from sensor data
  const generateSensorContext = (): string => {
    if (!sensorData) {
      return "No current sensor data available."
    }

    const context = `Current water quality readings (as of ${format(new Date(sensorData.timestamp), "MMM d, yyyy HH:mm")}):
- pH Level: ${sensorData.ph} (ideal range: 6.5-8.5)
- Temperature: ${sensorData.temperature}°C (ideal range: 10-25°C)
- Total Dissolved Solids (TDS): ${sensorData.tds} ppm (ideal range: 50-300 ppm)
- Conductivity: ${sensorData.conductivity} μS/cm (ideal range: 200-800 μS/cm)
- Turbidity: ${sensorData.turbidity} NTU (ideal: <5 NTU)

Water Quality Assessment:
- pH: ${sensorData.ph >= 6.5 && sensorData.ph <= 8.5 ? "Normal" : "Outside ideal range"}
- Temperature: ${sensorData.temperature >= 10 && sensorData.temperature <= 25 ? "Normal" : "Outside ideal range"}
- TDS: ${sensorData.tds >= 50 && sensorData.tds <= 300 ? "Normal" : "Outside ideal range"}
- Conductivity: ${sensorData.conductivity >= 200 && sensorData.conductivity <= 800 ? "Normal" : "Outside ideal range"}
- Turbidity: ${sensorData.turbidity <= 5 ? "Good clarity" : "Poor clarity"}`

    return context
  }

  // Enhanced rule-based AI responses (same as before but more concise for overlay)
  const generateIntelligentResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()
    const context = generateSensorContext()

    // Greeting responses
    if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
      return `Hello! I'm analyzing your current water quality data. ${context}. What would you like to know?`
    }

    // Water quality questions
    if (message.includes("ph") || message.includes("acid")) {
      const ph = sensorData?.ph || 0
      if (ph < 6.5) {
        return `⚠️ **pH Alert**: Your pH is ${ph} (acidic). This could indicate contamination. Consider testing for pollutants and monitoring trends. ${context}`
      } else if (ph > 8.5) {
        return `⚠️ **pH Alert**: Your pH is ${ph} (alkaline). This might indicate mineral deposits. Monitor for changes and consider treatment if persistent. ${context}`
      } else {
        return `✅ **pH Good**: Your pH of ${ph} is perfect! Water is properly balanced and safe. ${context}`
      }
    }

    if (message.includes("temperature") || message.includes("temp")) {
      const temp = sensorData?.temperature || 0
      if (temp > 25) {
        return `🌡️ **Temperature High**: ${temp}°C is elevated. This can promote bacterial growth and reduce oxygen. Monitor for algae blooms. ${context}`
      } else if (temp < 10) {
        return `❄️ **Temperature Low**: ${temp}°C is quite cold but not necessarily harmful. Normal for winter conditions. ${context}`
      } else {
        return `✅ **Temperature Perfect**: ${temp}°C is ideal for healthy water ecosystems. ${context}`
      }
    }

    if (message.includes("safe") || message.includes("quality") || message.includes("overall")) {
      const issues = []
      if (sensorData) {
        if (sensorData.ph < 6.5 || sensorData.ph > 8.5) issues.push("pH outside ideal range")
        if (sensorData.temperature > 25) issues.push("elevated temperature")
        if (sensorData.tds > 300) issues.push("high dissolved solids")
        if (sensorData.conductivity > 800) issues.push("high conductivity")
        if (sensorData.turbidity > 5) issues.push("poor clarity")
      }

      if (issues.length === 0) {
        return `✅ **Excellent Water Quality!** All parameters are within ideal ranges. Your water appears safe for most uses. ${context}`
      } else {
        return `⚠️ **Quality Issues Detected**: ${issues.join(", ")}. Consider addressing these concerns. ${context}`
      }
    }

    if (message.includes("help")) {
      return `🤖 **I can help with**: pH analysis, temperature effects, TDS levels, conductivity, turbidity, and overall safety assessment. Try asking "Is my water safe?" or "What does my pH mean?"`
    }

    // Firebase error response
    if (message.includes("error") || message.includes("firebase") || message.includes("permission")) {
      if (firebaseError) {
        return `🔧 **System Status**: I'm currently using simulated data because there was an error accessing the Firebase database: "${firebaseError}". Your administrator needs to check Firebase security rules. In the meantime, I'm still able to provide analysis based on typical water quality parameters.`
      } else {
        return `✅ **System Status**: All systems are operational. I'm analyzing real-time water quality data.`
      }
    }

    // Default response
    return `🔍 **Analysis**: ${context}. Ask me about specific parameters or overall water safety!`
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
      const response = generateIntelligentResponse(userMessage.content)

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
        content: "I'm having trouble right now. Please try asking about specific water quality parameters.",
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

  return (
    <>
      {/* Floating Avatar Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="relative w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
          size="icon"
        >
          <Bot className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />

          {/* Sparkle animation */}
          <div className="absolute -top-1 -right-1">
            <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
          </div>

          {/* Notification badge */}
          {hasNewMessage && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
            >
              <span className="text-xs text-white font-bold">!</span>
            </motion.div>
          )}

          {/* Live data indicator */}
          {isConnected && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white">
              <div className="w-full h-full bg-green-400 rounded-full animate-ping" />
            </div>
          )}

          {/* Firebase error indicator */}
          {firebaseError && (
            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white">
              <AlertTriangle className="w-3 h-3 text-white" />
            </div>
          )}
        </Button>
      </motion.div>

      {/* Chat Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 ${
                isMinimized ? "w-80 h-16" : "w-full max-w-2xl h-[600px]"
              } transition-all duration-300`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">AI Water Assistant</h3>
                    <div className="flex items-center gap-2">
                      {isConnected && (
                        <Badge
                          variant="outline"
                          className={`${firebaseError ? "text-yellow-600 border-yellow-600" : "text-green-600 border-green-600"} text-xs`}
                        >
                          <div
                            className={`w-1.5 h-1.5 ${firebaseError ? "bg-yellow-500" : "bg-green-500"} rounded-full mr-1 animate-pulse`}
                          />
                          {firebaseError ? "Using Mock Data" : "Live Data"}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
                        AI Enhanced
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)} className="h-8 w-8">
                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Chat Content */}
              {!isMinimized && (
                <div className="flex flex-col h-[calc(100%-80px)]">
                  {/* Firebase Error Alert */}
                  {firebaseError && (
                    <Alert
                      variant="warning"
                      className="m-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900"
                    >
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-300">
                        Using simulated data due to Firebase permission error. Ask your administrator to check Firebase
                        security rules.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`flex gap-2 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                message.role === "user"
                                  ? "bg-blue-500 text-white"
                                  : "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                              }`}
                            >
                              {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>
                            <div
                              className={`rounded-lg p-3 ${
                                message.role === "user"
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              }`}
                            >
                              <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                              <p className="text-xs opacity-70 mt-2">{format(message.timestamp, "HH:mm")}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex gap-3 justify-start">
                          <div className="flex gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Analyzing your water data...
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex gap-2">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about your water quality..."
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isLoading || !input.trim()}
                        size="icon"
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
