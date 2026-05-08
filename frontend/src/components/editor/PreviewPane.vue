<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { RefreshCw, ExternalLink } from 'lucide-vue-next'

const props = defineProps<{
  url: string
}>()

const iframeRef = ref<HTMLIFrameElement>()
const iframeKey = ref(0)
let saveRefreshTimer: ReturnType<typeof setTimeout> | null = null

function refresh() {
  iframeKey.value++
}

function refreshAfterSave() {
  if (saveRefreshTimer) clearTimeout(saveRefreshTimer)
  saveRefreshTimer = setTimeout(() => {
    refresh()
  }, 2000)
}

function openExternal() {
  window.open(props.url, '_blank')
}

watch(() => props.url, () => {
  iframeKey.value++
})

onUnmounted(() => {
  if (saveRefreshTimer) clearTimeout(saveRefreshTimer)
})

defineExpose({ refreshAfterSave })
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center justify-between border-b px-3 py-1.5">
      <span class="text-xs font-semibold uppercase text-muted-foreground">Preview</span>
      <div class="flex items-center gap-1">
        <Button variant="ghost" size="icon" class="h-6 w-6" @click="refresh">
          <RefreshCw class="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" class="h-6 w-6" @click="openExternal">
          <ExternalLink class="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
    <div class="flex-1">
      <iframe
        :key="iframeKey"
        ref="iframeRef"
        :src="url"
        class="h-full w-full border-0 bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  </div>
</template>
