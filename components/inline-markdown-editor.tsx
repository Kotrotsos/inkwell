"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { SettingsPanel } from "./settings-panel"
import { DocumentSidebar, type DocumentSidebarRef } from "./document-sidebar"
import { UserMenu } from "./auth/user-menu"
import { RenderedBlock } from "./rendered-block"
import { parseMarkdownToBlocks, type Block } from "@/lib/markdown-parser"
import { type EditorSettings, defaultSettings } from "@/lib/settings-db"
import { type Document, saveDocument, getAllDocuments, getDocument } from "@/lib/documents-db"
import { cn } from "@/lib/utils"

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
    setIsEditing(true)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        adjustTextareaHeight()
      }
    }, 0)
  }, [])

  const stopEditing = useCallback(() => {
    setIsEditing(false)
    setBlocks(parseMarkdownToBlocks(markdown))
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

  const handleSettingsChange = useCallback((newSettings: EditorSettings) => {
    setSettings(newSettings)
  }, [])

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
          <header className="mb-8 md:mb-12 flex items-center justify-end">
            <div className="flex items-center gap-3">
              <SettingsPanel onSettingsChange={handleSettingsChange} />
              <UserMenu />
            </div>
          </header>

          <article className={`prose-custom ${getContentClasses()}`}>
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={handleTextareaChange}
                onBlur={handleTextareaBlur}
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
                onClick={startEditing}
                className={cn(
                  "cursor-text rounded-lg -mx-3 px-3 py-1",
                  "transition-all duration-200",
                  "hover:bg-muted/30",
                  "min-h-[200px]",
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
    </div>
  )
}
