<script setup lang="ts">
import { ref } from 'vue'
import type { Project } from '@pixelate/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProjects } from '@/composables/useProjects'
import { useRouter } from 'vue-router'

const props = defineProps<{
  starters: Project[]
}>()

const { remixProject } = useProjects()
const router = useRouter()
const selectedStarter = ref<string | null>(null)
const newName = ref('')
const loading = ref(false)

async function create() {
  if (!selectedStarter.value) return
  loading.value = true
  try {
    await remixProject(selectedStarter.value, newName.value || undefined)
    const slug = newName.value || selectedStarter.value
    router.push(`/editor/${slug}`)
  } catch {
    // Handle error
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Create a New Project</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="space-y-4">
        <div class="space-y-2">
          <Label>Choose a starter template</Label>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button
              v-for="starter in starters"
              :key="starter.slug"
              :variant="selectedStarter === starter.slug ? 'default' : 'outline'"
              size="sm"
              @click="selectedStarter = starter.slug"
            >
              {{ starter.name }}
            </Button>
          </div>
        </div>
        <div class="space-y-2">
          <Label for="projectName">Project name (optional)</Label>
          <Input id="projectName" v-model="newName" placeholder="my-project" />
        </div>
        <Button @click="create" :disabled="!selectedStarter || loading" class="w-full">
          {{ loading ? 'Creating...' : 'Create Project' }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
