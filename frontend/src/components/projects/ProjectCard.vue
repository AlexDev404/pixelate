<script setup lang="ts">
import type { Project } from '@pixelate/types'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Code2, Trash2, Download, GitFork } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const props = defineProps<{
  project: Project
  showActions?: boolean
  isStarter?: boolean
}>()

const emit = defineEmits<{
  delete: [slug: string]
  remix: [slug: string]
  download: [slug: string]
}>()

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString()
}
</script>

<template>
  <Card class="flex flex-col hover:shadow-md transition-shadow">
    <CardHeader class="flex-1">
      <div class="flex items-center justify-between">
        <CardTitle class="text-lg">
          <RouterLink :to="`/editor/${project.slug}`" class="hover:underline flex items-center gap-2">
            <Code2 class="h-4 w-4 text-muted-foreground" />
            {{ project.name }}
          </RouterLink>
        </CardTitle>
        <Badge v-if="isStarter" variant="secondary">Starter</Badge>
      </div>
      <CardDescription v-if="project.description">{{ project.description }}</CardDescription>
      <CardDescription>{{ formatDate(project.updated_at || project.created_at) }}</CardDescription>
    </CardHeader>
    <CardFooter v-if="showActions" class="gap-2">
      <Button variant="ghost" size="icon" @click="emit('remix', project.slug)" title="Remix">
        <GitFork class="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" @click="emit('download', project.slug)" title="Download">
        <Download class="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" @click="emit('delete', project.slug)" title="Delete" class="text-destructive hover:text-destructive">
        <Trash2 class="h-4 w-4" />
      </Button>
    </CardFooter>
  </Card>
</template>
