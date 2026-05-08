<script setup lang="ts">
import { ref } from 'vue'
import type { Project } from '@pixelate/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { backendAdapter } from '@/adapters/backend.adapter'
import { useRouter } from 'vue-router'

const props = defineProps<{
  starters: Project[]
}>()

const router = useRouter()
const selectedStarter = ref<string | null>(null)
const newName = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function create() {
  if (!selectedStarter.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    const result = await backendAdapter.createFromStarter(selectedStarter.value, newName.value || undefined)
    router.push(`/editor/${result.slug}`)
  } catch (e: any) {
    errorMsg.value = e.message || 'Failed to create project'
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
        <Alert v-if="errorMsg" variant="destructive">
          <AlertDescription>{{ errorMsg }}</AlertDescription>
        </Alert>
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
