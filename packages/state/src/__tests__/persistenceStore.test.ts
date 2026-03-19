import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { usePersistenceStore } from '../persistenceStore.js';
import { useDocumentStore } from '../documentStore.js';

// ---------------------------------------------------------------------------
// Mock @tauri-apps/api/core
// ---------------------------------------------------------------------------
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// We import the mocked invoke AFTER vi.mock so the module is already replaced
import { invoke } from '@tauri-apps/api/core';
const mockInvoke = invoke as Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sampleProject = () => ({
  id: 'proj-001',
  name: 'Test Project',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  schemaVersion: 1,
});

const sampleProjectFile = () => ({
  schemaVersion: 1,
  project: sampleProject(),
  layers: [],
});

// ---------------------------------------------------------------------------
// Reset both stores before every test
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  usePersistenceStore.getState().reset();
  useDocumentStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('persistenceStore — newProject', () => {
  it('calls invoke("new_project") with the given name', async () => {
    mockInvoke.mockResolvedValueOnce(sampleProjectFile());

    await usePersistenceStore.getState().newProject('My Project');

    expect(mockInvoke).toHaveBeenCalledWith('new_project', { name: 'My Project' });
  });

  it('loads project into documentStore after newProject', async () => {
    mockInvoke.mockResolvedValueOnce(sampleProjectFile());

    await usePersistenceStore.getState().newProject('My Project');

    const project = useDocumentStore.getState().project;
    expect(project).not.toBeNull();
    expect(project?.name).toBe('Test Project');
  });

  it('marks state clean after newProject (no path, not dirty)', async () => {
    mockInvoke.mockResolvedValueOnce(sampleProjectFile());

    await usePersistenceStore.getState().newProject('Clean Slate');

    const { isDirty, currentPath, isLoading } = usePersistenceStore.getState();
    expect(isDirty).toBe(false);
    expect(currentPath).toBeNull();
    expect(isLoading).toBe(false);
  });

  it('sets lastError and re-throws when invoke rejects', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('backend error'));

    await expect(
      usePersistenceStore.getState().newProject('Bad'),
    ).rejects.toThrow('backend error');

    expect(usePersistenceStore.getState().lastError).toBe('backend error');
    expect(usePersistenceStore.getState().isLoading).toBe(false);
  });
});

describe('persistenceStore — markDirty / markClean', () => {
  it('markDirty sets isDirty=true and records lastModifiedAt', () => {
    usePersistenceStore.getState().markDirty();

    const { isDirty, lastModifiedAt } = usePersistenceStore.getState();
    expect(isDirty).toBe(true);
    expect(lastModifiedAt).not.toBeNull();
  });

  it('markClean sets isDirty=false and records lastSavedAt', () => {
    usePersistenceStore.getState().markDirty();
    usePersistenceStore.getState().markClean();

    const { isDirty, lastSavedAt } = usePersistenceStore.getState();
    expect(isDirty).toBe(false);
    expect(lastSavedAt).not.toBeNull();
  });

  it('markDirty is suppressed while _isLoadingProject is true', () => {
    // Manually engage loading flag
    usePersistenceStore.setState({ _isLoadingProject: true });
    usePersistenceStore.getState().markDirty();

    expect(usePersistenceStore.getState().isDirty).toBe(false);
  });
});

describe('persistenceStore — saveProject / saveProjectAs', () => {
  beforeEach(async () => {
    // Pre-load a project so the store has something to serialize
    mockInvoke.mockResolvedValueOnce(sampleProjectFile());
    await usePersistenceStore.getState().newProject('My Project');
    mockInvoke.mockClear();
  });

  it('saveProjectAs calls invoke("save_project") with path and data', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, path: '/tmp/my.studioflow' });

    await usePersistenceStore.getState().saveProjectAs('/tmp/my.studioflow');

    expect(mockInvoke).toHaveBeenCalledWith('save_project', {
      path: '/tmp/my.studioflow',
      data: expect.objectContaining({ schemaVersion: 1 }),
    });
  });

  it('saveProjectAs updates currentPath and clears dirty flag', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, path: '/tmp/my.studioflow' });

    await usePersistenceStore.getState().saveProjectAs('/tmp/my.studioflow');

    const { currentPath, isDirty, isSaving } = usePersistenceStore.getState();
    expect(currentPath).toBe('/tmp/my.studioflow');
    expect(isDirty).toBe(false);
    expect(isSaving).toBe(false);
  });

  it('saveProjectAs adds entry to recentProjects', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true });

    await usePersistenceStore.getState().saveProjectAs('/tmp/proj.studioflow');

    const { recentProjects } = usePersistenceStore.getState();
    expect(recentProjects).toHaveLength(1);
    expect(recentProjects[0].path).toBe('/tmp/proj.studioflow');
  });

  it('saveProject with no currentPath sets lastError (no throw)', async () => {
    // currentPath is null after newProject
    await usePersistenceStore.getState().saveProject();

    expect(usePersistenceStore.getState().lastError).toBeTruthy();
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('saveProjectAs sets lastError and re-throws when backend returns failure', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'disk full' });

    await expect(
      usePersistenceStore.getState().saveProjectAs('/tmp/fail.studioflow'),
    ).rejects.toThrow('disk full');

    expect(usePersistenceStore.getState().lastError).toBe('disk full');
    expect(usePersistenceStore.getState().isSaving).toBe(false);
  });
});

