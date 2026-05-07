import { gitService } from '../../services/git.service.js';
import { projectService } from '../../services/project.service.js';

export async function getProjectHistory(projectId: number, commit?: string) {
  const project = await projectService.findById(projectId);
  if (!project) throw new Error('Project not found');

  if (commit) {
    const diff = await gitService.getCommitDiff(project.slug, commit);
    return { commit, diff };
  }

  const history = await gitService.getHistory(project.slug);
  return { history };
}
