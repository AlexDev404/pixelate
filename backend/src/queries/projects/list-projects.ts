import { projectService } from '../../services/project.service.js';
import { db } from '../../db/index.js';
import { projectAccess } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

export async function listProjects(userId?: number) {
  if (userId) {
    // List projects the user has access to
    const access = await db.query.projectAccess.findMany({
      where: eq(projectAccess.user_id, userId),
      with: { project: true },
    });
    return access.map((a) => ({
      ...a.project,
      access_level: a.access_level,
    }));
  }

  return projectService.listProjects();
}