describe('persistenceStore — openProject', () => {
  it('calls invoke("load_project") with path', async () => {
    mockInvoke.mockResolvedValueOnce(sampleProjectFile());

    await usePersistenceStore.getState().openProject('/tmp/my.studioflow');

    expect(mockInvoke).toHaveBeenCalledWith('load_project', {
      path: '/tmp/my.studioflow',
    });
  });

  it('loads project and layers into documentStore', async () => {
    const file = {
      ...sampleProjectFile(),
      layers: [
        { id: 'layer-1', name: 'Background', visible: true, locked: false, order: 0, items: [] },
      ],
    };
    mockInvoke.mockResolvedValueOnce(file);

    await usePersistenceStore.getState().openProject('/tmp/my.studioflow');

    const doc = useDocumentStore.getState();
    expect(doc.project?.name).toBe('Test Project');
    expect(doc.layers).toHaveLength(1);
    expect(doc.layers[0].name).toBe('Background');
  });

  it('marks state clean and sets currentPath after open', async () => {
    mockInvoke.mockResolvedValueOnce(sampleProjectFile());

    await usePersistenceStore.getState().openProject('/tmp/my.studioflow');

    const { currentPath, isDirty, isLoading } = usePersistenceStore.getState();
    expect(currentPath).toBe('/tmp/my.studioflow');
    expect(isDirty).toBe(false);
    expect(isLoading).toBe(false);
  });

  it('adds entry to recentProjects', async () => {
    mockInvoke.mockResolvedValueOnce(sampleProjectFile());

    await usePersistenceStore.getState().openProject('/tmp/my.studioflow');

    const { recentProjects } = usePersistenceStore.getState();
    expect(recentProjects).toHaveLength(1);
    expect(recentProjects[0].name).toBe('Test Project');
    expect(recentProjects[0].path).toBe('/tmp/my.studioflow');
  });

  it('sets lastError and re-throws on invoke failure', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('file not found'));

    await expect(
      usePersistenceStore.getState().openProject('/bad/path.studioflow'),
    ).rejects.toThrow('file not found');

    expect(usePersistenceStore.getState().lastError).toBe('file not found');
    expect(usePersistenceStore.getState().isLoading).toBe(false);
  });

  it('throws when returned data is missing project field', async () => {
    mockInvoke.mockResolvedValueOnce({ schemaVersion: 1, layers: [] }); // no project

    await expect(
      usePersistenceStore.getState().openProject('/bad.studioflow'),
    ).rejects.toThrow();

    expect(usePersistenceStore.getState().lastError).toBeTruthy();
  });
});

describe('persistenceStore — loadRecentProjects', () => {
  it('populates recentProjects from invoke result', async () => {
    const recents = [
      { id: 'r1', name: 'Proj A', path: '/a.studioflow', lastOpenedAt: '2026-01-01T00:00:00Z' },
      { id: 'r2', name: 'Proj B', path: '/b.studioflow', lastOpenedAt: '2026-01-02T00:00:00Z' },
    ];
    mockInvoke.mockResolvedValueOnce(recents);

    await usePersistenceStore.getState().loadRecentProjects();

    expect(mockInvoke).toHaveBeenCalledWith('get_recent_projects');
    const { recentProjects } = usePersistenceStore.getState();
    expect(recentProjects).toHaveLength(2);
    expect(recentProjects[0].name).toBe('Proj A');
  });

  it('sets lastError (does not throw) when invoke fails', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('db error'));

    await usePersistenceStore.getState().loadRecentProjects(); // should not throw

    expect(usePersistenceStore.getState().lastError).toBe('db error');
  });
});

describe('persistenceStore — reset', () => {
  it('clears all state back to initial values', async () => {
    mockInvoke.mockResolvedValueOnce(sampleProjectFile());
    await usePersistenceStore.getState().newProject('X');
    mockInvoke.mockResolvedValueOnce({ success: true });
    await usePersistenceStore.getState().saveProjectAs('/tmp/x.studioflow');

    usePersistenceStore.getState().reset();

    const state = usePersistenceStore.getState();
    expect(state.currentPath).toBeNull();
    expect(state.isDirty).toBe(false);
    expect(state.lastSavedAt).toBeNull();
    expect(state.lastModifiedAt).toBeNull();
    expect(state.recentProjects).toHaveLength(0);
    expect(state.isSaving).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.lastError).toBeNull();
  });
});
