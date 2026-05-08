<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LogIn, KeyRound, Loader2 } from 'lucide-vue-next'

const { providers, loginWith } = useAuth()

const showMagicLink = ref(false)
const magicUsername = ref('')
const magicLoading = ref(false)
const magicError = ref('')
const magicLinkUrl = ref('')
const magicSent = ref(false)

async function requestMagicLink() {
  if (!magicUsername.value.trim()) {
    magicError.value = 'Please enter your username'
    return
  }

  magicLoading.value = true
  magicError.value = ''

  try {
    const res = await fetch('/auth/personal/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: magicUsername.value }),
    })
    const data = await res.json()

    if (!res.ok) {
      magicError.value = data.error || 'Failed to generate login link'
      return
    }

    magicSent.value = true
    if (data.link) {
      magicLinkUrl.value = data.link
    }
  } catch {
    magicError.value = 'An error occurred'
  } finally {
    magicLoading.value = false
  }
}

function handleClick(service: string) {
  if (service === 'personal') {
    showMagicLink.value = true
  } else {
    loginWith(service)
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Magic link form -->
    <div v-if="showMagicLink" class="space-y-3">
      <div v-if="magicSent" class="space-y-2">
        <Alert>
          <AlertDescription>
            Login link generated. Check your email or use the link below.
          </AlertDescription>
        </Alert>
        <a
          v-if="magicLinkUrl"
          :href="magicLinkUrl"
          class="text-sm text-primary underline break-all"
        >
          Click here to log in
        </a>
      </div>

      <template v-else>
        <Alert v-if="magicError" variant="destructive">
          <AlertDescription>{{ magicError }}</AlertDescription>
        </Alert>

        <div class="space-y-2">
          <Label for="magic-username">Username</Label>
          <Input
            id="magic-username"
            v-model="magicUsername"
            placeholder="Enter your username"
            :disabled="magicLoading"
            @keyup.enter="requestMagicLink"
          />
        </div>

        <div class="flex gap-2">
          <Button
            class="flex-1"
            :disabled="magicLoading"
            @click="requestMagicLink"
          >
            <Loader2 v-if="magicLoading" class="mr-2 h-4 w-4 animate-spin" />
            <KeyRound v-else class="mr-2 h-4 w-4" />
            Send Login Link
          </Button>
          <Button variant="ghost" @click="showMagicLink = false">
            Back
          </Button>
        </div>
      </template>
    </div>

    <!-- Provider buttons -->
    <template v-else>
      <Button
        v-for="provider in providers"
        :key="provider.service"
        variant="outline"
        class="w-full"
        @click="handleClick(provider.service)"
      >
        <KeyRound v-if="provider.service === 'personal'" class="mr-2 h-4 w-4" />
        <LogIn v-else class="mr-2 h-4 w-4" />
        Log in with {{ provider.name }}
      </Button>
    </template>
  </div>
</template>
