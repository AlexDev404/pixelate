import type { AuthProvider, DirListing, ProjectSettings } from '@pixelate/types'
import type { BackendAdapter } from './index'
import type {
  MainPageData,
  AdminData,
  UserProfile,
  FileHistoryEntry,
  ProjectHistoryEntry,
} from './types'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

async function ok(res: Response): Promise<void> {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `HTTP ${res.status}`)
  }
}

export const backendAdapter: BackendAdapter = {
  // Auth
  async getAuthProviders() {
    return json<AuthProvider[]>(await fetch('/auth/providers'))
  },

  async logout() {
    await ok(await fetch('/auth/logout', { method: 'POST' }))
  },

  // Projects
  async getMainPageData() {
    return json<MainPageData>(await fetch('/api/main'))
  },

  async deleteProject(slug) {
    await ok(await fetch(`/api/projects/${slug}`, { method: 'DELETE' }))
  },

  downloadProject(slug) {
    window.location.href = `/api/projects/${slug}/download`
  },

  async getProjectHealth(slug) {
    const res = await fetch(`/api/projects/${slug}/health`)
    return res.text()
  },

  async getProjectHistory(slug, commit?) {
    const url = commit
      ? `/api/projects/${slug}/history?commit=${commit}`
      : `/api/projects/${slug}/history`
    return json<ProjectHistoryEntry[]>(await fetch(url))
  },

  async getProjectLogs(slug, since?) {
    const url = since
      ? `/api/projects/${slug}/logs?since=${since}`
      : `/api/projects/${slug}/logs`
    return json<any>(await fetch(url))
  },

  async remixProject(slug, newName?) {
    await ok(
      await fetch(`/api/projects/${slug}/remix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      })
    )
  },

  async restartProject(slug) {
    await ok(await fetch(`/api/projects/${slug}/restart`, { method: 'POST' }))
  },

  async getProjectSettings(projectId) {
    return json<ProjectSettings>(await fetch(`/api/projects/settings/${projectId}`))
  },

  async updateProjectSettings(projectId, settings) {
    const res = await fetch(`/api/projects/settings/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    return res.text()
  },

  // Files
  async getFileContent(slug, filename) {
    return fetch(`/api/projects/${slug}/files/${encodeURIComponent(filename)}`)
  },

  async createFile(slug, filename) {
    await ok(
      await fetch(`/api/projects/${slug}/files/${encodeURIComponent(filename)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '' }),
      })
    )
  },

  async deleteFile(slug, filename) {
    await ok(
      await fetch(`/api/projects/${slug}/files/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      })
    )
  },

  async getDirListing(slug) {
    return json<DirListing>(await fetch(`/api/projects/${slug}/files`))
  },

  async formatFile(slug, filename) {
    return json<{ formatted: boolean }>(
      await fetch(`/api/projects/${slug}/files/${encodeURIComponent(filename)}/format`, {
        method: 'POST',
      })
    )
  },

  async getFileHistory(slug, filename) {
    return json<FileHistoryEntry[]>(
      await fetch(`/api/projects/${slug}/files/${encodeURIComponent(filename)}/history`)
    )
  },

  async syncFile(slug, filename, changes) {
    const res = await fetch(`/api/projects/${slug}/files/${encodeURIComponent(filename)}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changes }),
    })
    return res.text()
  },

  async renameFile(slug, oldPath, newPath) {
    await ok(
      await fetch(`/api/projects/${slug}/files/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newPath }),
      })
    )
  },

  async uploadFile(slug, filename, formData) {
    await ok(
      await fetch(`/api/projects/${slug}/files/${encodeURIComponent(filename)}/upload`, {
        method: 'POST',
        body: formData,
      })
    )
  },

  // Users
  async getUserProfile(username) {
    return json<UserProfile>(await fetch(`/api/users/${username}`))
  },

  async updateUserProfile(username, data) {
    await ok(
      await fetch(`/api/users/${username}`, {
        method: 'PUT',
        body: data,
      })
    )
  },

  async checkUsernameAvailable(username) {
    const res = await fetch(`/api/users/check/${username}`)
    const data = await res.json()
    return data.available
  },

  async getUserSettings(uid) {
    return json<any>(await fetch(`/api/users/settings/${uid}`))
  },

  async generateLoginLink() {
    return json<{ url: string; password: string }>(
      await fetch('/api/users/login-link', { method: 'POST' })
    )
  },

  // Admin
  async getAdminData() {
    return json<AdminData>(await fetch('/api/admin'))
  },

  async adminDeleteUser(uid) {
    await ok(await fetch(`/api/admin/users/${uid}`, { method: 'DELETE' }))
  },

  async adminDisableUser(uid) {
    await ok(await fetch(`/api/admin/users/${uid}/disable`, { method: 'POST' }))
  },

  async adminEnableUser(uid) {
    await ok(await fetch(`/api/admin/users/${uid}/enable`, { method: 'POST' }))
  },

  async adminSuspendUser(uid, reason) {
    await ok(
      await fetch(`/api/admin/users/${uid}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
    )
  },

  async adminUnsuspendUser(sid) {
    await ok(await fetch(`/api/admin/suspensions/${sid}/unsuspend`, { method: 'POST' }))
  },

  async adminDeleteProject(pid) {
    await ok(await fetch(`/api/admin/projects/${pid}`, { method: 'DELETE' }))
  },

  async adminSuspendProject(pid, reason) {
    await ok(
      await fetch(`/api/admin/projects/${pid}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
    )
  },

  async adminUnsuspendProject(sid) {
    await ok(
      await fetch(`/api/admin/project-suspensions/${sid}/unsuspend`, { method: 'POST' })
    )
  },

  async adminStopContainer(image) {
    await ok(
      await fetch('/api/admin/containers/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
    )
  },

  async adminStopServer(name) {
    await ok(
      await fetch('/api/admin/servers/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
    )
  },
}
