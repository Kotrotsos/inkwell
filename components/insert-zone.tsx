"use client"

import type React from "react"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface InsertZoneProps {
  onInsert: () => void
  isFirst?: boolean
  isLast?: boolean
}

export function InsertZone({ onInsert, isFirst, isLast }: InsertZoneProps) {
  const [isActive, setIsActive] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleDoubleClick = () => {
    onInsert()
  }

  const handlePlusClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onInsert()
  }

  const handlePlusTouch = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setTimeout(() => {
      onInsert()
    }, 50)
  }

  const handleTouchStart = () => {
    setIsActive(true)
  }

  const handleTouchEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => setIsActive(false), 2000)
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      className={cn(
        "relative h-4 -mx-3 cursor-text transition-all duration-200",
        isFirst && "mt-0 mb-1",
        isLast && "mt-1 mb-0 h-12",
      )}
    >
      <button
        type="button"
        onMouseDown={handlePlusClick}
        onTouchEnd={handlePlusTouch}
        className={cn(
          "absolute -left-3 top-1/2 -translate-y-1/2",
          "w-10 h-10 md:w-7 md:h-7 rounded-full",
          "flex items-center justify-center",
          "text-xl md:text-lg font-light text-muted-foreground hover:text-foreground hover:bg-muted",
          "opacity-0 transition-all duration-200",
          "active:bg-muted",
          "touch-manipulation",
          isActive && "opacity-100",
        )}
      >
        +
      </button>
    </div>
  )
}
