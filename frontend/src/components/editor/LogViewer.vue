<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Trash2, RefreshCw } from 'lucide-vue-next'
import { backendAdapter } from '@/adapters/backend.adapter'

const props = defineProps<{
  projectSlug: string
}>()

const logs = ref('')
const containerRef = ref<HTMLDivElement>()
const autoScroll = ref(true)
let pollTimer: ReturnType<typeof setInterval> | null = null
let lastFetch = ''

async function fetchLogs() {
  try {
    const result = await backendAdapter.getProjectLogs(props.projectSlug, lastFetch || undefined)
    if (result.logs) {
      if (lastFetch) {
        // Append new logs
        const newContent = result.logs.trim()
        if (newContent) {
          logs.value += (logs.value ? '\n' : '') + newContent
        }
      } else {
        logs.value = result.logs.trim()
      }
      lastFetch = new Date().toISOString()
      if (autoScroll.value) {
        nextTick(() => {
          if (containerRef.value) {
            containerRef.value.scrollTop = containerRef.value.scrollHeight
          }
        })
      }
    }
  } catch {
    // Container might not be running yet
  }
}

function clear() {
  logs.value = ''
}

onMounted(() => {
  fetchLogs()
  pollTimer = setInterval(fetchLogs, 3000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center justify-between border-b px-3 py-1.5">
      <span class="text-xs font-semibold uppercase text-muted-foreground">Logs</span>
      <div class="flex items-center gap-1">
        <Button variant="ghost" size="icon" class="h-6 w-6" @click="fetchLogs" title="Refresh">
          <RefreshCw class="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" class="h-6 w-6" @click="clear" title="Clear">
          <Trash2 class="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
    <div ref="containerRef" class="flex-1 overflow-auto p-2 font-mono text-xs whitespace-pre-wrap break-all bg-[#1e1e2e] text-[#cdd6f4]">
      <template v-if="logs">{{ logs }}</template>
      <span v-else class="text-muted-foreground italic">No output yet</span>
    </div>
  </div>
</template>
