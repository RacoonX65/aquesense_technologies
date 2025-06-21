"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

interface CircularGaugeProps {
  value: number
  min: number
  max: number
  title: string
  unit: string
  color: string
  size?: number
  loading?: boolean
}

export function CircularGauge({
  value,
  min,
  max,
  title,
  unit,
  color,
  size = 140,
  loading = false,
}: CircularGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme, resolvedTheme } = useTheme()

  // Add debug logging to verify the value is received correctly
  console.log(`🎯 CircularGauge ${title} RENDER:`, { value, min, max, unit, loading })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Log when actually drawing to canvas
    console.log(`🎨 Drawing ${title} gauge with value:`, value)

    // Set canvas resolution for retina displays
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 10

    // Determine if we're in dark mode
    const isDark = resolvedTheme === "dark" || theme === "dark"

    // Draw background circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.lineWidth = 5
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
    ctx.stroke()

    if (!loading) {
      // Calculate percentage
      const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1)

      // Draw value arc
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, -0.5 * Math.PI, 2 * Math.PI * percentage - 0.5 * Math.PI)
      ctx.lineWidth = 5
      ctx.strokeStyle = color
      ctx.lineCap = "round"
      ctx.stroke()

      // Add glow effect
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, -0.5 * Math.PI, 2 * Math.PI * percentage - 0.5 * Math.PI)
      ctx.lineWidth = 8
      ctx.strokeStyle = `${color}33` // Add transparency for glow
      ctx.lineCap = "round"
      ctx.stroke()
    }

    // Draw inner shadow
    const gradient = ctx.createRadialGradient(centerX, centerY, radius - 20, centerX, centerY, radius + 10)
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)")
    gradient.addColorStop(1, isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.1)")
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fill()
  }, [value, min, max, color, size, loading, theme, resolvedTheme])

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{ width: `${size}px`, height: `${size}px` }}
          className="mb-2"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? "--" : value.toFixed(1)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {title} ({unit})
          </div>
        </div>
      </div>
      <div className="flex justify-between w-full text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
