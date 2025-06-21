// Advanced LSTM models for water quality anomaly detection and classification
import * as tf from "@tensorflow/tfjs"

// Updated water quality standards with correct turbidity range
export const WATER_QUALITY_STANDARDS = {
  ph: { min: 6.5, max: 8.5, critical_low: 5.0, critical_high: 9.5 },
  tds: { min: 50, max: 300, critical_low: 0, critical_high: 500 },
  temperature: { min: 10, max: 25, critical_low: 5, critical_high: 35 },
  conductivity: { min: 200, max: 800, critical_low: 50, critical_high: 1200 },
  turbidity: { min: 0, max: 50, critical_low: 0, critical_high: 1000 }, // Updated range 0-1000
}

// Enhanced classification levels with better descriptions
export const CLASSIFICATION_LEVELS = {
  1: "Excellent", // All parameters within ideal range
  2: "Good", // Minor deviations from ideal range
  3: "Fair", // Some parameters outside ideal but acceptable
  4: "Poor", // Multiple parameters outside acceptable range
  5: "Critical", // Parameters in critical range, immediate attention needed
}

// Interface for sensor readings
export interface WaterQualityReading {
  ph: number
  tds: number
  temperature: number
  conductivity: number
  turbidity: number
  timestamp?: string
}

// Interface for processed results
export interface WaterQualityAnalysis {
  reading: WaterQualityReading
  anomalyScore: number
  classificationCode: number
  classificationLabel: string
  parameterScores: {
    ph: number
    tds: number
    temperature: number
    conductivity: number
    turbidity: number
  }
  alerts: string[]
}

// LSTM Anomaly Detection Model
export class WaterQualityAnomalyDetector {
  private model: tf.LayersModel | null = null
  private isTraining = false
  private sequenceLength = 24 // Look back 24 hours
  private featureCount = 5 // 5 sensor parameters
  private scaler: { min: number[]; max: number[] } | null = null

  constructor() {
    this.loadModel()
  }

