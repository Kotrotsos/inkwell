"use client"

import { cn } from "@/lib/utils"

export type EditMode = "quick" | "edit" | "read"

interface EditModeToggleProps {
  mode: EditMode
  onChange: (mode: EditMode) => void
}

export function EditModeToggle({ mode, onChange }: EditModeToggleProps) {
  return (
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
    </div>
  )
}
