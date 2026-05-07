<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { KeyRound } from 'lucide-vue-next'

const props = defineProps<{
  uuid: string
}>()

const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  if (!password.value.trim()) {
    error.value = 'Please enter the password'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`/auth/direct/${props.uuid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.value }),
    })
    if (res.ok) {
      window.location.href = '/'
    } else {
      const text = await res.text()
      error.value = text || 'Invalid or expired login link'
    }
  } catch {
    error.value = 'An error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Card class="max-w-md mx-auto">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <KeyRound class="h-5 w-5" />
        Direct Login
      </CardTitle>
    </CardHeader>
    <CardContent>
      <form @submit.prevent="submit" class="space-y-4">
        <Alert v-if="error" variant="destructive">
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>

        <div class="space-y-2">
          <Label for="password">One-time password</Label>
          <Input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter the password from your login link"
            :disabled="loading"
          />
        </div>

        <Button type="submit" class="w-full" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Log In' }}
        </Button>
      </form>
    </CardContent>
  </Card>
</template>
