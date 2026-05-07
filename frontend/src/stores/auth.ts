import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthProvider } from '@pixelate/types'
import { backendAdapter } from '@/adapters/backend.adapter'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const providers = ref<AuthProvider[]>([])
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => !!user.value?.superuser)

  function setUser(u: User | null) {
    user.value = u
  }

  async function fetchProviders() {
    try {
      providers.value = await backendAdapter.getAuthProviders()
    } catch {
      providers.value = []
    }
  }

  async function logout() {
    loading.value = true
    try {
      await backendAdapter.logout()
      user.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    providers,
    loading,
    isAuthenticated,
    isAdmin,
    setUser,
    fetchProviders,
    logout,
  }
})
