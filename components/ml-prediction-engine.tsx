"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Info,
  AlertCircle,
  Brain,
  BarChart4,
  RefreshCw,
  Save,
  Trash2,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Settings,
  Download,
  Eye,
  EyeOff,
} from "lucide-react"
import {
  type WaterQualityModel,
  createModel,
  DEFAULT_CONFIG,
  type ModelConfig,
  type ModelMetadata,
  evaluateModel,
} from "@/lib/ml-model"
import { subscribeToSensorData } from "@/lib/firebase"
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart,
  LineChart,
} from "recharts"
import { format } from "date-fns"

// Enhanced sensor type definitions with more detailed configurations
const sensorTypes = {
  ph: {
    title: "pH Level",
    color: "#3b82f6",
    unit: "",
    min: 0,
    max: 14,
    idealRange: "6.5 - 8.5",
    criticalLow: 6.0,
    criticalHigh: 9.0,
    description: "Measures acidity/alkalinity of water",
    importance: "Critical for aquatic life and water treatment processes",
  },
  tds: {
    title: "Total Dissolved Solids",
    color: "#22c55e",
    unit: "ppm",
    min: 0,
    max: 1000,
    idealRange: "50 - 300 ppm",
    criticalLow: 30,
    criticalHigh: 500,
    description: "Measures dissolved minerals and salts in water",
    importance: "Indicates water purity and mineral content",
  },
  temperature: {
    title: "Temperature",
    color: "#ef4444",
    unit: "°C",
    min: 0,
    max: 50,
    idealRange: "10 - 25°C",
    criticalLow: 5,
    criticalHigh: 35,
    description: "Water temperature measurement",
    importance: "Affects dissolved oxygen levels and aquatic ecosystem health",
  },
  conductivity: {
    title: "Conductivity",
    color: "#eab308",
    unit: "μS/cm",
    min: 0,
    max: 2000,
    idealRange: "200 - 800 μS/cm",
    criticalLow: 100,
    criticalHigh: 1200,
    description: "Measures water's ability to conduct electrical current",
    importance: "Indicates dissolved ion concentration and water quality",
  },
  turbidity: {
    title: "Turbidity",
    color: "#6b7280",
    unit: "NTU",
    min: 0,
    max: 100,
    idealRange: "< 5 NTU",
    criticalLow: 0,
    criticalHigh: 10,
    description: "Measures water clarity and suspended particles",
    importance: "Indicates filtration effectiveness and water clarity",
  },
}

// Field mapping for sensor data
const fieldMapping: Record<string, string> = {
  ph: "field1",
  tds: "field2",
  temperature: "field3",
  conductivity: "field4",
  turbidity: "field5",
}

// Advanced model presets
const modelPresets = {
  fast: {
    name: "Fast Training",
    description: "Quick training with basic accuracy",
    config: { ...DEFAULT_CONFIG, epochs: 20, hiddenLayers: [32, 16], lookBack: 24 },
  },
  balanced: {
    name: "Balanced",
    description: "Good balance of speed and accuracy",
    config: { ...DEFAULT_CONFIG, epochs: 50, hiddenLayers: [64, 32], lookBack: 48 },
  },
  accurate: {
    name: "High Accuracy",
    description: "Slower training but higher accuracy",
    config: { ...DEFAULT_CONFIG, epochs: 100, hiddenLayers: [128, 64, 32], lookBack: 72 },
  },
  custom: {
    name: "Custom",
    description: "Manually configured parameters",
    config: DEFAULT_CONFIG,
  },
}

interface MLPredictionEngineProps {
  initialSensorType?: string
  initialHorizon?: number
}

