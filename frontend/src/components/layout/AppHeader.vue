<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar } from '@/components/ui/avatar'
import { Code2, LogOut, Settings, User } from 'lucide-vue-next'

const { user, isAuthenticated, isAdmin, providers, init, logout, loginWith } = useAuth()

onMounted(() => {
  init()
})
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container flex h-14 items-center px-4">
      <RouterLink to="/" class="flex items-center gap-2 font-semibold">
        <Code2 class="h-5 w-5" />
        <span>Pixelate</span>
      </RouterLink>

      <div class="flex-1" />

      <nav class="flex items-center gap-2">
        <template v-if="isAuthenticated && user">
          <RouterLink v-if="isAdmin" to="/admin">
            <Button variant="ghost" size="sm">
              <Settings class="h-4 w-4 mr-1" />
              Admin
            </Button>
          </RouterLink>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm" class="gap-2">
                <Avatar size="sm" :alt="user.name" :fallback="user.name.charAt(0).toUpperCase()" />
                <span>{{ user.name }}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem as-child>
                <RouterLink :to="`/profile/${user.name}`" class="flex items-center">
                  <User class="mr-2 h-4 w-4" />
                  Profile
                </RouterLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="logout" class="text-destructive">
                <LogOut class="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </template>

        <template v-else>
          <Button
            v-for="provider in providers"
            :key="provider.service"
            variant="outline"
            size="sm"
            @click="loginWith(provider.service)"
          >
            Log in with {{ provider.name }}
          </Button>
        </template>
      </nav>
    </div>
  </header>
</template>
