"use client"

import { useState } from "react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SensorChartProps {
  data: any[]
  dataKey: string
  name: string
  color: string
  loading?: boolean
  timeKey?: string
  unit?: string
  isClassification?: boolean
  formatTime?: (timestamp: string | Date) => string
}

export function SensorChart({
  data,
  dataKey,
  name,
  color,
  loading = false,
  timeKey = "created_at",
  unit = "",
  isClassification = false,
  formatTime,
}: SensorChartProps) {
  const [chartType, setChartType] = useState<"line" | "bar">("line")

  // Format data for the chart
  const chartData = data.map((item) => {
    const value = Number.parseFloat(item[dataKey])
    return {
      name: formatTime ? formatTime(item[timeKey]) : new Date(item[timeKey]).toLocaleString(),
      [name]: isNaN(value) ? 0 : value,
    }
  })

  if (loading) {
    return <Skeleton className="h-full w-full" />
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-50 dark:bg-gray-800 rounded-md">
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-md">
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-sm font-medium">
            {name}: {payload[0].value}
            {unit}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-full w-full">
      <div className="flex justify-end mb-2">
        <Tabs value={chartType} onValueChange={(value) => setChartType(value as "line" | "bar")}>
          <TabsList className="h-8">
            <TabsTrigger value="line" className="text-xs px-2 py-1 h-6">
              Line
            </TabsTrigger>
            <TabsTrigger value="bar" className="text-xs px-2 py-1 h-6">
              Bar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ResponsiveContainer width="100%" height="90%">
        {chartType === "line" ? (
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => {
                // Extract just the time part for better readability
                const parts = value.split(", ")
                return parts.length > 1 ? parts[1] : value
              }}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              domain={isClassification ? [1, 5] : ["auto", "auto"]}
              tickFormatter={(value) => `${value}${unit}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={name}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
              animationDuration={500}
            />
          </LineChart>
        ) : (
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => {
                // Extract just the time part for better readability
                const parts = value.split(", ")
                return parts.length > 1 ? parts[1] : value
              }}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              domain={isClassification ? [1, 5] : ["auto", "auto"]}
              tickFormatter={(value) => `${value}${unit}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={name} fill={color} animationDuration={500} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
