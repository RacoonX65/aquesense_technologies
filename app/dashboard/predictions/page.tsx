import { Suspense } from "react"
import PredictionsTab from "@/components/predictions-tab"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import { getSensorData } from "@/lib/actions"

export default async function PredictionsPage() {
  // Fetch historical data for predictions
  const historicalData = await getSensorData("168") // Last 7 days of data

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <PredictionsTab historicalData={historicalData} />
    </Suspense>
  )
}
