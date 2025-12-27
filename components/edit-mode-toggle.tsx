"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export type EditMode = "quick" | "edit" | "read"

interface EditModeToggleProps {
  mode: EditMode
  onChange: (mode: EditMode) => void
  onMerge?: () => void
}

export function EditModeToggle({ mode, onChange, onMerge }: EditModeToggleProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleMergeClick = () => {
    setShowConfirm(true)
  }

  const handleConfirm = () => {
    setShowConfirm(false)
    onMerge?.()
  }

  return (
    <>
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      {/* Quick edit mode - click to edit individual sections */}
      <button
        onClick={() => onChange("quick")}
        className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center",
          "transition-colors",
          mode === "quick" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
        title="Quick edit - click sections to edit"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
        </svg>
      </button>

      {/* Full edit mode - everything editable */}
      <button
        onClick={() => onChange("edit")}
        className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center",
          "transition-colors",
          mode === "edit" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
        title="Edit mode - edit all content"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      </button>

      {/* Read mode - view only */}
      <button
        onClick={() => onChange("read")}
        className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center",
          "transition-colors",
          mode === "read" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
        title="Read mode - view only"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {/* Divider */}
      <div className="w-px h-4 bg-border mx-0.5" />

      {/* Merge button */}
      <button
        onClick={handleMergeClick}
        className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center",
          "transition-colors",
          "text-muted-foreground hover:text-foreground",
        )}
        title="Merge all sections into one"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 6h13" />
          <path d="M8 12h13" />
          <path d="M8 18h13" />
          <path d="M3 6h.01" />
          <path d="M3 12h.01" />
          <path d="M3 18h.01" />
        </svg>
      </button>
    </div>

    {/* Confirmation dialog */}
    {showConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
        <div className="relative bg-background border border-border rounded-xl shadow-lg p-6 max-w-sm mx-4">
          <h3 className="text-lg font-medium text-foreground mb-2">Merge sections?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This will combine all sections into a single editable block. This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              Merge
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