  // Create LSTM model for anomaly detection
  private createModel(): tf.LayersModel {
    const model = tf.sequential()

    // Input layer - expects sequences of sensor readings
    model.add(
      tf.layers.lstm({
        units: 64,
        returnSequences: true,
        inputShape: [this.sequenceLength, this.featureCount],
        activation: "tanh",
      }),
    )

    model.add(tf.layers.dropout({ rate: 0.2 }))

    model.add(
      tf.layers.lstm({
        units: 32,
        returnSequences: false,
        activation: "tanh",
      }),
    )

    model.add(tf.layers.dropout({ rate: 0.2 }))

    // Dense layers for reconstruction
    model.add(tf.layers.dense({ units: 16, activation: "relu" }))
    model.add(tf.layers.dense({ units: this.featureCount, activation: "linear" }))

    // Compile model for reconstruction error (anomaly detection)
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "meanSquaredError",
      metrics: ["mae"],
    })

    return model
  }

  // Normalize sensor data with updated turbidity range
  private normalizeData(data: number[][]): number[][] {
    if (!this.scaler) {
      // Calculate min/max for each feature with proper turbidity handling
      const featureCount = data[0].length
      const min = new Array(featureCount).fill(Number.POSITIVE_INFINITY)
      const max = new Array(featureCount).fill(Number.NEGATIVE_INFINITY)

      data.forEach((reading) => {
        reading.forEach((value, i) => {
          // Handle turbidity specially (index 4)
          if (i === 4) {
            // turbidity
            min[i] = Math.min(min[i], Math.max(0, value)) // Ensure min is at least 0
            max[i] = Math.max(max[i], Math.min(1000, value)) // Cap at 1000
          } else {
            min[i] = Math.min(min[i], value)
            max[i] = Math.max(max[i], value)
          }
        })
      })

      this.scaler = { min, max }
    }

    // Normalize to [0, 1] range
    return data.map((reading) =>
      reading.map((value, i) => {
        const range = this.scaler!.max[i] - this.scaler!.min[i]
        return range === 0 ? 0 : (value - this.scaler!.min[i]) / range
      }),
    )
  }

  // Prepare sequences for LSTM training
  private createSequences(data: number[][]): [tf.Tensor3D, tf.Tensor2D] {
    const sequences = []
    const targets = []

    for (let i = 0; i < data.length - this.sequenceLength; i++) {
      const sequence = data.slice(i, i + this.sequenceLength)
      const target = data[i + this.sequenceLength]
      sequences.push(sequence)
      targets.push(target)
    }

    const inputTensor = tf.tensor3d(sequences)
    const targetTensor = tf.tensor2d(targets)

    return [inputTensor, targetTensor]
  }

  // Train the anomaly detection model
  async trainModel(
    historicalData: WaterQualityReading[],
    onProgress?: (epoch: number, logs: tf.Logs) => void,
  ): Promise<void> {
    if (this.isTraining) {
      throw new Error("Model is already training")
    }

    if (historicalData.length < this.sequenceLength + 50) {
      throw new Error(`Need at least ${this.sequenceLength + 50} data points for training`)
    }

    this.isTraining = true

    try {
      console.log("Training anomaly detection model...")

      // Prepare training data with proper turbidity handling
      const rawData = historicalData.map((reading) => [
        reading.ph,
        reading.tds,
        reading.temperature,
        reading.conductivity,
        Math.min(1000, Math.max(0, reading.turbidity)), // Clamp turbidity to 0-1000 range
      ])

      // Normalize data
      const normalizedData = this.normalizeData(rawData)

      // Create sequences
      const [inputTensor, targetTensor] = this.createSequences(normalizedData)

      // Create model
      this.model = this.createModel()

      // Train model
      await this.model.fit(inputTensor, targetTensor, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (onProgress && logs) {
              onProgress(epoch, logs)
            }
          },
        },
      })

      // Save model
      await this.saveModel()

      // Clean up tensors
      inputTensor.dispose()
      targetTensor.dispose()

      console.log("Anomaly detection model training complete")
    } finally {
      this.isTraining = false
    }
  }

  // Calculate anomaly score for a reading
  async calculateAnomalyScore(recentReadings: WaterQualityReading[]): Promise<number> {
    if (!this.model || !this.scaler) {
      // Fallback to rule-based anomaly detection
      return this.calculateRuleBasedAnomalyScore(recentReadings[recentReadings.length - 1])
    }

    if (recentReadings.length < this.sequenceLength) {
      // Not enough data for LSTM, use rule-based approach
      return this.calculateRuleBasedAnomalyScore(recentReadings[recentReadings.length - 1])
    }

    try {
      // Prepare input sequence with proper turbidity handling
      const rawSequence = recentReadings
        .slice(-this.sequenceLength)
        .map((reading) => [
          reading.ph,
          reading.tds,
          reading.temperature,
          reading.conductivity,
          Math.min(1000, Math.max(0, reading.turbidity)),
        ])

      // Normalize sequence
      const normalizedSequence = rawSequence.map((reading) =>
        reading.map((value, i) => {
          const range = this.scaler!.max[i] - this.scaler!.min[i]
          return range === 0 ? 0 : (value - this.scaler!.min[i]) / range
        }),
      )

      // Create tensor
      const inputTensor = tf.tensor3d([normalizedSequence])

      // Get prediction (reconstruction)
      const prediction = this.model.predict(inputTensor) as tf.Tensor2D
      const predictedValues = await prediction.data()

      // Calculate reconstruction error
      const actualValues = normalizedSequence[normalizedSequence.length - 1]
      let reconstructionError = 0

      for (let i = 0; i < actualValues.length; i++) {
        const error = Math.pow(actualValues[i] - predictedValues[i], 2)
        reconstructionError += error
      }

      reconstructionError = Math.sqrt(reconstructionError / actualValues.length)

      // Clean up tensors
      inputTensor.dispose()
      prediction.dispose()

      // Convert reconstruction error to anomaly score (0-1 range)
      const anomalyScore = Math.min(1.0, reconstructionError * 10) // Scale factor

      return Number(anomalyScore.toFixed(3))
    } catch (error) {
      console.error("Error calculating LSTM anomaly score:", error)
      // Fallback to rule-based approach
      return this.calculateRuleBasedAnomalyScore(recentReadings[recentReadings.length - 1])
    }
  }

  // Enhanced rule-based anomaly detection with updated turbidity standards
  private calculateRuleBasedAnomalyScore(reading: WaterQualityReading): number {
    let totalDeviation = 0
    let parameterCount = 0

    // Check each parameter against updated standards
    Object.entries(WATER_QUALITY_STANDARDS).forEach(([param, standards]) => {
      const value = reading[param as keyof WaterQualityReading] as number

      let deviation = 0
      if (value < standards.min) {
        deviation = (standards.min - value) / (standards.min - standards.critical_low)
      } else if (value > standards.max) {
        deviation = (value - standards.max) / (standards.critical_high - standards.max)
      }

      totalDeviation += Math.min(1.0, Math.abs(deviation))
      parameterCount++
    })

    const anomalyScore = totalDeviation / parameterCount
    return Number(anomalyScore.toFixed(3))
  }

  // Save model to localStorage
  private async saveModel(): Promise<void> {
    if (this.model && this.scaler) {
      await this.model.save("localstorage://water-quality-anomaly-model")
      localStorage.setItem("water-quality-anomaly-scaler", JSON.stringify(this.scaler))
    }
  }

  // Load model from localStorage
  private async loadModel(): Promise<void> {
    try {
      const models = await tf.io.listModels()
      if (models["localstorage://water-quality-anomaly-model"]) {
        this.model = await tf.loadLayersModel("localstorage://water-quality-anomaly-model")

        const scalerData = localStorage.getItem("water-quality-anomaly-scaler")
        if (scalerData) {
          this.scaler = JSON.parse(scalerData)
        }

        console.log("Anomaly detection model loaded from storage")
      }
    } catch (error) {
      console.log("No existing anomaly model found, will train new one")
    }
  }

  // Get model status
  getModelStatus(): { trained: boolean; training: boolean } {
    return {
      trained: !!this.model,
      training: this.isTraining,
    }
  }
}

