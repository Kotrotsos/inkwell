"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import type { Block } from "@/lib/markdown-parser"
import { RenderedBlock } from "./rendered-block"
import { cn } from "@/lib/utils"
import type { EditMode } from "./edit-mode-toggle"

interface EditableBlockProps {
  block: Block
  onUpdate: (id: string, content: string) => void
  onAddAfter: (id: string) => void
  autoFocus?: boolean
  onFocused?: () => void
  onBlurred?: () => void
  editMode: EditMode
}

export function EditableBlock({
  block,
  onUpdate,
  onAddAfter,
  autoFocus,
  onFocused,
  onBlurred,
  editMode,
}: EditableBlockProps) {
  const [isEditing, setIsEditing] = useState(editMode === "edit" || autoFocus)
  const [editContent, setEditContent] = useState(block.raw)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0)
  }, [])

  useEffect(() => {
    setEditContent(block.raw)
  }, [block.raw])

  useEffect(() => {
    if (autoFocus && !isEditing) {
      setIsEditing(true)
    }
  }, [autoFocus])

  useEffect(() => {
    if (editMode === "edit") {
      setIsEditing(true)
    } else if (editMode === "read") {
      setIsEditing(false)
    }
  }, [editMode])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const timer = setTimeout(
        () => {
          if (textareaRef.current) {
            textareaRef.current.focus()
            textareaRef.current.selectionStart = textareaRef.current.value.length
            adjustTextareaHeight()
            onFocused?.()
          }
        },
        isTouchDevice ? 300 : 100,
      )
      return () => clearTimeout(timer)
    }
  }, [isEditing, onFocused, isTouchDevice])

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [])

  const handleClick = () => {
    if (editMode === "quick" && !isEditing) {
      setIsEditing(true)
      onFocused?.()
    }
  }

  const saveAndClose = useCallback(() => {
    if (editMode !== "edit") {
      setIsEditing(false)
    }
    if (editContent !== block.raw) {
      onUpdate(block.id, editContent)
    }
    onBlurred?.()
  }, [editContent, block.raw, block.id, onUpdate, onBlurred, editMode])

  const handleBlur = (e: React.FocusEvent) => {
    if (isTouchDevice || editMode === "edit") {
      return
    }

    setTimeout(() => {
      if (textareaRef.current && document.activeElement === textareaRef.current) {
        return
      }
      saveAndClose()
    }, 150)
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value)
    adjustTextareaHeight()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (!["code", "list"].includes(block.type)) {
        e.preventDefault()
        saveAndClose()
        if (editMode !== "edit") {
          onAddAfter(block.id)
        }
      }
    }
    if (e.key === "Escape") {
      if (editMode !== "edit") {
        setIsEditing(false)
      }
      setEditContent(block.raw)
      onBlurred?.()
    }
  }

  if (editMode === "read") {
    return (
      <div className="rounded-lg -mx-3 px-3 py-3">
        <RenderedBlock block={block} />
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full bg-muted/50 text-foreground font-mono text-base",
            "px-4 py-3 rounded-lg",
            "focus:outline-none",
            "resize-none overflow-hidden",
            "transition-all duration-200",
            "min-h-[48px]",
            isTouchDevice && editMode === "quick" && "pb-14",
          )}
          placeholder="Type markdown here..."
          rows={1}
        />
        {isTouchDevice && editMode === "quick" && (
          <button
            type="button"
            onTouchEnd={(e) => {
              e.preventDefault()
              e.stopPropagation()
              saveAndClose()
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              saveAndClose()
            }}
            className={cn(
              "absolute bottom-2 right-2",
              "px-4 py-2 min-h-[44px]",
              "bg-foreground text-background",
              "rounded-md font-medium text-sm",
              "active:opacity-80",
            )}
          >
            Done
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "cursor-pointer rounded-lg -mx-3 px-3 py-1",
        "transition-all duration-200",
        "hover:bg-muted/50",
        "group",
      )}
    >
      <RenderedBlock block={block} />
    </div>
  )
}
