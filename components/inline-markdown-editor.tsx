"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { useAuth } from "@clerk/nextjs"
import { SettingsPanel } from "./settings-panel"
import { DocumentSidebar, type DocumentSidebarRef } from "./document-sidebar"
import { UserMenu } from "./auth/user-menu"
import { RenderedBlock } from "./rendered-block"
import { EditorContextMenu } from "./editor-context-menu"
import { parseMarkdownToBlocks, type Block } from "@/lib/markdown-parser"
import { type EditorSettings, defaultSettings } from "@/lib/settings-db"
import { type Document, saveDocument, getAllDocuments, getDocument } from "@/lib/documents-db"
import { cn } from "@/lib/utils"

interface SharedDocument {
  title: string
  content: string
  updatedAt: string
}

const defaultMarkdown = `# Welcome to Inkwell

A beautifully simple markdown editor where **what you see is what you get**.

## How it works

Click on any element to edit its markdown directly. Press **Enter** or click outside to see it rendered again.

### Features

- **Inline editing** — Click any element to edit
- **Live preview** — See your changes instantly
- **Distraction-free** — Focus on your writing
- **Images** — Add images with ![alt](url)

## Try it yourself

This is a paragraph with some *italic text* and **bold text**. You can also add [links](https://example.com) and \`inline code\`.

![Example image](https://picsum.photos/600/300)

> Blockquotes work beautifully too. Click this to edit the quote directly.

Here's a code block:

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

---

Start writing. Click anywhere to begin.`

