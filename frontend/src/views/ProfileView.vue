<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { backendAdapter } from '@/adapters/backend.adapter'
import type { UserProfile } from '@/adapters/types'
import { useAuth } from '@/composables/useAuth'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import LoginMethods from '@/components/profile/LoginMethods.vue'
import DirectLoginGenerator from '@/components/profile/DirectLoginGenerator.vue'
import ProfileEditForm from '@/components/profile/ProfileEditForm.vue'
import ProfileProjects from '@/components/profile/ProfileProjects.vue'
import { ExternalLink, Calendar } from 'lucide-vue-next'

const route = useRoute()
const username = route.params.user as string
const { user: currentUser } = useAuth()

const profile = ref<UserProfile | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    profile.value = await backendAdapter.getUserProfile(username)
  } catch (e: any) {
    error.value = e.message || 'User not found'
  } finally {
    loading.value = false
  }
})

async function refreshProfile() {
  profile.value = await backendAdapter.getUserProfile(username)
}
</script>

<template>
  <div class="container px-4 py-8 max-w-4xl">
    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="flex items-center gap-4">
        <Skeleton class="h-16 w-16 rounded-full" />
        <div class="space-y-2">
          <Skeleton class="h-6 w-32" />
          <Skeleton class="h-4 w-48" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-16">
      <h2 class="text-2xl font-bold">User not found</h2>
      <p class="text-muted-foreground mt-2">{{ error }}</p>
    </div>

    <!-- Profile -->
    <template v-else-if="profile">
      <div class="space-y-8">
        <!-- Header -->
        <div class="flex items-center gap-4">
          <Avatar size="lg" :alt="profile.user.name" :fallback="profile.user.name.charAt(0).toUpperCase()" />
          <div>
            <h1 class="text-2xl font-bold">{{ profile.user.name }}</h1>
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar class="h-4 w-4" />
              <span>Joined {{ new Date(profile.user.created_at).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>

        <!-- Links -->
        <div v-if="profile.links.length > 0" class="flex flex-wrap gap-2">
          <a
            v-for="link in profile.links"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink class="h-3 w-3" />
            {{ link.label }}
          </a>
        </div>

        <Separator />

        <!-- Projects -->
        <ProfileProjects :projects="profile.projects" />

        <!-- Edit section (only for own profile) -->
        <template v-if="profile.allowEdit">
          <Separator />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LoginMethods
              :services="profile.services"
              :additional-services="profile.additionalServices"
              :allow-edit="profile.allowEdit"
            />
            <DirectLoginGenerator />
          </div>

          <ProfileEditForm
            :username="profile.user.name"
            :links="profile.links"
            @saved="refreshProfile"
          />
        </template>
      </div>
    </template>
  </div>
</template>
