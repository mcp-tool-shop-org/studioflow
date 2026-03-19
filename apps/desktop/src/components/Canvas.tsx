import { useRef, useState } from 'react';
import {
  useDocumentStore,
  useSelectionStore,
  useCommandStore,
  useViewportStore,
} from '@studioflow/state';

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
      fill: '#2a2a38',
      data: {},
    },
  };
}

interface ItemDragState {
  itemId: string;
  layerId: string;
  startMouseX: number;
  startMouseY: number;
  startItemX: number;
  startItemY: number;
}

interface MarqueeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function Canvas() {
  const layers = useDocumentStore((s) => s.layers);
  const { selectedLayerId, selectedItemIds, selectItem } = useSelectionStore();
  const dispatch = useCommandStore((s) => s.dispatch);
  const { zoom, panX, panY, zoomIn, zoomOut, zoomReset, fitToCanvas } = useViewportStore();

  // Item drag tracked in a ref to avoid re-renders during drag
  const itemDragRef = useRef<ItemDragState | null>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const wasDraggingRef = useRef(false);

  const [marquee, setMarquee] = useState<MarqueeBox | null>(null);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;
  const visibleLayers = layers.filter((l) => l.visible);

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  function zoomPercent() {
    return `${Math.round(zoom * 100)}%`;
  }

