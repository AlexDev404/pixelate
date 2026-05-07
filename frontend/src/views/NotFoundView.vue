<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { RouterLink } from 'vue-router'
import { Home } from 'lucide-vue-next'
</script>

<template>
  <div class="container px-4 py-16 flex flex-col items-center justify-center text-center">
    <h1 class="text-6xl font-bold text-muted-foreground">404</h1>
    <h2 class="text-2xl font-semibold mt-4">Page Not Found</h2>
    <p class="text-muted-foreground mt-2 max-w-md">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <RouterLink to="/" class="mt-6">
      <Button>
        <Home class="mr-2 h-4 w-4" />
        Back to Home
      </Button>
    </RouterLink>
  </div>
</template>
