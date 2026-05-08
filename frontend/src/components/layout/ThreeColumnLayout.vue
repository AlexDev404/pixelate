<script setup lang="ts">
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

withDefaults(defineProps<{
  leftSize?: number
  rightSize?: number
  minSize?: number
}>(), {
  leftSize: 15,
  rightSize: 30,
  minSize: 10,
})
</script>

<template>
  <ResizablePanelGroup direction="horizontal" class="h-full">
    <ResizablePanel :default-size="leftSize" :min-size="minSize">
      <slot name="left" />
    </ResizablePanel>

    <ResizableHandle with-handle />

    <ResizablePanel :min-size="20">
      <slot name="center" />
    </ResizablePanel>

    <ResizableHandle with-handle />

    <ResizablePanel :default-size="rightSize" :min-size="minSize">
      <slot name="right" />
    </ResizablePanel>
  </ResizablePanelGroup>
</template>
