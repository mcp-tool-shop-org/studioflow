import { useRef } from 'react';
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

interface DragState {
  itemId: string;
  layerId: string;
  startMouseX: number;
  startMouseY: number;
  startItemX: number;
  startItemY: number;
}

export default function Canvas() {
  const layers = useDocumentStore((s) => s.layers);
  const { selectedLayerId, selectedItemIds, selectItem } = useSelectionStore();
  const dispatch = useCommandStore((s) => s.dispatch);

  // Drag state tracked in a ref to avoid re-renders during drag
  const dragRef = useRef<DragState | null>(null);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;

  // Only render items from visible layers; the canvas shows all visible layers' items
  // but interaction is constrained to the selected layer.
  const visibleLayers = layers.filter((l) => l.visible);

  function handleAddItem() {
    if (!selectedLayerId) return;
    const { layerId, item } = makeDefaultItem(selectedLayerId);
    dispatch('item:add', { layerId, item });
  }

  function handleItemClick(e: React.MouseEvent, itemId: string, layerLocked: boolean) {
    e.stopPropagation();
    if (layerLocked) return; // locked layers: no item selection
    selectItem(itemId);
  }

  function handleCanvasClick() {
    // Clear item selection on empty canvas click
    selectItem('');
  }

  // ----------------------------------------------------------------
  // Drag-to-move
  // ----------------------------------------------------------------
  function handleItemMouseDown(
    e: React.MouseEvent,
    itemId: string,
    layerId: string,
    itemX: number,
    itemY: number,
    layerLocked: boolean,
  ) {
    if (layerLocked) return;
    e.stopPropagation();
    e.preventDefault();

    dragRef.current = {
      itemId,
      layerId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startItemX: itemX,
      startItemY: itemY,
    };

    // Select the item on mousedown so it is immediately highlighted
    selectItem(itemId);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(e: MouseEvent) {
    const drag = dragRef.current;
    if (!drag) return;

    const dx = e.clientX - drag.startMouseX;
    const dy = e.clientY - drag.startMouseY;

    // Live update via item:move command so the canvas re-renders at the new position
    dispatch('item:move', {
      layerId: drag.layerId,
      itemId: drag.itemId,
      x: drag.startItemX + dx,
      y: drag.startItemY + dy,
    });
  }

  function handleMouseUp(e: MouseEvent) {
    const drag = dragRef.current;
    if (!drag) {
      cleanup();
      return;
    }

    const dx = e.clientX - drag.startMouseX;
    const dy = e.clientY - drag.startMouseY;

    dispatch('item:move', {
      layerId: drag.layerId,
      itemId: drag.itemId,
      x: drag.startItemX + dx,
      y: drag.startItemY + dy,
    });

    dragRef.current = null;
    cleanup();
  }

  function cleanup() {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }

  return (
    <main className="canvas-panel" aria-label="Canvas">
      <div className="canvas-panel__header">
        <span className="canvas-panel__title">Canvas</span>
        {selectedLayer && (
          <span className="canvas-panel__layer-name">
            {selectedLayer.name}
            {selectedLayer.locked && (
              <span className="canvas-panel__layer-locked"> — locked</span>
            )}
          </span>
        )}
      </div>

      <div className="canvas-area" onClick={handleCanvasClick}>
        {visibleLayers.length === 0 ? (
          <div className="canvas-empty">
            <span className="canvas-empty__icon">⬚</span>
            <span>
              {layers.length === 0
                ? 'Select a layer to view its contents'
                : 'All layers are hidden'}
            </span>
          </div>
        ) : (
          visibleLayers.map((layer) =>
            layer.items.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              const isLocked = layer.locked;

              return (
                <div
                  key={item.id}
                  className={[
                    'canvas-item',
                    isSelected ? 'canvas-item--selected' : '',
                    isLocked ? 'canvas-item--locked' : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                    left: item.x,
                    top: item.y,
                    width: item.width,
                    height: item.height,
                    transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
                  }}
                  onClick={(e) => handleItemClick(e, item.id, isLocked)}
                  onMouseDown={(e) =>
                    handleItemMouseDown(e, item.id, layer.id, item.x, item.y, isLocked)
                  }
                  role="button"
                  tabIndex={isLocked ? -1 : 0}
                  aria-label={`Item: ${item.name}${isLocked ? ' (locked)' : ''}`}
                  aria-pressed={isSelected}
                  onKeyDown={(e) => {
                    if (!isLocked && (e.key === 'Enter' || e.key === ' ')) {
                      selectItem(item.id);
                    }
                  }}
                >
                  <span className="canvas-item__name">{item.name}</span>
                  <span className="canvas-item__type">{item.type}</span>
                  {isLocked && (
                    <span className="canvas-item__locked-icon" title="Layer locked">🔒</span>
                  )}
                </div>
              );
            })
          )
        )}

        {selectedLayer && !selectedLayer.locked && (
          <button
            className="canvas-add-btn"
            onClick={(e) => { e.stopPropagation(); handleAddItem(); }}
            aria-label="Add item to selected layer"
          >
            + Add Item
          </button>
        )}
      </div>
    </main>
  );
}
