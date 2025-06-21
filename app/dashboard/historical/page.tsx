"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  RefreshCw,
  Download,
  Filter,
  LineChart,
  BarChart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Droplets,
  Thermometer,
  Zap,
  AlertTriangle,
  Tag,
  Radio,
  WifiOff,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { subscribeToSensorDataByDateRange, type SensorData } from "@/lib/firebase"
import { format, isValid, parseISO, addDays, subDays } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { ExportButton } from "@/components/export-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CustomDatePicker } from "@/components/custom-date-picker"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Line,
  Bar,
} from "recharts"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

// Sensor type definitions
const sensorTypes = {
  ph: {
    title: "pH Level",
    field: "field1",
    color: "#3b82f6",
    unit: "",
  },
  tds: {
    title: "Total Dissolved Solids",
    field: "field2",
    color: "#22c55e",
    unit: "ppm",
  },
  temperature: {
    title: "Temperature",
    field: "field3",
    color: "#ef4444",
    unit: "°C",
  },
  conductivity: {
    title: "Conductivity",
    field: "field4",
    color: "#eab308",
    unit: "μS/cm",
  },
  turbidity: {
    title: "Turbidity",
    field: "field5",
    color: "#6b7280",
    unit: "NTU",
  },
  anomaly: {
    title: "Anomaly Score",
    field: "field6",
    color: "#f97316",
    unit: "",
  },
  classification: {
    title: "Classification Code",
    field: "field7",
    color: "#a855f7",
    unit: "",
  },
}

