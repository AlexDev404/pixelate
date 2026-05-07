<script setup lang="ts">
import { ref } from 'vue'
import { backendAdapter } from '@/adapters/backend.adapter'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { UserLink } from '@pixelate/types'

const props = defineProps<{
  username: string
  links: UserLink[]
}>()

const emit = defineEmits<{ saved: [] }>()

const editLinks = ref<UserLink[]>([...props.links])
const loading = ref(false)
const error = ref('')

function addLink() {
  editLinks.value.push({ label: '', url: '' })
}

function removeLink(index: number) {
  editLinks.value.splice(index, 1)
}

async function save() {
  loading.value = true
  error.value = ''
  try {
    await backendAdapter.updateUserProfile(props.username, {
      links: editLinks.value.filter((l) => l.label && l.url),
    })
    emit('saved')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Edit Profile</CardTitle>
    </CardHeader>
    <CardContent>
      <form @submit.prevent="save" class="space-y-4">
        <Alert v-if="error" variant="destructive">
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>

        <div class="space-y-3">
          <Label>Links</Label>
          <div v-for="(link, i) in editLinks" :key="i" class="flex items-center gap-2">
            <Input v-model="link.label" placeholder="Label" class="flex-1" />
            <Input v-model="link.url" placeholder="https://..." class="flex-1" />
            <Button variant="ghost" size="sm" type="button" @click="removeLink(i)">Remove</Button>
          </div>
          <Button variant="outline" size="sm" type="button" @click="addLink">Add Link</Button>
        </div>

        <Button type="submit" :disabled="loading">
          {{ loading ? 'Saving...' : 'Save' }}
        </Button>
      </form>
    </CardContent>
  </Card>
</template>
