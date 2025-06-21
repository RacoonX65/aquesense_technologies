"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface ExportButtonProps {
  data: any[]
  filename?: string
}

export function ExportButton({ data, filename = "sensor-data.csv" }: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return

    // Create CSV header
    const headers = Object.keys(data[0]).join(",")

    // Create CSV rows
    const rows = data.map((item) =>
      Object.values(item)
        .map((value) => (typeof value === "string" && value.includes(",") ? `"${value}"` : value))
        .join(","),
    )

    // Combine header and rows
    const csv = [headers, ...rows].join("\n")

    // Create download link
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()

    // Clean up
    URL.revokeObjectURL(url)
  }

  return (
    <Button onClick={handleExport} variant="outline" size="sm">
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  )
}
