"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Github, Linkedin, Mail, Rocket, Droplets, Zap, Brain, Microscope, Cpu } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface TeamMember {
  name: string
  nickname: string
  role: string
  bio: string
  skills: string[]
  github?: string
  linkedin?: string
  email?: string
  color: string
  icon: React.ReactNode
}

export default function MeetTeamPage() {
  const router = useRouter()

  const teamMembers: TeamMember[] = [
    {
      name: "Judas",
      nickname: "Jay",
      role: "Lead Developer & Project Architect",
      bio: "Jay is the lead developer and visionary behind AqueSense Technologies. As an electrical engineering student, he combines his hardware knowledge with software expertise to create the complete IoT water quality monitoring system, from ESP32 firmware to Firebase integration.",
      skills: ["IoT Development", "ESP32 Programming", "Circuit Design", "Firebase Integration", "System Architecture"],
      github: "https://github.com/jay",
      linkedin: "https://linkedin.com/in/jay",
      email: "jay@aquesense.tech",
      color: "from-blue-500 to-purple-600",
      icon: <Zap className="h-8 w-8" />,
    },
    {
      name: "Zinhle",
      nickname: "Zee",
      role: "Hardware Engineer & Sensor Specialist",
      bio: "Zee specializes in sensor integration and hardware optimization. Her electrical engineering background drives the precision and reliability of our sensor arrays, ensuring accurate water quality measurements across all parameters.",
      skills: ["Sensor Integration", "PCB Design", "Analog Circuits", "Signal Processing", "Hardware Testing"],
      github: "https://github.com/zee",
      linkedin: "https://linkedin.com/in/zee",
      color: "from-emerald-500 to-teal-600",
      icon: <Microscope className="h-8 w-8" />,
    },
    {
      name: "Mqhele",
      nickname: "MQ",
      role: "Embedded Systems Engineer",
      bio: "MQ focuses on the embedded systems and microcontroller programming aspects of the project. His expertise in electrical engineering and embedded programming ensures optimal performance and power efficiency of our monitoring devices.",
      skills: [
        "Embedded Programming",
        "Microcontrollers",
        "Power Management",
        "Real-time Systems",
        "Firmware Development",
      ],
      linkedin: "https://linkedin.com/in/mq",
      email: "mq@aquesense.tech",
      color: "from-orange-500 to-red-600",
      icon: <Cpu className="h-8 w-8" />,
    },
    {
      name: "Editor",
      nickname: "Caarl",
      role: "Systems Integration & QA Engineer",
      bio: "Caarl handles systems integration, testing protocols, and quality assurance. His electrical engineering knowledge ensures all components work seamlessly together and meet industry standards for water quality monitoring equipment.",
      skills: [
        "Systems Integration",
        "Quality Assurance",
        "Testing Protocols",
        "Documentation",
        "Standards Compliance",
      ],
      email: "caarl@aquesense.tech",
      github: "https://github.com/caarl",
      color: "from-pink-500 to-rose-600",
      icon: <Brain className="h-8 w-8" />,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Back Button */}
      <div className="container px-4 pt-6">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-4 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Hero Section */}
      <section className="container px-4 py-8 mx-auto text-center">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Meet the Developer
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-4 leading-relaxed">
          This project is developed and maintained by <span className="font-semibold text-blue-600 dark:text-blue-400">RaccoonX65</span>.
        </p>
      </section>

      {/* Team Members Grid */}
      <section className="container px-4 py-8 mx-auto mb-16">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4 max-w-7xl mx-auto">
          {teamMembers.map((member, index) => (
            <Card
              key={index}
              className="group overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-blue-500/25 dark:hover:shadow-blue-400/25"
              style={{
                animationDelay: `${index * 150}ms`,
                animation: "fadeInUp 0.6s ease-out forwards",
              }}
            >
              {/* Profile Picture Section */}
              <div className="relative p-8 pb-4">
                <div
                  className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${member.color} p-1 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
                >
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-white relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${member.color} opacity-90`}></div>
                    <div className="relative z-10 flex flex-col items-center">
                      {member.icon}
                      <span className="text-2xl font-bold mt-1">{member.nickname}</span>
                    </div>
                  </div>
                </div>

                {/* Floating Animation Elements */}
                <div className="absolute top-4 right-4 w-3 h-3 bg-blue-400 rounded-full animate-bounce opacity-60"></div>
                <div className="absolute top-8 left-6 w-2 h-2 bg-purple-400 rounded-full animate-pulse opacity-40"></div>
              </div>

              <CardContent className="px-6 pb-6">
                <h3 className="text-xl font-bold mb-1 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {member.name} ({member.nickname})
                </h3>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">
                  {member.role}
                </p>
                <div className="inline-block px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full mb-3">
                  Electrical Engineering Student
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed line-clamp-4">
                  {member.bio}
                </p>

                {/* Skills */}
                <div className="mb-6">
                  <h4 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 font-semibold">
                    Expertise
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.slice(0, 3).map((skill, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-700/50"
                      >
                        {skill}
                      </span>
                    ))}
                    {member.skills.length > 3 && (
                      <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                        +{member.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex gap-3 justify-center">
                  {member.github && (
                    <Link href={member.github} target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all duration-300 hover:scale-110"
                      >
                        <Github className="h-4 w-4" />
                        <span className="sr-only">GitHub</span>
                      </Button>
                    </Link>
                  )}
                  {member.linkedin && (
                    <Link href={member.linkedin} target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300 hover:scale-110"
                      >
                        <Linkedin className="h-4 w-4" />
                        <span className="sr-only">LinkedIn</span>
                      </Button>
                    </Link>
                  )}
                  {member.email && (
                    <Link href={`mailto:${member.email}`}>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full hover:bg-green-600 hover:text-white transition-all duration-300 hover:scale-110"
                      >
                        <Mail className="h-4 w-4" />
                        <span className="sr-only">Email</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Technical Implementation Section */}
      <section className="container px-4 py-16 mx-auto">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white text-center">
            Our Technical Implementation
          </h2>

          <Card className="overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Droplets className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">ESP32-Based Sensor Array</h3>
                  <p className="text-slate-600 dark:text-slate-300">Advanced IoT water quality monitoring system</p>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 mb-6 text-lg leading-relaxed">
                Our electrical engineering team has developed a comprehensive hardware and software solution using ESP32
                microcontrollers connected to multiple calibrated water quality sensors:
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-slate-700 dark:text-slate-300">
                      DS18B20 temperature sensor with precision calibration
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-slate-700 dark:text-slate-300">
                      Analog pH sensor with custom amplification
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-slate-700 dark:text-slate-300">
                      Turbidity sensor with optical measurement
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-slate-700 dark:text-slate-300">EC sensor with temperature compensation</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span className="text-slate-700 dark:text-slate-300">TDS calculation from EC measurements</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span className="text-slate-700 dark:text-slate-300">Real-time Firebase data transmission</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg mb-6">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Electrical Engineering Excellence</h4>
                <p className="text-slate-600 dark:text-slate-300">
                  Our team's electrical engineering background ensures proper signal conditioning, power management, and
                  robust circuit design. The system features WPA2-Enterprise WiFi connectivity, NTP time
                  synchronization, and efficient data transmission protocols.
                </p>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                The complete system integrates hardware expertise with modern software development, creating a
                professional-grade water quality monitoring solution suitable for various applications.
              </p>
            </CardContent>
          </Card>

          <div className="text-center mt-12">
            <Link href="/dashboard">
              <Button className="gap-3 px-8 py-4 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Droplets className="h-5 w-5" />
                Explore Our Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
