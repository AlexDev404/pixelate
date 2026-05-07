<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { backendAdapter } from '@/adapters/backend.adapter'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserPlus } from 'lucide-vue-next'

const { providers, loginWith } = useAuth()

const username = ref('')
const selectedProvider = ref('')
const error = ref('')
const checking = ref(false)

async function signup() {
  if (!username.value.trim()) {
    error.value = 'Please enter a username'
    return
  }
  if (!selectedProvider.value) {
    error.value = 'Please select a login method'
    return
  }

  checking.value = true
  error.value = ''

  try {
    const available = await backendAdapter.checkUsernameAvailable(username.value)
    if (!available) {
      error.value = 'Username is already taken'
      return
    }
    // Redirect to auth with username param
    window.location.href = `/auth/${selectedProvider.value}?username=${encodeURIComponent(username.value)}`
  } catch (e: any) {
    error.value = e.message || 'An error occurred'
  } finally {
    checking.value = false
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <UserPlus class="h-5 w-5" />
        Sign Up
      </CardTitle>
    </CardHeader>
    <CardContent>
      <form @submit.prevent="signup" class="space-y-4">
        <Alert v-if="error" variant="destructive">
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>

        <div class="space-y-2">
          <Label for="username">Username</Label>
          <Input
            id="username"
            v-model="username"
            placeholder="Choose a username"
            :disabled="checking"
          />
        </div>

        <div class="space-y-2">
          <Label>Sign up with</Label>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="provider in providers"
              :key="provider.service"
              type="button"
              :variant="selectedProvider === provider.service ? 'default' : 'outline'"
              @click="selectedProvider = provider.service"
            >
              {{ provider.name }}
            </Button>
          </div>
        </div>

        <Button type="submit" class="w-full" :disabled="checking">
          {{ checking ? 'Checking...' : 'Create Account' }}
        </Button>
      </form>
    </CardContent>
  </Card>
</template>
