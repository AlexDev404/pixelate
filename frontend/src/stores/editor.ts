import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DirListing } from '@pixelate/types'

export interface EditorTab {
  filename: string
  content: string
  dirty: boolean
}

export const useEditorStore = defineStore('editor', () => {
  const projectSlug = ref<string>('')
  const tabs = ref<EditorTab[]>([])
  const activeFile = ref<string | null>(null)
  const dirListing = ref<DirListing>({ dirs: [], files: [] })
  const wsConnected = ref(false)
  const previewUrl = ref<string>('')
  const uploading = ref(false)

  const activeTab = computed(() =>
    tabs.value.find((t) => t.filename === activeFile.value) || null
  )

  function openFile(filename: string, content: string) {
    const existing = tabs.value.find((t) => t.filename === filename)
    if (!existing) {
      tabs.value.push({ filename, content, dirty: false })
    } else {
      existing.content = content
    }
    activeFile.value = filename
  }

  function closeTab(filename: string) {
    const idx = tabs.value.findIndex((t) => t.filename === filename)
    if (idx === -1) return
    tabs.value.splice(idx, 1)
    if (activeFile.value === filename) {
      activeFile.value = tabs.value.length > 0
        ? tabs.value[Math.min(idx, tabs.value.length - 1)].filename
        : null
    }
  }

  function updateContent(filename: string, content: string) {
    const tab = tabs.value.find((t) => t.filename === filename)
    if (tab) {
      tab.content = content
      tab.dirty = true
    }
  }

  function markClean(filename: string) {
    const tab = tabs.value.find((t) => t.filename === filename)
    if (tab) tab.dirty = false
  }

  function setProject(slug: string) {
    projectSlug.value = slug
    tabs.value = []
    activeFile.value = null
    dirListing.value = { dirs: [], files: [] }
  }

  function setDirListing(listing: DirListing) {
    dirListing.value = listing
  }

  function removeFileFromTree(filename: string) {
    dirListing.value.files = dirListing.value.files.filter((f) => f !== filename)
    closeTab(filename)
  }

  function addFileToTree(filename: string) {
    if (!dirListing.value.files.includes(filename)) {
      dirListing.value.files.push(filename)
      dirListing.value.files.sort()
    }
  }

  return {
    projectSlug,
    tabs,
    activeFile,
    activeTab,
    dirListing,
    wsConnected,
    previewUrl,
    uploading,
    openFile,
    closeTab,
    updateContent,
    markClean,
    setProject,
    setDirListing,
    removeFileFromTree,
    addFileToTree,
  }
})
