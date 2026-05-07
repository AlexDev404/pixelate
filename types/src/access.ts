export const AccessLevel = {
  OWNER: 30,
  EDITOR: 25,
  MEMBER: 20,
  VIEWER: 10,
} as const;

export type AccessLevelValue = (typeof AccessLevel)[keyof typeof AccessLevel];

export interface ProjectAccess {
  project_id: number;
  user_id: number;
  access_level: AccessLevelValue;
  notes: string | null;
}

export interface ProjectAccessLevel {
  access_level: number;
  name: string;
}

export const UNKNOWN_USER = -1;
export const NOT_ACTIVATED = -2;
export const ADMIN = 100;
