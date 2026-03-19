import { useState, useRef } from 'react';
import { useDocumentStore, useSelectionStore, useCommandStore } from '@studioflow/state';

export default function LayersPanel() {
  const layers = useDocumentStore((s) => s.layers);
  const { selectedLayerId, selectLayer } = useSelectionStore();
  const dispatch = useCommandStore((s) => s.dispatch);

  // Inline rename state: layerId -> current draft value, or null when not editing
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  function handleVisibilityToggle(e: React.MouseEvent, layerId: string) {
    e.stopPropagation();
    dispatch('layer:toggle-visibility', { layerId });
  }

  function handleLockToggle(e: React.MouseEvent, layerId: string) {
    e.stopPropagation();
    dispatch('layer:toggle-lock', { layerId });
  }

  function handleDeleteLayer(e: React.MouseEvent, layerId: string) {
    e.stopPropagation();
    dispatch('layer:delete', { layerId });
  }

  function handleReorderUp(e: React.MouseEvent, layerId: string) {
    e.stopPropagation();
    const sorted = [...layers].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((l) => l.id === layerId);
    if (idx <= 0) return;
    // Swap orders with the layer above
    const current = sorted[idx];
    const above = sorted[idx - 1];
    dispatch('layer:reorder', { layerId: current.id, newOrder: above.order });
    dispatch('layer:reorder', { layerId: above.id, newOrder: current.order });
  }

  function handleReorderDown(e: React.MouseEvent, layerId: string) {
    e.stopPropagation();
    const sorted = [...layers].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((l) => l.id === layerId);
    if (idx < 0 || idx >= sorted.length - 1) return;
    // Swap orders with the layer below
    const current = sorted[idx];
    const below = sorted[idx + 1];
    dispatch('layer:reorder', { layerId: current.id, newOrder: below.order });
    dispatch('layer:reorder', { layerId: below.id, newOrder: current.order });
  }

  function handleAddLayer() {
    dispatch('layer:create', {});
  }

  function startRename(e: React.MouseEvent, layerId: string, currentName: string) {
    e.stopPropagation();
    setRenamingId(layerId);
    setRenameValue(currentName);
    // Focus the input after React renders it
    setTimeout(() => renameInputRef.current?.focus(), 0);
  }

  function commitRename(layerId: string) {
    const trimmed = renameValue.trim();
    if (trimmed) {
      dispatch('layer:rename', { layerId, name: trimmed });
    }
    setRenamingId(null);
  }

  function handleRenameKeyDown(e: React.KeyboardEvent, layerId: string) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename(layerId);
    } else if (e.key === 'Escape') {
      setRenamingId(null);
    }
  }

  const sortedLayers = [...layers].sort((a, b) => a.order - b.order);

  return (
    <aside className="panel layers-panel" aria-label="Layers panel">
      <div className="panel__header">
        <span className="panel__title">Layers</span>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
          {layers.length}
        </span>
      </div>

      <div className="panel__body">
        {sortedLayers.length === 0 ? (
          <div style={{
            padding: '24px 12px',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontSize: '12px',
          }}>
            No layers yet
          </div>
        ) : (
          <ul className="layer-list" role="listbox" aria-label="Layer list">
            {sortedLayers.map((layer, idx) => (
              <li
                key={layer.id}
                role="option"
                aria-selected={selectedLayerId === layer.id}
                className={[
                  'layer-item',
                  selectedLayerId === layer.id ? 'layer-item--selected' : '',
                  !layer.visible ? 'layer-item--hidden' : '',
                  layer.locked ? 'layer-item--locked' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => selectLayer(layer.id)}
              >
                {/* Visibility toggle */}
                <button
                  className={`layer-item__visibility-btn${!layer.visible ? ' layer-item__visibility-btn--hidden' : ''}`}
                  onClick={(e) => handleVisibilityToggle(e, layer.id)}
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                  aria-label={`${layer.visible ? 'Hide' : 'Show'} layer ${layer.name}`}
                >
                  {layer.visible ? '●' : '○'}
                </button>

                {/* Layer name — double-click to rename */}
                {renamingId === layer.id ? (
                  <input
                    ref={renameInputRef}
                    className="layer-item__rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(layer.id)}
                    onKeyDown={(e) => handleRenameKeyDown(e, layer.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Rename layer ${layer.name}`}
                  />
                ) : (
                  <span
                    className="layer-item__name"
                    title={layer.name}
                    onDoubleClick={(e) => startRename(e, layer.id, layer.name)}
                  >
                    {layer.name}
                    {layer.locked && (
                      <span className="layer-item__locked-badge">(locked)</span>
                    )}
                  </span>
                )}

                {/* Lock toggle */}
                <button
                  className={`layer-item__icon-btn${layer.locked ? ' layer-item__icon-btn--active' : ''}`}
                  onClick={(e) => handleLockToggle(e, layer.id)}
                  title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                  aria-label={`${layer.locked ? 'Unlock' : 'Lock'} layer ${layer.name}`}
                >
                  {layer.locked ? '🔒' : '🔓'}
                </button>

                {/* Reorder up */}
                <button
                  className="layer-item__icon-btn"
                  onClick={(e) => handleReorderUp(e, layer.id)}
                  title="Move layer up"
                  aria-label={`Move layer ${layer.name} up`}
                  disabled={idx === 0}
                >
                  ▲
                </button>

                {/* Reorder down */}
                <button
                  className="layer-item__icon-btn"
                  onClick={(e) => handleReorderDown(e, layer.id)}
                  title="Move layer down"
                  aria-label={`Move layer ${layer.name} down`}
                  disabled={idx === sortedLayers.length - 1}
                >
                  ▼
                </button>

                {/* Delete layer */}
                <button
                  className="layer-item__icon-btn layer-item__icon-btn--danger"
                  onClick={(e) => handleDeleteLayer(e, layer.id)}
                  title="Delete layer"
                  aria-label={`Delete layer ${layer.name}`}
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel__footer">
        <button
          className="panel-add-btn"
          onClick={handleAddLayer}
          aria-label="Add new layer"
        >
          + Add Layer
        </button>
      </div>
    </aside>
  );
}
