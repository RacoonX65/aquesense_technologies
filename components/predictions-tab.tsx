"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LineChart, RefreshCw, AlertCircle, Info } from "lucide-react"
import { generatePredictions } from "@/lib/prediction-actions"
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ComposedChart,
} from "recharts"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

// Sensor type definitions
const sensorTypes = {
  ph: {
    title: "pH Level",
    field: "field1",
    color: "#3b82f6",
    unit: "",
    min: 0,
    max: 14,
    idealRange: "6.5 - 8.5",
  },
  tds: {
    title: "Total Dissolved Solids",
    field: "field2",
    color: "#22c55e",
    unit: "ppm",
    min: 0,
    max: 1000,
    idealRange: "50 - 300 ppm",
  },
  temperature: {
    title: "Temperature",
    field: "field3",
    color: "#ef4444",
    unit: "°C",
    min: 0,
    max: 50,
    idealRange: "10 - 25°C",
  },
  conductivity: {
    title: "Conductivity",
    field: "field4",
    color: "#eab308",
    unit: "μS/cm",
    min: 0,
    max: 2000,
    idealRange: "200 - 800 μS/cm",
  },
  turbidity: {
    title: "Turbidity",
    field: "field5",
    color: "#6b7280",
    unit: "NTU",
    min: 0,
    max: 100,
    idealRange: "< 5 NTU",
  },
}

export default function PredictionsTab({ historicalData }: { historicalData?: any }) {
  const [selectedSensor, setSelectedSensor] = useState("ph")
  const [predictionHorizon, setPredictionHorizon] = useState("24")
  const [predictions, setPredictions] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get the current sensor configuration
  const sensor = sensorTypes[selectedSensor as keyof typeof sensorTypes]

  const handleGeneratePredictions = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await generatePredictions(selectedSensor, Number.parseInt(predictionHorizon))

      if (result.error) {
        setError(result.error)
      } else {
        setPredictions(result)
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate predictions")
    } finally {
      setLoading(false)
    }
  }

  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isPrediction = payload[0].payload.isPrediction
      const value = payload[0].value

      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-md">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
            {format(new Date(label), "MMM d, yyyy HH:mm")}
          </p>
          <div className="flex items-center gap-2">
            <p className="font-medium" style={{ color: sensor.color }}>
              {sensor.title}:{" "}
              <span className="font-bold">
                {value}
                {sensor.unit}
              </span>
            </p>
            {isPrediction && (
              <Badge variant="outline" className="ml-1 text-xs">
                Prediction
              </Badge>
            )}
          </div>
          {isPrediction && predictions?.confidenceIntervals && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Confidence interval: {predictions.confidenceIntervals[payload[0].payload.predictionIndex]?.lower} -{" "}
              {predictions.confidenceIntervals[payload[0].payload.predictionIndex]?.upper} {sensor.unit}
            </p>
          )}
        </div>
      )
    }

    return null
  }

  // Prepare chart data
  const prepareChartData = () => {
    if (!historicalData?.feeds || !predictions?.predictions) return []

    // Get the field name for the selected sensor
    const fieldName = sensor.field

    // Format historical data
    const formattedHistorical = historicalData.feeds
      .slice(-48) // Last 48 hours of historical data
      .map((feed: any) => ({
        created_at: feed.created_at,
        [fieldName]: Number.parseFloat(feed[fieldName]),
        isPrediction: false,
      }))
      .reverse() // Oldest to newest

    // Format predictions with index for confidence intervals
    const formattedPredictions = predictions.predictions.map((pred: any, index: number) => ({
      ...pred,
      [fieldName]: Number.parseFloat(pred[fieldName]),
      predictionIndex: index,
    }))

    // Combine historical and prediction data
    return [...formattedHistorical, ...formattedPredictions]
  }

  const chartData = prepareChartData()

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sensor Predictions</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered forecasting of future sensor values</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={selectedSensor} onValueChange={setSelectedSensor}>
            <SelectTrigger className="w-[150px] backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800">
              <SelectValue placeholder="Sensor Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ph">pH Level</SelectItem>
              <SelectItem value="tds">Total Dissolved Solids</SelectItem>
              <SelectItem value="temperature">Temperature</SelectItem>
              <SelectItem value="conductivity">Conductivity</SelectItem>
              <SelectItem value="turbidity">Turbidity</SelectItem>
            </SelectContent>
          </Select>

          <Select value={predictionHorizon} onValueChange={setPredictionHorizon}>
            <SelectTrigger className="w-[150px] backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800">
              <SelectValue placeholder="Forecast Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12 Hours</SelectItem>
              <SelectItem value="24">24 Hours</SelectItem>
              <SelectItem value="48">48 Hours</SelectItem>
              <SelectItem value="72">72 Hours</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleGeneratePredictions}
            disabled={loading}
            className="backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80 text-white"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <LineChart className="mr-2 h-4 w-4" />
                Generate Predictions
              </>
            )}
          </Button>
        </div>
      </div>

      <Alert className="backdrop-blur-md bg-blue-50/50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-800 dark:text-blue-300">About Predictions</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-400">
          Predictions are generated using statistical analysis based on historical sensor data. The system analyzes
          patterns and trends to forecast future values. Predictions become less accurate the further into the future
          they extend.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert
          variant="destructive"
          className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border border-red-200 dark:border-red-900"
        >
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
        <CardHeader>
          <CardTitle>{sensor.title} Forecast</CardTitle>
          <CardDescription>Historical data and predictions for the next {predictionHorizon} hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-full w-full" />
              </div>
            ) : chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis
                    dataKey="created_at"
                    tickFormatter={(time) => format(new Date(time), "HH:mm")}
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <YAxis
                    domain={[
                      (dataMin: number) => Math.max(sensor.min, dataMin * 0.9),
                      (dataMax: number) => Math.min(sensor.max, dataMax * 1.1),
                    ]}
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />

                  {/* Reference line to separate historical from predictions */}
                  {predictions && (
                    <ReferenceLine
                      x={chartData.find((d: any) => d.isPrediction)?.created_at}
                      stroke="#6B7280"
                      strokeDasharray="3 3"
                      label={{ value: "Now", position: "insideTopLeft", fill: "#6B7280", fontSize: 12 }}
                    />
                  )}

                  {/* Historical data line */}
                  <Line
                    type="monotone"
                    dataKey={sensor.field}
                    name={`${sensor.title} (Historical)`}
                    stroke={sensor.color}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                    isAnimationActive
                  />

                  {/* Prediction line */}
                  {predictions && (
                    <>
                      <Line
                        type="monotone"
                        dataKey={sensor.field}
                        name={`${sensor.title} (Predicted)`}
                        stroke={sensor.color}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 3, fill: sensor.color, stroke: "white", strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                        isAnimationActive
                      />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <p>Generate predictions to see forecast data</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {predictions && predictions.analysis && (
        <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle>Analysis</CardTitle>
            <CardDescription>AI-generated insights based on historical data and predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">{predictions.analysis}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
