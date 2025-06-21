"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface Threshold {
  value: number
  color: string
}

interface SensorGaugeProps {
  value: number
  min: number
  max: number
  title: string
  loading: boolean
  thresholds?: Threshold[]
}

export function SensorGauge({ value, min, max, title, loading, thresholds = [] }: SensorGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState<number>(Number(min))

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(Number(value))
    }, 500)
    return () => clearTimeout(timer)
  }, [value])

  if (loading) {
    return <Skeleton className="h-[200px] w-full" />
  }

  const percentage = ((animatedValue - min) / (max - min)) * 100
  const angle = percentage * 1.8 - 90 // -90 to 90 degrees

  // Determine color based on thresholds
  const getColor = () => {
    // Sort thresholds by value
    const sortedThresholds = [...thresholds].sort((a, b) => a.value - b.value)

    // Find the appropriate color based on the current value
    for (let i = sortedThresholds.length - 1; i >= 0; i--) {
      if (animatedValue >= sortedThresholds[i].value) {
        return getColorCode(sortedThresholds[i].color)
      }
    }

    // Default color if no threshold is met
    return "#22c55e" // green
  }

  const getColorCode = (color: string) => {
    switch (color) {
      case "red":
        return "#ef4444"
      case "yellow":
        return "#eab308"
      case "orange":
        return "#f97316"
      case "green":
        return "#22c55e"
      case "blue":
        return "#3b82f6"
      default:
        return color
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-[200px]">
      <div className="relative w-32 h-32">
        {/* Gauge background */}
        <div className="absolute w-full h-full rounded-full border-8 border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm" />

        {/* Gauge fill */}
        <div
          className="absolute w-full h-full rounded-full border-8 border-transparent backdrop-blur-sm"
          style={{
            borderTopColor: getColor(),
            borderRightColor: getColor(),
            borderLeftColor: percentage > 50 ? getColor() : "transparent",
            transform: `rotate(${angle}deg)`,
            transition: "transform 1s ease-out, border-color 1s ease-out",
            boxShadow: `0 0 15px ${getColor()}50`,
          }}
        />

        {/* Gauge center and value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm bg-white/10 dark:bg-black/10 rounded-full">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {isNaN(animatedValue) ? "N/A" : animatedValue.toFixed(1)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{title}</span>
        </div>
      </div>

      {/* Min and max labels */}
      <div className="flex justify-between w-full mt-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">{min}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{max}</span>
      </div>
    </div>
  )
}
