<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { backendAdapter } from '@/adapters/backend.adapter'
import type { AdminData } from '@/adapters/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import AdminUsers from '@/components/admin/AdminUsers.vue'
import AdminProjects from '@/components/admin/AdminProjects.vue'
import AdminContainers from '@/components/admin/AdminContainers.vue'
import AdminServers from '@/components/admin/AdminServers.vue'
import { Shield } from 'lucide-vue-next'

const data = ref<AdminData | null>(null)
const loading = ref(true)
const error = ref('')

async function fetchData() {
  loading.value = true
  try {
    data.value = await backendAdapter.getAdminData()
  } catch (e: any) {
    error.value = e.message || 'Access denied'
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="container px-4 py-8">
    <div class="flex items-center gap-2 mb-6">
      <Shield class="h-6 w-6" />
      <h1 class="text-3xl font-bold tracking-tight">Admin Panel</h1>
    </div>

    <div v-if="loading">
      <Skeleton class="h-64 w-full" />
    </div>

    <div v-else-if="error" class="text-center py-16">
      <h2 class="text-2xl font-bold text-destructive">Access Denied</h2>
      <p class="text-muted-foreground mt-2">{{ error }}</p>
    </div>

    <Tabs v-else-if="data" default-value="users">
      <TabsList>
        <TabsTrigger value="users">Users ({{ data.users.length }})</TabsTrigger>
        <TabsTrigger value="projects">Projects ({{ data.projects.length }})</TabsTrigger>
        <TabsTrigger value="containers">Containers ({{ data.containers.length }})</TabsTrigger>
        <TabsTrigger value="servers">Servers ({{ data.servers.length }})</TabsTrigger>
      </TabsList>

      <TabsContent value="users">
        <AdminUsers :users="data.users" @refresh="fetchData" />
      </TabsContent>
      <TabsContent value="projects">
        <AdminProjects :projects="data.projects" @refresh="fetchData" />
      </TabsContent>
      <TabsContent value="containers">
        <AdminContainers :containers="data.containers" @refresh="fetchData" />
      </TabsContent>
      <TabsContent value="servers">
        <AdminServers :servers="data.servers" @refresh="fetchData" />
      </TabsContent>
    </Tabs>
  </div>
</template>