// Enhanced LSTM Classification Model
export class WaterQualityClassifier {
  private model: tf.LayersModel | null = null
  private isTraining = false
  private sequenceLength = 12 // Look back 12 hours for classification
  private featureCount = 5 // 5 sensor parameters
  private scaler: { min: number[]; max: number[] } | null = null

  constructor() {
    this.loadModel()
  }

  // Create enhanced LSTM model for classification
  private createModel(): tf.LayersModel {
    const model = tf.sequential()

    // Enhanced LSTM layers for better classification
    model.add(
      tf.layers.lstm({
        units: 64,
        returnSequences: true,
        inputShape: [this.sequenceLength, this.featureCount],
        activation: "tanh",
      }),
    )

    model.add(tf.layers.dropout({ rate: 0.3 }))

    model.add(
      tf.layers.lstm({
        units: 32,
        returnSequences: false,
        activation: "tanh",
      }),
    )

    model.add(tf.layers.dropout({ rate: 0.3 }))

    // Enhanced dense layers for better classification
    model.add(tf.layers.dense({ units: 16, activation: "relu" }))
    model.add(tf.layers.dropout({ rate: 0.2 }))
    model.add(tf.layers.dense({ units: 8, activation: "relu" }))
    model.add(tf.layers.dense({ units: 5, activation: "softmax" })) // 5 classes

    // Compile for classification with better optimizer
    model.compile({
      optimizer: tf.train.adam(0.0005), // Lower learning rate for stability
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    })

    return model
  }

