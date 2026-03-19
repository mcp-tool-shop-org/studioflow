import { useDocumentStore, useSelectionStore, useCommandStore } from '@studioflow/state';

export default function Inspector() {
  const layers = useDocumentStore((s) => s.layers);
  const { selectedLayerId, selectedItemIds } = useSelectionStore();
  const dispatch = useCommandStore((s) => s.dispatch);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;

  const selectedItems = selectedLayer
    ? selectedLayer.items.filter((i) => selectedItemIds.includes(i.id))
    : [];

  const singleItem = selectedItems.length === 1 ? selectedItems[0] : null;

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!singleItem || !selectedLayerId) return;
    dispatch('item:update', {
      layerId: selectedLayerId,
      itemId: singleItem.id,
      patch: { name: e.target.value },
    });
  }

  return (
    <aside className="panel inspector-panel" aria-label="Inspector panel">
      <div className="panel__header">
        <span className="panel__title">Inspector</span>
      </div>

      <div className="panel__body">
        {!singleItem ? (
          <div className="inspector-empty">
            {selectedItems.length > 1 ? (
              <span>{selectedItems.length} items selected</span>
            ) : (
              <>
                <span style={{ fontSize: '20px', opacity: 0.3 }}>◻</span>
                <span>Nothing selected</span>
                <span style={{ fontSize: '11px' }}>
                  Click an item on the canvas to inspect it
                </span>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="inspector-section">
              <div className="inspector-section__label">Identity</div>

              <div className="inspector-field">
                <span className="inspector-field__label">Name</span>
                <input
                  className="inspector-field__input"
                  type="text"
                  value={singleItem.name}
                  onChange={handleNameChange}
                  aria-label="Item name"
                />
              </div>

              <div className="inspector-field">
                <span className="inspector-field__label">Type</span>
                <span className="inspector-field__type-badge">{singleItem.type}</span>
              </div>

              <div className="inspector-field">
                <span className="inspector-field__label">ID</span>
                <span
                  className="inspector-field__value"
                  style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}
                >
                  {singleItem.id}
                </span>
              </div>
            </div>

            <div className="inspector-section">
              <div className="inspector-section__label">Position &amp; Size</div>
              <div className="inspector-grid">
                <div className="inspector-grid-field">
                  <span className="inspector-grid-field__label">X</span>
                  <span className="inspector-grid-field__value">{singleItem.x}</span>
                </div>
                <div className="inspector-grid-field">
                  <span className="inspector-grid-field__label">Y</span>
                  <span className="inspector-grid-field__value">{singleItem.y}</span>
                </div>
                <div className="inspector-grid-field">
                  <span className="inspector-grid-field__label">W</span>
                  <span className="inspector-grid-field__value">{singleItem.width}</span>
                </div>
                <div className="inspector-grid-field">
                  <span className="inspector-grid-field__label">H</span>
                  <span className="inspector-grid-field__value">{singleItem.height}</span>
                </div>
              </div>
            </div>

            {singleItem.rotation !== 0 && (
              <div className="inspector-section">
                <div className="inspector-section__label">Transform</div>
                <div className="inspector-field">
                  <span className="inspector-field__label">Rotation</span>
                  <span className="inspector-field__value">{singleItem.rotation}°</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