export default function MLPredictionEngine({ initialSensorType = "ph", initialHorizon = 24 }: MLPredictionEngineProps) {
  // State for sensor selection and configuration
  const [sensorType, setSensorType] = useState(initialSensorType)
  const [predictionHorizon, setPredictionHorizon] = useState(initialHorizon)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState("balanced")
  const [showRawData, setShowRawData] = useState(false)

  // State for data and predictions
  const [historicalData, setHistoricalData] = useState<any>(null)
  const [predictions, setPredictions] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [modelPerformance, setModelPerformance] = useState<any>(null)

  // State for model and training
  const [model, setModel] = useState<WaterQualityModel | null>(null)
  const [modelMetadata, setModelMetadata] = useState<ModelMetadata | null>(null)
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [trainingLogs, setTrainingLogs] = useState<any>(null)
  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_CONFIG)
  const [trainingHistory, setTrainingHistory] = useState<any[]>([])

  // State for UI
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState("predictions")
  const [dataQuality, setDataQuality] = useState<any>(null)

  // Get the current sensor configuration
  const sensor = sensorTypes[sensorType as keyof typeof sensorTypes]

  // Initialize model and load data
  useEffect(() => {
    const initModel = async () => {
      try {
        // Create model for the selected sensor type
        const newModel = createModel(sensorType, modelConfig)

        // Try to load existing model
        const modelLoaded = await newModel.loadModel()
        if (modelLoaded) {
          const metadata = newModel.getMetadata()
          setModelMetadata(metadata)
          setModelConfig(metadata?.config || DEFAULT_CONFIG)
          console.log(`Model loaded for ${sensorType}`)

          // Evaluate model performance if we have data
          if (historicalData) {
            evaluateModelPerformance(newModel)
          }
        } else {
          console.log(`No existing model found for ${sensorType}`)
        }

        setModel(newModel)
      } catch (err: any) {
        console.error("Error initializing model:", err)
        setError(`Error initializing model: ${err.message}`)
      }
    }

    initModel()
    loadHistoricalData()
  }, [sensorType])

  // Load historical data with real-time updates
  const loadHistoricalData = useCallback(() => {
    setLoading(true)
    setError(null)

    // Subscribe to real-time updates for the last 7 days (168 hours)
    const unsubscribe = subscribeToSensorData(
      "168",
      (data) => {
        if (data && data.feeds && data.feeds.length > 0) {
          setHistoricalData(data)
          analyzeDataQuality(data)

          // If we have predictions, update the chart data
          if (predictions) {
            updateChartData(data, predictions)
          }
        } else {
          setError("No historical data available")
        }
        setLoading(false)
      },
      (error) => {
        console.error("Error loading historical data:", error)
        setError(`Error loading data: ${error.message}`)
        setLoading(false)
      },
    )

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [predictions, sensorType])

  // Analyze data quality
  const analyzeDataQuality = useCallback(
    (data: any) => {
      if (!data || !data.feeds) return

      const fieldName = fieldMapping[sensorType]
      const values = data.feeds
        .map((feed: any) => Number.parseFloat(feed[fieldName]))
        .filter((val: number) => !isNaN(val))

      if (values.length === 0) return

      const mean = values.reduce((sum: number, val: number) => sum + val, 0) / values.length
      const variance = values.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / values.length
      const stdDev = Math.sqrt(variance)
      const min = Math.min(...values)
      const max = Math.max(...values)

      // Calculate missing data percentage
      const totalExpected = data.feeds.length
      const actualValues = values.length
      const missingPercentage = ((totalExpected - actualValues) / totalExpected) * 100

      // Calculate outliers (values beyond 2 standard deviations)
      const outliers = values.filter((val: number) => Math.abs(val - mean) > 2 * stdDev)
      const outlierPercentage = (outliers.length / values.length) * 100

      // Data quality score (0-100)
      let qualityScore = 100
      qualityScore -= missingPercentage * 0.5 // Penalize missing data
      qualityScore -= outlierPercentage * 0.3 // Penalize outliers
      qualityScore = Math.max(0, Math.min(100, qualityScore))

      setDataQuality({
        totalPoints: totalExpected,
        validPoints: actualValues,
        missingPercentage: missingPercentage.toFixed(1),
        mean: mean.toFixed(2),
        stdDev: stdDev.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        outliers: outliers.length,
        outlierPercentage: outlierPercentage.toFixed(1),
        qualityScore: qualityScore.toFixed(1),
        range: (max - min).toFixed(2),
        coefficient_of_variation: ((stdDev / mean) * 100).toFixed(1),
      })
    },
    [sensorType],
  )

  // Evaluate model performance
  const evaluateModelPerformance = useCallback(
    async (modelInstance: WaterQualityModel) => {
      if (!historicalData || !modelInstance.getMetadata()) return

      try {
        const fieldName = fieldMapping[sensorType]
        const sensorValues = historicalData.feeds
          .map((feed: any) => Number.parseFloat(feed[fieldName]))
          .filter((val: number) => !isNaN(val))

        if (sensorValues.length < 100) return // Need sufficient data for evaluation

        // Use last 20% of data for testing
        const testSize = Math.floor(sensorValues.length * 0.2)
        const testData = sensorValues.slice(-testSize)

        const performance = await evaluateModel(modelInstance, testData)
        setModelPerformance(performance)
      } catch (error) {
        console.error("Error evaluating model:", error)
      }
    },
    [historicalData, sensorType],
  )

  // Update chart data when historical data or predictions change
  const updateChartData = useCallback(
    (data: any, preds: any) => {
      if (!data || !data.feeds || !preds) return

      const fieldName = fieldMapping[sensorType]

      // Format historical data
      const formattedHistorical = data.feeds
        .slice(-48) // Last 48 hours of historical data
        .map((feed: any) => ({
          created_at: feed.created_at,
          [sensorType]: Number.parseFloat(feed[fieldName]),
          isPrediction: false,
        }))
        .reverse() // Oldest to newest

      // Format predictions
      const formattedPredictions = preds.predictions.map((pred: any, index: number) => ({
        created_at: pred.timestamp,
        [sensorType]: Number.parseFloat(pred[sensorType]),
        isPrediction: true,
        predictionIndex: index,
        confidenceLower: preds.confidenceIntervals[index].lower,
        confidenceUpper: preds.confidenceIntervals[index].upper,
      }))

      // Combine historical and prediction data
      setChartData([...formattedHistorical, ...formattedPredictions])
    },
    [sensorType],
  )

  // Apply model preset
  const applyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey)
    if (presetKey !== "custom") {
      setModelConfig(modelPresets[presetKey as keyof typeof modelPresets].config)
    }
  }

  // Train the model with enhanced logging
  const handleTrainModel = async () => {
    if (!model || !historicalData || !historicalData.feeds || historicalData.feeds.length === 0) {
      setError("No data available for training")
      return
    }

    setIsTraining(true)
    setTrainingProgress(0)
    setError(null)
    setTrainingHistory([])

    try {
      // Extract sensor values from historical data
      const fieldName = fieldMapping[sensorType]
      const sensorValues = historicalData.feeds
        .map((feed: any) => Number.parseFloat(feed[fieldName]))
        .filter((val: number) => !isNaN(val))

      if (sensorValues.length < modelConfig.lookBack + modelConfig.horizon) {
        throw new Error(`Not enough data points. Need at least ${modelConfig.lookBack + modelConfig.horizon}`)
      }

      // Train the model with enhanced progress tracking
      const metadata = await model.train(sensorValues, (epoch, logs) => {
        const progress = Math.round(((epoch + 1) / modelConfig.epochs) * 100)
        setTrainingProgress(progress)
        setTrainingLogs(logs)

        // Store training history
        setTrainingHistory((prev) => [
          ...prev,
          {
            epoch: epoch + 1,
            loss: logs.loss,
            mae: logs.meanAbsoluteError,
            val_loss: logs.val_loss,
            val_mae: logs.val_meanAbsoluteError,
          },
        ])
      })

      setModelMetadata(metadata)

      // Evaluate model performance
      await evaluateModelPerformance(model)

      // Generate predictions after training
      handleGeneratePredictions()
    } catch (err: any) {
      console.error("Error training model:", err)
      setError(`Error training model: ${err.message}`)
    } finally {
      setIsTraining(false)
    }
  }

  // Generate predictions using the trained model
  const handleGeneratePredictions = async () => {
    if (!model || !historicalData || !historicalData.feeds || historicalData.feeds.length === 0) {
      setError("No data available for predictions")
      return
    }

    if (!model.getMetadata()) {
      setError("Model not trained yet. Please train the model first.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Extract recent sensor values
      const fieldName = fieldMapping[sensorType]
      const sensorValues = historicalData.feeds
        .map((feed: any) => Number.parseFloat(feed[fieldName]))
        .filter((val: number) => !isNaN(val))
        .reverse() // Oldest to newest

      // Generate predictions
      const result = await model.predict(sensorValues)

      // Create timestamps for predictions
      const lastTimestamp = new Date(historicalData.feeds[0].created_at)
      const predictionTimestamps = Array.from({ length: predictionHorizon }, (_, i) => {
        const timestamp = new Date(lastTimestamp)
        timestamp.setHours(timestamp.getHours() + i + 1)
        return timestamp.toISOString()
      })

      // Format predictions with timestamps (limit to requested horizon)
      const formattedPredictions = predictionTimestamps.map((timestamp, i) => ({
        timestamp,
        [sensorType]: result.predictions[i].toFixed(2),
      }))

      // Limit confidence intervals to requested horizon
      const confidenceIntervals = result.confidenceIntervals.slice(0, predictionHorizon)

      // Generate enhanced analysis
      const analysis = generateEnhancedAnalysis(
        sensorType,
        result.predictions.slice(0, predictionHorizon),
        confidenceIntervals,
        sensorValues,
      )

      const predictionResult = {
        predictions: formattedPredictions,
        confidenceIntervals,
        analysis,
        color: sensor.color,
        metadata: {
          generatedAt: new Date().toISOString(),
          modelAccuracy: modelMetadata?.meanAbsoluteError,
          dataPoints: sensorValues.length,
          horizon: predictionHorizon,
        },
      }

      setPredictions(predictionResult)
      updateChartData(historicalData, predictionResult)
    } catch (err: any) {
      console.error("Error generating predictions:", err)
      setError(`Error generating predictions: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Delete the model
  const handleDeleteModel = async () => {
    if (!model) return

    try {
      await model.deleteModel()
      setModelMetadata(null)
      setPredictions(null)
      setChartData([])
      setModelPerformance(null)
      setTrainingHistory([])

      // Recreate the model
      const newModel = createModel(sensorType, DEFAULT_CONFIG)
      setModel(newModel)
      setModelConfig(DEFAULT_CONFIG)
    } catch (err: any) {
      console.error("Error deleting model:", err)
      setError(`Error deleting model: ${err.message}`)
    }
  }

  // Update model configuration
  const handleConfigChange = (key: keyof ModelConfig, value: any) => {
    setModelConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
    setSelectedPreset("custom")
  }

  // Export model configuration
  const exportModelConfig = () => {
    const exportData = {
      sensorType,
      config: modelConfig,
      metadata: modelMetadata,
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${sensorType}-model-config.json`
    a.click()
    URL.revokeObjectURL(url)
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
          {isPrediction && payload[0].payload.confidenceLower && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Confidence interval: {payload[0].payload.confidenceLower} - {payload[0].payload.confidenceUpper}{" "}
              {sensor.unit}
            </p>
          )}
          <div className="mt-2 text-xs">
            <p className="text-gray-600 dark:text-gray-300">Status: {isPrediction ? "Predicted" : "Historical"}</p>
            {!isPrediction && <p className="text-gray-600 dark:text-gray-300">Range: {sensor.idealRange}</p>}
          </div>
        </div>
      )
    }

    return null
  }

  // Generate enhanced analysis text based on predictions
  const generateEnhancedAnalysis = (
    sensorType: string,
    predictions: number[],
    confidenceIntervals: { lower: number; upper: number }[],
    historicalData: number[],
  ): string => {
    if (!predictions || predictions.length === 0) return ""

    // Calculate trends
    const firstPrediction = predictions[0]
    const lastPrediction = predictions[predictions.length - 1]
    const trend =
      lastPrediction > firstPrediction ? "increasing" : lastPrediction < firstPrediction ? "decreasing" : "stable"
    const trendMagnitude = Math.abs(lastPrediction - firstPrediction)
    const trendPercentage = ((trendMagnitude / firstPrediction) * 100).toFixed(1)

    // Calculate statistics
    const avgPredicted = predictions.reduce((sum, val) => sum + val, 0) / predictions.length
    const minPrediction = Math.min(...predictions)
    const maxPrediction = Math.max(...predictions)
    const avgHistorical = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length
    const avgConfidenceRange =
      confidenceIntervals.reduce((sum, interval) => sum + (interval.upper - interval.lower), 0) /
      confidenceIntervals.length

    // Risk assessment
    const sensor = sensorTypes[sensorType as keyof typeof sensorTypes]
    const criticalLow = sensor.criticalLow
    const criticalHigh = sensor.criticalHigh
    const criticalPredictions = predictions.filter((val) => val < criticalLow || val > criticalHigh)
    const riskLevel =
      criticalPredictions.length > 0
        ? "HIGH"
        : minPrediction < criticalLow * 1.1 || maxPrediction > criticalHigh * 0.9
          ? "MEDIUM"
          : "LOW"

    // Generate comprehensive analysis
    let analysis = `🔍 **Prediction Analysis for ${sensor.title}**\n\n`

    analysis += `📈 **Trend Analysis**: ${sensorType} values show a ${trend} trend over the next ${predictions.length} hours`
    if (trend !== "stable") {
      analysis += ` with a ${trendPercentage}% change magnitude`
    }
    analysis += `.\n\n`

    analysis += `📊 **Statistical Summary**:\n`
    analysis += `• Average predicted value: ${avgPredicted.toFixed(2)}${sensor.unit}\n`
    analysis += `• Prediction range: ${minPrediction.toFixed(2)}${sensor.unit} to ${maxPrediction.toFixed(2)}${sensor.unit}\n`
    analysis += `• Historical average: ${avgHistorical.toFixed(2)}${sensor.unit}\n`
    analysis += `• Model confidence: ±${(avgConfidenceRange / 2).toFixed(2)}${sensor.unit}\n\n`

    analysis += `⚠️ **Risk Assessment**: ${riskLevel} RISK\n`
    if (criticalPredictions.length > 0) {
      analysis += `• ${criticalPredictions.length} predictions fall outside safe operating range\n`
    }
    analysis += `• Safe range: ${sensor.idealRange}\n`
    analysis += `• Critical thresholds: ${criticalLow}${sensor.unit} - ${criticalHigh}${sensor.unit}\n\n`

    // Add sensor-specific insights
    analysis += `🎯 **Sensor-Specific Insights**:\n`
    switch (sensorType) {
      case "ph":
        if (minPrediction < 6.5 || maxPrediction > 8.5) {
          analysis += `• pH values may exceed optimal range (6.5-8.5), potentially affecting aquatic life\n`
          analysis += `• Consider monitoring buffer capacity and alkalinity\n`
        } else {
          analysis += `• pH levels remain within optimal range for aquatic ecosystems\n`
        }
        break
      case "temperature":
        if (maxPrediction > 30) {
          analysis += `• High temperatures (>${maxPrediction.toFixed(1)}°C) may reduce dissolved oxygen\n`
          analysis += `• Monitor for thermal stress in aquatic organisms\n`
        }
        if (trend === "increasing") {
          analysis += `• Rising temperature trend may indicate seasonal changes or thermal pollution\n`
        }
        break
      case "turbidity":
        if (maxPrediction > 20) {
          analysis += `• High turbidity predictions indicate potential water clarity issues\n`
          analysis += `• May require enhanced filtration or settling processes\n`
        }
        break
      case "conductivity":
        if (maxPrediction > 1000) {
          analysis += `• Elevated conductivity suggests high dissolved solids concentration\n`
          analysis += `• Investigate potential pollution sources or saltwater intrusion\n`
        }
        break
      case "tds":
        if (maxPrediction > 300) {
          analysis += `• High TDS levels may affect water taste and treatment processes\n`
          analysis += `• Consider reverse osmosis or ion exchange treatment\n`
        }
        break
    }

    analysis += `\n💡 **Recommendations**:\n`
    analysis += `• Monitor actual readings against predictions to validate model accuracy\n`
    analysis += `• Set up alerts for values approaching critical thresholds\n`
    if (riskLevel === "HIGH") {
      analysis += `• Implement immediate corrective measures for predicted critical values\n`
    }
    analysis += `• Retrain model with new data to improve prediction accuracy over time\n`

    return analysis
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Advanced ML Prediction Engine
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {sensor.description} • {sensor.importance}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={sensorType} onValueChange={setSensorType}>
            <SelectTrigger className="w-[180px] backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800">
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

          <Select value={predictionHorizon.toString()} onValueChange={(val) => setPredictionHorizon(Number(val))}>
            <SelectTrigger className="w-[150px] backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800">
              <SelectValue placeholder="Forecast Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 Hours</SelectItem>
              <SelectItem value="12">12 Hours</SelectItem>
              <SelectItem value="24">24 Hours</SelectItem>
              <SelectItem value="48">48 Hours</SelectItem>
              <SelectItem value="72">72 Hours</SelectItem>
              <SelectItem value="168">1 Week</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Switch id="advanced-mode" checked={advancedMode} onCheckedChange={setAdvancedMode} />
            <Label htmlFor="advanced-mode">Advanced Mode</Label>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Model Status</p>
                <p className="text-lg font-bold">{modelMetadata ? "Trained" : "Not Trained"}</p>
              </div>
              <Activity className={`h-8 w-8 ${modelMetadata ? "text-green-500" : "text-gray-400"}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Data Quality</p>
                <p className="text-lg font-bold">{dataQuality ? `${dataQuality.qualityScore}%` : "N/A"}</p>
              </div>
              <Target
                className={`h-8 w-8 ${dataQuality && Number(dataQuality.qualityScore) > 80 ? "text-green-500" : "text-yellow-500"}`}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Model Accuracy</p>
                <p className="text-lg font-bold">
                  {modelMetadata ? `${(100 - modelMetadata.meanAbsoluteError * 100).toFixed(1)}%` : "N/A"}
                </p>
              </div>
              <Zap
                className={`h-8 w-8 ${modelMetadata && modelMetadata.meanAbsoluteError < 0.1 ? "text-green-500" : "text-yellow-500"}`}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Predictions</p>
                <p className="text-lg font-bold">{predictions ? predictions.predictions.length : 0}</p>
              </div>
              <TrendingUp className={`h-8 w-8 ${predictions ? "text-blue-500" : "text-gray-400"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert className="backdrop-blur-md bg-blue-50/50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-800 dark:text-blue-300">Advanced ML Prediction System</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-400">
          This system uses LSTM neural networks for time-series forecasting. The model analyzes historical patterns to
          predict future water quality parameters with confidence intervals. Fine-tune parameters for optimal
          performance.
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

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="model">Model Training</TabsTrigger>
          <TabsTrigger value="analysis">Data Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{sensor.title} ML Forecast</span>
                <div className="flex items-center gap-2">
                  {modelMetadata && (
                    <Badge variant="outline" className="ml-2">
                      Accuracy: {(100 - modelMetadata.meanAbsoluteError * 100).toFixed(1)}%
                    </Badge>
                  )}
                  {predictions && (
                    <Badge variant="outline" className="ml-2">
                      {predictions.predictions.length}h forecast
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                Advanced machine learning predictions for the next {predictionHorizon} hours
                {predictions && (
                  <span className="block mt-1 text-xs text-gray-500">
                    Generated: {format(new Date(predictions.metadata.generatedAt), "MMM d, yyyy HH:mm")}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">Loading data...</p>
                    </div>
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

                      {/* Critical threshold lines */}
                      <ReferenceLine
                        y={sensor.criticalLow}
                        stroke="#ef4444"
                        strokeDasharray="2 2"
                        label={{ value: "Critical Low", position: "insideTopLeft", fill: "#ef4444", fontSize: 10 }}
                      />
                      <ReferenceLine
                        y={sensor.criticalHigh}
                        stroke="#ef4444"
                        strokeDasharray="2 2"
                        label={{ value: "Critical High", position: "insideTopRight", fill: "#ef4444", fontSize: 10 }}
                      />

                      {/* Reference line to separate historical from predictions */}
                      {predictions && (
                        <ReferenceLine
                          x={chartData.find((d: any) => d.isPrediction)?.created_at}
                          stroke="#6B7280"
                          strokeDasharray="3 3"
                          label={{ value: "Now", position: "insideTopLeft", fill: "#6B7280", fontSize: 12 }}
                        />
                      )}

                      {/* Confidence interval area */}
                      {predictions && (
                        <Area
                          type="monotone"
                          dataKey="confidenceUpper"
                          stroke="transparent"
                          fill={sensor.color}
                          fillOpacity={0.1}
                          activeDot={false}
                        />
                      )}

                      {predictions && (
                        <Area
                          type="monotone"
                          dataKey="confidenceLower"
                          stroke="transparent"
                          fill={sensor.color}
                          fillOpacity={0.1}
                          activeDot={false}
                        />
                      )}

                      {/* Historical data line */}
                      <Line
                        type="monotone"
                        dataKey={sensorType}
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
                        <Line
                          type="monotone"
                          dataKey={sensorType}
                          name={`${sensor.title} (Predicted)`}
                          stroke={sensor.color}
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          dot={{ r: 4, fill: sensor.color, stroke: "white", strokeWidth: 2 }}
                          activeDot={{ r: 8 }}
                          connectNulls
                          isAnimationActive
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <BarChart4 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Train the model and generate predictions to see forecast data</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={loadHistoricalData} disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh Data
                </Button>
                <Button variant="outline" onClick={() => setShowRawData(!showRawData)}>
                  {showRawData ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {showRawData ? "Hide" : "Show"} Raw Data
                </Button>
              </div>

              <Button
                onClick={handleGeneratePredictions}
                disabled={loading || !modelMetadata}
                className="backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80 text-white"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Generate ML Predictions
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {predictions && predictions.analysis && (
            <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle>Enhanced ML Analysis</CardTitle>
                <CardDescription>Comprehensive AI-generated insights and risk assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                    {predictions.analysis}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {showRawData && predictions && (
            <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle>Raw Prediction Data</CardTitle>
                <CardDescription>Detailed prediction values and confidence intervals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Time</th>
                        <th className="text-left p-2">Predicted Value</th>
                        <th className="text-left p-2">Confidence Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictions.predictions.map((pred: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{format(new Date(pred.timestamp), "MMM d, HH:mm")}</td>
                          <td className="p-2">
                            {pred[sensorType]}
                            {sensor.unit}
                          </td>
                          <td className="p-2">
                            {predictions.confidenceIntervals[index].lower.toFixed(2)} -{" "}
                            {predictions.confidenceIntervals[index].upper.toFixed(2)}
                            {sensor.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="model" className="space-y-4">
          <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Model Training & Configuration</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportModelConfig}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Config
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Train and fine-tune the machine learning model for {sensor.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Model Status */}
              {modelMetadata ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium mb-3 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Current Model Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Sensor Type:</span> {modelMetadata.sensorType}
                      </p>
                      <p>
                        <span className="font-medium">Last Trained:</span>{" "}
                        {format(new Date(modelMetadata.lastTrainedAt), "MMM d, yyyy HH:mm")}
                      </p>
                      <p>
                        <span className="font-medium">Training Data Points:</span> {modelMetadata.dataPoints}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Model Accuracy:</span>{" "}
                        {(100 - modelMetadata.meanAbsoluteError * 100).toFixed(1)}%
                      </p>
                      <p>
                        <span className="font-medium">Mean Absolute Error:</span>{" "}
                        {modelMetadata.meanAbsoluteError.toFixed(4)}
                      </p>
                      <p>
                        <span className="font-medium">Feature Range:</span> {modelMetadata.featureMin.toFixed(2)} -{" "}
                        {modelMetadata.featureMax.toFixed(2)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Look Back Period:</span> {modelMetadata.config.lookBack} points
                      </p>
                      <p>
                        <span className="font-medium">Prediction Horizon:</span> {modelMetadata.config.horizon} points
                      </p>
                      <p>
                        <span className="font-medium">Neural Network:</span>{" "}
                        {modelMetadata.config.hiddenLayers.join(" → ")} neurons
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No trained model</AlertTitle>
                  <AlertDescription>
                    No trained model found for {sensor.title}. Configure parameters and train a new model to enable
                    predictions.
                  </AlertDescription>
                </Alert>
              )}

              {/* Model Presets */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Model Presets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {Object.entries(modelPresets).map(([key, preset]) => (
                    <Card
                      key={key}
                      className={`cursor-pointer transition-all ${selectedPreset === key ? "ring-2 ring-blue-500" : ""}`}
                      onClick={() => applyPreset(key)}
                    >
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm">{preset.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{preset.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Advanced Configuration */}
              {(advancedMode || selectedPreset === "custom") && (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium mb-2">Advanced Model Configuration</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Look Back Period: {modelConfig.lookBack} data points</Label>
                        <Slider
                          value={[modelConfig.lookBack]}
                          min={12}
                          max={168}
                          step={12}
                          onValueChange={(value) => handleConfigChange("lookBack", value[0])}
                          disabled={isTraining}
                        />
                        <p className="text-xs text-gray-500">How many past data points to consider for predictions</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Prediction Horizon: {modelConfig.horizon} data points</Label>
                        <Slider
                          value={[modelConfig.horizon]}
                          min={6}
                          max={168}
                          step={6}
                          onValueChange={(value) => handleConfigChange("horizon", value[0])}
                          disabled={isTraining}
                        />
                        <p className="text-xs text-gray-500">How many future data points to predict</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Training Epochs: {modelConfig.epochs}</Label>
                        <Slider
                          value={[modelConfig.epochs]}
                          min={10}
                          max={200}
                          step={10}
                          onValueChange={(value) => handleConfigChange("epochs", value[0])}
                          disabled={isTraining}
                        />
                        <p className="text-xs text-gray-500">
                          Number of training iterations (more = better accuracy, slower training)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Batch Size: {modelConfig.batchSize}</Label>
                        <Slider
                          value={[modelConfig.batchSize]}
                          min={8}
                          max={128}
                          step={8}
                          onValueChange={(value) => handleConfigChange("batchSize", value[0])}
                          disabled={isTraining}
                        />
                        <p className="text-xs text-gray-500">Number of samples processed together</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Dropout Rate: {(modelConfig.dropoutRate * 100).toFixed(0)}%</Label>
                        <Slider
                          value={[modelConfig.dropoutRate * 100]}
                          min={0}
                          max={50}
                          step={5}
                          onValueChange={(value) => handleConfigChange("dropoutRate", value[0] / 100)}
                          disabled={isTraining}
                        />
                        <p className="text-xs text-gray-500">Prevents overfitting (higher = more regularization)</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Hidden Layers</Label>
                        <Input
                          value={modelConfig.hiddenLayers.join(", ")}
                          onChange={(e) => {
                            const layers = e.target.value
                              .split(",")
                              .map((n) => Number.parseInt(n.trim()))
                              .filter((n) => !isNaN(n))
                            handleConfigChange("hiddenLayers", layers)
                          }}
                          disabled={isTraining}
                          placeholder="64, 32, 16"
                        />
                        <p className="text-xs text-gray-500">Comma-separated list of neurons per layer</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Training Progress */}
              {isTraining && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Training Progress</span>
                    <span>{trainingProgress}%</span>
                  </div>
                  <Progress value={trainingProgress} className="h-3" />
                  {trainingLogs && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="font-medium">Loss</p>
                        <p>{trainingLogs.loss.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="font-medium">MAE</p>
                        <p>{trainingLogs.meanAbsoluteError.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Val Loss</p>
                        <p>{trainingLogs.val_loss?.toFixed(6) || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-medium">Val MAE</p>
                        <p>{trainingLogs.val_meanAbsoluteError?.toFixed(6) || "N/A"}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="destructive" onClick={handleDeleteModel} disabled={isTraining || !modelMetadata}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Model
              </Button>

              <Button
                onClick={handleTrainModel}
                disabled={isTraining || loading}
                className="backdrop-blur-md bg-green-500/80 hover:bg-green-600/80 text-white"
              >
                {isTraining ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Training... ({trainingProgress}%)
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {modelMetadata ? "Retrain Model" : "Train New Model"}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Training History Chart */}
          {trainingHistory.length > 0 && (
            <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle>Training History</CardTitle>
                <CardDescription>Loss and accuracy metrics during training</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trainingHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="epoch" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="loss" stroke="#ef4444" name="Training Loss" />
                      <Line type="monotone" dataKey="val_loss" stroke="#f97316" name="Validation Loss" />
                      <Line type="monotone" dataKey="mae" stroke="#3b82f6" name="Training MAE" />
                      <Line type="monotone" dataKey="val_mae" stroke="#6366f1" name="Validation MAE" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {/* Data Quality Analysis */}
          {dataQuality && (
            <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle>Data Quality Analysis</CardTitle>
                <CardDescription>Comprehensive analysis of input data quality and characteristics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Data Completeness</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Data Points:</span>
                        <span className="font-medium">{dataQuality.totalPoints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valid Points:</span>
                        <span className="font-medium">{dataQuality.validPoints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Missing Data:</span>
                        <span className="font-medium">{dataQuality.missingPercentage}%</span>
                      </div>
                      <div className="mt-2">
                        <Progress value={100 - Number(dataQuality.missingPercentage)} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Statistical Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Mean:</span>
                        <span className="font-medium">
                          {dataQuality.mean}
                          {sensor.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Std Deviation:</span>
                        <span className="font-medium">
                          {dataQuality.stdDev}
                          {sensor.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Range:</span>
                        <span className="font-medium">
                          {dataQuality.min} - {dataQuality.max}
                          {sensor.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Coefficient of Variation:</span>
                        <span className="font-medium">{dataQuality.coefficient_of_variation}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Data Quality Score</h4>
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">{dataQuality.qualityScore}%</div>
                      <Progress value={Number(dataQuality.qualityScore)} className="h-3 mb-2" />
                      <p className="text-sm text-gray-600">
                        {Number(dataQuality.qualityScore) > 90
                          ? "Excellent"
                          : Number(dataQuality.qualityScore) > 80
                            ? "Good"
                            : Number(dataQuality.qualityScore) > 70
                              ? "Fair"
                              : "Poor"}
                      </p>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Outliers:</span>
                        <span className="font-medium">
                          {dataQuality.outliers} ({dataQuality.outlierPercentage}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sensor Information */}
          <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle>{sensor.title} Information</CardTitle>
              <CardDescription>Detailed information about this sensor type and its parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{sensor.description}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Importance</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{sensor.importance}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Operating Ranges</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Measurement Range:</span>
                        <span className="font-medium">
                          {sensor.min} - {sensor.max}
                          {sensor.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ideal Range:</span>
                        <span className="font-medium text-green-600">{sensor.idealRange}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Critical Thresholds:</span>
                        <span className="font-medium text-red-600">
                          {sensor.criticalLow} - {sensor.criticalHigh}
                          {sensor.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Units & Precision</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Unit of Measurement:</span>
                        <span className="font-medium">{sensor.unit || "Dimensionless"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Color Code:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: sensor.color }}></div>
                          <span className="font-medium">{sensor.color}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Model Performance Metrics */}
          {modelPerformance && (
            <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle>Model Performance Metrics</CardTitle>
                <CardDescription>Detailed evaluation of model accuracy and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <h4 className="font-medium mb-2">Mean Squared Error</h4>
                    <div className="text-2xl font-bold mb-1">{modelPerformance.mse.toFixed(4)}</div>
                    <p className="text-sm text-gray-600">Lower is better</p>
                  </div>
                  <div className="text-center">
                    <h4 className="font-medium mb-2">Mean Absolute Error</h4>
                    <div className="text-2xl font-bold mb-1">{modelPerformance.mae.toFixed(4)}</div>
                    <p className="text-sm text-gray-600">Average prediction error</p>
                  </div>
                  <div className="text-center">
                    <h4 className="font-medium mb-2">Model Accuracy</h4>
                    <div className="text-2xl font-bold mb-1">{modelPerformance.accuracy.toFixed(1)}%</div>
                    <Progress value={modelPerformance.accuracy} className="h-2 mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Recommendations */}
          <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle>Performance Optimization</CardTitle>
              <CardDescription>Recommendations to improve model performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-300">💡 Optimization Tips</h4>
                  <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
                    <li>• Increase training epochs for better convergence (current: {modelConfig.epochs})</li>
                    <li>• Add more historical data for improved pattern recognition</li>
                    <li>• Experiment with different neural network architectures</li>
                    <li>• Fine-tune hyperparameters based on validation metrics</li>
                    <li>• Consider data preprocessing techniques for better normalization</li>
                  </ul>
                </div>

                {dataQuality && Number(dataQuality.qualityScore) < 80 && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                    <h4 className="font-medium mb-2 text-yellow-800 dark:text-yellow-300">⚠️ Data Quality Issues</h4>
                    <ul className="space-y-2 text-sm text-yellow-700 dark:text-yellow-400">
                      {Number(dataQuality.missingPercentage) > 10 && (
                        <li>
                          • High missing data percentage ({dataQuality.missingPercentage}%) - consider data imputation
                        </li>
                      )}
                      {Number(dataQuality.outlierPercentage) > 5 && (
                        <li>
                          • Significant outliers detected ({dataQuality.outlierPercentage}%) - consider outlier removal
                        </li>
                      )}
                      <li>• Improve data collection consistency for better model performance</li>
                    </ul>
                  </div>
                )}

                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <h4 className="font-medium mb-2 text-green-800 dark:text-green-300">✅ Best Practices</h4>
                  <ul className="space-y-2 text-sm text-green-700 dark:text-green-400">
                    <li>• Retrain model regularly with new data to maintain accuracy</li>
                    <li>• Monitor prediction accuracy against actual readings</li>
                    <li>• Use ensemble methods for critical applications</li>
                    <li>• Implement automated model retraining pipelines</li>
                    <li>• Set up alerts for prediction confidence drops</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Model Comparison */}
          <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle>Model Configuration Comparison</CardTitle>
              <CardDescription>Compare different model configurations and their trade-offs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Configuration</th>
                      <th className="text-left p-3">Training Speed</th>
                      <th className="text-left p-3">Expected Accuracy</th>
                      <th className="text-left p-3">Memory Usage</th>
                      <th className="text-left p-3">Best For</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Fast Training</td>
                      <td className="p-3 text-green-600">Very Fast</td>
                      <td className="p-3 text-yellow-600">Moderate</td>
                      <td className="p-3 text-green-600">Low</td>
                      <td className="p-3">Quick prototyping, real-time updates</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Balanced</td>
                      <td className="p-3 text-blue-600">Moderate</td>
                      <td className="p-3 text-blue-600">Good</td>
                      <td className="p-3 text-blue-600">Medium</td>
                      <td className="p-3">General purpose, production use</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">High Accuracy</td>
                      <td className="p-3 text-red-600">Slow</td>
                      <td className="p-3 text-green-600">Excellent</td>
                      <td className="p-3 text-red-600">High</td>
                      <td className="p-3">Critical applications, research</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Custom</td>
                      <td className="p-3 text-gray-600">Variable</td>
                      <td className="p-3 text-gray-600">Variable</td>
                      <td className="p-3 text-gray-600">Variable</td>
                      <td className="p-3">Specialized requirements</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function to generate enhanced analysis text
function generateEnhancedAnalysis(
  sensorType: string,
  predictions: number[],
  confidenceIntervals: { lower: number; upper: number }[],
  historicalData: number[],
): string {
  if (!predictions || predictions.length === 0) return ""

  // Calculate trends
  const firstPrediction = predictions[0]
  const lastPrediction = predictions[predictions.length - 1]
  const trend =
    lastPrediction > firstPrediction ? "increasing" : lastPrediction < firstPrediction ? "decreasing" : "stable"
  const trendMagnitude = Math.abs(lastPrediction - firstPrediction)
  const trendPercentage = ((trendMagnitude / firstPrediction) * 100).toFixed(1)

  // Calculate statistics
  const avgPredicted = predictions.reduce((sum, val) => sum + val, 0) / predictions.length
  const minPrediction = Math.min(...predictions)
  const maxPrediction = Math.max(...predictions)
  const avgHistorical = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length
  const avgConfidenceRange =
    confidenceIntervals.reduce((sum, interval) => sum + (interval.upper - interval.lower), 0) /
    confidenceIntervals.length

  // Risk assessment
  const sensor = sensorTypes[sensorType as keyof typeof sensorTypes]
  const criticalLow = sensor.criticalLow
  const criticalHigh = sensor.criticalHigh
  const criticalPredictions = predictions.filter((val) => val < criticalLow || val > criticalHigh)
  const riskLevel =
    criticalPredictions.length > 0
      ? "HIGH"
      : minPrediction < criticalLow * 1.1 || maxPrediction > criticalHigh * 0.9
        ? "MEDIUM"
        : "LOW"

  // Generate comprehensive analysis
  let analysis = `🔍 **Prediction Analysis for ${sensor.title}**\n\n`

  analysis += `📈 **Trend Analysis**: ${sensorType} values show a ${trend} trend over the next ${predictions.length} hours`
  if (trend !== "stable") {
    analysis += ` with a ${trendPercentage}% change magnitude`
  }
  analysis += `.\n\n`

  analysis += `📊 **Statistical Summary**:\n`
  analysis += `• Average predicted value: ${avgPredicted.toFixed(2)}${sensor.unit}\n`
  analysis += `• Prediction range: ${minPrediction.toFixed(2)}${sensor.unit} to ${maxPrediction.toFixed(2)}${sensor.unit}\n`
  analysis += `• Historical average: ${avgHistorical.toFixed(2)}${sensor.unit}\n`
  analysis += `• Model confidence: ±${(avgConfidenceRange / 2).toFixed(2)}${sensor.unit}\n\n`

  analysis += `⚠️ **Risk Assessment**: ${riskLevel} RISK\n`
  if (criticalPredictions.length > 0) {
    analysis += `• ${criticalPredictions.length} predictions fall outside safe operating range\n`
  }
  analysis += `• Safe range: ${sensor.idealRange}\n`
  analysis += `• Critical thresholds: ${criticalLow}${sensor.unit} - ${criticalHigh}${sensor.unit}\n\n`

  // Add sensor-specific insights
  analysis += `🎯 **Sensor-Specific Insights**:\n`
  switch (sensorType) {
    case "ph":
      if (minPrediction < 6.5 || maxPrediction > 8.5) {
        analysis += `• pH values may exceed optimal range (6.5-8.5), potentially affecting aquatic life\n`
        analysis += `• Consider monitoring buffer capacity and alkalinity\n`
      } else {
        analysis += `• pH levels remain within optimal range for aquatic ecosystems\n`
      }
      break
    case "temperature":
      if (maxPrediction > 30) {
        analysis += `• High temperatures (>${maxPrediction.toFixed(1)}°C) may reduce dissolved oxygen\n`
        analysis += `• Monitor for thermal stress in aquatic organisms\n`
      }
      if (trend === "increasing") {
        analysis += `• Rising temperature trend may indicate seasonal changes or thermal pollution\n`
      }
      break
    case "turbidity":
      if (maxPrediction > 20) {
        analysis += `• High turbidity predictions indicate potential water clarity issues\n`
        analysis += `• May require enhanced filtration or settling processes\n`
      }
      break
    case "conductivity":
      if (maxPrediction > 1000) {
        analysis += `• Elevated conductivity suggests high dissolved solids concentration\n`
        analysis += `• Investigate potential pollution sources or saltwater intrusion\n`
      }
      break
    case "tds":
      if (maxPrediction > 300) {
        analysis += `• High TDS levels may affect water taste and treatment processes\n`
        analysis += `• Consider reverse osmosis or ion exchange treatment\n`
      }
      break
  }

  analysis += `\n💡 **Recommendations**:\n`
  analysis += `• Monitor actual readings against predictions to validate model accuracy\n`
  analysis += `• Set up alerts for values approaching critical thresholds\n`
  if (riskLevel === "HIGH") {
    analysis += `• Implement immediate corrective measures for predicted critical values\n`
  }
  analysis += `• Retrain model with new data to improve prediction accuracy over time\n`

  return analysis
}
