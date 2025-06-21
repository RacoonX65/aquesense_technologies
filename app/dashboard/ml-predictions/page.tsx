import { Suspense } from "react"
import MLPredictionEngine from "@/components/ml-prediction-engine"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"

export default function MLPredictionsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <MLPredictionEngine />
    </Suspense>
  )
}
