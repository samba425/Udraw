/**
 * In-memory project sync store. This is intentionally simple: a bounded map
 * with last-write-wins semantics, suitable for local/single-tenant use. A
 * PostgreSQL-backed implementation can replace this behind the same interface.
 * @module store/projectStore
 */

/** A stored project snapshot with server metadata. */
export interface StoredProject {
  id: string;
  revision: number;
  updatedAt: string;
  data: unknown;
}

const MAX_PROJECTS = 500;
const projects = new Map<string, StoredProject>();

/** Persist (or update) a project snapshot; returns the stored record. */
export function saveProject(id: string, data: unknown): StoredProject {
  const existing = projects.get(id);
  const record: StoredProject = {
    id,
    revision: (existing?.revision ?? 0) + 1,
    updatedAt: new Date().toISOString(),
    data,
  };
  projects.set(id, record);

  // Evict the oldest entries when over capacity (insertion order = age).
  if (projects.size > MAX_PROJECTS) {
    const oldest = projects.keys().next().value;
    if (oldest !== undefined) projects.delete(oldest);
  }
  return record;
}

/** Retrieve a stored project by id, if present. */
export function getProject(id: string): StoredProject | undefined {
  return projects.get(id);
}

/** List stored project ids with revision metadata (no payloads). */
export function listProjects(): Array<Omit<StoredProject, 'data'>> {
  return [...projects.values()].map(({ id, revision, updatedAt }) => ({
    id,
    revision,
    updatedAt,
  }));
}