  // Enhanced classification logic with updated turbidity standards
  private calculateRuleBasedClassification(reading: WaterQualityReading): number {
    let violationScore = 0
    let criticalViolations = 0

    // Enhanced scoring system for each parameter
    Object.entries(WATER_QUALITY_STANDARDS).forEach(([param, standards]) => {
      const value = reading[param as keyof WaterQualityReading] as number

      if (value < standards.critical_low || value > standards.critical_high) {
        criticalViolations += 1
        violationScore += 3 // Critical violation
      } else if (value < standards.min || value > standards.max) {
        violationScore += 1 // Minor violation
      }

      // Special handling for turbidity with updated range
      if (param === "turbidity") {
        if (value > 100) violationScore += 2 // High turbidity is serious
        if (value > 500) violationScore += 3 // Very high turbidity is critical
      }
    })

    // Enhanced classification logic
    if (criticalViolations >= 2) return 5 // Critical - multiple critical violations
    if (criticalViolations >= 1) return 4 // Poor - at least one critical violation
    if (violationScore >= 4) return 4 // Poor - multiple violations
    if (violationScore >= 2) return 3 // Fair - some violations
    if (violationScore >= 1) return 2 // Good - minor violations
    return 1 // Excellent - no violations
  }

  // Generate enhanced classification labels for training data
  private generateClassificationLabels(data: WaterQualityReading[]): number[] {
    return data.map((reading) => this.calculateRuleBasedClassification(reading))
  }

  // Train the classification model with enhanced logic
  async trainModel(
    historicalData: WaterQualityReading[],
    onProgress?: (epoch: number, logs: tf.Logs) => void,
  ): Promise<void> {
    if (this.isTraining) {
      throw new Error("Model is already training")
    }

    if (historicalData.length < this.sequenceLength + 50) {
      throw new Error(`Need at least ${this.sequenceLength + 50} data points for training`)
    }

    this.isTraining = true

    try {
      console.log("Training enhanced classification model...")

      // Prepare training data with proper turbidity handling
      const rawData = historicalData.map((reading) => [
        reading.ph,
        reading.tds,
        reading.temperature,
        reading.conductivity,
        Math.min(1000, Math.max(0, reading.turbidity)), // Clamp turbidity to 0-1000 range
      ])

      // Generate enhanced labels
      const labels = this.generateClassificationLabels(historicalData)

      // Normalize data
      const normalizedData = this.normalizeData(rawData)

      // Create sequences
      const sequences = []
      const targets = []

      for (let i = 0; i < normalizedData.length - this.sequenceLength; i++) {
        const sequence = normalizedData.slice(i, i + this.sequenceLength)
        const target = labels[i + this.sequenceLength] - 1 // Convert to 0-based index
        sequences.push(sequence)
        targets.push(target)
      }

      // Convert to tensors
      const inputTensor = tf.tensor3d(sequences)
      const targetTensor = tf.oneHot(tf.tensor1d(targets, "int32"), 5)

      // Create enhanced model
      this.model = this.createModel()

      // Train model with better parameters
      await this.model.fit(inputTensor, targetTensor, {
        epochs: 60, // More epochs for better training
        batchSize: 16, // Smaller batch size for better convergence
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (onProgress && logs) {
              onProgress(epoch, logs)
            }
          },
        },
      })

      // Save model
      await this.saveModel()

      // Clean up tensors
      inputTensor.dispose()
      targetTensor.dispose()

