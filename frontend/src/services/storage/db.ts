/**
 * IndexedDB access layer for offline project persistence. Wraps `idb` with a
 * tiny, typed API. All reads/writes are local; no network is involved.
 * @module services/storage/db
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Project } from '@/types';

const DB_NAME = 'diagramforge';
const DB_VERSION = 1;
const PROJECT_STORE = 'projects';
const META_STORE = 'meta';

/** Key under which the "last opened project id" is stored. */
export const LAST_PROJECT_KEY = 'lastProjectId';

interface DiagramForgeDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { 'by-updated': number };
  };
  meta: {
    key: string;
    value: string;
  };
}

let dbPromise: Promise<IDBPDatabase<DiagramForgeDB>> | null = null;

/** Lazily open (and upgrade) the database. */
function getDb(): Promise<IDBPDatabase<DiagramForgeDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DiagramForgeDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(PROJECT_STORE, { keyPath: 'id' });
        store.createIndex('by-updated', 'updatedAt');
        db.createObjectStore(META_STORE);
      },
    });
  }
  return dbPromise;
}

/** Persist (upsert) a project. */
export async function saveProject(project: Project): Promise<void> {
  const db = await getDb();
  await db.put(PROJECT_STORE, project);
  await db.put(META_STORE, project.id, LAST_PROJECT_KEY);
}

/** Load a project by id. */
export async function loadProject(id: string): Promise<Project | undefined> {
  const db = await getDb();
  return db.get(PROJECT_STORE, id);
}

/** Load the most recently updated project (for crash recovery). */
export async function loadLastProject(): Promise<Project | undefined> {
  const db = await getDb();
  const lastId = await db.get(META_STORE, LAST_PROJECT_KEY);
  if (lastId) {
    const project = await db.get(PROJECT_STORE, lastId);
    if (project) return project;
  }
  const all = await db.getAllFromIndex(PROJECT_STORE, 'by-updated');
  return all[all.length - 1];
}

/** List all stored projects, most recent first. */
export async function listProjects(): Promise<Project[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex(PROJECT_STORE, 'by-updated');
  return all.reverse();
}

/** Delete a project by id. */
export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(PROJECT_STORE, id);
}
