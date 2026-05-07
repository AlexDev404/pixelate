import { projectService } from '../../services/project.service.js';

interface UpdateProjectSettingsInput {
  projectId: number;
  settings: {
    default_file?: string | null;
    default_collapse?: string | null;
    run_script?: string | null;
    env_vars?: string | null;
  };
}

export async function updateProjectSettings(input: UpdateProjectSettingsInput) {
  await projectService.updateSettings(input.projectId, input.settings);
  const updated = await projectService.getSettings(input.projectId);
  return updated;
}
