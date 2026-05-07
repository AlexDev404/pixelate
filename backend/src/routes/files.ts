import { Hono } from 'hono';
import { projectLookup } from '../middleware/project-lookup.js';
import { verifyLogin, verifyEditRights } from '../middleware/access.js';
import { fileService } from '../services/file.service.js';
import { gitService } from '../services/git.service.js';

const fileRoutes = new Hono();

// Get file content
fileRoutes.get('/content/:project/:filename{.+}', projectLookup(), async (c) => {
  const project = c.get('project')!;
  const filename = c.req.param('filename');

  try {
    const { content, mime } = await fileService.readFile(project.slug, filename);
    return c.text(content, 200, { 'Content-Type': mime });
  } catch {
    return c.json({ error: 'File not found' }, 404);
  }
});

// Create file
fileRoutes.post('/create/:project/:filename{.+}', verifyLogin(), projectLookup(), verifyEditRights(), async (c) => {
  const project = c.get('project')!;
  const filename = c.req.param('filename');

  const body = await c.req.json<{ content?: string; isDirectory?: boolean }>().catch(() => ({}));

  try {
    await fileService.createFile(project.slug, filename, body.content || '', body.isDirectory || false);
    await gitService.commit(project.slug, `Created ${filename}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// Delete file
fileRoutes.delete('/delete/:project/:filename{.+}', verifyLogin(), projectLookup(), verifyEditRights(), async (c) => {
  const project = c.get('project')!;
  const filename = c.req.param('filename');

  try {
    await fileService.deleteFile(project.slug, filename);
    await gitService.commit(project.slug, `Deleted ${filename}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// Directory listing
fileRoutes.get('/dir/:project', projectLookup(), async (c) => {
  const project = c.get('project')!;

  try {
    const listing = await fileService.listDir(project.slug);
    return c.json(listing);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// Format file
fileRoutes.post('/format/:project/:filename{.+}', verifyLogin(), projectLookup(), verifyEditRights(), async (c) => {
  const project = c.get('project')!;
  const filename = c.req.param('filename');

  try {
    const content = await fileService.formatFile(project.slug, filename);
    await gitService.commit(project.slug, `Formatted ${filename}`);
    return c.json({ content });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// File history
fileRoutes.get('/history/:project/:filename{.+}', projectLookup(), async (c) => {
  const project = c.get('project')!;
  const filename = c.req.param('filename');

  try {
    const history = await gitService.getFileHistory(project.slug, filename);
    return c.json({ history });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// Sync/patch file
fileRoutes.post('/sync/:project/:filename{.+}', verifyLogin(), projectLookup(), verifyEditRights(), async (c) => {
  const project = c.get('project')!;
  const filename = c.req.param('filename');

  const body = await c.req.json<{ patch?: string; content?: string }>();

  try {
    let content: string;
    if (body.patch) {
      content = await fileService.applyPatch(project.slug, filename, body.patch);
    } else if (body.content !== undefined) {
      await fileService.writeFile(project.slug, filename, body.content);
      content = body.content;
    } else {
      return c.json({ error: 'Missing patch or content' }, 400);
    }

    await gitService.commit(project.slug, `Updated ${filename}`);
    return c.json({ success: true, content });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// Rename/move file
fileRoutes.post('/rename/:project/:slug{.+}', verifyLogin(), projectLookup(), verifyEditRights(), async (c) => {
  const project = c.get('project')!;
  const oldPath = c.req.param('slug');
  const body = await c.req.json<{ newPath: string }>();

  if (!body.newPath) {
    return c.json({ error: 'newPath required' }, 400);
  }

  try {
    await fileService.moveFile(project.slug, oldPath, body.newPath);
    await gitService.commit(project.slug, `Renamed ${oldPath} to ${body.newPath}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// Upload file
fileRoutes.post('/upload/:project/:filename{.+}', verifyLogin(), projectLookup(), verifyEditRights(), async (c) => {
  const project = c.get('project')!;
  const filename = c.req.param('filename');

  try {
    const body = await c.req.arrayBuffer();
    await fileService.saveUpload(project.slug, filename, Buffer.from(body));
    await gitService.commit(project.slug, `Uploaded ${filename}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

export default fileRoutes;
