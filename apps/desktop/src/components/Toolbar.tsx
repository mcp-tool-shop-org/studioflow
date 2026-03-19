import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useWorkspaceStore, useDocumentStore, useSelectionStore } from '@studioflow/state';
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

  // Subscribe to selection state for reactive toolbar rendering
  const { selectedLayerId, selectedItemIds } = useSelectionStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Never steal keystrokes from text inputs / textareas
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Read latest store state at event time (avoids stale closures)
      const sel = useSelectionStore.getState();
      const { selectedLayerId: layerId, selectedItemIds: itemIds } = sel;
      const docLayers = useDocumentStore.getState().layers;

      // ── Undo / Redo ────────────────────────────────────────────────────
      if (e.ctrlKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
          return;
        }
        if (e.key === 'Z' && e.shiftKey) {
          e.preventDefault();
          redo();
          return;
        }

        // ── Duplicate selected (Ctrl+D) ─────────────────────────────────
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          if (layerId && itemIds.length > 0) {
            const layer = docLayers.find((l) => l.id === layerId);
            if (layer) {
              const items = layer.items.filter((i) => itemIds.includes(i.id));
              for (const item of items) {
                dispatch('item:add', {
                  layerId,
                  item: {
                    name: `${item.name} copy`,
                    type: item.type,
                    x: item.x + 20,
                    y: item.y + 20,
                    width: item.width,
                    height: item.height,
                    rotation: item.rotation,
                    data: { ...item.data },
                  },
                });
              }
            }
          }
          return;
        }

        // ── Select all (Ctrl+A) — select every item on active layer ─────
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          if (layerId) {
            const layer = docLayers.find((l) => l.id === layerId);
            if (layer) {
              sel.selectItems(layer.items.map((i) => i.id));
            }
          }
          return;
        }
      }

      // ── Delete / Backspace: delete selected items ──────────────────────
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (layerId && itemIds.length > 0) {
          e.preventDefault();
          // Snapshot ids before the dispatch loop (store mutates as we go)
          const ids = [...itemIds];
          for (const itemId of ids) {
            dispatch('item:delete', { layerId, itemId });
          }
        }
        return;
      }

      // ── Escape: clear selection ────────────────────────────────────────
      if (e.key === 'Escape') {
        sel.clearSelection();
        return;
      }

      // ── Arrow keys: nudge selected items ──────────────────────────────
      const nudgePx = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        dx = -nudgePx;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        dx = nudgePx;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        dy = -nudgePx;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        dy = nudgePx;
      }

      if ((dx !== 0 || dy !== 0) && layerId && itemIds.length > 0) {
        const layer = docLayers.find((l) => l.id === layerId);
        if (layer) {
          const items = layer.items.filter((i) => itemIds.includes(i.id));
          for (const item of items) {
            dispatch('item:move', {
              layerId,
              itemId: item.id,
              x: item.x + dx,
              y: item.y + dy,
            });
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, dispatch]);

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

  function handleDuplicateSelected() {
    if (!selectedLayerId || selectedItemIds.length === 0) return;
    const docLayers = useDocumentStore.getState().layers;
    const layer = docLayers.find((l) => l.id === selectedLayerId);
    if (!layer) return;
    const items = layer.items.filter((i) => selectedItemIds.includes(i.id));
    for (const item of items) {
      dispatch('item:add', {
        layerId: selectedLayerId,
        item: {
          name: `${item.name} copy`,
          type: item.type,
          x: item.x + 20,
          y: item.y + 20,
          width: item.width,
          height: item.height,
          rotation: item.rotation,
          data: { ...item.data },
        },
      });
    }
  }

  function handleDeleteSelected() {
    if (!selectedLayerId || selectedItemIds.length === 0) return;
    const ids = [...selectedItemIds];
    for (const itemId of ids) {
      dispatch('item:delete', { layerId: selectedLayerId, itemId });
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
            <kbd className="toolbar__shortcut-hint">Ctrl+Z</kbd>
          </button>
          <button
            className="toolbar__btn toolbar__btn--history"
            onClick={redo}
            disabled={!canRedo}
            title={redoLabel ?? 'Redo'}
            aria-label={redoLabel ?? 'Redo'}
          >
            ↪ Redo
            <kbd className="toolbar__shortcut-hint">Ctrl+⇧Z</kbd>
          </button>
        </div>

        {selectedItemIds.length > 0 && (
          <>
            <div className="toolbar__separator" />
            <div className="toolbar__section toolbar__section--selection">
              <span className="toolbar__selection-info">
                {selectedItemIds.length} selected
              </span>
              <button
                className="toolbar__btn toolbar__btn--action"
                onClick={handleDuplicateSelected}
                title="Duplicate selected items (Ctrl+D)"
                aria-label="Duplicate selected"
              >
                Duplicate
                <kbd className="toolbar__shortcut-hint">Ctrl+D</kbd>
              </button>
              <button
                className="toolbar__btn toolbar__btn--danger"
                onClick={handleDeleteSelected}
                title="Delete selected items (Delete)"
                aria-label="Delete selected"
              >
                Delete
                <kbd className="toolbar__shortcut-hint">Del</kbd>
              </button>
            </div>
          </>
        )}

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
