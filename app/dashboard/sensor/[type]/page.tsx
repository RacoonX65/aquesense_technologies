import { notFound } from "next/navigation"
import EnhancedSensorDetail from "@/components/enhanced-sensor-detail"

// Valid sensor types
const VALID_SENSOR_TYPES = ["ph", "tds", "temperature", "conductivity", "turbidity"]

export default function SensorDetailPage({ params }: { params: { type: string } }) {
  const sensorType = params.type.toLowerCase()

  // Validate sensor type
  if (!VALID_SENSOR_TYPES.includes(sensorType)) {
    notFound()
  }

  return <EnhancedSensorDetail type={sensorType} />
}

// Generate static params for all sensor types
export function generateStaticParams() {
  return VALID_SENSOR_TYPES.map((type) => ({
    type: type,
  }))
}
