import type { Project } from './project.js';
import type { Layer } from './layer.js';

/** Current schema version for project files */
export const CURRENT_SCHEMA_VERSION = 1;

/** The persisted project file format — explicit, not a state dump */
export interface ProjectFile {
  schemaVersion: number;
  project: Project;
  layers: Layer[];
}

/** Result of validating a project file */
export interface ProjectValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  schemaVersion: number | null;
}

/** Metadata about a saved project for recent-projects list */
export interface RecentProject {
  id: string;
  name: string;
  path: string;
  lastOpenedAt: string;
}

/** Result from save/load backend operations */
export interface PersistenceResult {
  success: boolean;
  path?: string;
  error?: string;
}

/** Dirty state tracking */
export interface DirtyState {
  isDirty: boolean;
  lastSavedAt: string | null;
  lastModifiedAt: string | null;
}

/** Extended command types for persistence */
export type PersistenceCommandType =
  | 'project:new'
  | 'project:save'
  | 'project:save-as'
  | 'project:open'
  | 'project:close';
