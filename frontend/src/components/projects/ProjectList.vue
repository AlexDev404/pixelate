<script setup lang="ts">
import type { Project } from '@pixelate/types'
import ProjectCard from './ProjectCard.vue'

const props = defineProps<{
  projects: Project[]
  showActions?: boolean
  isStarter?: boolean
}>()

const emit = defineEmits<{
  delete: [slug: string]
  remix: [slug: string]
  download: [slug: string]
}>()
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <ProjectCard
      v-for="project in projects"
      :key="project.id"
      :project="project"
      :show-actions="showActions"
      :is-starter="isStarter"
      @delete="emit('delete', $event)"
      @remix="emit('remix', $event)"
      @download="emit('download', $event)"
    />
  </div>
</template>
