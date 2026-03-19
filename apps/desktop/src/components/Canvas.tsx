import { useDocumentStore, useSelectionStore, useCommandStore } from '@studioflow/state';

let itemCounter = 0;

function makeDefaultItem(layerId: string) {
  itemCounter += 1;
  const col = (itemCounter - 1) % 4;
  const row = Math.floor((itemCounter - 1) / 4);
  return {
    layerId,
    item: {
      name: `Item ${itemCounter}`,
      type: 'shape' as const,
      x: 24 + col * 160,
      y: 24 + row * 120,
      width: 128,
      height: 96,
      rotation: 0,
      data: {},
    },
  };
}

export default function Canvas() {
  const layers = useDocumentStore((s) => s.layers);
  const { selectedLayerId, selectedItemIds, selectItem } = useSelectionStore();
  const dispatch = useCommandStore((s) => s.dispatch);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;

  function handleAddItem() {
    if (!selectedLayerId) return;
    const { layerId, item } = makeDefaultItem(selectedLayerId);
    dispatch('item:add', { layerId, item });
  }

  function handleItemClick(e: React.MouseEvent, itemId: string) {
    e.stopPropagation();
    selectItem(itemId);
  }

  return (
    <main className="canvas-panel" aria-label="Canvas">
      <div className="canvas-panel__header">
        <span className="canvas-panel__title">Canvas</span>
        {selectedLayer && (
          <span className="canvas-panel__layer-name">{selectedLayer.name}</span>
        )}
      </div>

      <div className="canvas-area" onClick={() => selectItem('')}>
        {!selectedLayer ? (
          <div className="canvas-empty">
            <span className="canvas-empty__icon">⬚</span>
            <span>Select a layer to view its contents</span>
          </div>
        ) : selectedLayer.items.length === 0 ? (
          <div className="canvas-empty">
            <span className="canvas-empty__icon">+</span>
            <span>No items in this layer</span>
            <span style={{ fontSize: '11px' }}>Click "Add Item" to get started</span>
          </div>
        ) : (
          selectedLayer.items.map((item) => (
            <div
              key={item.id}
              className={[
                'canvas-item',
                selectedItemIds.includes(item.id) ? 'canvas-item--selected' : '',
              ].filter(Boolean).join(' ')}
              style={{
                left: item.x,
                top: item.y,
                width: item.width,
                height: item.height,
                transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
              }}
              onClick={(e) => handleItemClick(e, item.id)}
              role="button"
              tabIndex={0}
              aria-label={`Item: ${item.name}`}
              aria-pressed={selectedItemIds.includes(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') selectItem(item.id);
              }}
            >
              <span className="canvas-item__name">{item.name}</span>
              <span className="canvas-item__type">{item.type}</span>
            </div>
          ))
        )}

        {selectedLayer && (
          <button
            className="canvas-add-btn"
            onClick={handleAddItem}
            aria-label="Add item to selected layer"
          >
            + Add Item
          </button>
        )}
      </div>
    </main>
  );
}
