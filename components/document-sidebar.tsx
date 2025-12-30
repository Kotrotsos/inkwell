"use client"

import type React from "react"

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react"
import { cn } from "@/lib/utils"
import {
  type Document,
  type Folder,
  type SidebarState,
  getAllDocuments,
  getAllFolders,
  saveDocument,
  deleteDocument,
  saveFolder,
  deleteFolder,
  saveSidebarState,
  loadSidebarState,
} from "@/lib/documents-db"

interface DocumentSidebarProps {
  currentDocId: string | null
  onSelectDocument: (doc: Document) => void
  onNewDocument: (folderId: string | null) => Promise<void>
  onPinnedChange?: (isPinned: boolean) => void
  backgroundStyle?: React.CSSProperties
}

export interface DocumentSidebarRef {
  refresh: () => Promise<void>
}

export const DocumentSidebar = forwardRef<DocumentSidebarRef, DocumentSidebarProps>(function DocumentSidebar(
  { currentDocId, onSelectDocument, onNewDocument, onPinnedChange, backgroundStyle },
  ref,
) {
  const [sidebarState, setSidebarState] = useState<SidebarState>({ isOpen: false, isPinned: false })
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [contextMenu, setContextMenu] = useState<{ id: string; type: "doc" | "folder"; x: number; y: number } | null>(
    null,
  )
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadSidebarState().then(setSidebarState)
    loadData()
  }, [])

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  const loadData = async () => {
    const [docs, folds] = await Promise.all([getAllDocuments(), getAllFolders()])
    setDocuments(docs.sort((a, b) => b.updatedAt - a.updatedAt))
    setFolders(folds.sort((a, b) => a.name.localeCompare(b.name)))
  }

  useImperativeHandle(ref, () => ({
    refresh: loadData,
  }))

  const toggleSidebar = () => {
    const newState = { ...sidebarState, isOpen: !sidebarState.isOpen }
    setSidebarState(newState)
    saveSidebarState(newState)
  }

  const togglePin = () => {
    const newState = { ...sidebarState, isPinned: !sidebarState.isPinned }
    setSidebarState(newState)
    saveSidebarState(newState)
    onPinnedChange?.(newState.isPinned)
  }

  const handleAddFolder = async () => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: "New Folder",
      parentId: null,
      createdAt: Date.now(),
    }
    await saveFolder(newFolder)
    await loadData()
    setEditingId(newFolder.id)
    setEditingName(newFolder.name)
  }

  const handleNewDocument = async () => {
    // If a folder is selected and expanded, create inside that folder
    const targetFolderId = selectedFolderId && expandedFolders.has(selectedFolderId) ? selectedFolderId : null

    // Auto-expand the target folder if creating inside it
    if (targetFolderId) {
      setExpandedFolders((prev) => new Set([...prev, targetFolderId]))
    }

    await onNewDocument(targetFolderId)
  }

  const handleRename = async (id: string, type: "doc" | "folder") => {
    if (!editingName.trim()) return

    if (type === "doc") {
      const doc = documents.find((d) => d.id === id)
      if (doc) {
        await saveDocument({ ...doc, title: editingName.trim(), updatedAt: Date.now() })
      }
    } else {
      const folder = folders.find((f) => f.id === id)
      if (folder) {
        await saveFolder({ ...folder, name: editingName.trim() })
      }
    }
    setEditingId(null)
    setEditingName("")
    await loadData()
  }

  const handleDelete = async (id: string, type: "doc" | "folder") => {
    if (type === "doc") {
      await deleteDocument(id)
    } else {
      // Delete folder and all documents in it
      const docsInFolder = documents.filter((d) => d.folderId === id)
      for (const doc of docsInFolder) {
        await deleteDocument(doc.id)
      }
      await deleteFolder(id)
      // Clear selected folder if it was deleted
      if (selectedFolderId === id) {
        setSelectedFolderId(null)
      }
    }
    setContextMenu(null)
    await loadData()
  }

  const handleContextMenu = (e: React.MouseEvent, id: string, type: "doc" | "folder") => {
    e.preventDefault()
    setContextMenu({ id, type, x: e.clientX, y: e.clientY })
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
        // Clear selection if collapsing the selected folder
        if (selectedFolderId === folderId) {
          setSelectedFolderId(null)
        }
      } else {
        next.add(folderId)
        // Select the folder when expanding
        setSelectedFolderId(folderId)
      }
      return next
    })
  }

  const handleFolderClick = (folderId: string) => {
    if (expandedFolders.has(folderId)) {
      // If already expanded, toggle selection
      setSelectedFolderId(selectedFolderId === folderId ? null : folderId)
    } else {
      // If collapsed, expand and select
      setExpandedFolders((prev) => new Set([...prev, folderId]))
      setSelectedFolderId(folderId)
    }
  }

  const handleDragStart = (e: React.DragEvent, docId: string) => {
    setDraggedDocId(docId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", docId)
  }

  const handleDragEnd = () => {
    setDraggedDocId(null)
    setDropTargetId(null)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (dropTargetId !== targetId) {
      setDropTargetId(targetId)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropTargetId(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault()
    const docId = e.dataTransfer.getData("text/plain")
    if (!docId) return

    const doc = documents.find((d) => d.id === docId)
    if (!doc) return

    // Don't do anything if dropping in the same folder
    if (doc.folderId === targetFolderId) {
      setDraggedDocId(null)
      setDropTargetId(null)
      return
    }

    // Update the document's folder
    await saveDocument({ ...doc, folderId: targetFolderId, updatedAt: Date.now() })
    await loadData()

    // Expand the target folder if dropping into one
    if (targetFolderId) {
      setExpandedFolders((prev) => new Set([...prev, targetFolderId]))
    }

    setDraggedDocId(null)
    setDropTargetId(null)
  }

  const rootDocuments = documents.filter((d) => !d.folderId)

  return (
    <>
      {/* Toggle button - hidden when pinned, moves with sidebar when open */}
      {!sidebarState.isPinned && (
        <button
          onClick={toggleSidebar}
          className={cn(
            "fixed top-4 z-50",
            "w-9 h-9 rounded-lg",
            "flex items-center justify-center",
            "bg-background/80 backdrop-blur-sm",
            "border border-border",
            "text-muted-foreground hover:text-foreground",
            "transition-all duration-300 ease-out",
            "hover:bg-muted",
            sidebarState.isOpen ? "left-[296px]" : "left-4",
          )}
          aria-label={sidebarState.isOpen ? "Close sidebar" : "Open sidebar"}
        >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {sidebarState.isOpen ? (
            <>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
              <path d="M14 9l-3 3 3 3" />
            </>
          ) : (
            <>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </>
          )}
        </svg>
        </button>
      )}

      {/* Backdrop for non-pinned sidebar on mobile */}
      {sidebarState.isOpen && !sidebarState.isPinned && (
        <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-30 md:hidden" onClick={toggleSidebar} />
      )}

      {/* Sidebar panel */}
      <aside
        onMouseLeave={() => {
          if (!sidebarState.isPinned && sidebarState.isOpen) {
            const newState = { ...sidebarState, isOpen: false }
            setSidebarState(newState)
            saveSidebarState(newState)
          }
        }}
        style={backgroundStyle}
        className={cn(
          "fixed left-0 top-0 h-full z-40",
          "w-72 bg-background border-r border-border",
          "flex flex-col",
          "transition-transform duration-300 ease-out",
          sidebarState.isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-border">
          <span className="text-sm font-medium text-foreground ml-10">Documents</span>
          <div className="flex items-center gap-1">
            {/* Pin button */}
            <button
              onClick={togglePin}
              className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center",
                "text-muted-foreground hover:text-foreground hover:bg-muted",
                "transition-colors",
                sidebarState.isPinned && "text-foreground bg-muted",
              )}
              title={sidebarState.isPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={sidebarState.isPinned ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 17v5" />
                <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 flex gap-2 border-b border-border">
          <button
            onClick={handleNewDocument}
            className={cn(
              "flex-1 h-9 rounded-md",
              "flex items-center justify-center gap-2",
              "bg-foreground text-background",
              "text-sm font-medium",
              "hover:opacity-90 transition-opacity",
            )}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            New
          </button>
          <button
            onClick={handleAddFolder}
            className={cn(
              "h-9 px-3 rounded-md",
              "flex items-center justify-center",
              "border border-border",
              "text-muted-foreground hover:text-foreground hover:bg-muted",
              "transition-colors",
            )}
            title="New folder"
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
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
            </svg>
          </button>
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Folders */}
          {folders.map((folder) => {
            const folderDocs = documents.filter((d) => d.folderId === folder.id)
            const isExpanded = expandedFolders.has(folder.id)
            const isDropTarget = dropTargetId === folder.id

            return (
              <div key={folder.id} className="mb-1">
                <div
                  onClick={() => handleFolderClick(folder.id)}
                  onContextMenu={(e) => handleContextMenu(e, folder.id, "folder")}
                  onDragOver={(e) => handleDragOver(e, folder.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, folder.id)}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md",
                    "text-sm",
                    "hover:bg-muted",
                    "cursor-pointer transition-colors",
                    "text-muted-foreground hover:text-foreground",
                    isDropTarget && "ring-2 ring-foreground/30 bg-muted",
                  )}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn("transition-transform", isExpanded && "rotate-90")}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFolder(folder.id)
                    }}
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
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
                    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
                  </svg>
                  {editingId === folder.id ? (
                    <input
                      ref={inputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleRename(folder.id, "folder")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(folder.id, "folder")
                        if (e.key === "Escape") {
                          setEditingId(null)
                          setEditingName("")
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-transparent border-none outline-none text-foreground"
                    />
                  ) : (
                    <span className="flex-1 truncate">{folder.name}</span>
                  )}
                  <span className="text-xs text-muted-foreground/60">{folderDocs.length}</span>
                </div>

                {/* Folder contents */}
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {folderDocs.map((doc) => (
                      <DocumentItem
                        key={doc.id}
                        doc={doc}
                        isActive={currentDocId === doc.id}
                        isEditing={editingId === doc.id}
                        editingName={editingName}
                        inputRef={inputRef}
                        onSelect={() => onSelectDocument(doc)}
                        onContextMenu={(e) => handleContextMenu(e, doc.id, "doc")}
                        onEditingChange={setEditingName}
                        onRename={() => handleRename(doc.id, "doc")}
                        onCancelEdit={() => {
                          setEditingId(null)
                          setEditingName("")
                        }}
                        onDragStart={(e) => handleDragStart(e, doc.id)}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedDocId === doc.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Root documents - also a drop zone for moving out of folders */}
          <div
            className={cn(
              "space-y-0.5 min-h-[40px] rounded-md transition-colors",
              dropTargetId === "root" && "ring-2 ring-foreground/30 bg-muted/50",
            )}
            onDragOver={(e) => handleDragOver(e, "root")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
          >
            {rootDocuments.map((doc) => (
              <DocumentItem
                key={doc.id}
                doc={doc}
                isActive={currentDocId === doc.id}
                isEditing={editingId === doc.id}
                editingName={editingName}
                inputRef={inputRef}
                onSelect={() => onSelectDocument(doc)}
                onContextMenu={(e) => handleContextMenu(e, doc.id, "doc")}
                onEditingChange={setEditingName}
                onRename={() => handleRename(doc.id, "doc")}
                onCancelEdit={() => {
                  setEditingId(null)
                  setEditingName("")
                }}
                onDragStart={(e) => handleDragStart(e, doc.id)}
                onDragEnd={handleDragEnd}
                isDragging={draggedDocId === doc.id}
              />
            ))}
          </div>

          {documents.length === 0 && folders.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">No documents yet</div>
          )}
        </div>
      </aside>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} />
          <div
            className={cn(
              "fixed z-50 min-w-[140px]",
              "bg-popover border border-border rounded-lg shadow-lg",
              "py-1 overflow-hidden",
            )}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                const item =
                  contextMenu.type === "doc"
                    ? documents.find((d) => d.id === contextMenu.id)
                    : folders.find((f) => f.id === contextMenu.id)
                if (item) {
                  setEditingId(contextMenu.id)
                  setEditingName(contextMenu.type === "doc" ? (item as Document).title : (item as Folder).name)
                }
                setContextMenu(null)
              }}
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted flex items-center gap-2"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              Rename
            </button>
            <button
              onClick={() => handleDelete(contextMenu.id, contextMenu.type)}
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted text-destructive flex items-center gap-2"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              Delete
            </button>
          </div>
        </>
      )}
    </>
  )
})

