"use client"

import { useAuth } from "@clerk/nextjs"
import {
  saveMedia as saveLocalMedia,
  getMedia as getLocalMedia,
  getAllMedia as getAllLocalMedia,
  deleteMedia as deleteLocalMedia,
  generateMediaId,
  formatFileSize,
  type MediaItem,
} from "@/lib/media-db"

export { generateMediaId, formatFileSize, type MediaItem }

interface ServerMediaItem {
  id: string
  name: string
  type: string
  size: number
  data: string
  createdAt: string
  localId: string | null
}

function serverToLocal(item: ServerMediaItem): MediaItem {
  return {
    id: item.localId || item.id,
    name: item.name,
    type: item.type,
    size: item.size,
    data: item.data,
    createdAt: new Date(item.createdAt).getTime(),
  }
}

export function useMedia() {
  const { isSignedIn } = useAuth()

  const saveMedia = async (item: MediaItem): Promise<string> => {
    if (isSignedIn) {
      const response = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          type: item.type,
          size: item.size,
          data: item.data,
          localId: item.id,
        }),
      })
      if (!response.ok) {
        throw new Error("Failed to save media to server")
      }
      const serverMedia = await response.json()
      return serverMedia.id
    } else {
      await saveLocalMedia(item)
      return item.id
    }
  }

  const getMedia = async (id: string): Promise<MediaItem | undefined> => {
    // Try local first
    const localMedia = await getLocalMedia(id)
    if (localMedia) {
      return localMedia
    }

    // If signed in, try server
    if (isSignedIn) {
      try {
        const response = await fetch(`/api/media/${id}`)
        if (response.ok) {
          const serverMedia: ServerMediaItem = await response.json()
          return serverToLocal(serverMedia)
        }
      } catch {
        // Ignore errors, media not found
      }
    }

    return undefined
  }

  const getAllMedia = async (): Promise<MediaItem[]> => {
    if (isSignedIn) {
      const response = await fetch("/api/media")
      if (response.ok) {
        const serverMedia: ServerMediaItem[] = await response.json()
        return serverMedia.map(serverToLocal)
      }
    }
    return getAllLocalMedia()
  }

  const deleteMedia = async (id: string): Promise<void> => {
    if (isSignedIn) {
      const response = await fetch(`/api/media/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete media from server")
      }
    } else {
      await deleteLocalMedia(id)
    }
  }

  return {
    saveMedia,
    getMedia,
    getAllMedia,
    deleteMedia,
    isSignedIn,
  }
}
