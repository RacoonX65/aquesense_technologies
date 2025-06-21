import { IndividualSensorCard } from "@/components/individual-sensor-card"

export default function PHSensorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">pH Level Monitoring</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">LIVE MONITORING</span>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">About pH Level</h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            pH measures the acidity or alkalinity of water on a scale from 0-14. A pH of 7 is neutral, below 7 is
            acidic, and above 7 is alkaline. For drinking water, the ideal range is 6.5-8.5.
          </p>
        </div>

        <IndividualSensorCard type="ph" unit="" />
      </div>
    </div>
  )
}
