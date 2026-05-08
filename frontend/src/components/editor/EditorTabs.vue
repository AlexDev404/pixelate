<script setup lang="ts">
import type { EditorTab } from '@/stores/editor'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, FileCode } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

defineProps<{
  tabs: EditorTab[]
  activeFile: string | null
}>()

const emit = defineEmits<{
  select: [filename: string]
  close: [filename: string]
}>()

function basename(path: string) {
  return path.split('/').pop() || path
}
</script>

<template>
  <ScrollArea class="w-full">
    <div class="flex h-9 items-center border-b bg-muted/40">
      <div
        v-for="tab in tabs"
        :key="tab.filename"
        :class="cn(
          'group flex h-full items-center gap-1.5 border-r px-3 text-sm transition-colors cursor-pointer',
          tab.filename === activeFile
            ? 'bg-background text-foreground'
            : 'text-muted-foreground hover:bg-background/50'
        )"
        @click="emit('select', tab.filename)"
      >
        <FileCode class="h-3.5 w-3.5 shrink-0" />
        <span class="max-w-32 truncate">{{ basename(tab.filename) }}</span>
        <span v-if="tab.dirty" class="h-2 w-2 rounded-full bg-orange-400" />
        <button
          class="ml-1 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted p-0.5"
          @click.stop="emit('close', tab.filename)"
        >
          <X class="h-3 w-3" />
        </button>
      </div>
    </div>
  </ScrollArea>
</template>
