<script setup lang="ts">
import CodeMirrorEditor from './CodeMirrorEditor.vue'
import EditorTabs from './EditorTabs.vue'
import { useEditor } from '@/composables/useEditor'

const { tabs, activeFile, activeTab, openFile, closeFile, updateContent, syncFile } = useEditor()

const emit = defineEmits<{
  saved: []
}>()

function onSelect(filename: string) {
  openFile(filename)
}

function onClose(filename: string) {
  closeFile(filename)
}

function onChange(value: string) {
  if (activeFile.value) {
    syncFile(activeFile.value, value)
  }
}

function onSave() {
  if (activeFile.value && activeTab.value) {
    syncFile(activeFile.value, activeTab.value.content)
    emit('saved')
  }
}

function onUpdate(value: string) {
  if (activeFile.value) {
    updateContent(activeFile.value, value)
  }
}
</script>

<template>
  <div class="flex h-full flex-col">
    <EditorTabs :tabs="tabs" :active-file="activeFile" @select="onSelect" @close="onClose" />
    <div class="flex-1 min-h-0">
      <template v-if="activeTab">
        <CodeMirrorEditor
          :key="activeTab.filename"
          :model-value="activeTab.content"
          :filename="activeTab.filename"
          @update:model-value="onUpdate"
          @change="onChange"
          @save="onSave"
        />
      </template>
      <div v-else class="flex h-full items-center justify-center text-muted-foreground">
        <p>Open a file to start editing</p>
      </div>
    </div>
  </div>
</template>
