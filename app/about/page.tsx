import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Droplets, Thermometer, Zap, AlertTriangle, Tag, CheckCircle, Database, TrendingUp, Brain } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 w-full backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <Droplets className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">Water Quality Dashboard by RaccoonX65</h1>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium hover:text-blue-500 transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-sm font-medium hover:text-blue-500 transition-colors">
                About
              </Link>
              <Link href="/dashboard" className="text-sm font-medium hover:text-blue-500 transition-colors">
                Dashboard
              </Link>
            </nav>
            <ThemeToggle />
            <Link href="/login">
              <Button className="backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80 text-white">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-12 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            About Our Water Quality Monitoring System
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Learn about the water quality parameters we monitor and the technologies implemented in our project.
          </p>
        </div>
      </section>

      {/* Parameters Section */}
      <section className="container px-4 py-8 mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white text-center">Monitored Parameters</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "pH Level",
              description:
                "pH is a measure of how acidic or basic water is. The range goes from 0 to 14, with 7 being neutral. pH affects many chemical and biological processes in water and is one of the most important parameters in water quality assessment.",
              icon: <Droplets className="w-10 h-10 text-blue-500" />,
              idealRange: "6.5 - 8.5",
              effects: [
                "< 6.5: Acidic water can corrode pipes and fixtures, and may contain toxic metals",
                "6.5 - 8.5: Ideal range for most aquatic life and drinking water",
                "> 8.5: Alkaline water can cause scale buildup and give water a bitter taste",
              ],
            },
            {
              title: "Total Dissolved Solids (TDS)",
              description:
                "TDS is a measure of all inorganic and organic substances dissolved in water. It indicates the general quality of water and its suitability for different uses.",
              icon: <Droplets className="w-10 h-10 text-green-500" />,
              idealRange: "50 - 300 ppm",
              effects: [
                "< 50 ppm: Very low mineral content, may taste flat and lack essential minerals",
                "50 - 300 ppm: Ideal range for drinking water with good taste and mineral content",
                "> 500 ppm: High mineral content, may taste salty and cause scale buildup",
              ],
            },
            {
              title: "Temperature",
              description:
                "Water temperature affects many biological and chemical processes in water bodies. It influences the amount of oxygen that can dissolve in water, the rate of photosynthesis, and the metabolic rates of organisms.",
              icon: <Thermometer className="w-10 h-10 text-red-500" />,
              idealRange: "10 - 25°C",
              effects: [
                "< 10°C: Cold water holds more oxygen but slows biological processes",
                "10 - 25°C: Ideal range for most aquatic life and biological processes",
                "> 25°C: Warm water holds less oxygen and can accelerate algae growth",
              ],
            },
            {
              title: "Conductivity",
              description:
                "Electrical conductivity indicates the amount of dissolved solids in water. It is directly related to the concentration of ions in water and can be used as an indicator of water pollution.",
              icon: <Zap className="w-10 h-10 text-yellow-500" />,
              idealRange: "200 - 800 μS/cm",
              effects: [
                "< 200 μS/cm: Low mineral content, typical of rainwater or distilled water",
                "200 - 800 μS/cm: Normal range for freshwater, good for most uses",
                "> 800 μS/cm: High mineral content, may indicate pollution or saltwater intrusion",
              ],
            },
            {
              title: "Turbidity",
              description:
                "Turbidity measures the cloudiness or haziness of water caused by suspended particles. High turbidity can indicate the presence of microorganisms, sediments, or organic material that can affect water quality.",
              icon: <Droplets className="w-10 h-10 text-gray-500" />,
              idealRange: "< 5 NTU",
              effects: [
                "< 1 NTU: Very clear water, excellent for drinking and aquatic life",
                "1 - 5 NTU: Slightly cloudy but still acceptable for most uses",
                "> 20 NTU: Very cloudy water, harmful to aquatic life and requires significant treatment",
              ],
            },
            {
              title: "Anomaly Score",
              description:
                "Our system calculates an anomaly score that indicates how unusual the current readings are compared to normal patterns. This helps in early detection of potential issues in water quality.",
              icon: <AlertTriangle className="w-10 h-10 text-orange-500" />,
              idealRange: "< 0.3",
              effects: [
                "< 0.3: Normal readings, no significant anomalies detected",
                "0.3 - 0.6: Minor anomalies detected, may warrant monitoring",
                "> 0.8: Critical anomalies detected, immediate action required",
              ],
            },
            {
              title: "Classification Code",
              description:
                "Based on multiple parameters, our system classifies water quality into different classes. This provides a comprehensive assessment of overall water quality.",
              icon: <Tag className="w-10 h-10 text-purple-500" />,
              idealRange: "Class 1-2",
              effects: [
                "Class 1: Excellent water quality, suitable for all uses",
                "Class 2: Good water quality, suitable for most uses",
                "Class 3-5: Fair to poor water quality, may require treatment",
              ],
            },
          ].map((parameter, index) => (
            <div
              key={index}
              className="p-6 rounded-xl backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 shadow-lg"
            >
              <div className="p-3 mb-4 rounded-full w-fit bg-blue-100 dark:bg-blue-900/50">{parameter.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{parameter.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{parameter.description}</p>
              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Ideal Range</h4>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">{parameter.idealRange}</p>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Effects</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
                  {parameter.effects.map((effect, i) => (
                    <li key={i}>{effect}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Prediction Model Section */}
      <section className="container px-4 py-12 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Prediction Model Implementation</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Technical details about the machine learning approach we implemented for water quality prediction.
          </p>
        </div>

        <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-xl p-8 shadow-lg max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Prediction Model Architecture</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our prediction system implements time-series forecasting techniques to analyze historical data patterns
                and generate predictions for future water quality parameters.
              </p>

              <div className="space-y-4 mt-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/50 rounded-full p-2 mr-4">
                    <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Data Processing</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Historical sensor data is collected and preprocessed to handle missing values and normalize
                      readings.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/50 rounded-full p-2 mr-4">
                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Algorithm Implementation</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      We implemented exponential smoothing and regression techniques to identify trends and seasonal
                      patterns.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/50 rounded-full p-2 mr-4">
                    <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Forecasting Engine</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      The model generates predictions with statistical confidence intervals to indicate reliability.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/50 rounded-full p-2 mr-4">
                    <AlertTriangle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Module</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      An automated system interprets prediction results and generates insights about potential water
                      quality changes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-purple-50 dark:bg-purple-900/30 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Technical Implementation</h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Time-series analysis with exponential smoothing</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Trend detection using regression algorithms</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Statistical confidence intervals calculation</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Feedback loop for model accuracy improvement</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Configurable prediction horizons from 12 to 72 hours</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Technical Outcomes</h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Accurate detection of parameter trend deviations</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Proactive monitoring capabilities</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Improved system response time to anomalies</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Enhanced data visualization for trend analysis</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Integration with the monitoring dashboard</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16 mx-auto">
        <div className="p-8 rounded-xl backdrop-blur-md bg-blue-500/10 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 shadow-lg text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Explore our project</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Access the dashboard to see our water quality monitoring system in action.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="backdrop-blur-md bg-blue-500/80 hover:bg-blue-600/80 text-white">
                View Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="backdrop-blur-md bg-white/40 dark:bg-gray-900/40">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 backdrop-blur-md bg-white/70 dark:bg-gray-900/70">
        <div className="container px-4 py-8 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Droplets className="w-6 h-6 text-blue-500" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">Water Quality Dashboard by RaccoonX65</span>
            </div>
            <div className="flex gap-6">
              <Link href="/" className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors">
                Home
              </Link>
              <Link
                href="/about"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
              >
                About
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Water Quality Dashboard by RaccoonX65. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
