<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { KeyRound, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  uuid: string
}>()

const router = useRouter()
const authStore = useAuthStore()
const error = ref('')
const loading = ref(true)

async function confirmLogin() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`/auth/personal/confirm/${props.uuid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()

    if (res.ok && data.success) {
      authStore.setUser(data.user)
      router.push('/')
    } else {
      error.value = data.error || 'Invalid or expired login link'
    }
  } catch {
    error.value = 'An error occurred while confirming login'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  confirmLogin()
})
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
      <div v-if="loading" class="flex items-center justify-center gap-2 py-4">
        <Loader2 class="h-5 w-5 animate-spin" />
        <span class="text-muted-foreground">Confirming login...</span>
      </div>

      <div v-else-if="error" class="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
        <Button variant="outline" class="w-full" @click="confirmLogin">
          Try Again
        </Button>
        <Button variant="ghost" class="w-full" @click="router.push('/')">
          Back to Home
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
