import { IndividualSensorCard } from "@/components/individual-sensor-card"

export default function TemperatureSensorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Temperature Monitoring</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
            <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">LIVE MONITORING</span>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2">About Water Temperature</h3>
          <p className="text-orange-800 dark:text-orange-200 text-sm">
            Water temperature affects dissolved oxygen levels, chemical reaction rates, and aquatic life. Ideal
            temperature for most aquatic ecosystems is 10-25°C. Higher temperatures can reduce oxygen levels.
          </p>
        </div>

        <IndividualSensorCard type="temperature" unit="°C" />
      </div>
    </div>
  )
}
