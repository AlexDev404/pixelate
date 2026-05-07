import type { AuthProvider, DirListing, ProjectSettings } from '@pixelate/types'
import type {
  MainPageData,
  AdminData,
  UserProfile,
  FileHistoryEntry,
  ProjectHistoryEntry,
} from './types'

export interface BackendAdapter {
  // Auth
  getAuthProviders(): Promise<AuthProvider[]>
  logout(): Promise<void>

  // Projects
  getMainPageData(): Promise<MainPageData>
  deleteProject(slug: string): Promise<void>
  downloadProject(slug: string): void
  getProjectHealth(slug: string): Promise<{ healthy: boolean; message?: string }>
  getProjectHistory(slug: string, commit?: string): Promise<ProjectHistoryEntry[]>
  getProjectLogs(slug: string, since?: string): Promise<any>
  remixProject(slug: string, newName?: string): Promise<void>
  restartProject(slug: string): Promise<void>
  getProjectSettings(projectId: number): Promise<ProjectSettings>
  updateProjectSettings(projectId: number, settings: Record<string, any>): Promise<string>

  // Files
  getFileContent(slug: string, filename: string): Promise<Response>
  createFile(slug: string, filename: string): Promise<void>
  deleteFile(slug: string, filename: string): Promise<void>
  getDirListing(slug: string): Promise<DirListing>
  formatFile(slug: string, filename: string): Promise<{ content: string }>
  getFileHistory(slug: string, filename: string): Promise<FileHistoryEntry[]>
  syncFile(slug: string, filename: string, changes: string): Promise<string>
  renameFile(slug: string, oldPath: string, newPath: string): Promise<void>
  uploadFile(slug: string, filename: string, data: ArrayBuffer | Blob): Promise<void>

  // Users
  getUserProfile(username: string): Promise<UserProfile>
  updateUserProfile(username: string, data: Record<string, unknown>): Promise<void>
  checkUsernameAvailable(username: string): Promise<boolean>
  getUserSettings(uid: number): Promise<any>
  generateLoginLink(): Promise<{ url: string; password: string }>

  // Admin
  getAdminData(): Promise<AdminData>
  adminDeleteUser(uid: number): Promise<void>
  adminDisableUser(uid: number): Promise<void>
  adminEnableUser(uid: number): Promise<void>
  adminSuspendUser(uid: number, reason: string): Promise<void>
  adminUnsuspendUser(sid: number): Promise<void>
  adminDeleteProject(pid: number): Promise<void>
  adminSuspendProject(pid: number, reason: string): Promise<void>
  adminUnsuspendProject(sid: number): Promise<void>
  adminStopContainer(image: string): Promise<void>
  adminStopServer(name: string): Promise<void>
}
