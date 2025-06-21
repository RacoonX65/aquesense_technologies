"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface AnomalyScoreGaugeProps {
  value: number
  loading: boolean
}

export function AnomalyScoreGauge({ value, loading }: AnomalyScoreGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState<number>(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(Number(value))
    }, 500)
    return () => clearTimeout(timer)
  }, [value])

  if (loading) {
    return <Skeleton className="h-[200px] w-full" />
  }

  // Clamp value between 0 and 1
  const clampedValue = Math.max(0, Math.min(1, animatedValue))

  // Determine color based on value
  const getColor = () => {
    if (clampedValue < 0.3) return "#22c55e" // green
    if (clampedValue < 0.6) return "#eab308" // yellow
    if (clampedValue < 0.8) return "#f97316" // orange
    return "#ef4444" // red
  }

  // Calculate percentage for the fill
  const percentage = clampedValue * 100

  return (
    <div className="flex flex-col items-center justify-center h-[200px]">
      <div className="relative w-32 h-32 rounded-full overflow-hidden backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
        {/* Background circle */}
        <div className="absolute inset-0 bg-gray-200/30 dark:bg-gray-700/30" />

        {/* Filled portion */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
          style={{
            height: `${percentage}%`,
            backgroundColor: getColor(),
            boxShadow: `0 0 20px ${getColor()}50`,
          }}
        />

        {/* Glass effect overlay */}
        <div className="absolute inset-0 bg-white/10 dark:bg-black/10" />

        {/* Value display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {isNaN(animatedValue) ? "N/A" : animatedValue.toFixed(2)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Anomaly Score</span>
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between w-full mt-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Normal</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">Anomalous</span>
      </div>
    </div>
  )
}
