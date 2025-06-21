import { Suspense } from "react"
import WaterQualityTrainer from "@/components/water-quality-trainer"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"

export default function MLTrainingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<DashboardSkeleton />}>
          <WaterQualityTrainer />
        </Suspense>
      </div>
    </div>
  )
}
