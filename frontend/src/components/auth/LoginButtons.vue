<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'
import { Button } from '@/components/ui/button'
import { LogIn } from 'lucide-vue-next'

const { providers, loginWith } = useAuth()
</script>

<template>
  <div class="flex flex-col gap-2">
    <Button
      v-for="provider in providers"
      :key="provider.service"
      variant="outline"
      class="w-full"
      @click="loginWith(provider.service)"
    >
      <LogIn class="mr-2 h-4 w-4" />
      Log in with {{ provider.name }}
    </Button>
  </div>
</template>