      console.log("Enhanced classification model training complete")
    } finally {
      this.isTraining = false
    }
  }

  // Normalize data (shared with anomaly detector)
  private normalizeData(data: number[][]): number[][] {
    if (!this.scaler) {
      const featureCount = data[0].length
      const min = new Array(featureCount).fill(Number.POSITIVE_INFINITY)
      const max = new Array(featureCount).fill(Number.NEGATIVE_INFINITY)

      data.forEach((reading) => {
        reading.forEach((value, i) => {
          // Handle turbidity specially (index 4)
          if (i === 4) {
            // turbidity
            min[i] = Math.min(min[i], Math.max(0, value))
            max[i] = Math.max(max[i], Math.min(1000, value))
          } else {
            min[i] = Math.min(min[i], value)
            max[i] = Math.max(max[i], value)
          }
        })
      })

      this.scaler = { min, max }
    }

    return data.map((reading) =>
      reading.map((value, i) => {
        const range = this.scaler!.max[i] - this.scaler!.min[i]
        return range === 0 ? 0 : (value - this.scaler!.min[i]) / range
      }),
    )
  }

  // Enhanced water quality classification
  async classifyWaterQuality(recentReadings: WaterQualityReading[]): Promise<number> {
    if (!this.model || !this.scaler) {
      // Fallback to enhanced rule-based classification
      return this.calculateRuleBasedClassification(recentReadings[recentReadings.length - 1])
    }

    if (recentReadings.length < this.sequenceLength) {
      // Not enough data for LSTM, use rule-based approach
      return this.calculateRuleBasedClassification(recentReadings[recentReadings.length - 1])
    }

    try {
      // Prepare input sequence with proper turbidity handling
      const rawSequence = recentReadings
        .slice(-this.sequenceLength)
        .map((reading) => [
          reading.ph,
          reading.tds,
          reading.temperature,
          reading.conductivity,
          Math.min(1000, Math.max(0, reading.turbidity)),
        ])

      // Normalize sequence
      const normalizedSequence = rawSequence.map((reading) =>
        reading.map((value, i) => {
          const range = this.scaler!.max[i] - this.scaler!.min[i]
          return range === 0 ? 0 : (value - this.scaler!.min[i]) / range
        }),
      )

      // Create tensor
      const inputTensor = tf.tensor3d([normalizedSequence])

      // Get prediction
      const prediction = this.model.predict(inputTensor) as tf.Tensor2D
      const probabilities = await prediction.data()

      // Get class with highest probability
      let maxProb = 0
      let classIndex = 0
      for (let i = 0; i < probabilities.length; i++) {
        if (probabilities[i] > maxProb) {
          maxProb = probabilities[i]
          classIndex = i
        }
      }

      // Clean up tensors
      inputTensor.dispose()
      prediction.dispose()

      return classIndex + 1 // Convert back to 1-based index
    } catch (error) {
      console.error("Error with LSTM classification:", error)
      // Fallback to enhanced rule-based approach
      return this.calculateRuleBasedClassification(recentReadings[recentReadings.length - 1])
    }
  }

  // Save model to localStorage
  private async saveModel(): Promise<void> {
    if (this.model && this.scaler) {
      await this.model.save("localstorage://water-quality-classification-model")
      localStorage.setItem("water-quality-classification-scaler", JSON.stringify(this.scaler))
    }
  }

  // Load model from localStorage
  private async loadModel(): Promise<void> {
    try {
      const models = await tf.io.listModels()
      if (models["localstorage://water-quality-classification-model"]) {
        this.model = await tf.loadLayersModel("localstorage://water-quality-classification-model")

        const scalerData = localStorage.getItem("water-quality-classification-scaler")
        if (scalerData) {
          this.scaler = JSON.parse(scalerData)
        }

        console.log("Enhanced classification model loaded from storage")
      }
    } catch (error) {
      console.log("No existing classification model found, will train new one")
    }
  }

  // Get model status
  getModelStatus(): { trained: boolean; training: boolean } {
    return {
      trained: !!this.model,
      training: this.isTraining,
    }
  }
}

// Enhanced Water Quality Analysis Engine
export class WaterQualityAnalysisEngine {
  private anomalyDetector: WaterQualityAnomalyDetector
  private classifier: WaterQualityClassifier
  private recentReadings: WaterQualityReading[] = []
  private maxHistoryLength = 100 // Keep last 100 readings for analysis

  constructor() {
    this.anomalyDetector = new WaterQualityAnomalyDetector()
    this.classifier = new WaterQualityClassifier()
  }

  // Enhanced reading analysis with updated turbidity handling
  async analyzeReading(reading: WaterQualityReading): Promise<WaterQualityAnalysis> {
    // Clamp turbidity to valid range
    const processedReading = {
      ...reading,
      turbidity: Math.min(1000, Math.max(0, reading.turbidity)),
    }

    // Add to recent readings
    this.recentReadings.push(processedReading)
    if (this.recentReadings.length > this.maxHistoryLength) {
      this.recentReadings.shift()
    }

    // Calculate anomaly score
    const anomalyScore = await this.anomalyDetector.calculateAnomalyScore(this.recentReadings)

    // Get enhanced classification
    const classificationCode = await this.classifier.classifyWaterQuality(this.recentReadings)
    const classificationLabel = CLASSIFICATION_LEVELS[classificationCode as keyof typeof CLASSIFICATION_LEVELS]

    // Calculate individual parameter scores
    const parameterScores = this.calculateParameterScores(processedReading)

    // Generate enhanced alerts
    const alerts = this.generateAlerts(processedReading, anomalyScore, classificationCode)

    return {
      reading: processedReading,
      anomalyScore,
      classificationCode,
      classificationLabel,
      parameterScores,
      alerts,
    }
  }

