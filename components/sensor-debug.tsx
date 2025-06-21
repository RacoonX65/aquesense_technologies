import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle } from "lucide-react"

interface SensorDebugProps {
  latestReading: any
  isConnected: boolean
}

export function SensorDebug({ latestReading, isConnected }: SensorDebugProps) {
  // Check for sensor problems
  const sensorProblems = []

  if (!latestReading) return null

  // Check pH value
  if (latestReading.field1 === "0.00" || Number.parseFloat(latestReading.field1) > 14) {
    sensorProblems.push("pH sensor may be disconnected or needs calibration")
  }

  // Check TDS value
  if (latestReading.field2 === "0.00") {
    sensorProblems.push("TDS sensor may be disconnected")
  }

  // Check EC value
  if (latestReading.field4 === "0.00") {
    sensorProblems.push("EC sensor may be disconnected")
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Sensor Status{" "}
          {isConnected ? (
            <Badge className="bg-green-600">Connected</Badge>
          ) : (
            <Badge variant="destructive">Disconnected</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sensorProblems.length > 0 ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc pl-4 mt-2">
                {sensorProblems.map((problem, i) => (
                  <li key={i}>{problem}</li>
                ))}
              </ul>
              <p className="mt-2 text-sm">
                Check your ESP32 code and sensor connections. pH readings showing as "inf" typically indicate a sensor
                error or division by zero.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>All sensors appear to be working correctly.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
