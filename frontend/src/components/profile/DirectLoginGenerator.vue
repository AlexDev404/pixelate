<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { KeyRound, Copy, Check } from 'lucide-vue-next'

const { generateLoginLink } = useAuth()
const result = ref<{ url: string; password: string } | null>(null)
const loading = ref(false)
const copied = ref(false)

async function generate() {
  loading.value = true
  try {
    result.value = await generateLoginLink()
  } finally {
    loading.value = false
  }
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <KeyRound class="h-5 w-5" />
        Direct Login Link
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <p class="text-sm text-muted-foreground">
        Generate a one-time login link you can use to log in from any device.
      </p>

      <Button @click="generate" :disabled="loading">
        {{ loading ? 'Generating...' : 'Generate Login Link' }}
      </Button>

      <Alert v-if="result">
        <AlertTitle>Login Link Generated</AlertTitle>
        <AlertDescription class="space-y-2">
          <div class="flex items-center gap-2">
            <Input :model-value="result.url" readonly class="text-xs" />
            <Button variant="outline" size="icon" @click="copyToClipboard(result.url)">
              <Check v-if="copied" class="h-4 w-4" />
              <Copy v-else class="h-4 w-4" />
            </Button>
          </div>
          <p class="text-xs"><strong>Password:</strong> {{ result.password }}</p>
          <p class="text-xs text-muted-foreground">This link can only be used once.</p>
        </AlertDescription>
      </Alert>
    </CardContent>
  </Card>
</template>
