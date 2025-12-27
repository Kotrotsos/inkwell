export interface EditorSettings {
  fontFamily: "serif" | "sans" | "mono"
  fontSize: "small" | "medium" | "large"
  lineHeight: "compact" | "normal" | "relaxed"
  theme: "light" | "dark" | "system"
  contentWidth: "default" | "wide" | "full"
  backgroundColor: "default" | "gray" | "warm" | "cool"
}

export const defaultSettings: EditorSettings = {
  fontFamily: "serif",
  fontSize: "medium",
  lineHeight: "normal",
  theme: "system",
  contentWidth: "default",
  backgroundColor: "gray",
}

const DB_NAME = "inkwell-settings"
const STORE_NAME = "settings"
const SETTINGS_KEY = "editor-settings"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export async function saveSettings(settings: EditorSettings): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(settings, SETTINGS_KEY)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function loadSettings(): Promise<EditorSettings> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(SETTINGS_KEY)

      request.onerror = () => resolve(defaultSettings)
      request.onsuccess = () => {
        resolve(request.result || defaultSettings)
      }
    })
  } catch {
    return defaultSettings
  }
}
