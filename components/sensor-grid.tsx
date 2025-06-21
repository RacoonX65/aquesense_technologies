"use client"

import { IndividualSensorCard } from "./individual-sensor-card"

interface SensorData {
  ph: number
  tds: number
  temperature: number
  conductivity: number
  turbidity: number
  timestamp: string
}

interface SensorGridProps {
  sensorData: SensorData
  previousData?: Partial<SensorData>
  loading?: boolean
}

export function SensorGrid({ sensorData, previousData, loading = false }: SensorGridProps) {
  const sensors = [
    {
      type: "ph" as const,
      value: sensorData.ph,
      previousValue: previousData?.ph,
      unit: "pH",
      min: 0,
      max: 14,
      idealRange: { min: 6.5, max: 8.5 },
    },
    {
      type: "tds" as const,
      value: sensorData.tds,
      previousValue: previousData?.tds,
      unit: "ppm",
      min: 0,
      max: 1000,
      idealRange: { min: 50, max: 300 },
    },
    {
      type: "temperature" as const,
      value: sensorData.temperature,
      previousValue: previousData?.temperature,
      unit: "°C",
      min: 0,
      max: 40,
      idealRange: { min: 15, max: 25 },
    },
    {
      type: "conductivity" as const,
      value: sensorData.conductivity,
      previousValue: previousData?.conductivity,
      unit: "µS/cm",
      min: 0,
      max: 2000,
      idealRange: { min: 200, max: 800 },
    },
    {
      type: "turbidity" as const,
      value: sensorData.turbidity,
      previousValue: previousData?.turbidity,
      unit: "NTU",
      min: 0,
      max: 20,
      idealRange: { min: 0, max: 4 },
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {sensors.map((sensor) => (
        <IndividualSensorCard
          key={sensor.type}
          type={sensor.type}
          value={sensor.value}
          previousValue={sensor.previousValue}
          unit={sensor.unit}
          min={sensor.min}
          max={sensor.max}
          idealRange={sensor.idealRange}
          loading={loading}
          timestamp={sensorData.timestamp}
        />
      ))}
    </div>
  )
}
