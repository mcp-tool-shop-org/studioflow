import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type {
  ProjectFile,
  RecentProject,
  PersistenceResult,
} from '@studioflow/domain';
import { CURRENT_SCHEMA_VERSION } from '@studioflow/domain';
import { useDocumentStore } from './documentStore.js';

export interface PersistenceStoreState {
  currentPath: string | null;
  isDirty: boolean;
  lastSavedAt: string | null;
  lastModifiedAt: string | null;
  recentProjects: RecentProject[];
  isSaving: boolean;
  isLoading: boolean;
  lastError: string | null;

  // Internal flag used by dirtyTracker to suppress dirty-marking during loads
  _isLoadingProject: boolean;

  // Actions
  newProject: (name: string) => Promise<void>;
  saveProject: () => Promise<void>;
  saveProjectAs: (path: string) => Promise<void>;
  openProject: (path: string) => Promise<void>;
  loadRecentProjects: () => Promise<void>;
  markDirty: () => void;
  markClean: () => void;
  reset: () => void;
}

const initialState = {
  currentPath: null as string | null,
  isDirty: false,
  lastSavedAt: null as string | null,
  lastModifiedAt: null as string | null,
  recentProjects: [] as RecentProject[],
  isSaving: false,
  isLoading: false,
  lastError: null as string | null,
  _isLoadingProject: false,
};

function buildProjectFile(): ProjectFile {
  const doc = useDocumentStore.getState();
  if (!doc.project) {
    throw new Error('No project loaded — cannot serialize');
  }
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    project: doc.project,
    layers: doc.layers,
  };
}

function addToRecents(
  recents: RecentProject[],
  entry: Omit<RecentProject, 'lastOpenedAt'>,
): RecentProject[] {
  const now = new Date().toISOString();
  const filtered = recents.filter((r) => r.path !== entry.path);
  const updated: RecentProject = { ...entry, lastOpenedAt: now };
  return [updated, ...filtered].slice(0, 20);
}

export const usePersistenceStore = create<PersistenceStoreState>()(
  (set, get) => ({
    ...initialState,

    newProject: async (name: string) => {
      set({ isLoading: true, lastError: null, _isLoadingProject: true });
      try {
        const result = await invoke<ProjectFile>('new_project', { name });
        const doc = useDocumentStore.getState();
        doc.reset();
        doc.setProject(result.project);
        for (const layer of result.layers) {
          // Hydrate layers directly via reset + manual state injection
          // since addLayer only auto-generates IDs; use setProject + direct set
        }
        // Directly load layers from the result into the document store
        useDocumentStore.setState({
          project: result.project,
          layers: result.layers,
          nextLayerId: result.layers.length + 1,
          nextItemId: 1,
        });
        set({
          currentPath: null,
          isDirty: false,
          lastSavedAt: null,
          lastModifiedAt: null,
          isLoading: false,
          lastError: null,
          _isLoadingProject: false,
        });
      } catch (err) {
        set({
          isLoading: false,
          lastError: err instanceof Error ? err.message : String(err),
          _isLoadingProject: false,
        });
        throw err;
      }
    },

    saveProject: async () => {
      const { currentPath } = get();
      if (!currentPath) {
        // No path — caller should use saveProjectAs
        set({ lastError: 'No file path set. Use Save As to choose a location.' });
        return;
      }
      await get().saveProjectAs(currentPath);
    },

    saveProjectAs: async (path: string) => {
      set({ isSaving: true, lastError: null });
      try {
        const data = buildProjectFile();
        const result = await invoke<PersistenceResult>('save_project', {
          path,
          data,
        });
        if (!result.success) {
          throw new Error(result.error ?? 'Save failed');
        }
        const now = new Date().toISOString();
        const project = useDocumentStore.getState().project;
        const updated = addToRecents(get().recentProjects, {
          id: project?.id ?? path,
          name: project?.name ?? 'Untitled',
          path,
        });
        set({
          currentPath: path,
          isDirty: false,
          lastSavedAt: now,
          isSaving: false,
          recentProjects: updated,
          lastError: null,
        });
      } catch (err) {
        set({
          isSaving: false,
          lastError: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    },

    openProject: async (path: string) => {
      set({ isLoading: true, lastError: null, _isLoadingProject: true });
      try {
        const result = await invoke<ProjectFile>('load_project', { path });
        if (!result || !result.project) {
          throw new Error('Invalid project file: missing project data');
        }
        // Load into document store
        useDocumentStore.setState({
          project: result.project,
          layers: result.layers ?? [],
          nextLayerId: (result.layers?.length ?? 0) + 1,
          nextItemId: 1,
        });
        const updated = addToRecents(get().recentProjects, {
          id: result.project.id,
          name: result.project.name,
          path,
        });
        set({
          currentPath: path,
          isDirty: false,
          lastSavedAt: new Date().toISOString(),
          lastModifiedAt: null,
          isLoading: false,
          recentProjects: updated,
          lastError: null,
          _isLoadingProject: false,
        });
      } catch (err) {
        set({
          isLoading: false,
          lastError: err instanceof Error ? err.message : String(err),
          _isLoadingProject: false,
        });
        throw err;
      }
    },

    loadRecentProjects: async () => {
      try {
        const recents = await invoke<RecentProject[]>('get_recent_projects');
        set({ recentProjects: recents ?? [] });
      } catch (err) {
        set({
          lastError: err instanceof Error ? err.message : String(err),
        });
      }
    },

    markDirty: () => {
      if (get()._isLoadingProject) return;
      set({ isDirty: true, lastModifiedAt: new Date().toISOString() });
    },

    markClean: () => {
      set({ isDirty: false, lastSavedAt: new Date().toISOString() });
    },

    reset: () => set({ ...initialState }),
  }),
);