  function handleFitToCanvas() {
    const el = canvasAreaRef.current;
    if (!el) return;

    const { layers: currentLayers } = useDocumentStore.getState();
    const visItems = currentLayers
      .filter((l) => l.visible)
      .flatMap((l) => l.items);

    if (visItems.length === 0) return;

    const { width, height } = el.getBoundingClientRect();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const item of visItems) {
      if (item.x < minX) minX = item.x;
      if (item.y < minY) minY = item.y;
      if (item.x + item.width > maxX) maxX = item.x + item.width;
      if (item.y + item.height > maxY) maxY = item.y + item.height;
    }
    fitToCanvas(width, height, { x: minX, y: minY, width: maxX - minX, height: maxY - minY });
  }

  function handleAddItem() {
    if (!selectedLayerId) return;
    const { layerId, item } = makeDefaultItem(selectedLayerId);
    dispatch('item:add', { layerId, item });
  }

  function handleItemClick(e: React.MouseEvent, itemId: string, layerLocked: boolean) {
    e.stopPropagation();
    if (layerLocked) return;
    selectItem(itemId);
  }

  function handleCanvasClick() {
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      return;
    }
    selectItem('');
  }

  // ----------------------------------------------------------------
  // Wheel zoom
  // ----------------------------------------------------------------
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  }

  // ----------------------------------------------------------------
  // Canvas mousedown: start pan (middle-click / Alt+left) or marquee
  // ----------------------------------------------------------------
  function handleCanvasMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const isPan = e.button === 1 || (e.button === 0 && e.altKey);

    if (isPan) {
      e.preventDefault();
      let lastX = e.clientX;
      let lastY = e.clientY;

      function onPanMove(me: MouseEvent) {
        const dx = me.clientX - lastX;
        const dy = me.clientY - lastY;
        if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
          wasDraggingRef.current = true;
        }
        useViewportStore.getState().panBy(dx, dy);
        lastX = me.clientX;
        lastY = me.clientY;
      }

      function onPanUp() {
        window.removeEventListener('mousemove', onPanMove);
        window.removeEventListener('mouseup', onPanUp);
      }

      window.addEventListener('mousemove', onPanMove);
      window.addEventListener('mouseup', onPanUp);
      return;
    }

    // Left-click on empty canvas → start marquee selection
    if (e.button === 0 && !e.altKey) {
      const areaEl = canvasAreaRef.current;
      if (!areaEl) return;
      const areaRect = areaEl.getBoundingClientRect();
      const startX = e.clientX - areaRect.left;
      const startY = e.clientY - areaRect.top;

      function onMarqueeMove(me: MouseEvent) {
        const nowRect = canvasAreaRef.current?.getBoundingClientRect();
        if (!nowRect) return;
        const cx = me.clientX - nowRect.left;
        const cy = me.clientY - nowRect.top;
        const dx = cx - startX;
        const dy = cy - startY;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          wasDraggingRef.current = true;
          setMarquee({
            x: Math.min(startX, cx),
            y: Math.min(startY, cy),
            width: Math.abs(dx),
            height: Math.abs(dy),
          });
        }
      }

      function onMarqueeUp(me: MouseEvent) {
        const nowRect = canvasAreaRef.current?.getBoundingClientRect();
        if (nowRect && wasDraggingRef.current) {
          const cx = me.clientX - nowRect.left;
          const cy = me.clientY - nowRect.top;
          const sx = Math.min(startX, cx);
          const sy = Math.min(startY, cy);
          const sw = Math.abs(cx - startX);
          const sh = Math.abs(cy - startY);

          if (sw > 3 && sh > 3) {
            const { panX: px, panY: py, zoom: z } = useViewportStore.getState();
            const contentX = (sx - px) / z;
            const contentY = (sy - py) / z;
            const contentW = sw / z;
            const contentH = sh / z;

            const { layers: docLayers } = useDocumentStore.getState();
            const visItems = docLayers
              .filter((l) => l.visible)
              .flatMap((l) =>
                l.items.map((item) => ({
                  id: item.id,
                  x: item.x,
                  y: item.y,
                  width: item.width,
                  height: item.height,
                })),
              );

            useSelectionStore.getState().selectByRect(
              { x: contentX, y: contentY, width: contentW, height: contentH },
              visItems,
            );
          }
        }

        setMarquee(null);
        window.removeEventListener('mousemove', onMarqueeMove);
        window.removeEventListener('mouseup', onMarqueeUp);
      }

      window.addEventListener('mousemove', onMarqueeMove);
      window.addEventListener('mouseup', onMarqueeUp);
    }
  }

  // ----------------------------------------------------------------
  // Drag-to-move items
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

    itemDragRef.current = {
      itemId,
      layerId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startItemX: itemX,
      startItemY: itemY,
    };

    // Select the item on mousedown so it is immediately highlighted
    selectItem(itemId);

    window.addEventListener('mousemove', handleItemMouseMove);
    window.addEventListener('mouseup', handleItemMouseUp);
  }

  function handleItemMouseMove(e: MouseEvent) {
    const drag = itemDragRef.current;
    if (!drag) return;

    const currentZoom = useViewportStore.getState().zoom;
    const dx = (e.clientX - drag.startMouseX) / currentZoom;
    const dy = (e.clientY - drag.startMouseY) / currentZoom;

    dispatch('item:move', {
      layerId: drag.layerId,
      itemId: drag.itemId,
      x: drag.startItemX + dx,
      y: drag.startItemY + dy,
    });
  }

  function handleItemMouseUp(e: MouseEvent) {
    const drag = itemDragRef.current;
    if (!drag) {
      cleanupItemDrag();
      return;
    }

    const currentZoom = useViewportStore.getState().zoom;
    const dx = (e.clientX - drag.startMouseX) / currentZoom;
    const dy = (e.clientY - drag.startMouseY) / currentZoom;

    dispatch('item:move', {
      layerId: drag.layerId,
      itemId: drag.itemId,
      x: drag.startItemX + dx,
      y: drag.startItemY + dy,
    });

    itemDragRef.current = null;
    cleanupItemDrag();
  }

  function cleanupItemDrag() {
    window.removeEventListener('mousemove', handleItemMouseMove);
    window.removeEventListener('mouseup', handleItemMouseUp);
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
        <div className="canvas-panel__controls">
          <span className="canvas-zoom-level" aria-label="Zoom level">{zoomPercent()}</span>
          <button
            className="canvas-ctrl-btn"
            onClick={handleFitToCanvas}
            title="Fit to canvas"
            aria-label="Fit to canvas"
          >
            Fit
          </button>
          <button
            className="canvas-ctrl-btn"
            onClick={zoomReset}
            title="Reset zoom"
            aria-label="Reset zoom"
          >
            Reset
          </button>
          <button
            className="canvas-ctrl-btn"
            onClick={zoomIn}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            className="canvas-ctrl-btn"
            onClick={zoomOut}
            aria-label="Zoom out"
          >
            −
          </button>
        </div>
      </div>

      <div
        className="canvas-area"
        ref={canvasAreaRef}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
      >
        {/* Transform container — viewport zoom+pan applied here */}
        <div
          className="canvas-transform"
          style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }}
        >
          {visibleLayers.flatMap((layer) =>
            layer.items.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              const isLocked = layer.locked;

              // Access optional fill/stroke color properties
              const itemAny = item as typeof item & { fill?: string; stroke?: string };
              const hasStroke = !!itemAny.stroke;

              return (
                <div
                  key={item.id}
                  className={[
                    'canvas-item',
                    isSelected ? 'canvas-item--selected' : '',
                    isLocked ? 'canvas-item--locked' : '',
                    hasStroke ? 'canvas-item--has-stroke' : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                    left: item.x,
                    top: item.y,
                    width: item.width,
                    height: item.height,
                    transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
                    backgroundColor: itemAny.fill || '#2a2a38',
                    border: hasStroke ? `2px solid ${itemAny.stroke}` : undefined,
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
          )}
        </div>

        {/* Empty state — shown outside transform so it fills the viewport */}
        {visibleLayers.length === 0 && (
          <div className="canvas-empty">
            <span className="canvas-empty__icon">⬚</span>
            <span>
              {layers.length === 0
                ? 'Select a layer to view its contents'
                : 'All layers are hidden'}
            </span>
          </div>
        )}

        {/* Marquee selection overlay (screen-space, outside the transform) */}
        {marquee && (
          <div
            className="canvas-marquee"
            aria-hidden="true"
            data-testid="canvas-marquee"
            style={{
              left: marquee.x,
              top: marquee.y,
              width: marquee.width,
              height: marquee.height,
            }}
          />
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
