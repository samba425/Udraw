/**
 * The serializable DiagramForge file format (`.dgm.json`). Wraps a `Project`
 * with an app signature and schema version so imports can be validated and
 * migrated across versions.
 * @module services/project/fileFormat
 */
import { FILE_FORMAT_VERSION, type Project } from '@/types';

/** Magic signature identifying a DiagramForge document. */
export const FILE_SIGNATURE = 'diagramforge';

/** The on-disk document envelope. */
export interface DiagramFile {
  app: typeof FILE_SIGNATURE;
  version: number;
  project: Project;
}

/** Serialize a project into a pretty-printed JSON document string. */
export function serializeProject(project: Project): string {
  const file: DiagramFile = {
    app: FILE_SIGNATURE,
    version: FILE_FORMAT_VERSION,
    project,
  };
  return JSON.stringify(file, null, 2);
}

/** Type guard for a plausible Project object. */
function isProjectShape(value: unknown): value is Project {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    Array.isArray(p.pages) &&
    Array.isArray(p.assets)
  );
}

/**
 * Parse and validate a document string into a `Project`. Accepts both the
 * enveloped `DiagramFile` format and a bare `Project` object for convenience.
 * Throws on malformed input.
 */
export function parseProject(text: string): Project {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON.');
  }

  // Enveloped format.
  if (typeof data === 'object' && data !== null && 'project' in data) {
    const file = data as Partial<DiagramFile>;
    if (file.app && file.app !== FILE_SIGNATURE) {
      throw new Error('Unrecognized document format.');
    }
    if (!isProjectShape(file.project)) throw new Error('Document is missing a valid project.');
    return file.project;
  }

  // Bare project object.
  if (isProjectShape(data)) return data;

  throw new Error('Document does not contain a diagram project.');
}
