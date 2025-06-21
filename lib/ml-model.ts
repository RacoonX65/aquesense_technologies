// Machine Learning Model for Water Quality Predictions
import * as tf from "@tensorflow/tfjs"

// Interface for model configuration
export interface ModelConfig {
  lookBack: number // Number of past data points to consider
  horizon: number // Number of future data points to predict
  epochs: number // Training epochs
  batchSize: number // Batch size for training
  hiddenLayers: number[] // Array of neurons in each hidden layer
  dropoutRate: number // Dropout rate for regularization
}

// Default configuration for the model
export const DEFAULT_CONFIG: ModelConfig = {
  lookBack: 48, // Look back 48 data points (e.g., 2 days of hourly data)
  horizon: 24, // Predict 24 data points ahead
  epochs: 50, // Train for 50 epochs
  batchSize: 32, // Batch size of 32
  hiddenLayers: [64, 32], // Two hidden layers with 64 and 32 neurons
  dropoutRate: 0.2, // 20% dropout for regularization
}

// Interface for model metadata
export interface ModelMetadata {
  sensorType: string
  lastTrainedAt: string
  dataPoints: number
  meanAbsoluteError: number
  config: ModelConfig
  featureMin: number
  featureMax: number
}

// Class for the ML prediction model
export class WaterQualityModel {
  private model: tf.LayersModel | null = null
  private metadata: ModelMetadata | null = null
  private sensorType: string
  private config: ModelConfig
  private isTraining = false
  private modelKey: string

  constructor(sensorType: string, config: ModelConfig = DEFAULT_CONFIG) {
    this.sensorType = sensorType
    this.config = config
    this.modelKey = `water-quality-model-${sensorType}`
  }

  // Check if a trained model exists in localStorage
  async loadModel(): Promise<boolean> {
    try {
      // Try to load model from localStorage
      const models = await tf.io.listModels()
      const modelUrl = `localstorage://${this.modelKey}`

      if (models[modelUrl]) {
        console.log(`Loading existing model for ${this.sensorType}...`)
        this.model = await tf.loadLayersModel(modelUrl)

        // Load metadata
        const metadataStr = localStorage.getItem(`${this.modelKey}-metadata`)
        if (metadataStr) {
          this.metadata = JSON.parse(metadataStr)
          this.config = this.metadata.config
          console.log(`Model loaded with metadata:`, this.metadata)
          return true
        }
      }
      return false
    } catch (error) {
      console.error("Error loading model:", error)
      return false
    }
  }

  // Create a new LSTM model
  private createModel(): tf.LayersModel {
    const model = tf.sequential()

    // Input layer
    model.add(
      tf.layers.lstm({
        units: this.config.hiddenLayers[0],
        returnSequences: this.config.hiddenLayers.length > 1,
        inputShape: [this.config.lookBack, 1],
        activation: "relu",
      }),
    )

    // Add dropout for regularization
    model.add(tf.layers.dropout({ rate: this.config.dropoutRate }))

    // Add hidden layers
    for (let i = 1; i < this.config.hiddenLayers.length; i++) {
      model.add(
        tf.layers.lstm({
          units: this.config.hiddenLayers[i],
          returnSequences: i < this.config.hiddenLayers.length - 1,
          activation: "relu",
        }),
      )
      model.add(tf.layers.dropout({ rate: this.config.dropoutRate }))
    }

    // Output layer
    model.add(tf.layers.dense({ units: this.config.horizon }))

    // Compile the model
    model.compile({
      optimizer: "adam",
      loss: "meanSquaredError",
      metrics: ["meanAbsoluteError"],
    })

    return model
  }

  // Prepare data for training
  private prepareData(data: number[]): [tf.Tensor, tf.Tensor, number, number] {
    // Normalize data
    const min = Math.min(...data)
    const max = Math.max(...data)
    const normalizedData = data.map((val) => (val - min) / (max - min))

    const X = []
    const y = []

    // Create sequences
    for (let i = 0; i <= normalizedData.length - this.config.lookBack - this.config.horizon; i++) {
      const sequence = normalizedData.slice(i, i + this.config.lookBack)
      X.push(sequence)

      const target = normalizedData.slice(i + this.config.lookBack, i + this.config.lookBack + this.config.horizon)
      y.push(target)
    }

    // Convert to tensors
    const inputTensor = tf.tensor3d(X, [X.length, this.config.lookBack, 1])
    const targetTensor = tf.tensor2d(y, [y.length, this.config.horizon])

    return [inputTensor, targetTensor, min, max]
  }

