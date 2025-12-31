"use client"

import { useState, useEffect } from "react"
import { useMedia, formatFileSize, type MediaItem } from "@/hooks/use-media"

interface MediaManagerProps {
  onClose: () => void
  onSelect?: (url: string) => void
}

export function MediaManager({ onClose, onSelect }: MediaManagerProps) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { getAllMedia, deleteMedia } = useMedia()

  useEffect(() => {
    loadMedia()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadMedia = async () => {
    setLoading(true)
    const items = await getAllMedia()
    setMedia(items.sort((a, b) => b.createdAt - a.createdAt))
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await deleteMedia(id)
    setMedia(media.filter((m) => m.id !== id))
  }

  const handleCopyUrl = async (item: MediaItem) => {
    const url = `/media/${item.id}`
    await navigator.clipboard.writeText(`![${item.name}](${url})`)
    setCopiedId(item.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] mx-4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-medium text-foreground">Media Library</h2>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : media.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No media uploaded yet. Right-click while editing to upload images.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-muted rounded-lg overflow-hidden"
                >
                  <div className="aspect-square">
                    <img
                      src={item.data}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/60 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleCopyUrl(item)}
                      className="p-2 bg-background rounded-lg hover:bg-muted transition-colors"
                      title="Copy markdown"
                    >
                      {copiedId === item.id ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                    {onSelect && (
                      <button
                        onClick={() => onSelect(`/media/${item.id}`)}
                        className="p-2 bg-background rounded-lg hover:bg-muted transition-colors"
                        title="Insert"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-background rounded-lg hover:bg-destructive/20 text-destructive transition-colors"
                      title="Delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-2">
                    <div className="text-xs text-foreground truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{formatFileSize(item.size)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
