import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Project } from '@pixelate/types'
import { backendAdapter } from '@/adapters/backend.adapter'
import { useAuthStore } from './auth'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const starters = ref<Project[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMainPageData() {
    loading.value = true
    error.value = null
    try {
      const data = await backendAdapter.getMainPageData()
      const authStore = useAuthStore()
      authStore.setUser(data.user)
      projects.value = data.projects
      starters.value = data.starters
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function deleteProject(slug: string) {
    await backendAdapter.deleteProject(slug)
    projects.value = projects.value.filter((p) => p.slug !== slug)
  }

  async function remixProject(slug: string, newName?: string) {
    await backendAdapter.remixProject(slug, newName)
    await fetchMainPageData()
  }

  return {
    projects,
    starters,
    loading,
    error,
    fetchMainPageData,
    deleteProject,
    remixProject,
  }
})
