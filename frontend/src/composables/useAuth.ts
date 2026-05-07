import { useAuthStore } from '@/stores/auth'
import { backendAdapter } from '@/adapters/backend.adapter'
import { storeToRefs } from 'pinia'

export function useAuth() {
  const store = useAuthStore()
  const { user, isAuthenticated, isAdmin, providers, loading } = storeToRefs(store)

  async function init() {
    await store.fetchProviders()
  }

  async function logout() {
    await store.logout()
    window.location.href = '/'
  }

  function loginWith(service: string) {
    window.location.href = `/auth/${service}`
  }

  async function generateLoginLink() {
    return backendAdapter.generateLoginLink()
  }

  return {
    user,
    isAuthenticated,
    isAdmin,
    providers,
    loading,
    init,
    logout,
    loginWith,
    generateLoginLink,
  }
}
