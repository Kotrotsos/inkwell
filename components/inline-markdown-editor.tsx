"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { EditableBlock } from "./editable-block"
import { InsertZone } from "./insert-zone"
import { SettingsPanel } from "./settings-panel"
import { DocumentSidebar, type DocumentSidebarRef } from "./document-sidebar"
import { EditModeToggle, type EditMode } from "./edit-mode-toggle"
import { parseMarkdownToBlocks, type Block } from "@/lib/markdown-parser"
import { type EditorSettings, defaultSettings } from "@/lib/settings-db"
import { type Document, saveDocument, getAllDocuments, getDocument } from "@/lib/documents-db"

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
  const [blocks, setBlocks] = useState<Block[]>(() => parseMarkdownToBlocks(defaultMarkdown))
  const [newlyInsertedId, setNewlyInsertedId] = useState<string | null>(null)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [settings, setSettings] = useState<EditorSettings>(defaultSettings)
  const [editMode, setEditMode] = useState<EditMode>("quick")
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null)
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const sidebarRef = useRef<DocumentSidebarRef>(null)
  const blocksRef = useRef<Block[]>(blocks)
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
    blocksRef.current = blocks
  }, [blocks])

  useEffect(() => {
    currentDocRef.current = currentDoc
  }, [currentDoc])

  const saveCurrentDocument = useCallback(async () => {
    if (currentDocRef.current) {
      const markdown = blocksRef.current.map((b) => b.raw).join("\n\n")
      const updatedDoc = { ...currentDocRef.current, content: markdown, updatedAt: Date.now() }
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
        const markdown = blocks.map((b) => b.raw).join("\n\n")
        const extractedTitle = extractTitleFromBlocks(blocks)
        const updatedDoc = {
          ...currentDoc,
          content: markdown,
          // Update title if we found a heading and current title is "Untitled X" or different
          title: extractedTitle || currentDoc.title,
          updatedAt: Date.now(),
        }
        await saveDocument(updatedDoc)
        // Update local state if title changed
        if (extractedTitle && extractedTitle !== currentDoc.title) {
          setCurrentDoc(updatedDoc)
          sidebarRef.current?.refresh()
        }
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [blocks, currentDoc, extractTitleFromBlocks])

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

  const updateBlock = useCallback((id: string, newContent: string) => {
    setBlocks((prev) => {
      const blockIndex = prev.findIndex((b) => b.id === id)
      if (blockIndex === -1) return prev

      const newBlocks = parseMarkdownToBlocks(newContent)

      if (newBlocks.length === 0) {
        return prev.filter((b) => b.id !== id)
      }

      const result = [...prev]
      result.splice(
        blockIndex,
        1,
        ...newBlocks.map((b, i) => ({
          ...b,
          id: i === 0 ? id : `${id}-${i}-${Date.now()}`,
        })),
      )
      return result
    })
  }, [])

  const addBlockAfter = useCallback((id: string) => {
    const newId = `block-${Date.now()}`
    setBlocks((prev) => {
      const blockIndex = prev.findIndex((b) => b.id === id)
      if (blockIndex === -1) return prev

      const newBlock: Block = {
        id: newId,
        type: "paragraph",
        content: "",
        raw: "",
      }

      const result = [...prev]
      result.splice(blockIndex + 1, 0, newBlock)
      return result
    })
    setNewlyInsertedId(newId)
    setEditingBlockId(newId)
  }, [])

  const insertBlockAt = useCallback((index: number) => {
    const newId = `block-${Date.now()}`
    setBlocks((prev) => {
      const newBlock: Block = {
        id: newId,
        type: "paragraph",
        content: "",
        raw: "",
      }

      const result = [...prev]
      result.splice(index, 0, newBlock)
      return result
    })
    setNewlyInsertedId(newId)
    setEditingBlockId(newId)
  }, [])

  const handleBlockFocused = useCallback(
    (id: string) => {
      if (newlyInsertedId === id) {
        setNewlyInsertedId(null)
      }
      setEditingBlockId(id)
    },
    [newlyInsertedId],
  )

  const handleBlockBlurred = useCallback(
    (id: string) => {
      if (editingBlockId === id) {
        setEditingBlockId(null)
      }
    },
    [editingBlockId],
  )

  const handleSettingsChange = useCallback((newSettings: EditorSettings) => {
    setSettings(newSettings)
  }, [])

  const handleSelectDocument = useCallback(
    async (doc: Document) => {
      // Save current document before switching
      await saveCurrentDocument()
      // Fetch fresh from IndexedDB to get latest saved content
      const freshDoc = await getDocument(doc.id)
      if (freshDoc) {
        setCurrentDoc(freshDoc)
        setBlocks(parseMarkdownToBlocks(freshDoc.content || defaultMarkdown))
      }
    },
    [saveCurrentDocument],
  )

  const handleNewDocument = useCallback(async (folderId: string | null) => {
    const docs = await getAllDocuments()
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: `Untitled ${docs.length + 1}`,
      content: "# New Document\n\nStart writing here...",
      folderId: folderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await saveDocument(newDoc)
    await sidebarRef.current?.refresh()
    setCurrentDoc(newDoc)
    setBlocks(parseMarkdownToBlocks(newDoc.content))
  }, [])

  const handleMergeBlocks = useCallback(() => {
    const mergedMarkdown = blocks.map((b) => b.raw).join("\n\n")
    const mergedBlock = {
      id: `block-${Date.now()}`,
      type: "paragraph" as const,
      content: mergedMarkdown,
      raw: mergedMarkdown,
    }
    setBlocks([mergedBlock])
    setEditingBlockId(mergedBlock.id)
    setEditMode("edit")
  }, [blocks])

  return (
    <div className="flex min-h-screen" style={getBackgroundStyle()}>
      <DocumentSidebar
        ref={sidebarRef}
        currentDocId={currentDoc?.id ?? null}
        onSelectDocument={handleSelectDocument}
        onNewDocument={handleNewDocument}
        onPinnedChange={setSidebarPinned}
      />

      <div className={`flex-1 transition-all duration-300 ${sidebarPinned ? "ml-72" : ""}`}>
        <div className={`${getContainerClasses()} py-8 md:py-16`}>
          <header className="mb-8 md:mb-12 flex items-center justify-end">
            <div className="flex items-center gap-3">
              <EditModeToggle mode={editMode} onChange={setEditMode} onMerge={handleMergeBlocks} />
              <SettingsPanel onSettingsChange={handleSettingsChange} />
            </div>
          </header>

          <article className={`prose-custom ${getContentClasses()}`}>
            {editMode !== "read" && <InsertZone onInsert={() => insertBlockAt(0)} isFirst />}

            {blocks
              .filter((block) => {
                const isEmpty = !block.content.trim() && newlyInsertedId !== block.id && editingBlockId !== block.id
                return !isEmpty
              })
              .map((block, index, filteredBlocks) => {
                return (
                  <div key={block.id}>
                    <EditableBlock
                      block={block}
                      onUpdate={updateBlock}
                      onAddAfter={addBlockAfter}
                      autoFocus={newlyInsertedId === block.id}
                      onFocused={() => handleBlockFocused(block.id)}
                      onBlurred={() => handleBlockBlurred(block.id)}
                      editMode={editMode}
                    />
                    {editMode !== "read" && (
                      <InsertZone
                        onInsert={() => {
                          const originalIndex = blocks.findIndex((b) => b.id === block.id)
                          insertBlockAt(originalIndex + 1)
                        }}
                        isLast={index === filteredBlocks.length - 1}
                      />
                    )}
                  </div>
                )
              })}
          </article>
        </div>
      </div>
    </div>
  )
}
