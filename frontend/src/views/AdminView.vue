<script setup lang="ts">
import { ref, shallowRef, onMounted } from 'vue'
import { backendAdapter } from '@/adapters/backend.adapter'
import type { AdminData } from '@/adapters/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import AdminUsers from '@/components/admin/AdminUsers.vue'
import AdminProjects from '@/components/admin/AdminProjects.vue'
import AdminContainers from '@/components/admin/AdminContainers.vue'
import AdminServers from '@/components/admin/AdminServers.vue'
import { Shield } from 'lucide-vue-next'

const data = shallowRef<AdminData | null>(null)
const loading = ref(true)
const error = ref('')
const activeTab = ref('users')

const tabs = [
  { value: 'users', label: 'Users' },
  { value: 'projects', label: 'Projects' },
  { value: 'containers', label: 'Containers' },
  { value: 'servers', label: 'Servers' },
]

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

    <div v-else-if="data">
      <div class="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground mb-4">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          :class="[
            'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all',
            activeTab === tab.value
              ? 'bg-background text-foreground shadow-sm'
              : 'hover:bg-background/50'
          ]"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <AdminUsers v-if="activeTab === 'users'" :users="data.users" @refresh="fetchData" />
      <AdminProjects v-if="activeTab === 'projects'" :projects="data.projects" @refresh="fetchData" />
      <AdminContainers v-if="activeTab === 'containers'" :containers="data.containers" @refresh="fetchData" />
      <AdminServers v-if="activeTab === 'servers'" :servers="data.servers" @refresh="fetchData" />
    </div>
  </div>
</template>
