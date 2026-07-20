/**
 * User-saved diagram templates stored in localStorage.
 * @module services/templates/userTemplates
 */
import type { Page, Project } from '@/types';
import { createProject } from '@/models/factory';
import { useProjectStore } from '@/state/projectStore';

const STORAGE_KEY = 'diagramforge.userTemplates';

export interface UserTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  accent: string;
  savedAt: number;
  /** Snapshot of a single page (shapes, edges, layers, order). */
  page: Page;
}

function readAll(): UserTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as UserTemplate[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeAll(templates: UserTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

/** List saved user templates (newest first). */
export function listUserTemplates(): UserTemplate[] {
  return readAll().sort((a, b) => b.savedAt - a.savedAt);
}

/** Save the active page as a user template. */
export function saveActivePageAsTemplate(title: string, description = ''): UserTemplate {
  const page = structuredClone(useProjectStore.getState().activePage());
  const template: UserTemplate = {
    id: `user-${Date.now()}`,
    title: title.trim() || page.name,
    description: description.trim() || `Saved from ${page.name}`,
    category: 'My templates',
    accent: '#6366f1',
    savedAt: Date.now(),
    page,
  };
  writeAll([template, ...readAll()]);
  return template;
}

/** Delete a user template by id. */
export function deleteUserTemplate(id: string): void {
  writeAll(readAll().filter((t) => t.id !== id));
}

/** Build a one-page project from a user template. */
export function projectFromUserTemplate(template: UserTemplate): Project {
  const project = createProject(template.title);
  const page = project.pages[0]!;
  Object.assign(page, structuredClone(template.page), { id: page.id, name: template.title });
  return project;
}
