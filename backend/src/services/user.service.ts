import { db } from '../db/index.js';
import {
  users,
  userLogins,
  adminTable,
  suspendedUsers,
  projectAccess,
} from '../db/schema.js';
import { eq, and, isNull } from 'drizzle-orm';
import type { User } from '@pixelate/types';

export class UserService {
  async findById(id: number) {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return result ?? null;
  }

  async findByName(name: string) {
    const result = await db.query.users.findFirst({
      where: eq(users.name, name),
    });
    return result ?? null;
  }

  async findByLogin(service: string, serviceId: string) {
    const login = await db.query.userLogins.findFirst({
      where: and(eq(userLogins.service, service), eq(userLogins.service_id, serviceId)),
      with: { user: true },
    });
    return login?.user ?? null;
  }

  async createUser(name: string): Promise<typeof users.$inferSelect> {
    const [user] = await db
      .insert(users)
      .values({ name, enabled_at: new Date() })
      .returning();
    return user;
  }

  async createUserPending(name: string): Promise<typeof users.$inferSelect> {
    const [user] = await db.insert(users).values({ name }).returning();
    return user;
  }

  async enableUser(id: number) {
    await db
      .update(users)
      .set({ enabled_at: new Date() })
      .where(eq(users.id, id));
  }

  async disableUser(id: number) {
    await db.update(users).set({ enabled_at: null }).where(eq(users.id, id));
  }

  async deleteUser(id: number) {
    await db.delete(users).where(eq(users.id, id));
  }

  async addLogin(userId: number, service: string, serviceId: string) {
    await db.insert(userLogins).values({
      user_id: userId,
      service,
      service_id: serviceId,
    });
  }

  async removeLogin(userId: number, service: string) {
    await db
      .delete(userLogins)
      .where(and(eq(userLogins.user_id, userId), eq(userLogins.service, service)));
  }

  async getLogins(userId: number) {
    return db.query.userLogins.findMany({
      where: eq(userLogins.user_id, userId),
    });
  }

  async isAdmin(userId: number): Promise<boolean> {
    const result = await db.query.adminTable.findFirst({
      where: eq(adminTable.user_id, userId),
    });
    return !!result;
  }

  async suspendUser(userId: number, reason?: string, notes?: string) {
    const [suspension] = await db
      .insert(suspendedUsers)
      .values({ user_id: userId, reason: reason ?? null, notes: notes ?? null })
      .returning();
    return suspension;
  }

  async unsuspendUser(suspensionId: number) {
    await db
      .update(suspendedUsers)
      .set({ invalidated_at: new Date() })
      .where(eq(suspendedUsers.id, suspensionId));
  }

  async getActiveSuspension(userId: number) {
    return db.query.suspendedUsers.findFirst({
      where: and(
        eq(suspendedUsers.user_id, userId),
        isNull(suspendedUsers.invalidated_at)
      ),
    });
  }

  async getUserProjects(userId: number) {
    const access = await db.query.projectAccess.findMany({
      where: eq(projectAccess.user_id, userId),
      with: { project: true },
    });
    return access.map((a) => a.project);
  }

  async listAllUsers() {
    return db.query.users.findMany({
      orderBy: (u, { desc }) => [desc(u.created_at)],
    });
  }

  async checkUsernameAvailable(name: string): Promise<boolean> {
    const existing = await this.findByName(name);
    return !existing;
  }

  async updateProfile(userId: number, updates: { name?: string }) {
    if (updates.name) {
      await db.update(users).set({ name: updates.name }).where(eq(users.id, userId));
    }
  }
}

export const userService = new UserService();
