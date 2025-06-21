"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface Threshold {
  value: number
  color: string
}

interface TickGaugeProps {
  value: number
  min: number
  max: number
  title: string
  loading: boolean
  unit?: string
  thresholds?: Threshold[]
  tickCount?: number
}

export function TickGauge({
  value,
  min,
  max,
  title,
  loading,
  unit = "",
  thresholds = [],
  tickCount = 30,
}: TickGaugeProps) {
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

  // Calculate the angle range (from -135 to 135 degrees, total 270 degrees)
  const startAngle = -135
  const endAngle = 135
  const angleRange = endAngle - startAngle

  // Generate ticks
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const tickPercentage = (i / (tickCount - 1)) * 100
    const isActive = tickPercentage <= clampedPercentage
    const tickAngle = startAngle + (angleRange * tickPercentage) / 100

    // Calculate position on the circle
    const tickLength = i % 5 === 0 ? 12 : 8 // Longer ticks for every 5th tick
    const innerRadius = 70 - tickLength
    const outerRadius = 70

    const innerX = 100 + innerRadius * Math.cos((tickAngle * Math.PI) / 180)
    const innerY = 100 + innerRadius * Math.sin((tickAngle * Math.PI) / 180)
    const outerX = 100 + outerRadius * Math.cos((tickAngle * Math.PI) / 180)
    const outerY = 100 + outerRadius * Math.sin((tickAngle * Math.PI) / 180)

    // Determine color based on thresholds
    let tickColor = "#d1d5db" // Default inactive color (gray-300)

    if (isActive) {
      // Default gradient colors if no thresholds provided
      if (thresholds.length === 0) {
        if (tickPercentage < 33)
          tickColor = "#3b82f6" // blue-500
        else if (tickPercentage < 66)
          tickColor = "#8b5cf6" // violet-500
        else tickColor = "#ef4444" // red-500
      } else {
        // Sort thresholds by value
        const sortedThresholds = [...thresholds].sort((a, b) => a.value - b.value)

        // Find the appropriate color based on the tick's position
        const tickValue = min + (tickPercentage / 100) * (max - min)
        for (let i = sortedThresholds.length - 1; i >= 0; i--) {
          if (tickValue >= sortedThresholds[i].value) {
            tickColor = getColorCode(sortedThresholds[i].color)
            break
          }
        }
      }
    }

    return {
      innerX,
      innerY,
      outerX,
      outerY,
      isActive,
      tickColor,
      tickAngle,
    }
  })

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
      <div className="relative w-[200px] h-[200px]">
        {/* SVG for the gauge */}
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Render all ticks */}
          {ticks.map((tick, i) => (
            <line
              key={i}
              x1={tick.innerX}
              y1={tick.innerY}
              x2={tick.outerX}
              y2={tick.outerY}
              stroke={tick.tickColor}
              strokeWidth={i % 5 === 0 ? 2 : 1.5}
              strokeLinecap="round"
              className="transition-colors duration-300"
            />
          ))}

          {/* Optional: Add labels for min, max, and some intermediate values */}
          <text
            x="40"
            y="150"
            fontSize="8"
            fill="currentColor"
            textAnchor="middle"
            className="text-gray-500 dark:text-gray-400"
          >
            {min}
          </text>
          <text
            x="160"
            y="150"
            fontSize="8"
            fill="currentColor"
            textAnchor="middle"
            className="text-gray-500 dark:text-gray-400"
          >
            {max}
          </text>

          {/* Center value display */}
          <text
            x="100"
            y="110"
            fontSize="24"
            fontWeight="bold"
            fill="currentColor"
            textAnchor="middle"
            className="text-gray-900 dark:text-white"
          >
            {isNaN(animatedValue) ? "N/A" : animatedValue.toFixed(1)}
          </text>

          <text
            x="100"
            y="130"
            fontSize="10"
            fill="currentColor"
            textAnchor="middle"
            className="text-gray-500 dark:text-gray-400"
          >
            {unit ? unit : title}
          </text>
        </svg>
      </div>
    </div>
  )
}
