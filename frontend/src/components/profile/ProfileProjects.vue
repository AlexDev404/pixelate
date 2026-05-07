<script setup lang="ts">
import type { Project } from '@pixelate/types'
import ProjectList from '@/components/projects/ProjectList.vue'

defineProps<{
  projects: Project[]
}>()
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold mb-4">Projects</h3>
    <ProjectList v-if="projects.length > 0" :projects="projects" />
    <p v-else class="text-muted-foreground">No projects yet.</p>
  </div>
</template>
