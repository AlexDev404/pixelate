<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useProjects } from '@/composables/useProjects'
import ProjectList from '@/components/projects/ProjectList.vue'
import CreateProjectForm from '@/components/projects/CreateProjectForm.vue'
import SignupForm from '@/components/auth/SignupForm.vue'
import LoginButtons from '@/components/auth/LoginButtons.vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

const { isAuthenticated } = useAuth()
const { projects, starters, loading, error, fetchMainPage, deleteProject, remixProject, downloadProject } = useProjects()

onMounted(() => {
  fetchMainPage()
})
</script>

<template>
  <div class="container px-4 py-8">
    <!-- Loading state -->
    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-8 w-48" />
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton v-for="i in 6" :key="i" class="h-40" />
      </div>
    </div>

    <!-- Authenticated view -->
    <template v-else-if="isAuthenticated">
      <div class="space-y-8">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Your Projects</h1>
          <p class="text-muted-foreground mt-1">Manage and edit your code projects</p>
        </div>

        <ProjectList
          v-if="projects.length > 0"
          :projects="projects"
          show-actions
          @delete="deleteProject"
          @remix="remixProject"
          @download="downloadProject"
        />
        <p v-else class="text-muted-foreground">You don't have any projects yet. Create one from a starter below!</p>

        <Separator />

        <CreateProjectForm :starters="starters" />
      </div>
    </template>

    <!-- Anonymous view -->
    <template v-else>
      <div class="max-w-4xl mx-auto space-y-8">
        <div class="text-center space-y-4">
          <h1 class="text-4xl font-bold tracking-tight">Build in Your Browser</h1>
          <p class="text-xl text-muted-foreground">
            A browser-based code editor for building and sharing web projects.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SignupForm />

          <Card>
            <CardHeader>
              <CardTitle>Already have an account?</CardTitle>
            </CardHeader>
            <CardContent>
              <LoginButtons />
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div>
          <h2 class="text-2xl font-semibold mb-4">Starter Projects</h2>
          <p class="text-muted-foreground mb-4">
            Try one of these starter templates to get started instantly.
          </p>
          <ProjectList :projects="starters" is-starter />
        </div>
      </div>
    </template>
  </div>
</template>