  // Enhanced parameter scoring with updated turbidity standards
  private calculateParameterScores(reading: WaterQualityReading): {
    ph: number
    tds: number
    temperature: number
    conductivity: number
    turbidity: number
  } {
    const scores: any = {}

    Object.entries(WATER_QUALITY_STANDARDS).forEach(([param, standards]) => {
      const value = reading[param as keyof WaterQualityReading] as number

      let score = 1.0 // Perfect score

      if (value < standards.min) {
        score = Math.max(0, 1 - (standards.min - value) / (standards.min - standards.critical_low))
      } else if (value > standards.max) {
        score = Math.max(0, 1 - (value - standards.max) / (standards.critical_high - standards.max))
      }

      scores[param] = Number(score.toFixed(3))
    })

    return scores
  }

  // Enhanced alert generation with updated turbidity alerts
  private generateAlerts(reading: WaterQualityReading, anomalyScore: number, classificationCode: number): string[] {
    const alerts: string[] = []

    // High anomaly score alert
    if (anomalyScore > 0.7) {
      alerts.push("High anomaly detected - readings are significantly different from normal patterns")
    }

    // Classification-based alerts
    if (classificationCode >= 4) {
      alerts.push("Water quality classification is Poor or Critical - immediate attention required")
    }

    // Enhanced parameter-specific alerts with updated turbidity thresholds
    Object.entries(WATER_QUALITY_STANDARDS).forEach(([param, standards]) => {
      const value = reading[param as keyof WaterQualityReading] as number

      if (value < standards.critical_low) {
        alerts.push(`Critical: ${param.toUpperCase()} is dangerously low (${value})`)
      } else if (value > standards.critical_high) {
        alerts.push(`Critical: ${param.toUpperCase()} is dangerously high (${value})`)
      } else if (value < standards.min) {
        alerts.push(`Warning: ${param.toUpperCase()} is below recommended range (${value})`)
      } else if (value > standards.max) {
        alerts.push(`Warning: ${param.toUpperCase()} is above recommended range (${value})`)
      }

      // Special turbidity alerts with updated thresholds
      if (param === "turbidity") {
        if (value > 100) {
          alerts.push(`High turbidity detected (${value} NTU) - water clarity may be compromised`)
        }
        if (value > 500) {
          alerts.push(`Very high turbidity (${value} NTU) - immediate filtration required`)
        }
      }
    })

    return alerts
  }

  // Train both models with enhanced training
  async trainModels(
    historicalData: WaterQualityReading[],
    onProgress?: (model: string, epoch: number, logs: tf.Logs) => void,
  ): Promise<void> {
    console.log("Training enhanced water quality analysis models...")

    // Train anomaly detection model
    await this.anomalyDetector.trainModel(historicalData, (epoch, logs) => {
      if (onProgress) onProgress("anomaly", epoch, logs)
    })

    // Train enhanced classification model
    await this.classifier.trainModel(historicalData, (epoch, logs) => {
      if (onProgress) onProgress("classification", epoch, logs)
    })

    console.log("Enhanced model training complete")
  }

  // Get model status
  getModelStatus(): {
    anomaly: { trained: boolean; training: boolean }
    classification: { trained: boolean; training: boolean }
  } {
    return {
      anomaly: this.anomalyDetector.getModelStatus(),
      classification: this.classifier.getModelStatus(),
    }
  }

  // Set recent readings (for initialization)
  setRecentReadings(readings: WaterQualityReading[]): void {
    this.recentReadings = readings.slice(-this.maxHistoryLength).map((reading) => ({
      ...reading,
      turbidity: Math.min(1000, Math.max(0, reading.turbidity)),
    }))
  }
}

// Create singleton instance
export const waterQualityEngine = new WaterQualityAnalysisEngine()
