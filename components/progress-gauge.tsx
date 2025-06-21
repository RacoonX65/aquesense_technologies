"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface Threshold {
  value: number
  color: string
}

interface ProgressGaugeProps {
  value: number
  min: number
  max: number
  title: string
  loading: boolean
  unit?: string
  thresholds?: Threshold[]
}

export function ProgressGauge({ value, min, max, title, loading, unit = "", thresholds = [] }: ProgressGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState<number>(min)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(Number(value))
    }, 500)
    return () => clearTimeout(timer)
  }, [value])

  if (loading) {
    return <Skeleton className="h-[200px] w-full" />
  }

  // Calculate percentage for the fill
  const percentage = ((animatedValue - min) / (max - min)) * 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage))

  // Determine color based on thresholds
  const getColor = () => {
    // Default gradient colors if no thresholds provided
    if (thresholds.length === 0) {
      if (clampedPercentage < 33)
        return "#3b82f6" // blue-500
      else if (clampedPercentage < 66)
        return "#8b5cf6" // violet-500
      else return "#ef4444" // red-500
    }

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

  // Helper function to convert color names to hex codes
  function getColorCode(color: string) {
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
      case "purple":
        return "#8b5cf6"
      default:
        return color
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-[200px]">
      <div className="relative w-full max-w-[200px]">
        {/* Value display */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {isNaN(animatedValue) ? "N/A" : animatedValue.toFixed(1)}
            <span className="text-lg ml-1">{unit}</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
        </div>

        {/* Progress bar background */}
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          {/* Progress bar fill */}
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${clampedPercentage}%`,
              backgroundColor: getColor(),
              boxShadow: `0 0 10px ${getColor()}80`,
            }}
          />
        </div>

        {/* Min and max labels */}
        <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {min}
            {unit}
          </span>
          <span>
            {max}
            {unit}
          </span>
        </div>

        {/* Threshold indicators */}
        {thresholds.length > 0 && (
          <div className="relative h-2 mt-2">
            {thresholds.map((threshold, index) => {
              // Skip min and max thresholds for indicators
              if (threshold.value === min || threshold.value === max) return null

              const thresholdPosition = ((threshold.value - min) / (max - min)) * 100
              return (
                <div
                  key={index}
                  className="absolute w-0.5 h-2 bg-gray-400 dark:bg-gray-500"
                  style={{
                    left: `${thresholdPosition}%`,
                    backgroundColor: getColorCode(threshold.color),
                  }}
                  title={`${threshold.value}${unit}`}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
