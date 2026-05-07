import { useProjectsStore } from '@/stores/projects'
import { backendAdapter } from '@/adapters/backend.adapter'
import { storeToRefs } from 'pinia'

export function useProjects() {
  const store = useProjectsStore()
  const { projects, starters, loading, error } = storeToRefs(store)

  async function fetchMainPage() {
    await store.fetchMainPageData()
  }

  async function deleteProject(slug: string) {
    await store.deleteProject(slug)
  }

  async function remixProject(slug: string, newName?: string) {
    await store.remixProject(slug, newName)
  }

  function downloadProject(slug: string) {
    backendAdapter.downloadProject(slug)
  }

  async function restartProject(slug: string) {
    await backendAdapter.restartProject(slug)
  }

  return {
    projects,
    starters,
    loading,
    error,
    fetchMainPage,
    deleteProject,
    remixProject,
    downloadProject,
    restartProject,
  }
}
