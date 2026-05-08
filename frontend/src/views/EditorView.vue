<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useEditor } from '@/composables/useEditor'
import { useWebSocket } from '@/composables/useWebSocket'
import ThreeColumnLayout from '@/components/layout/ThreeColumnLayout.vue'
import FileTree from '@/components/editor/FileTree.vue'
import EditorPane from '@/components/editor/EditorPane.vue'
import PreviewPane from '@/components/editor/PreviewPane.vue'
import LogViewer from '@/components/editor/LogViewer.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff } from 'lucide-vue-next'

const route = useRoute()
const projectSlug = route.params.project as string

const {
  dirListing,
  activeFile,
  previewUrl,
  wsConnected,
  loadProject,
  openFile,
  createFile,
  deleteFile,
  renameFile,
  uploadFile,
} = useEditor()

const logViewer = ref<InstanceType<typeof LogViewer>>()
const previewPane = ref<InstanceType<typeof PreviewPane>>()

const { connected, connect, send, on } = useWebSocket(projectSlug)

onMounted(async () => {
  await loadProject(projectSlug)
  connect()

  on('file-tree:update', (detail) => {
    const path = detail.path as string
    if (path) {
      // Refresh the file if it's currently open
      openFile(path)
    }
  })
})

function handleSelectFile(filename: string) {
  openFile(filename)
}

function handleCreateFile(filename: string) {
  createFile(filename)
  send('create', { path: filename, isFile: true })
}

function handleDeleteFile(filename: string) {
  if (!confirm(`Delete ${filename}?`)) return
  deleteFile(filename)
  send('delete', { path: filename })
}

function handleRenameFile(oldPath: string, newPath: string) {
  renameFile(oldPath, newPath)
  send('move', { isFile: true, oldPath, newPath })
}

function handleUploadFile(filename: string, formData: FormData) {
  uploadFile(filename, formData)
}
</script>

<template>
  <div class="h-[calc(100vh-3.5rem)] flex flex-col">
    <!-- Status bar -->
    <div class="flex items-center justify-between border-b px-4 py-1 text-xs bg-muted/30">
      <span class="font-medium">{{ projectSlug }}</span>
      <div class="flex items-center gap-2">
        <Badge v-if="connected" variant="default" class="gap-1 text-xs py-0">
          <Wifi class="h-3 w-3" /> Connected
        </Badge>
        <Badge v-else variant="secondary" class="gap-1 text-xs py-0">
          <WifiOff class="h-3 w-3" /> Disconnected
        </Badge>
      </div>
    </div>

    <!-- Main editor layout -->
    <ThreeColumnLayout class="flex-1 min-h-0">
      <template #left>
        <FileTree
          :dir-listing="dirListing"
          :active-file="activeFile"
          @select-file="handleSelectFile"
          @create-file="handleCreateFile"
          @delete-file="handleDeleteFile"
          @rename-file="handleRenameFile"
          @upload-file="handleUploadFile"
        />
      </template>

      <template #center>
        <div class="flex h-full flex-col">
          <div class="flex-1 min-h-0">
            <EditorPane @saved="previewPane?.refreshAfterSave()" />
          </div>
          <div class="h-48 border-t">
            <LogViewer ref="logViewer" />
          </div>
        </div>
      </template>

      <template #right>
        <Tabs default-value="preview" class="h-full flex flex-col">
          <TabsList class="w-full rounded-none border-b">
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" class="flex-1 min-h-0 mt-0">
            <PreviewPane ref="previewPane" :url="previewUrl" />
          </TabsContent>
        </Tabs>
      </template>
    </ThreeColumnLayout>
  </div>
</template>
