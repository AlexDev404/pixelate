export interface User {
  id: number;
  name: string;
  created_at: string;
  enabled_at: string | null;
  superuser?: boolean;
}

export interface UserLogin {
  user_id: number;
  service: string;
  service_id: string;
  created_at: string;
}

export interface UserSuspension {
  id: number;
  user_id: number;
  suspended_at: string;
  reason: string | null;
  notes: string | null;
  invalidated_at: string | null;
}

export interface UserProfile {
  user: User;
  projects: Project[];
  services: LoginService[];
  additionalServices: string[];
  links: UserLink[];
  allowEdit: boolean;
}

export interface LoginService {
  service: string;
  service_id: string;
}

export interface UserLink {
  label: string;
  url: string;
}
