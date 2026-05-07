<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Project, ProjectSettings } from '@pixelate/types'
import { backendAdapter } from '@/adapters/backend.adapter'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const props = defineProps<{
  open: boolean
  project: Project
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

const settings = ref<ProjectSettings | null>(null)
const loading = ref(false)
const defaultFile = ref('')
const runScript = ref('')
const envVars = ref('')

onMounted(async () => {
  try {
    settings.value = await backendAdapter.getProjectSettings(props.project.id)
    defaultFile.value = settings.value.default_file || ''
    runScript.value = settings.value.run_script || ''
    envVars.value = settings.value.env_vars || ''
  } catch {
    // Project might not have settings yet
  }
})

async function save() {
  loading.value = true
  try {
    await backendAdapter.updateProjectSettings(props.project.id, {
      default_file: defaultFile.value || null,
      run_script: runScript.value || null,
      env_vars: envVars.value || null,
    })
    emit('saved')
    emit('update:open', false)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Project Settings — {{ project.name }}</DialogTitle>
        <DialogDescription>Configure project behavior and environment.</DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="defaultFile">Default file</Label>
          <Input id="defaultFile" v-model="defaultFile" placeholder="index.html" />
        </div>
        <div class="space-y-2">
          <Label for="runScript">Run script</Label>
          <Input id="runScript" v-model="runScript" placeholder="npm start" />
        </div>
        <div class="space-y-2">
          <Label for="envVars">Environment variables</Label>
          <Input id="envVars" v-model="envVars" placeholder="KEY=value" />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">Cancel</Button>
        <Button @click="save" :disabled="loading">
          {{ loading ? 'Saving...' : 'Save' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
