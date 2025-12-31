"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useMedia, generateMediaId } from "@/hooks/use-media"

interface EditorContextMenuProps {
  x: number
  y: number
  onClose: () => void
  onInsertLink: (title: string, url: string) => void
  onInsertImage: (alt: string, url: string) => void
}

type Mode = "menu" | "link" | "image"

export function EditorContextMenu({
  x,
  y,
  onClose,
  onInsertLink,
  onInsertImage,
}: EditorContextMenuProps) {
  const [mode, setMode] = useState<Mode>("menu")
  const [linkTitle, setLinkTitle] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [imageAlt, setImageAlt] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { saveMedia } = useMedia()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mode !== "menu") {
          setMode("menu")
        } else {
          onClose()
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [onClose, mode])

  useEffect(() => {
    if (mode !== "menu" && inputRef.current) {
      inputRef.current.focus()
    }
  }, [mode])

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (linkUrl) {
      onInsertLink(linkTitle || linkUrl, linkUrl)
      onClose()
    }
  }

  const handleImageSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (imageUrl) {
      onInsertImage(imageAlt, imageUrl)
      onClose()
    }
  }

  const menuStyle: React.CSSProperties = {
    position: "fixed",
    left: Math.min(x, window.innerWidth - 250),
    top: Math.min(y, window.innerHeight - 200),
  }

  if (mode === "link") {
    return (
      <div
        ref={menuRef}
        style={menuStyle}
        className="z-50 bg-background border border-border rounded-lg shadow-lg p-3 w-64"
      >
        <div className="text-sm font-medium mb-2 text-foreground">Insert Link</div>
        <form onSubmit={handleLinkSubmit} className="space-y-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Link title"
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-muted border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="url"
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-muted border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => setMode("menu")}
              className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!linkUrl}
              className="px-3 py-1 text-xs bg-foreground text-background rounded hover:opacity-90 disabled:opacity-50"
            >
              Insert
            </button>
          </div>
        </form>
      </div>
    )
  }

  if (mode === "image") {
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = async (event) => {
          const dataUrl = event.target?.result as string
          const localId = generateMediaId()
          const mediaId = await saveMedia({
            id: localId,
            name: file.name,
            type: file.type,
            size: file.size,
            data: dataUrl,
            createdAt: Date.now(),
          })
          setImageUrl(`/media/${mediaId}`)
          if (!imageAlt) {
            setImageAlt(file.name.replace(/\.[^/.]+$/, ""))
          }
        }
        reader.readAsDataURL(file)
      }
    }

    return (
      <div
        ref={menuRef}
        style={menuStyle}
        className="z-50 bg-background border border-border rounded-lg shadow-lg p-3 w-64"
      >
        <div className="text-sm font-medium mb-2 text-foreground">Insert Image</div>
        <form onSubmit={handleImageSubmit} className="space-y-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Alt text (optional)"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-muted border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="text"
            placeholder="https://... or /media/..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-muted border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-full px-2 py-1.5 text-sm bg-muted border border-border border-dashed rounded text-center text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors">
              Or upload a file
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => setMode("menu")}
              className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!imageUrl}
              className="px-3 py-1 text-xs bg-foreground text-background rounded hover:opacity-90 disabled:opacity-50"
            >
              Insert
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="z-50 bg-background border border-border rounded-lg shadow-lg py-1 min-w-[140px]"
    >
      <button
        onClick={() => setMode("link")}
        className={cn(
          "w-full px-3 py-2 text-left text-sm",
          "hover:bg-muted transition-colors",
          "flex items-center gap-2"
        )}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        Insert Link
      </button>
      <button
        onClick={() => setMode("image")}
        className={cn(
          "w-full px-3 py-2 text-left text-sm",
          "hover:bg-muted transition-colors",
          "flex items-center gap-2"
        )}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
        Insert Image
      </button>
    </div>
  )
}
