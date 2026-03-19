import { useRef } from 'react';
import { open, save } from '@tauri-apps/plugin-dialog';
import { usePersistenceStore } from '@studioflow/state';
import { useDocumentStore } from '@studioflow/state';

// Graceful fallback when @tauri-apps/plugin-dialog is not available (dev / test)
async function pickOpenPath(): Promise<string | null> {
  try {
    const result = await open({
      filters: [{ name: 'StudioFlow Project', extensions: ['studioflow'] }],
      multiple: false,
    });
    if (typeof result === 'string') return result;
    if (Array.isArray(result) && result.length > 0) return result[0];
    return null;
  } catch {
    // Fallback to prompt
    return window.prompt('Enter file path to open:') ?? null;
  }
}

async function pickSavePath(defaultName: string): Promise<string | null> {
  try {
    const result = await save({
      filters: [{ name: 'StudioFlow Project', extensions: ['studioflow'] }],
      defaultPath: `${defaultName}.studioflow`,
    });
    return result ?? null;
  } catch {
    return window.prompt('Enter file path to save:') ?? null;
  }
}

export default function ProjectBar() {
  const {
    currentPath,
    isDirty,
    isSaving,
    isLoading,
    lastError,
    newProject,
    saveProject,
    saveProjectAs,
    openProject,
  } = usePersistenceStore();

  const project = useDocumentStore((s) => s.project);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const projectName = project?.name ?? 'Untitled';
  const busy = isSaving || isLoading;

  async function handleNew() {
    const name = window.prompt('Project name:', 'My Project') ?? 'My Project';
    if (name.trim() === '') return;
    try {
      await newProject(name.trim());
    } catch {
      // error is surfaced via lastError
    }
  }

  async function handleOpen() {
    const path = await pickOpenPath();
    if (!path) return;
    try {
      await openProject(path);
    } catch {
      // error is surfaced via lastError
    }
  }

  async function handleSave() {
    if (!currentPath) {
      await handleSaveAs();
      return;
    }
    try {
      await saveProject();
    } catch {
      // error is surfaced via lastError
    }
  }

  async function handleSaveAs() {
    const defaultName = project?.name ?? 'Untitled';
    const path = await pickSavePath(defaultName);
    if (!path) return;
    try {
      await saveProjectAs(path);
    } catch {
      // error is surfaced via lastError
    }
  }

  return (
    <div className="project-bar" role="region" aria-label="Project controls">
      {/* Project name + dirty indicator */}
      <div className="project-bar__name-area">
        <span className="project-bar__name" title={currentPath ?? 'Unsaved project'}>
          {projectName}
        </span>
        {isDirty && (
          <span
            className="project-bar__dirty-dot"
            title="Unsaved changes"
            aria-label="Unsaved changes"
          >
            ●
          </span>
        )}
      </div>

      {/* File path */}
      <span
        className="project-bar__path"
        title={currentPath ?? undefined}
      >
        {currentPath
          ? currentPath.split(/[\\/]/).pop()
          : 'Untitled'}
      </span>

      {/* Divider */}
      <div className="project-bar__sep" />

      {/* Action buttons */}
      <div className="project-bar__actions">
        <button
          className="project-bar__btn"
          onClick={handleNew}
          disabled={busy}
          title="New project"
        >
          New
        </button>
        <button
          className="project-bar__btn"
          onClick={handleOpen}
          disabled={busy}
          title="Open project"
        >
          Open
        </button>
        <button
          className={`project-bar__btn${isDirty ? ' project-bar__btn--dirty' : ''}`}
          onClick={handleSave}
          disabled={busy || (!isDirty && !!currentPath)}
          title="Save project"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
        <button
          className="project-bar__btn"
          onClick={handleSaveAs}
          disabled={busy}
          title="Save project as…"
        >
          Save As
        </button>
      </div>

      {/* Spinner */}
      {busy && (
        <span className="project-bar__spinner" role="status" aria-live="polite">
          {isLoading ? 'Loading…' : 'Saving…'}
        </span>
      )}

      {/* Error */}
      {lastError && (
        <span className="project-bar__error" role="alert" title={lastError}>
          {lastError}
        </span>
      )}

      <input ref={nameInputRef} type="hidden" />
    </div>
  );
}