function DocumentItem({
  doc,
  isActive,
  isEditing,
  editingName,
  inputRef,
  onSelect,
  onContextMenu,
  onEditingChange,
  onRename,
  onCancelEdit,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  doc: Document
  isActive: boolean
  isEditing: boolean
  editingName: string
  inputRef: React.RefObject<HTMLInputElement | null>
  onSelect: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onEditingChange: (name: string) => void
  onRename: () => void
  onCancelEdit: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  isDragging: boolean
}) {
  return (
    <div
      draggable={!isEditing}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md",
        "text-sm transition-colors",
        isEditing ? "cursor-text" : "cursor-grab active:cursor-grabbing",
        isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        isDragging && "opacity-50",
      )}
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
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" x2="8" y1="13" y2="13" />
        <line x1="16" x2="8" y1="17" y2="17" />
        <line x1="10" x2="8" y1="9" y2="9" />
      </svg>
      {isEditing ? (
        <input
          ref={inputRef}
          value={editingName}
          onChange={(e) => onEditingChange(e.target.value)}
          onBlur={onRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") onRename()
            if (e.key === "Escape") onCancelEdit()
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent border-none outline-none text-foreground"
        />
      ) : (
        <span className="flex-1 truncate">{doc.title || "Untitled"}</span>
      )}
    </div>
  )
}
