"use client"

import { useState, useRef, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { onLogout, fullSync } from "@/lib/sync"

export function UserMenu() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await fullSync()
    } catch (error) {
      console.error("Sync failed:", error)
    } finally {
      setSyncing(false)
    }
  }

  const handleLogout = async () => {
    await onLogout()
    await signOut({ callbackUrl: "/" })
  }

  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
    )
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className={cn(
          "px-3 py-1.5 rounded-lg text-sm font-medium",
          "bg-foreground text-background",
          "hover:opacity-90 transition-opacity"
        )}
      >
        Sign in
      </Link>
    )
  }

  const initials = session.user.name
    ? session.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : session.user.email[0].toUpperCase()

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          "bg-foreground text-background text-sm font-medium",
          "hover:opacity-90 transition-opacity"
        )}
      >
        {initials}
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute right-0 mt-2 w-56 rounded-lg",
            "bg-background border border-border shadow-lg",
            "py-1 z-50"
          )}
        >
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-medium truncate">
              {session.user.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {session.user.email}
            </p>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className={cn(
              "w-full px-3 py-2 text-left text-sm",
              "hover:bg-muted transition-colors",
              "disabled:opacity-50"
            )}
          >
            {syncing ? "Syncing..." : "Sync now"}
          </button>

          <button
            onClick={handleLogout}
            className={cn(
              "w-full px-3 py-2 text-left text-sm",
              "hover:bg-muted transition-colors",
              "text-red-600 dark:text-red-400"
            )}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