  // Train the model with historical data
  async train(data: number[], onProgress?: (epoch: number, logs: tf.Logs) => void): Promise<ModelMetadata> {
    if (this.isTraining) {
      throw new Error("Model is already training")
    }

    this.isTraining = true

    try {
      console.log(`Training model for ${this.sensorType} with ${data.length} data points...`)

      // Create a new model
      this.model = this.createModel()

      // Prepare data
      const [inputTensor, targetTensor, min, max] = this.prepareData(data)

      // Train the model
      const history = await this.model.fit(inputTensor, targetTensor, {
        epochs: this.config.epochs,
        batchSize: this.config.batchSize,
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

      // Save the model to localStorage
      await this.model.save(`localstorage://${this.modelKey}`)

      // Create and save metadata
      const finalLoss = history.history.loss[history.history.loss.length - 1] as number
      const finalMae = history.history.meanAbsoluteError[history.history.meanAbsoluteError.length - 1] as number

      this.metadata = {
        sensorType: this.sensorType,
        lastTrainedAt: new Date().toISOString(),
        dataPoints: data.length,
        meanAbsoluteError: finalMae,
        config: this.config,
        featureMin: min,
        featureMax: max,
      }

      localStorage.setItem(`${this.modelKey}-metadata`, JSON.stringify(this.metadata))

      console.log(`Model training complete. MAE: ${finalMae}, Loss: ${finalLoss}`)

      // Clean up tensors
      inputTensor.dispose()
      targetTensor.dispose()

      return this.metadata
    } catch (error) {
      console.error("Error training model:", error)
      throw error
    } finally {
      this.isTraining = false
    }
  }

  // Make predictions using the trained model
  async predict(recentData: number[]): Promise<{
    predictions: number[]
    confidenceIntervals: { lower: number; upper: number }[]
  }> {
    if (!this.model || !this.metadata) {
      throw new Error("Model not trained yet")
    }

    // Ensure we have enough data points
    if (recentData.length < this.config.lookBack) {
      throw new Error(`Not enough data points. Need at least ${this.config.lookBack}`)
    }

    // Get the most recent data points
    const inputData = recentData.slice(-this.config.lookBack)

    // Normalize the input data
    const { featureMin, featureMax } = this.metadata
    const normalizedInput = inputData.map((val) => (val - featureMin) / (featureMax - featureMin))

    // Reshape input for the model
    const inputTensor = tf.tensor3d([normalizedInput], [1, this.config.lookBack, 1])

    // Make prediction
    const predictionTensor = this.model.predict(inputTensor) as tf.Tensor
    const normalizedPredictions = await predictionTensor.data()

    // Denormalize predictions
    const predictions = Array.from(normalizedPredictions).map((val) => val * (featureMax - featureMin) + featureMin)

    // Calculate confidence intervals (using MAE as a basis)
    const mae = this.metadata.meanAbsoluteError * (featureMax - featureMin) // Denormalize MAE
    const confidenceMultiplier = 1.96 // ~95% confidence interval

    const confidenceIntervals = predictions.map((val, i) => {
      // Increase uncertainty as we predict further into the future
      const uncertaintyFactor = 1 + i / predictions.length
      const interval = mae * confidenceMultiplier * uncertaintyFactor

      return {
        lower: val - interval,
        upper: val + interval,
      }
    })

    // Clean up tensors
    inputTensor.dispose()
    predictionTensor.dispose()

    return { predictions, confidenceIntervals }
  }

  // Get model metadata
  getMetadata(): ModelMetadata | null {
    return this.metadata
  }

  // Check if model is currently training
  isModelTraining(): boolean {
    return this.isTraining
  }

  // Delete the model from localStorage
  async deleteModel(): Promise<void> {
    if (this.model) {
      this.model.dispose()
      this.model = null
    }

    try {
      await tf.io.removeModel(`localstorage://${this.modelKey}`)
      localStorage.removeItem(`${this.modelKey}-metadata`)
      this.metadata = null
      console.log(`Model for ${this.sensorType} deleted`)
    } catch (error) {
      console.error("Error deleting model:", error)
      throw error
    }
  }
}

// Helper function to create a model instance for a specific sensor type
export function createModel(sensorType: string, config?: ModelConfig): WaterQualityModel {
  return new WaterQualityModel(sensorType, config)
}

// Helper function to evaluate model performance
export async function evaluateModel(
  model: WaterQualityModel,
  testData: number[],
): Promise<{
  mse: number
  mae: number
  accuracy: number
}> {
  const metadata = model.getMetadata()
  if (!metadata) {
    throw new Error("Model not trained yet")
  }

  // Split test data into input and target
  const lookBack = metadata.config.lookBack
  const horizon = metadata.config.horizon

  // Need enough data for at least one prediction
  if (testData.length < lookBack + horizon) {
    throw new Error(`Not enough test data. Need at least ${lookBack + horizon} points`)
  }

  // Make predictions for each possible window in the test data
  const errors = []
  const percentErrors = []

  for (let i = 0; i <= testData.length - lookBack - horizon; i++) {
    const inputWindow = testData.slice(i, i + lookBack)
    const actualValues = testData.slice(i + lookBack, i + lookBack + horizon)

    const { predictions } = await model.predict(inputWindow)

    // Calculate errors for each prediction
    for (let j = 0; j < Math.min(predictions.length, actualValues.length); j++) {
      const error = Math.abs(predictions[j] - actualValues[j])
      errors.push(error)

      // Calculate percentage error (avoid division by zero)
      if (Math.abs(actualValues[j]) > 0.001) {
        const percentError = Math.abs(error / actualValues[j]) * 100
        percentErrors.push(percentError)
      }
    }
  }

  // Calculate metrics
  const mse = errors.reduce((sum, err) => sum + err * err, 0) / errors.length
  const mae = errors.reduce((sum, err) => sum + err, 0) / errors.length

  // Calculate accuracy as 100 - MAPE (Mean Absolute Percentage Error)
  const mape = percentErrors.length > 0 ? percentErrors.reduce((sum, err) => sum + err, 0) / percentErrors.length : 0
  const accuracy = Math.max(0, Math.min(100, 100 - mape))

  return { mse, mae, accuracy }
}