export function InlineMarkdownEditor() {
  const [markdown, setMarkdown] = useState(defaultMarkdown)
  const [blocks, setBlocks] = useState<Block[]>(() => parseMarkdownToBlocks(defaultMarkdown))
  const [isEditing, setIsEditing] = useState(false)
  const [settings, setSettings] = useState<EditorSettings>(defaultSettings)
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null)
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [isViewingShared, setIsViewingShared] = useState(false)
  const [shareId, setShareId] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const { isSignedIn } = useAuth()
  const sidebarRef = useRef<DocumentSidebarRef>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const markdownRef = useRef(markdown)
  const currentDocRef = useRef<Document | null>(currentDoc)

  const extractTitleFromBlocks = useCallback((blocks: Block[]): string | null => {
    for (const block of blocks) {
      if (block.type === "heading") {
        // Match # or ## at the start
        const match = block.raw.match(/^#{1,2}\s+(.+)$/)
        if (match) {
          return match[1].trim()
        }
      }
    }
    return null
  }, [])

  useEffect(() => {
    markdownRef.current = markdown
  }, [markdown])

  useEffect(() => {
    currentDocRef.current = currentDoc
  }, [currentDoc])

  const saveCurrentDocument = useCallback(async () => {
    if (currentDocRef.current) {
      const updatedDoc = { ...currentDocRef.current, content: markdownRef.current, updatedAt: Date.now() }
      await saveDocument(updatedDoc)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement

    if (settings.theme === "dark") {
      root.classList.add("dark")
    } else if (settings.theme === "light") {
      root.classList.remove("dark")
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (prefersDark) {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }
  }, [settings.theme])

  // Update URL hash when document changes
  useEffect(() => {
    if (currentDoc) {
      window.history.replaceState(null, "", `#${currentDoc.id}`)
    }
  }, [currentDoc])

  // Load document from URL hash on mount
  useEffect(() => {
    const loadFromHash = async () => {
      const hash = window.location.hash.slice(1)
      if (hash) {
        // First try to load as a local document
        const doc = await getDocument(hash)
        if (doc) {
          const content = doc.content || defaultMarkdown
          setCurrentDoc(doc)
          setMarkdown(content)
          setBlocks(parseMarkdownToBlocks(content))
          setIsViewingShared(false)
          setShareId(null)
          return
        }

        // If not found locally, try to load as a shared document
        try {
          const response = await fetch(`/api/share/${hash}`)
          if (response.ok) {
            const sharedDoc: SharedDocument = await response.json()
            setMarkdown(sharedDoc.content)
            setBlocks(parseMarkdownToBlocks(sharedDoc.content))
            setCurrentDoc(null)
            setIsViewingShared(true)
            setShareId(hash)
          }
        } catch {
          // Not a valid share ID either, ignore
        }
      }
    }
    loadFromHash()

    const handleHashChange = async () => {
      const hash = window.location.hash.slice(1)
      if (!hash) {
        setIsViewingShared(false)
        setShareId(null)
        return
      }

      if (hash !== currentDocRef.current?.id) {
        // First try local
        const doc = await getDocument(hash)
        if (doc) {
          const content = doc.content || defaultMarkdown
          setCurrentDoc(doc)
          setMarkdown(content)
          setBlocks(parseMarkdownToBlocks(content))
          setIsViewingShared(false)
          setShareId(null)
          return
        }

        // Try shared
        try {
          const response = await fetch(`/api/share/${hash}`)
          if (response.ok) {
            const sharedDoc: SharedDocument = await response.json()
            setMarkdown(sharedDoc.content)
            setBlocks(parseMarkdownToBlocks(sharedDoc.content))
            setCurrentDoc(null)
            setIsViewingShared(true)
            setShareId(hash)
          }
        } catch {
          // Ignore
        }
      }
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  useEffect(() => {
    if (currentDoc) {
      const timeout = setTimeout(async () => {
        const extractedTitle = extractTitleFromBlocks(blocks)
        const updatedDoc = {
          ...currentDoc,
          content: markdown,
          title: extractedTitle || currentDoc.title,
          updatedAt: Date.now(),
        }
        await saveDocument(updatedDoc)
        if (extractedTitle && extractedTitle !== currentDoc.title) {
          setCurrentDoc(updatedDoc)
          sidebarRef.current?.refresh()
        }
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [markdown, blocks, currentDoc, extractTitleFromBlocks])

  const getContentClasses = () => {
    const classes: string[] = []

    if (settings.fontFamily === "sans") {
      classes.push("font-sans")
    } else if (settings.fontFamily === "mono") {
      classes.push("font-mono")
    } else {
      classes.push("font-serif")
    }

    if (settings.fontSize === "small") {
      classes.push("text-base")
    } else if (settings.fontSize === "large") {
      classes.push("text-xl")
    } else {
      classes.push("text-lg")
    }

    if (settings.lineHeight === "compact") {
      classes.push("leading-snug")
    } else if (settings.lineHeight === "relaxed") {
      classes.push("leading-loose")
    } else {
      classes.push("leading-relaxed")
    }

    return classes.join(" ")
  }

  const getContainerClasses = () => {
    if (settings.contentWidth === "wide") {
      return "max-w-4xl mx-auto px-6"
    } else if (settings.contentWidth === "full") {
      return "max-w-6xl mx-auto px-8 md:px-12"
    }
    return "max-w-2xl mx-auto px-4"
  }

  const getBackgroundStyle = () => {
    switch (settings.backgroundColor) {
      case "gray":
        return { backgroundColor: "#DDDDE3" }
      case "warm":
        return { backgroundColor: "#E8E4DF" }
      case "cool":
        return { backgroundColor: "#DEE3E8" }
      default:
        return {}
    }
  }

  const getSidebarBackgroundStyle = () => {
    switch (settings.backgroundColor) {
      case "gray":
        return { backgroundColor: "#E8E8EC" }
      case "warm":
        return { backgroundColor: "#F0ECE7" }
      case "cool":
        return { backgroundColor: "#E8ECF0" }
      default:
        return {}
    }
  }

  const getToolbarBackgroundStyle = () => {
    switch (settings.backgroundColor) {
      case "gray":
        return { backgroundColor: "#E8E8EC" }
      case "warm":
        return { backgroundColor: "#F0ECE7" }
      case "cool":
        return { backgroundColor: "#E8ECF0" }
      default:
        return {}
    }
  }

  const startEditing = useCallback(() => {
    const scrollY = window.scrollY
    setIsEditing(true)
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        adjustTextareaHeight()
        textareaRef.current.focus({ preventScroll: true })
      }
      window.scrollTo(0, scrollY)
    })
  }, [])

  const stopEditing = useCallback(() => {
    const scrollY = window.scrollY
    setIsEditing(false)
    setBlocks(parseMarkdownToBlocks(markdown))
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY)
    })
  }, [markdown])

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(e.target.value)
    adjustTextareaHeight()
  }, [])

  const handleTextareaBlur = useCallback(() => {
    stopEditing()
  }, [stopEditing])

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const insertTextAtCursor = useCallback((text: string) => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newMarkdown = markdown.slice(0, start) + text + markdown.slice(end)
    setMarkdown(newMarkdown)
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const newPos = start + text.length
        textareaRef.current.selectionStart = newPos
        textareaRef.current.selectionEnd = newPos
        textareaRef.current.focus({ preventScroll: true })
      }
    })
  }, [markdown])

  const handleInsertLink = useCallback((title: string, url: string) => {
    insertTextAtCursor(`[${title}](${url})`)
  }, [insertTextAtCursor])

  const handleInsertImage = useCallback((alt: string, url: string) => {
    insertTextAtCursor(`![${alt}](${url})`)
  }, [insertTextAtCursor])

  const handleSettingsChange = useCallback((newSettings: EditorSettings) => {
    setSettings(newSettings)
  }, [])

  const handleShare = useCallback(async () => {
    if (!currentDoc?.serverId || !isSignedIn) return

    setIsSharing(true)
    try {
      const response = await fetch(`/api/documents/${currentDoc.serverId}/share`, {
        method: "POST",
      })
      if (response.ok) {
        const { shareId } = await response.json()
        const shareUrl = `${window.location.origin}/#${shareId}`
        await navigator.clipboard.writeText(shareUrl)
        setShareId(shareId)
        alert(`Share link copied to clipboard!\n\n${shareUrl}`)
      }
    } catch (error) {
      console.error("Failed to share document:", error)
    } finally {
      setIsSharing(false)
    }
  }, [currentDoc, isSignedIn])

  const handleSelectDocument = useCallback(
    async (doc: Document) => {
      await saveCurrentDocument()
      const freshDoc = await getDocument(doc.id)
      if (freshDoc) {
        const content = freshDoc.content || defaultMarkdown
        setCurrentDoc(freshDoc)
        setMarkdown(content)
        setBlocks(parseMarkdownToBlocks(content))
        setIsEditing(false)
      }
    },
    [saveCurrentDocument],
  )

  const handleNewDocument = useCallback(async (folderId: string | null) => {
    const docs = await getAllDocuments()
    const content = "# New Document\n\nStart writing here..."
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: `Untitled ${docs.length + 1}`,
      content,
      folderId: folderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await saveDocument(newDoc)
    await sidebarRef.current?.refresh()
    setCurrentDoc(newDoc)
    setMarkdown(content)
    setBlocks(parseMarkdownToBlocks(content))
    setIsEditing(false)
  }, [])

  return (
    <div className="flex min-h-screen" style={getBackgroundStyle()}>
      <DocumentSidebar
        ref={sidebarRef}
        currentDocId={currentDoc?.id ?? null}
        onSelectDocument={handleSelectDocument}
        onNewDocument={handleNewDocument}
        onPinnedChange={setSidebarPinned}
        backgroundStyle={getSidebarBackgroundStyle()}
      />

      <div className={`flex-1 transition-all duration-300 ${sidebarPinned ? "ml-72" : ""}`}>
        <div className={`${getContainerClasses()} py-8 md:py-16`}>
          <header className="mb-8 md:mb-12 flex items-center justify-between">
            {isViewingShared ? (
              <div className="text-sm text-muted-foreground">
                Viewing shared document
              </div>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              {currentDoc?.serverId && isSignedIn && !isViewingShared && (
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg",
                    "text-muted-foreground hover:text-foreground",
                    "hover:bg-muted/50 transition-colors",
                    "disabled:opacity-50"
                  )}
                >
                  {isSharing ? "Sharing..." : "Share"}
                </button>
              )}
              <SettingsPanel onSettingsChange={handleSettingsChange} />
              <UserMenu />
            </div>
          </header>

          <article className={`prose-custom ${getContentClasses()}`}>
            {isEditing && !isViewingShared ? (
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={handleTextareaChange}
                onBlur={(e) => {
                  if (!contextMenu) {
                    handleTextareaBlur()
                  }
                }}
                onContextMenu={handleContextMenu}
                className={cn(
                  "w-full bg-muted/50 text-foreground font-mono text-base",
                  "px-4 py-3 rounded-lg",
                  "focus:outline-none",
                  "resize-none overflow-hidden",
                  "min-h-[200px]",
                )}
                placeholder="Type markdown here..."
              />
            ) : (
              <div
                onClick={isViewingShared ? undefined : startEditing}
                className={cn(
                  "rounded-lg -mx-3 px-3 py-1",
                  "transition-all duration-200",
                  "min-h-[200px]",
                  !isViewingShared && "cursor-text hover:bg-muted/30",
                )}
              >
                {blocks
                  .filter((block) => block.content.trim() || block.type === "table" || block.type === "hr")
                  .map((block) => (
                    <RenderedBlock key={block.id} block={block} />
                  ))}
              </div>
            )}
          </article>
        </div>
      </div>

      {contextMenu && (
        <EditorContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onInsertLink={handleInsertLink}
          onInsertImage={handleInsertImage}
        />
      )}
    </div>
  )
}
