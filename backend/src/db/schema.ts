import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  unique,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Users ───────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  enabled_at: timestamp('enabled_at', { withTimezone: true }),
});

export const usersRelations = relations(users, ({ many }) => ({
  logins: many(userLogins),
  adminEntry: many(adminTable),
  suspensions: many(suspendedUsers),
  projectAccess: many(projectAccess),
}));

// ─── Admin ───────────────────────────────────────────────────────────

export const adminTable = pgTable('admin_table', {
  user_id: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .primaryKey(),
});

export const adminTableRelations = relations(adminTable, ({ one }) => ({
  user: one(users, { fields: [adminTable.user_id], references: [users.id] }),
}));

// ─── User Logins ─────────────────────────────────────────────────────

export const userLogins = pgTable('user_logins', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  service: text('service').notNull(),
  service_id: text('service_id').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userLoginsRelations = relations(userLogins, ({ one }) => ({
  user: one(users, { fields: [userLogins.user_id], references: [users.id] }),
}));

// ─── Suspended Users ─────────────────────────────────────────────────

export const suspendedUsers = pgTable('suspended_users', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  suspended_at: timestamp('suspended_at', { withTimezone: true }).notNull().defaultNow(),
  reason: text('reason'),
  notes: text('notes'),
  invalidated_at: timestamp('invalidated_at', { withTimezone: true }),
});

export const suspendedUsersRelations = relations(suspendedUsers, ({ one }) => ({
  user: one(users, { fields: [suspendedUsers.user_id], references: [users.id] }),
}));

// ─── Projects ────────────────────────────────────────────────────────

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const projectsRelations = relations(projects, ({ many, one }) => ({
  settings: one(projectSettings, {
    fields: [projects.id],
    references: [projectSettings.project_id],
  }),
  starterEntry: one(starterProjects, {
    fields: [projects.id],
    references: [starterProjects.project_id],
  }),
  suspensions: many(suspendedProjects),
  access: many(projectAccess),
}));

// ─── Starter Projects ────────────────────────────────────────────────

export const starterProjects = pgTable('starter_projects', {
  project_id: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' })
    .primaryKey(),
});

// ─── Remix ───────────────────────────────────────────────────────────

export const remix = pgTable(
  'remix',
  {
    original_id: integer('original_id').notNull(),
    project_id: integer('project_id').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: unique().on(t.original_id, t.project_id),
  })
);

// ─── Project Settings ────────────────────────────────────────────────

export const projectSettings = pgTable('project_settings', {
  project_id: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' })
    .unique()
    .primaryKey(),
  default_file: text('default_file'),
  default_collapse: text('default_collapse'),
  run_script: text('run_script'),
  env_vars: text('env_vars'),
});

// ─── Suspended Projects ──────────────────────────────────────────────

export const suspendedProjects = pgTable('suspended_projects', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  suspended_at: timestamp('suspended_at', { withTimezone: true }).notNull().defaultNow(),
  reason: text('reason'),
  notes: text('notes'),
  invalidated_at: timestamp('invalidated_at', { withTimezone: true }),
});

export const suspendedProjectsRelations = relations(suspendedProjects, ({ one }) => ({
  project: one(projects, {
    fields: [suspendedProjects.project_id],
    references: [projects.id],
  }),
}));

// ─── Project Access Levels ───────────────────────────────────────────

export const projectAccessLevels = pgTable('project_access_levels', {
  access_level: integer('access_level').primaryKey(),
  name: text('name').notNull(),
});

// ─── Project Access ──────────────────────────────────────────────────

export const projectAccess = pgTable(
  'project_access',
  {
    project_id: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    user_id: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    access_level: integer('access_level')
      .notNull()
      .references(() => projectAccessLevels.access_level),
    notes: text('notes'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.project_id, t.user_id] }),
  })
);

export const projectAccessRelations = relations(projectAccess, ({ one }) => ({
  project: one(projects, {
    fields: [projectAccess.project_id],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectAccess.user_id],
    references: [users.id],
  }),
  level: one(projectAccessLevels, {
    fields: [projectAccess.access_level],
    references: [projectAccessLevels.access_level],
  }),
}));
