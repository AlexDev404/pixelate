import type { AuthProvider, Project, User } from '@pixelate/types'

export interface MainPageData {
  user: User | null
  projects: Project[]
  starters: Project[]
  providers: AuthProvider[]
}

export interface AdminData {
  users: AdminUser[]
  projects: AdminProject[]
  containers: AdminContainer[]
  servers: AdminServer[]
}

export interface AdminUser {
  id: number
  name: string
  created_at: string
  enabled_at: string | null
  superuser?: boolean
  suspended?: boolean
  suspension_id?: number
}

export interface AdminProject {
  id: number
  name: string
  slug: string
  owner: string
  created_at: string
  suspended?: boolean
  suspension_id?: number
}

export interface AdminContainer {
  image: string
  project: string
  status: string
  created: string
}

export interface AdminServer {
  name: string
  url: string
  status: string
}

export interface UserProfile {
  user: User
  projects: Project[]
  services: { service: string; service_id: string }[]
  additionalServices: string[]
  links: { label: string; url: string }[]
  allowEdit: boolean
}

export interface FileHistoryEntry {
  hash: string
  message: string
  date: string
  diff?: string
}

export interface ProjectHistoryEntry {
  hash: string
  message: string
  date: string
}
