import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useWorkspaceStore } from '@studioflow/state';
import { useCommandStore } from '@studioflow/state';
import { usePersistenceStore } from '@studioflow/state';
import { useHistoryStore } from '@studioflow/state';
import ProjectBar from './ProjectBar.js';

interface PingResponse {
  pong: boolean;
  message: string;
  timestamp: string;
}

export default function Toolbar() {
  const { panels, togglePanel } = useWorkspaceStore();
  const dispatch = useCommandStore((s) => s.dispatch);
  const isDirty = usePersistenceStore((s) => s.isDirty);
  const { canUndo, canRedo, undoLabel, redoLabel, undo, redo } = useHistoryStore();
  const [pingResult, setPingResult] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.ctrlKey) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key === 'Z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  function handleNewLayer() {
    dispatch('layer:create', {});
  }

  async function handlePing() {
    try {
      const result = await invoke<PingResponse>('ping');
      setPingResult(result.message);
      setTimeout(() => setPingResult(null), 2500);
    } catch {
      setPingResult('error');
      setTimeout(() => setPingResult(null), 2500);
    }
  }

  return (
    <div className="toolbar-shell">
      {/* Main toolbar row */}
      <div className="toolbar" role="toolbar" aria-label="Main toolbar">
        <span className={`toolbar__title${isDirty ? ' toolbar__title--dirty' : ''}`}>
          StudioFlow{isDirty ? ' *' : ''}
        </span>

        <div className="toolbar__separator" />

        <div className="toolbar__section">
          <button
            className={`toolbar__btn${panels.layers ? ' toolbar__btn--active' : ''}`}
            onClick={() => togglePanel('layers')}
            aria-pressed={panels.layers}
            title="Toggle Layers panel"
          >
            Layers
          </button>
          <button
            className={`toolbar__btn${panels.inspector ? ' toolbar__btn--active' : ''}`}
            onClick={() => togglePanel('inspector')}
            aria-pressed={panels.inspector}
            title="Toggle Inspector panel"
          >
            Inspector
          </button>
        </div>

        <div className="toolbar__separator" />

        <div className="toolbar__section">
          <button
            className="toolbar__btn toolbar__btn--action"
            onClick={handleNewLayer}
            title="Create a new layer"
          >
            + New Layer
          </button>
        </div>

        <div className="toolbar__separator" />

        <div className="toolbar__section">
          <button
            className="toolbar__btn toolbar__btn--history"
            onClick={undo}
            disabled={!canUndo}
            title={undoLabel ?? 'Undo'}
            aria-label={undoLabel ?? 'Undo'}
          >
            ↩ Undo
          </button>
          <button
            className="toolbar__btn toolbar__btn--history"
            onClick={redo}
            disabled={!canRedo}
            title={redoLabel ?? 'Redo'}
            aria-label={redoLabel ?? 'Redo'}
          >
            ↪ Redo
          </button>
        </div>

        <div className="toolbar__section toolbar__section--right">
          {pingResult !== null && (
            <span className="toolbar__ping-result" role="status">
              {pingResult}
            </span>
          )}
          <button
            className="toolbar__btn toolbar__btn--ping"
            onClick={handlePing}
            title="Ping Tauri backend"
          >
            Ping
          </button>
        </div>
      </div>

      {/* Project bar sub-row */}
      <ProjectBar />
    </div>
  );
}
