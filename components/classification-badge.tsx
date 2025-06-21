"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface ClassificationBadgeProps {
  value: number
  loading: boolean
}

export function ClassificationBadge({ value, loading }: ClassificationBadgeProps) {
  const [animatedValue, setAnimatedValue] = useState<number>(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(Number(value))
    }, 500)
    return () => clearTimeout(timer)
  }, [value])

  if (loading) {
    return <Skeleton className="h-[200px] w-full" />
  }

  // Classification descriptions
  const classifications = [
    {
      id: 1,
      name: "Excellent",
      color: "bg-green-500/80",
      description: "Water quality is excellent and suitable for all uses.",
    },
    { id: 2, name: "Good", color: "bg-blue-500/80", description: "Water quality is good and suitable for most uses." },
    {
      id: 3,
      name: "Fair",
      color: "bg-yellow-500/80",
      description: "Water quality is acceptable but may require treatment for some uses.",
    },
    {
      id: 4,
      name: "Poor",
      color: "bg-orange-500/80",
      description: "Water quality is poor and requires treatment before use.",
    },
    {
      id: 5,
      name: "Very Poor",
      color: "bg-red-500/80",
      description: "Water quality is very poor and unsuitable for most uses without significant treatment.",
    },
  ]

  // Find the current classification
  const classification = classifications.find((c) => c.id === Math.round(animatedValue)) || classifications[0]

  return (
    <div className="flex flex-col items-center justify-center h-[200px] text-center">
      <Badge
        className={`${classification.color} text-white text-lg py-2 px-4 mb-4 backdrop-blur-md shadow-lg border border-white/20`}
      >
        Class {classification.id}: {classification.name}
      </Badge>

      <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs">{classification.description}</p>

      <div className="flex justify-between w-full mt-6">
        {classifications.map((c) => (
          <div
            key={c.id}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white backdrop-blur-md ${
              c.id === Math.round(animatedValue)
                ? `${c.color} ring-4 ring-offset-2 ring-offset-background ring-${c.color.replace("bg-", "")}/30 shadow-lg`
                : `${c.color} opacity-50`
            }`}
          >
            {c.id}
          </div>
        ))}
      </div>
    </div>
  )
}