export default function HistoricalDataPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get date from URL or default to today
  const dateParam = searchParams.get("date")
  const initialDate = dateParam && isValid(parseISO(dateParam)) ? parseISO(dateParam) : new Date()

  // Get sensor type from URL or default to pH
  const sensorParam = searchParams.get("sensor")
  const initialSensor = sensorParam && sensorTypes[sensorParam as keyof typeof sensorTypes] ? sensorParam : "ph"

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate)
  const [selectedSensor, setSelectedSensor] = useState(initialSensor)
  const [data, setData] = useState<SensorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noDataForDate, setNoDataForDate] = useState(false)
  const [chartView, setChartView] = useState<"line" | "bar">("line")
  const [dataRange, setDataRange] = useState<"day" | "week" | "month">("day")
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Ref for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Set up real-time listener when date, sensor, or range changes
  useEffect(() => {
    console.log("Setting up real-time listener for historical data")
    setLoading(true)
    setError(null)
    setNoDataForDate(false)

    // Clean up previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    // Calculate the date range based on selected range
    const nextDay = new Date(selectedDate)
    if (dataRange === "day") {
      nextDay.setDate(nextDay.getDate() + 1)
    } else if (dataRange === "week") {
      nextDay.setDate(nextDay.getDate() + 7)
    } else if (dataRange === "month") {
      nextDay.setMonth(nextDay.getMonth() + 1)
    }

    // Format dates for Firebase
    const startDate = format(selectedDate, "yyyy-MM-dd'T'00:00:00'Z'")
    const endDate = format(nextDay, "yyyy-MM-dd'T'00:00:00'Z'")

    // Set up real-time listener for date range
    const unsubscribe = subscribeToSensorDataByDateRange(
      startDate,
      endDate,
      (sensorData) => {
        console.log("Received real-time historical data update:", sensorData)

        // Check if we have data for this date
        if (!sensorData.feeds || sensorData.feeds.length === 0) {
          setNoDataForDate(true)
        } else {
          setNoDataForDate(false)
        }

        // Check if we're using mock data
        const isMock = sensorData.channel?.name?.includes("Mock") || false
        setIsUsingMockData(isMock)
        setIsRealTimeConnected(true)

        setData(sensorData)
        setLastUpdated(new Date())
        setLoading(false)
        setError(null)
      },
      (error) => {
        console.error("Real-time historical listener error:", error)
        setError(`Real-time connection error: ${error.message}`)
        setIsRealTimeConnected(false)
        setLoading(false)
      },
    )

    unsubscribeRef.current = unsubscribe

    // Update URL with new parameters
    const params = new URLSearchParams()
    params.set("date", format(selectedDate, "yyyy-MM-dd"))
    params.set("sensor", selectedSensor)
    router.push(`/dashboard/historical?${params.toString()}`, { scroll: false })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [selectedDate, selectedSensor, dataRange, router])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
  }

  const handleSensorChange = (value: string) => {
    setSelectedSensor(value)
  }

  const handleForceRefresh = () => {
    // Force reconnection by temporarily changing the date
    const currentDate = selectedDate
    setSelectedDate(new Date(selectedDate.getTime() + 1000)) // Add 1 second
    setTimeout(() => setSelectedDate(currentDate), 100)
  }

  // Navigate to previous/next day
  const goToPreviousDay = () => {
    setSelectedDate((prevDate) => {
      if (dataRange === "day") return subDays(prevDate, 1)
      if (dataRange === "week") return subDays(prevDate, 7)
      if (dataRange === "month") {
        const newDate = new Date(prevDate)
        newDate.setMonth(newDate.getMonth() - 1)
        return newDate
      }
      return prevDate
    })
  }

  const goToNextDay = () => {
    const today = new Date()
    setSelectedDate((prevDate) => {
      if (dataRange === "day") {
        const nextDate = addDays(prevDate, 1)
        return nextDate > today ? today : nextDate
      }
      if (dataRange === "week") {
        const nextDate = addDays(prevDate, 7)
        return nextDate > today ? today : nextDate
      }
      if (dataRange === "month") {
        const newDate = new Date(prevDate)
        newDate.setMonth(newDate.getMonth() + 1)
        return newDate > today ? today : newDate
      }
      return prevDate
    })
  }

  // Get the current sensor configuration
  const sensor = sensorTypes[selectedSensor as keyof typeof sensorTypes]

  // Custom tooltip component for better hover effects
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value

      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-md">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{label}</p>
          <p className="font-medium" style={{ color: sensor.color }}>
            {sensor.title}:{" "}
            <span className="font-bold">
              {value}
              {sensor.unit}
            </span>
          </p>
        </div>
      )
    }

    return null
  }

  // Function to render the appropriate chart based on the selected chart type
  const renderChart = () => {
    if (loading) {
      return <div className="h-[400px] flex items-center justify-center">Loading real-time data...</div>
    }

    if (!data?.feeds || data.feeds.length === 0) {
      return <div className="h-[400px] flex items-center justify-center">No data available</div>
    }

    // Map the data to a format suitable for recharts
    const chartData = data.feeds
      .map((feed: any) => {
        const timestamp = new Date(feed.created_at)
        return {
          time: format(timestamp, "HH:mm:ss"),
          date: format(timestamp, "MM/dd"),
          value: Number.parseFloat(feed[sensor.field]),
        }
      })
      .reverse()

    if (chartView === "line") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <RechartsLineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis dataKey={dataRange === "day" ? "time" : "date"} stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <RechartsTooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#6B7280",
                strokeWidth: 1,
                strokeDasharray: "5 5",
                strokeOpacity: 0.7,
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke={sensor.color}
              activeDot={{ r: 8, fill: sensor.color, stroke: "white", strokeWidth: 2 }}
              strokeWidth={2}
              name={sensor.title}
              dot={{ fill: sensor.color, strokeWidth: 1, stroke: "white", r: 3 }}
              animationDuration={500}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      )
    } else {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <RechartsBarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis dataKey={dataRange === "day" ? "time" : "date"} stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <RechartsTooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#6B7280",
                strokeWidth: 1,
                strokeDasharray: "5 5",
                fill: "rgba(107, 114, 128, 0.1)",
                strokeOpacity: 0.7,
              }}
            />
            <Legend />
            <Bar
              dataKey="value"
              fill={sensor.color}
              name={sensor.title}
              animationDuration={500}
              radius={[4, 4, 0, 0]}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      )
    }
  }

  // Mobile filter controls component
  const MobileFilterControls = () => (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Date</label>
        <div className="flex flex-col gap-2">
          <CustomDatePicker value={selectedDate} onChange={handleDateChange} maxDate={new Date()} />

          <div className="flex justify-between items-center mt-2">
            <Button variant="outline" size="sm" onClick={goToPreviousDay} className="flex-1">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextDay}
              disabled={selectedDate >= new Date()}
              className="flex-1"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Sensor Type</label>
        <Select value={selectedSensor} onValueChange={handleSensorChange}>
          <SelectTrigger className="w-full backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800">
            <SelectValue placeholder="Select sensor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ph">pH Level</SelectItem>
            <SelectItem value="tds">Total Dissolved Solids</SelectItem>
            <SelectItem value="temperature">Temperature</SelectItem>
            <SelectItem value="conductivity">Conductivity</SelectItem>
            <SelectItem value="turbidity">Turbidity</SelectItem>
            <SelectItem value="anomaly">Anomaly Score</SelectItem>
            <SelectItem value="classification">Classification</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Data Range</label>
        <Tabs
          defaultValue={dataRange}
          onValueChange={(value) => setDataRange(value as "day" | "week" | "month")}
          className="w-full"
        >
          <TabsList className="w-full bg-white/40 dark:bg-gray-900/40 backdrop-blur-md">
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
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
            <TabsTrigger value="line" className="flex items-center gap-1">
              <LineChart className="h-3 w-3" />
              Line
            </TabsTrigger>
            <TabsTrigger value="bar" className="flex items-center gap-1">
              <BarChart className="h-3 w-3" />
              Bar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="pt-4 space-y-2">
        <Button
          onClick={handleForceRefresh}
          disabled={loading}
          className="w-full backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80 text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Force Refresh
        </Button>

        {data?.feeds && data.feeds.length > 0 && (
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
              link.download = `${selectedSensor}-${format(selectedDate, "yyyy-MM-dd")}.csv`
              link.click()

              // Clean up
              URL.revokeObjectURL(url)
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Historical Data (Real-time)</h2>
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
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View sensor readings from past dates with real-time updates
            </p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Mobile filter button */}
        <div className="md:hidden flex justify-end gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" onClick={(e) => e.stopPropagation()}>
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] overflow-y-auto z-[60]">
              <SheetHeader>
                <SheetTitle>Filters & Options</SheetTitle>
                <SheetDescription>Adjust date, sensor type and view options</SheetDescription>
              </SheetHeader>
              <MobileFilterControls />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop filter controls */}
      <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg hidden md:block">
        <CardHeader>
          <CardTitle>Select Date and Sensor</CardTitle>
          <CardDescription>
            Choose a date and sensor type to view historical readings with real-time updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">
                Date
              </label>
              <div className="flex flex-col gap-2">
                <CustomDatePicker value={selectedDate} onChange={handleDateChange} maxDate={new Date()} />

                <div className="flex justify-between items-center mt-2">
                  <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToNextDay} disabled={selectedDate >= new Date()}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="sensor" className="text-sm font-medium">
                Sensor Type
              </label>
              <Select value={selectedSensor} onValueChange={handleSensorChange}>
                <SelectTrigger className="w-full backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800">
                  <SelectValue placeholder="Select sensor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ph">pH Level</SelectItem>
                  <SelectItem value="tds">Total Dissolved Solids</SelectItem>
                  <SelectItem value="temperature">Temperature</SelectItem>
                  <SelectItem value="conductivity">Conductivity</SelectItem>
                  <SelectItem value="turbidity">Turbidity</SelectItem>
                  <SelectItem value="anomaly">Anomaly Score</SelectItem>
                  <SelectItem value="classification">Classification</SelectItem>
                </SelectContent>
              </Select>

              <div className="mt-2">
                <label className="text-sm font-medium mb-1 block">Data Range</label>
                <Tabs
                  defaultValue={dataRange}
                  onValueChange={(value) => setDataRange(value as "day" | "week" | "month")}
                  className="w-full"
                >
                  <TabsList className="w-full bg-white/40 dark:bg-gray-900/40 backdrop-blur-md">
                    <TabsTrigger value="day">Day</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="mt-2">
                <label className="text-sm font-medium mb-1 block">Chart Type</label>
                <Tabs
                  defaultValue={chartView}
                  onValueChange={(value) => setChartView(value as "line" | "bar")}
                  className="w-full"
                >
                  <TabsList className="w-full bg-white/40 dark:bg-gray-900/40 backdrop-blur-md">
                    <TabsTrigger value="line" className="flex items-center gap-1">
                      <LineChart className="h-3 w-3" />
                      Line
                    </TabsTrigger>
                    <TabsTrigger value="bar" className="flex items-center gap-1">
                      <BarChart className="h-3 w-3" />
                      Bar
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="flex flex-col justify-end gap-2">
              <Button
                onClick={handleForceRefresh}
                disabled={loading}
                className="w-full backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80 text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Force Refresh
              </Button>

              {data?.feeds && data.feeds.length > 0 && (
                <ExportButton
                  data={data.feeds.map((feed: any) => ({
                    timestamp: new Date(feed.created_at).toLocaleString(),
                    value: feed[sensor.field],
                  }))}
                  filename={`${selectedSensor}-${format(selectedDate, "yyyy-MM-dd")}.csv`}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert className="backdrop-blur-md bg-yellow-50/50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-300">Connection Warning</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-400">
            {error} The dashboard will continue to show the last received data.
          </AlertDescription>
        </Alert>
      )}

      {noDataForDate && !loading && !error && (
        <Alert className="backdrop-blur-md bg-yellow-50/50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-300">Using Mock Data</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-400">
            No sensor readings were found for {format(selectedDate, "MMMM d, yyyy")}. Displaying mock data for
            demonstration purposes with real-time updates.
          </AlertDescription>
        </Alert>
      )}

      <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="md:hidden">
                  <Button
                    variant="outline"
                    className="flex items-center justify-between w-full md:w-auto border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-left font-medium"
                  >
                    <span>{sensor.title}</span>
                    <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[220px]">
                  <DropdownMenuItem onClick={() => setSelectedSensor("ph")}>
                    <Droplets className="mr-2 h-4 w-4 text-blue-500" />
                    pH Level
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedSensor("tds")}>
                    <Droplets className="mr-2 h-4 w-4 text-green-500" />
                    Total Dissolved Solids
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedSensor("temperature")}>
                    <Thermometer className="mr-2 h-4 w-4 text-red-500" />
                    Temperature
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedSensor("conductivity")}>
                    <Zap className="mr-2 h-4 w-4 text-yellow-500" />
                    Conductivity
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedSensor("turbidity")}>
                    <Droplets className="mr-2 h-4 w-4 text-gray-500" />
                    Turbidity
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedSensor("anomaly")}>
                    <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                    Anomaly Score
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedSensor("classification")}>
                    <Tag className="mr-2 h-4 w-4 text-purple-500" />
                    Classification
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="hidden md:block">
                <CardTitle>
                  {sensor.title} - {format(selectedDate, "MMMM d, yyyy")}
                  {dataRange !== "day" && (
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                      ({dataRange === "week" ? "7 days" : "30 days"})
                    </span>
                  )}
                </CardTitle>
              </div>
              <div className="flex md:hidden items-center gap-2 ml-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border border-gray-200 dark:border-gray-700 rounded-md"
                  onClick={() => setChartView(chartView === "line" ? "bar" : "line")}
                >
                  {chartView === "line" ? (
                    <LineChart className="h-4 w-4 text-gray-500" />
                  ) : (
                    <BarChart className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <CardDescription>Historical readings with real-time updates for the selected date</CardDescription>
            </div>
            <div className="md:hidden">
              <CardDescription>
                {format(selectedDate, "MMMM d, yyyy")}
                {dataRange !== "day" && (
                  <span className="text-sm ml-1">({dataRange === "week" ? "7 days" : "30 days"})</span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Mobile action buttons */}
            <div className="md:hidden flex gap-2">
              <Button
                onClick={handleForceRefresh}
                disabled={loading}
                size="sm"
                className="backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80 text-white"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span className="sr-only">Refresh</span>
              </Button>
            </div>

            {/* Desktop export button */}
            <div className="hidden md:block">
              {data?.feeds && data.feeds.length > 0 && (
                <ExportButton
                  data={data.feeds.map((feed: any) => ({
                    timestamp: new Date(feed.created_at).toLocaleString(),
                    value: feed[sensor.field],
                  }))}
                  filename={`${selectedSensor}-${format(selectedDate, "yyyy-MM-dd")}.csv`}
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>{renderChart()}</CardContent>
      </Card>

      <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
        <CardHeader>
          <CardTitle>Statistics (Real-time)</CardTitle>
          <CardDescription>
            Statistical summary for {sensor.title} on {format(selectedDate, "MMMM d, yyyy")} with live updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : data?.feeds && data.feeds.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Minimum"
                value={Math.min(...data.feeds.map((feed: any) => Number(feed[sensor.field])))}
                unit={sensor.unit}
              />
              <StatCard
                title="Maximum"
                value={Math.max(...data.feeds.map((feed: any) => Number(feed[sensor.field])))}
                unit={sensor.unit}
              />
              <StatCard
                title="Average"
                value={
                  data.feeds.reduce((sum: number, feed: any) => sum + Number(feed[sensor.field]), 0) / data.feeds.length
                }
                unit={sensor.unit}
              />
              <StatCard title="Readings" value={data.feeds.length} unit="" isCount={true} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-24">
              <p className="text-gray-500 dark:text-gray-400">No statistics available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper component for statistics cards
function StatCard({
  title,
  value,
  unit,
  isCount = false,
}: {
  title: string
  value: number
  unit: string
  isCount?: boolean
}) {
  return (
    <div className="p-4 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-semibold">
        {isCount ? value : value.toFixed(2)}
        {unit && ` ${unit}`}
      </p>
    </div>
  )
}
