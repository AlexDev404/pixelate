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
  // ── Auth ──────────────────────────────────────────────
  async getAuthProviders() {
    return json<AuthProvider[]>(await fetch('/auth/providers'))
  },

  async logout() {
    await ok(await fetch('/auth/logout'))
  },

  // ── Main ──────────────────────────────────────────────
  async getMainPageData() {
    return json<MainPageData>(await fetch('/api/v1/main'))
  },

  // ── Projects ──────────────────────────────────────────
  // Backend: POST /api/v1/projects/delete/:project
  async deleteProject(slug) {
    await ok(await fetch(`/api/v1/projects/delete/${slug}`, { method: 'POST' }))
  },

  // Backend: GET /api/v1/projects/download/:project
  downloadProject(slug) {
    window.location.href = `/api/v1/projects/download/${slug}`
  },

  // Backend: GET /api/v1/projects/health/:project
  async getProjectHealth(slug) {
    const res = await fetch(`/api/v1/projects/health/${slug}`)
    return res.text()
  },

  // Backend: GET /api/v1/projects/history/:project/:commit?
  async getProjectHistory(slug, commit?) {
    const url = commit
      ? `/api/v1/projects/history/${slug}/${commit}`
      : `/api/v1/projects/history/${slug}`
    return json<ProjectHistoryEntry[]>(await fetch(url))
  },

  // Backend: GET /api/v1/projects/logs/:project/:since?
  async getProjectLogs(slug, since?) {
    const url = since
      ? `/api/v1/projects/logs/${slug}/${since}`
      : `/api/v1/projects/logs/${slug}`
    return json<any>(await fetch(url))
  },

  // Backend: GET /api/v1/projects/remix/:project/:newname?
  async remixProject(slug, newName?) {
    const url = newName
      ? `/api/v1/projects/remix/${slug}/${encodeURIComponent(newName)}`
      : `/api/v1/projects/remix/${slug}`
    await ok(await fetch(url))
  },

  // Backend: POST /api/v1/projects/restart/:project
  async restartProject(slug) {
    await ok(await fetch(`/api/v1/projects/restart/${slug}`, { method: 'POST' }))
  },

  // Backend: GET /api/v1/projects/settings/:pid
  async getProjectSettings(projectId) {
    return json<ProjectSettings>(await fetch(`/api/v1/projects/settings/${projectId}`))
  },

  // Backend: POST /api/v1/projects/settings/:pid
  async updateProjectSettings(projectId, settings) {
    const res = await fetch(`/api/v1/projects/settings/${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    return res.text()
  },

  // ── Files (mounted at /api/v1/files) ─────────────────
  // Backend: GET /api/v1/files/content/:project/:filename+
  async getFileContent(slug, filename) {
    return fetch(`/api/v1/files/content/${slug}/${filename}`)
  },

  // Backend: POST /api/v1/files/create/:project/:filename+
  async createFile(slug, filename) {
    await ok(
      await fetch(`/api/v1/files/create/${slug}/${filename}`, {
        method: 'POST',
      }),
    )
  },

  // Backend: DELETE /api/v1/files/delete/:project/:filename+
  async deleteFile(slug, filename) {
    await ok(
      await fetch(`/api/v1/files/delete/${slug}/${filename}`, {
        method: 'DELETE',
      }),
    )
  },

  // Backend: GET /api/v1/files/dir/:project
  async getDirListing(slug) {
    return json<DirListing>(await fetch(`/api/v1/files/dir/${slug}`))
  },

  // Backend: POST /api/v1/files/format/:project/:filename+
  async formatFile(slug, filename) {
    return json<{ formatted: boolean }>(
      await fetch(`/api/v1/files/format/${slug}/${filename}`, {
        method: 'POST',
      }),
    )
  },

  // Backend: GET /api/v1/files/history/:project/:filename+
  async getFileHistory(slug, filename) {
    return json<FileHistoryEntry[]>(
      await fetch(`/api/v1/files/history/${slug}/${filename}`),
    )
  },

  // Backend: POST /api/v1/files/sync/:project/:filename+
  async syncFile(slug, filename, changes) {
    const res = await fetch(`/api/v1/files/sync/${slug}/${filename}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: changes,
    })
    return res.text()
  },

  // Backend: POST /api/v1/files/rename/:project/:slug+
  async renameFile(slug, oldPath, newPath) {
    await ok(
      await fetch(`/api/v1/files/rename/${slug}/${oldPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPath }),
      }),
    )
  },

  // Backend: POST /api/v1/files/upload/:project/:filename+
  async uploadFile(slug, filename, formData) {
    await ok(
      await fetch(`/api/v1/files/upload/${slug}/${filename}`, {
        method: 'POST',
        body: formData,
      }),
    )
  },

  // ── Users ─────────────────────────────────────────────
  // Backend: GET /api/v1/users/profile/:user
  async getUserProfile(username) {
    return json<UserProfile>(await fetch(`/api/v1/users/profile/${username}`))
  },

  // Backend: POST /api/v1/users/profile/:user
  async updateUserProfile(username, data) {
    await ok(
      await fetch(`/api/v1/users/profile/${username}`, {
        method: 'POST',
        body: data,
      }),
    )
  },

  // Backend: GET /api/v1/users/signup/:username
  async checkUsernameAvailable(username) {
    const res = await fetch(`/api/v1/users/signup/${username}`)
    const data = await res.json()
    return data.available
  },

  // Backend: GET /api/v1/users/settings/:uid
  async getUserSettings(uid) {
    return json<any>(await fetch(`/api/v1/users/settings/${uid}`))
  },

  // Backend: POST /auth/personal/link
  async generateLoginLink() {
    return json<{ url: string; password: string }>(
      await fetch('/auth/personal/link', { method: 'POST' }),
    )
  },

  // ── Admin (mounted at /api/v1/admin) ──────────────────
  // Backend: GET /api/v1/admin/
  async getAdminData() {
    return json<AdminData>(await fetch('/api/v1/admin'))
  },

  // Backend: POST /api/v1/admin/user/delete/:uid
  async adminDeleteUser(uid) {
    await ok(await fetch(`/api/v1/admin/user/delete/${uid}`, { method: 'POST' }))
  },

  // Backend: POST /api/v1/admin/user/disable/:uid
  async adminDisableUser(uid) {
    await ok(await fetch(`/api/v1/admin/user/disable/${uid}`, { method: 'POST' }))
  },

  // Backend: POST /api/v1/admin/user/enable/:uid
  async adminEnableUser(uid) {
    await ok(await fetch(`/api/v1/admin/user/enable/${uid}`, { method: 'POST' }))
  },

  // Backend: POST /api/v1/admin/user/suspend/:uid
  async adminSuspendUser(uid, reason) {
    await ok(
      await fetch(`/api/v1/admin/user/suspend/${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      }),
    )
  },

  // Backend: POST /api/v1/admin/user/unsuspend/:sid
  async adminUnsuspendUser(sid) {
    await ok(await fetch(`/api/v1/admin/user/unsuspend/${sid}`, { method: 'POST' }))
  },

  // Backend: POST /api/v1/admin/project/delete/:pid
  async adminDeleteProject(pid) {
    await ok(await fetch(`/api/v1/admin/project/delete/${pid}`, { method: 'POST' }))
  },

  // Backend: POST /api/v1/admin/project/suspend/:pid
  async adminSuspendProject(pid, reason) {
    await ok(
      await fetch(`/api/v1/admin/project/suspend/${pid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      }),
    )
  },

  // Backend: POST /api/v1/admin/project/unsuspend/:sid
  async adminUnsuspendProject(sid) {
    await ok(await fetch(`/api/v1/admin/project/unsuspend/${sid}`, { method: 'POST' }))
  },

  // Backend: POST /api/v1/admin/container/stop/:image
  async adminStopContainer(image) {
    await ok(
      await fetch(`/api/v1/admin/container/stop/${encodeURIComponent(image)}`, {
        method: 'POST',
      }),
    )
  },

  // Backend: POST /api/v1/admin/server/stop/:name
  async adminStopServer(name) {
    await ok(
      await fetch(`/api/v1/admin/server/stop/${encodeURIComponent(name)}`, {
        method: 'POST',
      }),
    )
  },
}
