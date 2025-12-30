"use client"

import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { fullSync } from "@/lib/sync"
import { useState } from "react"

export function UserMenu() {
  const [syncing, setSyncing] = useState(false)

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

  return (
    <div className="flex items-center gap-2">
      <SignedIn>
        <button
          onClick={handleSync}
          disabled={syncing}
          className={cn(
            "px-2 py-1 text-xs rounded",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted transition-colors",
            "disabled:opacity-50"
          )}
        >
          {syncing ? "Syncing..." : "Sync"}
        </button>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
            },
          }}
        />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium",
              "bg-foreground text-background",
              "hover:opacity-90 transition-opacity"
            )}
          >
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
    </div>
  )
}
