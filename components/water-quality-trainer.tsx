"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Brain, CheckCircle, AlertCircle, RefreshCw, Download } from "lucide-react"
import { waterQualityEngine, type WaterQualityReading, CLASSIFICATION_LEVELS } from "@/lib/water-quality-lstm"
import { subscribeToSensorData } from "@/lib/firebase"
import * as tf from "@tensorflow/tfjs"

interface TrainingProgress {
  model: string
  epoch: number
  totalEpochs: number
  loss: number
  accuracy?: number
}

export default function WaterQualityTrainer() {
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress[]>([])
  const [modelStatus, setModelStatus] = useState<any>(null)
  const [historicalData, setHistoricalData] = useState<WaterQualityReading[]>([])
  const [error, setError] = useState<string | null>(null)
  const [trainingComplete, setTrainingComplete] = useState(false)

  // Load historical data and model status
  useEffect(() => {
    loadHistoricalData()
    updateModelStatus()
  }, [])

  const loadHistoricalData = () => {
    // Subscribe to historical data (last 30 days)
    const unsubscribe = subscribeToSensorData(
      "720", // 30 days
      (data) => {
        if (data?.feeds && data.feeds.length > 0) {
          const readings: WaterQualityReading[] = data.feeds
            .map((feed) => ({
              ph: Number.parseFloat(feed.field1) || 7.0,
              tds: Number.parseFloat(feed.field2) || 150,
              temperature: Number.parseFloat(feed.field3) || 22,
              conductivity: Number.parseFloat(feed.field4) || 400,
              turbidity: Number.parseFloat(feed.field5) || 2,
              timestamp: feed.created_at,
            }))
            .filter(
              (reading) =>
                !isNaN(reading.ph) &&
                !isNaN(reading.tds) &&
                !isNaN(reading.temperature) &&
                !isNaN(reading.conductivity) &&
                !isNaN(reading.turbidity),
            )

          setHistoricalData(readings)
          console.log(`Loaded ${readings.length} historical readings for training`)
        }
      },
      (error) => {
        console.error("Error loading historical data:", error)
        setError(`Error loading data: ${error.message}`)
      },
    )

    return unsubscribe
  }

  const updateModelStatus = () => {
    const status = waterQualityEngine.getModelStatus()
    setModelStatus(status)
  }

  const handleTrainModels = async () => {
    if (historicalData.length < 100) {
      setError("Need at least 100 historical data points for training. Currently have: " + historicalData.length)
      return
    }

    setIsTraining(true)
    setTrainingProgress([])
    setError(null)
    setTrainingComplete(false)

    try {
      await waterQualityEngine.trainModels(historicalData, (model, epoch, logs) => {
        setTrainingProgress((prev) => {
          const updated = [...prev]
          const existingIndex = updated.findIndex((p) => p.model === model)

          const newProgress: TrainingProgress = {
            model,
            epoch,
            totalEpochs: model === "anomaly" ? 50 : 40,
            loss: logs.loss as number,
            accuracy: logs.accuracy as number,
          }

          if (existingIndex >= 0) {
            updated[existingIndex] = newProgress
          } else {
            updated.push(newProgress)
          }

          return updated
        })
      })

      setTrainingComplete(true)
      updateModelStatus()
    } catch (err: any) {
      setError(`Training failed: ${err.message}`)
    } finally {
      setIsTraining(false)
    }
  }

  const handleResetModels = async () => {
    try {
      // Clear models from localStorage
      const models = await tf.io.listModels()

      if (models["localstorage://water-quality-anomaly-model"]) {
        await tf.io.removeModel("localstorage://water-quality-anomaly-model")
      }

      if (models["localstorage://water-quality-classification-model"]) {
        await tf.io.removeModel("localstorage://water-quality-classification-model")
      }

      localStorage.removeItem("water-quality-anomaly-scaler")
      localStorage.removeItem("water-quality-classification-scaler")

      // Refresh the page to reinitialize models
      window.location.reload()
    } catch (err: any) {
      setError(`Error resetting models: ${err.message}`)
    }
  }

  const exportTrainingData = () => {
    if (historicalData.length === 0) return

    const csvContent = [
      "timestamp,ph,tds,temperature,conductivity,turbidity",
      ...historicalData.map(
        (reading) =>
          `${reading.timestamp},${reading.ph},${reading.tds},${reading.temperature},${reading.conductivity},${reading.turbidity}`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "water-quality-training-data.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="h-5 w-5" />
            LSTM Model Training
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Train neural networks for anomaly detection and water quality classification
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={exportTrainingData}
            variant="outline"
            disabled={historicalData.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>

          <Button onClick={handleResetModels} variant="destructive" disabled={isTraining}>
            Reset Models
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {trainingComplete && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Training Complete!</AlertTitle>
          <AlertDescription>
            Both LSTM models have been trained successfully and are ready for real-time analysis.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="status">Model Status</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Model Status</CardTitle>
              <CardDescription>Status of the LSTM models for water quality analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Anomaly Detection Model</h3>
                    <Badge variant={modelStatus?.anomaly?.trained ? "default" : "secondary"}>
                      {modelStatus?.anomaly?.trained ? "Trained" : "Not Trained"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    LSTM model for detecting unusual patterns in sensor readings using reconstruction error.
                  </p>
                  {modelStatus?.anomaly?.training && (
                    <div className="mt-2 flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Training in progress...</span>
                    </div>
                  )}
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Classification Model</h3>
                    <Badge variant={modelStatus?.classification?.trained ? "default" : "secondary"}>
                      {modelStatus?.classification?.trained ? "Trained" : "Not Trained"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    LSTM model for classifying water quality into 5 categories based on sensor patterns.
                  </p>
                  {modelStatus?.classification?.training && (
                    <div className="mt-2 flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Training in progress...</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Classification Levels</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
                  {Object.entries(CLASSIFICATION_LEVELS).map(([code, label]) => (
                    <div key={code} className="p-2 border rounded text-center">
                      <div className="font-medium">Class {code}</div>
                      <div className="text-gray-600 dark:text-gray-400">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Training Data</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {historicalData.length} historical readings loaded
                  {historicalData.length > 0 && (
                    <span className="ml-2">
                      (from {new Date(historicalData[historicalData.length - 1]?.timestamp || "").toLocaleDateString()}
                      to {new Date(historicalData[0]?.timestamp || "").toLocaleDateString()})
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Train LSTM Models</CardTitle>
              <CardDescription>
                Train neural networks on historical data to enable intelligent anomaly detection and classification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ready to train models</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Using {historicalData.length} data points for training
                  </p>
                </div>
                <Button
                  onClick={handleTrainModels}
                  disabled={isTraining || historicalData.length < 100}
                  className="gap-2"
                >
                  {isTraining ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Training...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      Start Training
                    </>
                  )}
                </Button>
              </div>

              {historicalData.length < 100 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Insufficient Data</AlertTitle>
                  <AlertDescription>
                    Need at least 100 historical data points for training. Currently have {historicalData.length}.
                    Please wait for more data to be collected or check your Firebase connection.
                  </AlertDescription>
                </Alert>
              )}

              {trainingProgress.length > 0 && (
                <div className="space-y-4">
                  {trainingProgress.map((progress) => (
                    <div key={progress.model} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium capitalize">{progress.model} Detection Model</h3>
                        <span className="text-sm text-gray-600">
                          Epoch {progress.epoch + 1}/{progress.totalEpochs}
                        </span>
                      </div>
                      <Progress value={((progress.epoch + 1) / progress.totalEpochs) * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Loss: {progress.loss.toFixed(4)}</span>
                        {progress.accuracy && <span>Accuracy: {(progress.accuracy * 100).toFixed(1)}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
