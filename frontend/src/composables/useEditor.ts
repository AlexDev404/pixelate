import { useEditorStore } from '@/stores/editor'
import { backendAdapter } from '@/adapters/backend.adapter'
import { storeToRefs } from 'pinia'

export function useEditor() {
  const store = useEditorStore()
  const { tabs, activeFile, activeTab, dirListing, wsConnected, projectSlug, previewUrl } =
    storeToRefs(store)

  async function loadProject(slug: string) {
    store.setProject(slug)
    const listing = await backendAdapter.getDirListing(slug)
    store.setDirListing(listing)
    store.previewUrl = `/api/projects/${slug}/preview/`
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
    if (result.formatted) {
      // Reload file content
      const res = await backendAdapter.getFileContent(store.projectSlug, filename)
      const content = await res.text()
      store.openFile(filename, content)
      store.markClean(filename)
    }
    return result
  }

  async function uploadFile(filename: string, formData: FormData) {
    await backendAdapter.uploadFile(store.projectSlug, filename, formData)
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
