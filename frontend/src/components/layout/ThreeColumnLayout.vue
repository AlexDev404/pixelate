<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  leftWidth?: number
  rightWidth?: number
  minWidth?: number
}>(), {
  leftWidth: 250,
  rightWidth: 400,
  minWidth: 150,
})

const leftW = ref(props.leftWidth)
const rightW = ref(props.rightWidth)
const dragging = ref<'left' | 'right' | null>(null)

function startDrag(side: 'left' | 'right') {
  dragging.value = side
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e: MouseEvent) {
  if (dragging.value === 'left') {
    leftW.value = Math.max(props.minWidth, e.clientX)
  } else if (dragging.value === 'right') {
    rightW.value = Math.max(props.minWidth, window.innerWidth - e.clientX)
  }
}

function stopDrag() {
  dragging.value = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}
</script>

<template>
  <div class="flex h-full overflow-hidden" :class="{ 'select-none': dragging }">
    <div class="shrink-0 overflow-hidden border-r" :style="{ width: `${leftW}px` }">
      <slot name="left" />
    </div>

    <div
      class="w-1 cursor-col-resize bg-border hover:bg-primary/20 transition-colors"
      @mousedown.prevent="startDrag('left')"
    />

    <div class="flex-1 min-w-0 overflow-hidden">
      <slot name="center" />
    </div>

    <div
      class="w-1 cursor-col-resize bg-border hover:bg-primary/20 transition-colors"
      @mousedown.prevent="startDrag('right')"
    />

    <div class="shrink-0 overflow-hidden border-l" :style="{ width: `${rightW}px` }">
      <slot name="right" />
    </div>
  </div>
</template>
