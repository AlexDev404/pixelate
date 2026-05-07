<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-vue-next'

interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'log'
  message: string
}

const logs = ref<LogEntry[]>([])
const containerRef = ref<HTMLDivElement>()
const autoScroll = ref(true)

function addLog(level: LogEntry['level'], message: string) {
  logs.value.push({
    timestamp: new Date().toLocaleTimeString(),
    level,
    message,
  })
  if (autoScroll.value) {
    nextTick(() => {
      if (containerRef.value) {
        containerRef.value.scrollTop = containerRef.value.scrollHeight
      }
    })
  }
}

function clear() {
  logs.value = []
}

function getLevelColor(level: LogEntry['level']) {
  switch (level) {
    case 'error': return 'text-red-500'
    case 'warn': return 'text-yellow-500'
    case 'info': return 'text-blue-500'
    default: return 'text-foreground'
  }
}

defineExpose({ addLog, clear })
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center justify-between border-b px-3 py-1.5">
      <span class="text-xs font-semibold uppercase text-muted-foreground">Console</span>
      <Button variant="ghost" size="icon" class="h-6 w-6" @click="clear">
        <Trash2 class="h-3.5 w-3.5" />
      </Button>
    </div>
    <div ref="containerRef" class="flex-1 overflow-auto p-2 font-mono text-xs">
      <div
        v-for="(log, i) in logs"
        :key="i"
        class="flex gap-2 py-0.5"
      >
        <span class="text-muted-foreground shrink-0">{{ log.timestamp }}</span>
        <span :class="getLevelColor(log.level)" class="shrink-0 uppercase w-12">{{ log.level }}</span>
        <span class="break-all">{{ log.message }}</span>
      </div>
      <div v-if="logs.length === 0" class="text-muted-foreground italic">
        No output yet
      </div>
    </div>
  </div>
</template>
