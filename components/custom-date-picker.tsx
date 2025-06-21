"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CustomDatePickerProps {
  value: Date
  onChange: (date: Date) => void
  maxDate?: Date
}

export function CustomDatePicker({ value, onChange, maxDate }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(value || new Date())
  const datePickerRef = React.useRef<HTMLDivElement>(null)

  // Close the date picker when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Generate days for the current month
  const days = React.useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Get day names
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    onChange(date)
    setIsOpen(false)
  }

  // Handle clear button
  const handleClear = () => {
    onChange(new Date())
    setIsOpen(false)
  }

  // Handle today button
  const handleToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    onChange(today)
    setIsOpen(false)
  }

  // Check if a date is selectable (not after maxDate)
  const isSelectable = (date: Date) => {
    if (!maxDate) return true
    return date <= maxDate
  }

  return (
    <div className="relative" ref={datePickerRef}>
      <div
        className="flex items-center gap-2 p-2 border rounded-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span>{format(value, "yyyy-MM-dd")}</span>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/50 z-[9998]" onClick={() => setIsOpen(false)}>
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg w-[280px] z-[9999]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevMonth}
                className="h-7 w-7 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                {format(currentMonth, "MMMM yyyy")}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextMonth}
                className="h-7 w-7 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                disabled={maxDate && currentMonth >= startOfMonth(maxDate)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* Add empty cells for days before the start of the month */}
              {Array.from({ length: days[0].getDay() }).map((_, index) => (
                <div key={`empty-start-${index}`} className="h-8 w-8" />
              ))}

              {days.map((day) => {
                const isSelected = isSameDay(day, value)
                const isTodayDate = isToday(day)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isDisabled = !isSelectable(day)

                return (
                  <Button
                    key={day.toString()}
                    variant="ghost"
                    size="icon"
                    disabled={isDisabled}
                    className={cn(
                      "h-8 w-8 p-0 font-normal",
                      isSelected
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : isTodayDate
                          ? "text-blue-600 dark:text-blue-400 border border-blue-500/50"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
                      !isCurrentMonth && "text-gray-400 dark:text-gray-500",
                      isDisabled && "opacity-50 cursor-not-allowed",
                    )}
                    onClick={() => handleDateSelect(day)}
                  >
                    {format(day, "d")}
                  </Button>
                )
              })}
            </div>

            <div className="flex justify-between mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800 h-7 px-2"
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToday}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800 h-7 px-2"
              >
                Today
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
