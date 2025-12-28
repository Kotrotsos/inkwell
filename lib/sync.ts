import {
  type Document,
  type Folder,
  getAllDocuments,
  getAllFolders,
  saveDocument,
  saveFolder,
  markDocumentSynced,
  markFolderSynced,
  getPendingDocuments,
  getPendingFolders,
  clearAllData,
} from './documents-db'

interface ServerDocument {
  id: string
  title: string
  content: string
  folderId: string | null
  createdAt: string
  updatedAt: string
  localId: string | null
}

interface ServerFolder {
  id: string
  name: string
  parentId: string | null
  createdAt: string
  localId: string | null
}

export async function syncFromServer(): Promise<void> {
  try {
    const [docsResponse, foldersResponse] = await Promise.all([
      fetch('/api/documents'),
      fetch('/api/folders'),
    ])

    if (!docsResponse.ok || !foldersResponse.ok) {
      throw new Error('Failed to fetch from server')
    }

    const serverDocs: ServerDocument[] = await docsResponse.json()
    const serverFolders: ServerFolder[] = await foldersResponse.json()

    const localDocs = await getAllDocuments()
    const localFolders = await getAllFolders()

    const localDocMap = new Map(localDocs.map(d => [d.serverId || d.id, d]))
    const localFolderMap = new Map(localFolders.map(f => [f.serverId || f.id, f]))

    for (const serverFolder of serverFolders) {
      const localFolder = localFolderMap.get(serverFolder.id)

      if (!localFolder) {
        await saveFolder({
          id: serverFolder.localId || `server-${serverFolder.id}`,
          name: serverFolder.name,
          parentId: serverFolder.parentId,
          createdAt: new Date(serverFolder.createdAt).getTime(),
          serverId: serverFolder.id,
          syncStatus: 'synced',
          lastSyncedAt: Date.now(),
        })
      } else if (localFolder.syncStatus !== 'pending') {
        await saveFolder({
          ...localFolder,
          name: serverFolder.name,
          parentId: serverFolder.parentId,
          serverId: serverFolder.id,
          syncStatus: 'synced',
          lastSyncedAt: Date.now(),
        })
      }
    }

    for (const serverDoc of serverDocs) {
      const localDoc = localDocMap.get(serverDoc.id)

      if (!localDoc) {
        await saveDocument({
          id: serverDoc.localId || `server-${serverDoc.id}`,
          title: serverDoc.title,
          content: serverDoc.content,
          folderId: serverDoc.folderId,
          createdAt: new Date(serverDoc.createdAt).getTime(),
          updatedAt: new Date(serverDoc.updatedAt).getTime(),
          serverId: serverDoc.id,
          syncStatus: 'synced',
          lastSyncedAt: Date.now(),
        })
      } else if (localDoc.syncStatus !== 'pending') {
        const serverUpdated = new Date(serverDoc.updatedAt).getTime()
        if (serverUpdated > (localDoc.lastSyncedAt || 0)) {
          await saveDocument({
            ...localDoc,
            title: serverDoc.title,
            content: serverDoc.content,
            folderId: serverDoc.folderId,
            serverId: serverDoc.id,
            syncStatus: 'synced',
            lastSyncedAt: Date.now(),
          })
        }
      }
    }
  } catch (error) {
    console.error('Sync from server failed:', error)
    throw error
  }
}

export async function syncToServer(): Promise<void> {
  try {
    const pendingFolders = await getPendingFolders()
    for (const folder of pendingFolders) {
      if (folder.serverId) {
        const response = await fetch(`/api/folders/${folder.serverId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: folder.name,
            parentId: folder.parentId,
          }),
        })
        if (response.ok) {
          await markFolderSynced(folder.id, folder.serverId)
        }
      } else {
        const response = await fetch('/api/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: folder.name,
            parentId: folder.parentId,
            localId: folder.id,
          }),
        })
        if (response.ok) {
          const serverFolder = await response.json()
          await markFolderSynced(folder.id, serverFolder.id)
        }
      }
    }

    const pendingDocs = await getPendingDocuments()
    for (const doc of pendingDocs) {
      if (doc.serverId) {
        const response = await fetch(`/api/documents/${doc.serverId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: doc.title,
            content: doc.content,
            folderId: doc.folderId,
          }),
        })
        if (response.ok) {
          await markDocumentSynced(doc.id, doc.serverId)
        }
      } else {
        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: doc.title,
            content: doc.content,
            folderId: doc.folderId,
            localId: doc.id,
          }),
        })
        if (response.ok) {
          const serverDoc = await response.json()
          await markDocumentSynced(doc.id, serverDoc.id)
        }
      }
    }
  } catch (error) {
    console.error('Sync to server failed:', error)
    throw error
  }
}

export async function fullSync(): Promise<void> {
  await syncToServer()
  await syncFromServer()
}

export async function onLogout(): Promise<void> {
  await clearAllData()
}

export async function onLogin(): Promise<void> {
  await syncFromServer()
  await syncToServer()
}
