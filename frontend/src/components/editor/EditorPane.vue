<script setup lang="ts">
import { useEditor } from "@/composables/useEditor";
import { computed } from "vue";
import CodeMirrorEditor from "./CodeMirrorEditor.vue";
import EditorTabs from "./EditorTabs.vue";

const {
  tabs,
  activeFile,
  activeTab,
  projectSlug,
  openFile,
  closeFile,
  updateContent,
  syncFile,
} = useEditor();

const emit = defineEmits<{
  saved: [];
}>();

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "webp",
  "ico",
  "bmp",
  "avif",
]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "ogg", "avi", "mov", "mkv"]);

const isVideoFile = computed(() => {
  if (!activeFile.value) return false;
  const ext = activeFile.value.split(".").pop()?.toLowerCase() || "";
  return VIDEO_EXTENSIONS.has(ext);
});

const isImageFile = computed(() => {
  if (!activeFile.value) return false;
  const ext = activeFile.value.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTENSIONS.has(ext);
});

const fileUrl = computed(() => {
  if (!activeFile.value || !projectSlug.value) return "";
  return `/api/v1/files/content/${projectSlug.value}/${activeFile.value}`;
});

function onSelect(filename: string) {
  openFile(filename);
}

function onClose(filename: string) {
  closeFile(filename);
}

function onChange(value: string) {
  if (activeFile.value) {
    syncFile(activeFile.value, value);
  }
}

function onSave() {
  if (activeFile.value && activeTab.value) {
    syncFile(activeFile.value, activeTab.value.content);
    emit("saved");
  }
}

function onUpdate(value: string) {
  if (activeFile.value) {
    updateContent(activeFile.value, value);
  }
}
</script>

<template>
  <div class="flex h-full flex-col">
    <EditorTabs
      :tabs="tabs"
      :active-file="activeFile"
      @select="onSelect"
      @close="onClose"
    />
    <div class="flex-1 min-h-0">
      <template v-if="activeTab">
        <div
          v-if="isImageFile"
          class="flex h-full items-center justify-center bg-muted/20 p-4"
        >
          <img
            :src="fileUrl"
            :alt="activeTab.filename"
            class="max-h-full max-w-full object-contain rounded shadow-sm"
          />
        </div>
        <div
          v-if="isVideoFile"
          class="flex h-full items-center justify-center bg-muted/20 p-4"
        >
          <video controls class="max-h-full max-w-full rounded shadow-sm">
            <source
              :src="fileUrl"
              :type="`video/${activeTab.filename.split('.').pop()?.toLowerCase()}`"
            />
            Your browser does not support the video tag.
          </video>
        </div>
        <CodeMirrorEditor
          v-else
          :key="activeTab.filename"
          :model-value="activeTab.content"
          :filename="activeTab.filename"
          @update:model-value="onUpdate"
          @change="onChange"
          @save="onSave"
        />
      </template>
      <div
        v-else
        class="flex h-full items-center justify-center text-muted-foreground"
      >
        <p>Open a file to start editing</p>
      </div>
    </div>
  </div>
</template>
