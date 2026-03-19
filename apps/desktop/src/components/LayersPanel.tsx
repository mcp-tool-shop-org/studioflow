import { useDocumentStore, useSelectionStore, useCommandStore } from '@studioflow/state';

export default function LayersPanel() {
  const layers = useDocumentStore((s) => s.layers);
  const { selectedLayerId, selectLayer } = useSelectionStore();
  const dispatch = useCommandStore((s) => s.dispatch);

  function handleVisibilityToggle(e: React.MouseEvent, layerId: string) {
    e.stopPropagation();
    dispatch('layer:toggle-visibility', { layerId });
  }

  function handleAddLayer() {
    dispatch('layer:create', {});
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
            {sortedLayers.map((layer) => (
              <li
                key={layer.id}
                role="option"
                aria-selected={selectedLayerId === layer.id}
                className={[
                  'layer-item',
                  selectedLayerId === layer.id ? 'layer-item--selected' : '',
                  !layer.visible ? 'layer-item--hidden' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => selectLayer(layer.id)}
              >
                <button
                  className={`layer-item__visibility-btn${!layer.visible ? ' layer-item__visibility-btn--hidden' : ''}`}
                  onClick={(e) => handleVisibilityToggle(e, layer.id)}
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                  aria-label={`${layer.visible ? 'Hide' : 'Show'} layer ${layer.name}`}
                >
                  {layer.visible ? '●' : '○'}
                </button>
                <span className="layer-item__name" title={layer.name}>
                  {layer.name}
                </span>
                {layer.locked && (
                  <span
                    style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}
                    title="Layer is locked"
                  >
                    🔒
                  </span>
                )}
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
