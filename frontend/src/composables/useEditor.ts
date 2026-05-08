import { backendAdapter } from '@/adapters/backend.adapter'
import { useEditorStore } from '@/stores/editor'
import { storeToRefs } from 'pinia'

export function useEditor() {
  const store = useEditorStore()
  const { tabs, activeFile, activeTab, dirListing, wsConnected, projectSlug, previewUrl } =
    storeToRefs(store)

  async function loadProject(slug: string) {
    store.setProject(slug)
    const listing = await backendAdapter.getDirListing(slug)
    store.setDirListing(listing)
  }

  async function ensureContainer(slug: string): Promise<{ healthy: boolean; port?: number }> {
    const isDev = import.meta.env.DEV
    if (!isDev) {
      store.previewUrl = `//${slug}.${window.location.hostname.replace(/^[^.]+\./, '')}`
      return { healthy: true }
    }

    store.previewUrl = ''
    let health = await backendAdapter.getProjectHealth(slug)

    // Auto-start container if not running
    if (!health.healthy) {
      await backendAdapter.restartProject(slug)
    }

    // Poll until healthy (max ~30s)
    for (let i = 0; i < 15; i++) {
      health = await backendAdapter.getProjectHealth(slug)
      if (health.healthy) {
        if (health.port) {
          store.previewUrl = `//localhost:${health.port}`
        }
        return health
      }
      await new Promise((r) => setTimeout(r, 2500))
    }

    return health
  }

  async function openFile(filename: string) {
    const existing = store.tabs.find((t) => t.filename === filename)
    if (existing) {
      store.activeFile = filename
      return
    }
    const res = await backendAdapter.getFileContent(store.projectSlug, filename)
    const content = await res.text()
    store.openFile(filename, content)
  }

  function closeFile(filename: string) {
    store.closeTab(filename)
  }

  async function createFile(filename: string) {
    await backendAdapter.createFile(store.projectSlug, filename)
    store.addFileToTree(filename)
    await openFile(filename)
  }

  async function deleteFile(filename: string) {
    await backendAdapter.deleteFile(store.projectSlug, filename)
    store.removeFileFromTree(filename)
  }

  async function renameFile(oldPath: string, newPath: string) {
    await backendAdapter.renameFile(store.projectSlug, oldPath, newPath)
    store.removeFileFromTree(oldPath)
    store.addFileToTree(newPath)
  }

  async function syncFile(filename: string, changes: string) {
    await backendAdapter.syncFile(store.projectSlug, filename, changes)
    store.markClean(filename)
  }

  async function formatFile(filename: string) {
    const result = await backendAdapter.formatFile(store.projectSlug, filename)
    if (result.content != null) {
      // Update editor with formatted content directly
      store.openFile(filename, result.content)
      store.markClean(filename)
    }
    return result
  }

  async function uploadFile(filename: string, data: ArrayBuffer | Blob) {
    await backendAdapter.uploadFile(store.projectSlug, filename, data)
    store.addFileToTree(filename)
  }

  return {
    tabs,
    activeFile,
    activeTab,
    dirListing,
    wsConnected,
    projectSlug,
    previewUrl,
    loadProject,
    ensureContainer,
    openFile,
    closeFile,
    createFile,
    deleteFile,
    renameFile,
    syncFile,
    formatFile,
    uploadFile,
    updateContent: store.updateContent,
  }
}
