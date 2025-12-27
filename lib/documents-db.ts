export interface Document {
  id: string
  title: string
  content: string
  folderId: string | null
  createdAt: number
  updatedAt: number
}

export interface Folder {
  id: string
  name: string
  parentId: string | null
  createdAt: number
}

export interface SidebarState {
  isOpen: boolean
  isPinned: boolean
}

const DB_NAME = "inkwell-documents"
const DB_VERSION = 1
const DOCUMENTS_STORE = "documents"
const FOLDERS_STORE = "folders"
const SIDEBAR_STORE = "sidebar"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(DOCUMENTS_STORE)) {
        db.createObjectStore(DOCUMENTS_STORE, { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains(FOLDERS_STORE)) {
        db.createObjectStore(FOLDERS_STORE, { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains(SIDEBAR_STORE)) {
        db.createObjectStore(SIDEBAR_STORE)
      }
    }
  })
}

// Documents
export async function saveDocument(doc: Document): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOCUMENTS_STORE, "readwrite")
    const store = tx.objectStore(DOCUMENTS_STORE)
    const request = store.put(doc)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getDocument(id: string): Promise<Document | null> {
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction(DOCUMENTS_STORE, "readonly")
    const store = tx.objectStore(DOCUMENTS_STORE)
    const request = store.get(id)
    request.onerror = () => resolve(null)
    request.onsuccess = () => resolve(request.result || null)
  })
}

export async function getAllDocuments(): Promise<Document[]> {
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction(DOCUMENTS_STORE, "readonly")
    const store = tx.objectStore(DOCUMENTS_STORE)
    const request = store.getAll()
    request.onerror = () => resolve([])
    request.onsuccess = () => resolve(request.result || [])
  })
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOCUMENTS_STORE, "readwrite")
    const store = tx.objectStore(DOCUMENTS_STORE)
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// Folders
export async function saveFolder(folder: Folder): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FOLDERS_STORE, "readwrite")
    const store = tx.objectStore(FOLDERS_STORE)
    const request = store.put(folder)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getAllFolders(): Promise<Folder[]> {
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction(FOLDERS_STORE, "readonly")
    const store = tx.objectStore(FOLDERS_STORE)
    const request = store.getAll()
    request.onerror = () => resolve([])
    request.onsuccess = () => resolve(request.result || [])
  })
}

export async function deleteFolder(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FOLDERS_STORE, "readwrite")
    const store = tx.objectStore(FOLDERS_STORE)
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// Sidebar state
export async function saveSidebarState(state: SidebarState): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SIDEBAR_STORE, "readwrite")
    const store = tx.objectStore(SIDEBAR_STORE)
    const request = store.put(state, "state")
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function loadSidebarState(): Promise<SidebarState> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(SIDEBAR_STORE, "readonly")
      const store = tx.objectStore(SIDEBAR_STORE)
      const request = store.get("state")
      request.onerror = () => resolve({ isOpen: false, isPinned: false })
      request.onsuccess = () => resolve(request.result || { isOpen: false, isPinned: false })
    })
  } catch {
    return { isOpen: false, isPinned: false }
  }
}
