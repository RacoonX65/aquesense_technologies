import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Droplets, Thermometer, Zap } from "lucide-react"

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-32 mt-1" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">pH Level</CardTitle>
            <Droplets className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Thermometer className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Turbidity</CardTitle>
            <Droplets className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Conductivity</CardTitle>
            <Zap className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>

      <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40">
        <CardContent className="p-0">
          <Tabs defaultValue="ph" className="w-full">
            <TabsList className="w-full h-auto p-0 bg-transparent border-b border-gray-200 dark:border-gray-800 rounded-none">
              <div className="flex w-full overflow-x-auto scrollbar-hide">
                <TabsTrigger value="ph" className="flex-1 py-3 rounded-none">
                  pH
                </TabsTrigger>
                <TabsTrigger value="temperature" className="flex-1 py-3 rounded-none">
                  Temp
                </TabsTrigger>
                <TabsTrigger value="turbidity" className="flex-1 py-3 rounded-none">
                  Turbidity
                </TabsTrigger>
                <TabsTrigger value="conductivity" className="flex-1 py-3 rounded-none">
                  Conductivity
                </TabsTrigger>
                <TabsTrigger value="tds" className="flex-1 py-3 rounded-none">
                  TDS
                </TabsTrigger>
              </div>
            </TabsList>
            <TabsContent value="ph" className="p-4">
              <Skeleton className="h-[300px] w-full" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
