export interface Project {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectSettings {
  project_id: number;
  default_file: string | null;
  default_collapse: string | null;
  run_script: string | null;
  env_vars: string | null;
  app_type?: string;
  root_dir?: string;
}

export interface ProjectSuspension {
  id: number;
  project_id: number;
  suspended_at: string;
  reason: string | null;
  notes: string | null;
  invalidated_at: string | null;
}

export interface StarterProject {
  project_id: number;
}

export interface Remix {
  original_id: number;
  project_id: number;
  created_at: string;
}
