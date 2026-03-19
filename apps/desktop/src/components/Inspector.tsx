import React, { useCallback, useRef } from 'react';
import { useDocumentStore, useSelectionStore, useCommandStore } from '@studioflow/state';
import { DEFAULT_FILL } from '@studioflow/domain';
import ColorPicker from './ColorPicker';

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the single common value if every element in the array is equal,
 * otherwise returns null (indicating "mixed" values across the selection).
 */
function getMixedValue<T>(values: T[]): T | null {
  if (values.length === 0) return null;
  const first = values[0];
  return values.every((v) => v === first) ? first : null;
}

function NumericInput({
  label,
  value,
  onCommit,
  min,
}: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
  min?: number;
}) {
  const localRef = useRef<HTMLInputElement>(null);

  const commit = useCallback(() => {
    if (!localRef.current) return;
    const parsed = parseFloat(localRef.current.value);
    if (!isNaN(parsed)) {
      if (min !== undefined && parsed < min) {
        onCommit(min);
        localRef.current.value = String(min);
      } else {
        onCommit(parsed);
      }
    } else {
      // reset to prop value on bad input
      localRef.current.value = String(value);
    }
  }, [onCommit, value, min]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') commit();
      if (e.key === 'Escape' && localRef.current) {
        localRef.current.value = String(value);
        localRef.current.blur();
      }
    },
    [commit, value],
  );

  return (
    <div className="inspector-grid-field">
      <span className="inspector-grid-field__label">{label}</span>
      <input
        ref={localRef}
        className="inspector-grid-field__input"
        type="number"
        defaultValue={value}
        key={value} // re-mount when prop changes so defaultValue syncs
        onBlur={commit}
        onKeyDown={handleKeyDown}
        aria-label={label}
      />
    </div>
  );
}

/**
 * Like NumericInput but accepts `null` to indicate mixed values across a
 * multi-selection. Shows a "—" placeholder when mixed; committing a numeric
 * value applies it to all selected items via the parent's onCommit handler.
 */
function MixedNumericInput({
  label,
  value,
  onCommit,
  min,
}: {
  label: string;
  value: number | null; // null = mixed
  onCommit: (v: number) => void;
  min?: number;
}) {
  const localRef = useRef<HTMLInputElement>(null);
  const isMixed = value === null;

  const commit = useCallback(() => {
    if (!localRef.current) return;
    const raw = localRef.current.value;
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      const clamped = min !== undefined && parsed < min ? min : parsed;
      onCommit(clamped);
    } else if (!isMixed && localRef.current) {
      // Reset to prop value on bad input (only when not mixed)
      localRef.current.value = String(value);
    }
  }, [onCommit, value, min, isMixed]);

  return (
    <div className="inspector-grid-field">
      <span className="inspector-grid-field__label">{label}</span>
      <input
        ref={localRef}
        className={`inspector-grid-field__input${isMixed ? ' inspector-grid-field__input--mixed' : ''}`}
        type="text"
        defaultValue={isMixed ? '' : String(value)}
        placeholder={isMixed ? '—' : undefined}
        key={isMixed ? 'mixed' : String(value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape' && localRef.current) {
            localRef.current.value = isMixed ? '' : String(value);
            localRef.current.blur();
          }
        }}
        aria-label={label}
      />
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function Inspector() {
  const layers = useDocumentStore((s) => s.layers);
  const { selectedLayerId, selectedItemIds } = useSelectionStore();
  const dispatch = useCommandStore((s) => s.dispatch);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;

  const selectedItems = selectedLayer
    ? selectedLayer.items.filter((i) => selectedItemIds.includes(i.id))
    : [];

  const singleItem = selectedItems.length === 1 ? selectedItems[0] : null;

  // ── layer-only selection (no items picked) ──────────────────────────────
  const layerOnlySelected = selectedLayer !== null && selectedItemIds.length === 0;

  // ── multi-select derived values ─────────────────────────────────────────
  const multiX = selectedItems.length > 1 ? getMixedValue(selectedItems.map((i) => i.x)) : null;
  const multiY = selectedItems.length > 1 ? getMixedValue(selectedItems.map((i) => i.y)) : null;

  // ── layer name editing ──────────────────────────────────────────────────
  const layerNameRef = useRef<HTMLInputElement>(null);

  const commitLayerRename = useCallback(() => {
    if (!selectedLayer || !layerNameRef.current) return;
    const name = layerNameRef.current.value.trim();
    if (name && name !== selectedLayer.name) {
      dispatch('layer:rename', { layerId: selectedLayer.id, name });
    } else {
      layerNameRef.current.value = selectedLayer.name;
    }
  }, [dispatch, selectedLayer]);

  const handleLayerNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') commitLayerRename();
      if (e.key === 'Escape' && layerNameRef.current && selectedLayer) {
        layerNameRef.current.value = selectedLayer.name;
        layerNameRef.current.blur();
      }
    },
    [commitLayerRename, selectedLayer],
  );

  // ── item name editing ───────────────────────────────────────────────────
  const itemNameRef = useRef<HTMLInputElement>(null);

  const commitItemRename = useCallback(() => {
    if (!singleItem || !selectedLayerId || !itemNameRef.current) return;
    const name = itemNameRef.current.value.trim();
    if (name && name !== singleItem.name) {
      dispatch('item:update', { layerId: selectedLayerId, itemId: singleItem.id, patch: { name } });
    } else {
      itemNameRef.current.value = singleItem.name;
    }
  }, [dispatch, selectedLayerId, singleItem]);

  const handleItemNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') commitItemRename();
      if (e.key === 'Escape' && itemNameRef.current && singleItem) {
        itemNameRef.current.value = singleItem.name;
        itemNameRef.current.blur();
      }
    },
    [commitItemRename, singleItem],
  );

  // ── numeric field commit helpers (single item) ──────────────────────────
  const commitMove = useCallback(
    (axis: 'x' | 'y', v: number) => {
      if (!singleItem || !selectedLayerId) return;
      dispatch('item:move', {
        layerId: selectedLayerId,
        itemId: singleItem.id,
        x: axis === 'x' ? v : singleItem.x,
        y: axis === 'y' ? v : singleItem.y,
      });
    },
    [dispatch, selectedLayerId, singleItem],
  );

  const commitResize = useCallback(
    (dim: 'width' | 'height', v: number) => {
      if (!singleItem || !selectedLayerId) return;
      dispatch('item:resize', {
        layerId: selectedLayerId,
        itemId: singleItem.id,
        width: dim === 'width' ? v : singleItem.width,
        height: dim === 'height' ? v : singleItem.height,
      });
    },
    [dispatch, selectedLayerId, singleItem],
  );

  const commitRotation = useCallback(
    (v: number) => {
      if (!singleItem || !selectedLayerId) return;
      dispatch('item:update', {
        layerId: selectedLayerId,
        itemId: singleItem.id,
        patch: { rotation: v },
      });
    },
    [dispatch, selectedLayerId, singleItem],
  );

  // ── color commit helpers (single item) ─────────────────────────────────
  const commitFill = useCallback(
    (color: string) => {
      if (!singleItem || !selectedLayerId) return;
      dispatch('item:set-fill', {
        layerId: selectedLayerId,
        itemId: singleItem.id,
        color,
      });
    },
    [dispatch, selectedLayerId, singleItem],
  );

  const commitStroke = useCallback(
    (color: string) => {
      if (!singleItem || !selectedLayerId) return;
      dispatch('item:set-stroke', {
        layerId: selectedLayerId,
        itemId: singleItem.id,
        color,
      });
    },
    [dispatch, selectedLayerId, singleItem],
  );

  // ── color commit helpers (multi-select) ───────────────────────────────
  const batchFill = useCallback(
    (color: string) => {
      if (!selectedLayerId) return;
      for (const item of selectedItems) {
        dispatch('item:set-fill', {
          layerId: selectedLayerId,
          itemId: item.id,
          color,
        });
      }
    },
    [dispatch, selectedLayerId, selectedItems],
  );

  const batchStroke = useCallback(
    (color: string) => {
      if (!selectedLayerId) return;
      for (const item of selectedItems) {
        dispatch('item:set-stroke', {
          layerId: selectedLayerId,
          itemId: item.id,
          color,
        });
      }
    },
    [dispatch, selectedLayerId, selectedItems],
  );

  // ── multi-select derived color values ─────────────────────────────────
  const multiFill =
    selectedItems.length > 1
      ? getMixedValue(selectedItems.map((i) => (typeof i.fill === 'string' ? i.fill : DEFAULT_FILL)))
      : null;
  const multiStroke =
    selectedItems.length > 1
      ? getMixedValue(selectedItems.map((i) => (typeof i.stroke === 'string' ? i.stroke : '')))
      : null;

  // ── delete helpers ──────────────────────────────────────────────────────
  const deleteSingleItem = useCallback(() => {
    if (!singleItem || !selectedLayerId) return;
    dispatch('item:delete', { layerId: selectedLayerId, itemId: singleItem.id });
  }, [dispatch, selectedLayerId, singleItem]);

  const deleteAllSelected = useCallback(() => {
    if (!selectedLayerId) return;
    for (const itemId of selectedItemIds) {
      dispatch('item:delete', { layerId: selectedLayerId, itemId });
    }
  }, [dispatch, selectedLayerId, selectedItemIds]);

  // ── batch move helpers (multi-select) ───────────────────────────────────
  const batchMoveX = useCallback(
    (v: number) => {
      if (!selectedLayerId) return;
      for (const item of selectedItems) {
        dispatch('item:move', { layerId: selectedLayerId, itemId: item.id, x: v, y: item.y });
      }
    },
    [dispatch, selectedLayerId, selectedItems],
  );

  const batchMoveY = useCallback(
    (v: number) => {
      if (!selectedLayerId) return;
      for (const item of selectedItems) {
        dispatch('item:move', { layerId: selectedLayerId, itemId: item.id, x: item.x, y: v });
      }
    },
    [dispatch, selectedLayerId, selectedItems],
  );

  // ── nudge all selected items ────────────────────────────────────────────
  const nudgeAll = useCallback(
    (dx: number, dy: number) => {
      if (!selectedLayerId) return;
      for (const item of selectedItems) {
        dispatch('item:move', {
          layerId: selectedLayerId,
          itemId: item.id,
          x: item.x + dx,
          y: item.y + dy,
        });
      }
    },
    [dispatch, selectedLayerId, selectedItems],
  );

  // ── duplicate all selected items ────────────────────────────────────────
  const duplicateSelected = useCallback(() => {
    if (!selectedLayerId) return;
    for (const item of selectedItems) {
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
  }, [dispatch, selectedLayerId, selectedItems]);

  // ── render ──────────────────────────────────────────────────────────────
  return (
    <aside className="panel inspector-panel" aria-label="Inspector panel">
      <div className="panel__header">
        <span className="panel__title">Inspector</span>
      </div>

      <div className="panel__body">

        {/* ── NOTHING SELECTED ── */}
        {!selectedLayer && (
          <div className="inspector-empty">
            <span className="inspector-empty__icon">◻</span>
            <span>Nothing selected</span>
            <span className="inspector-empty__hint">
              Select a layer or item to inspect its properties
            </span>
          </div>
        )}

        {/* ── LAYER SELECTED (no items) ── */}
        {layerOnlySelected && selectedLayer && (
          <>
            <div className="inspector-section">
              <div className="inspector-section__label">Layer</div>

              <div className="inspector-field">
                <span className="inspector-field__label">Name</span>
                <input
                  ref={layerNameRef}
                  className="inspector-field__input"
                  type="text"
                  defaultValue={selectedLayer.name}
                  key={selectedLayer.id + selectedLayer.name}
                  onBlur={commitLayerRename}
                  onKeyDown={handleLayerNameKeyDown}
                  aria-label="Layer name"
                />
              </div>

              <div className="inspector-field">
                <span className="inspector-field__label">Order</span>
                <span className="inspector-field__value">{selectedLayer.order}</span>
              </div>

              <div className="inspector-field">
                <span className="inspector-field__label">Items</span>
                <span className="inspector-field__value">{selectedLayer.items.length}</span>
              </div>
            </div>

            <div className="inspector-section">
              <div className="inspector-section__label">Visibility &amp; Lock</div>

              <div className="inspector-field">
                <span className="inspector-field__label">Visible</span>
                <button
                  className={`inspector-toggle${selectedLayer.visible ? ' inspector-toggle--on' : ' inspector-toggle--off'}`}
                  onClick={() =>
                    dispatch('layer:toggle-visibility', { layerId: selectedLayer.id })
                  }
                  aria-pressed={selectedLayer.visible}
                  aria-label="Toggle layer visibility"
                >
                  {selectedLayer.visible ? '● Visible' : '○ Hidden'}
                </button>
              </div>

              <div className="inspector-field">
                <span className="inspector-field__label">Locked</span>
                <button
                  className={`inspector-toggle${selectedLayer.locked ? ' inspector-toggle--locked' : ''}`}
                  onClick={() =>
                    dispatch('layer:toggle-lock', { layerId: selectedLayer.id })
                  }
                  aria-pressed={selectedLayer.locked}
                  aria-label="Toggle layer lock"
                >
                  {selectedLayer.locked ? '🔒 Locked' : '🔓 Unlocked'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── SINGLE ITEM SELECTED ── */}
        {singleItem && selectedLayer && selectedLayerId && (
          <>
            <div className="inspector-section">
              <div className="inspector-section__label">Identity</div>

              <div className="inspector-field">
                <span className="inspector-field__label">Name</span>
                <input
                  ref={itemNameRef}
                  className="inspector-field__input"
                  type="text"
                  defaultValue={singleItem.name}
                  key={singleItem.id + singleItem.name}
                  onBlur={commitItemRename}
                  onKeyDown={handleItemNameKeyDown}
                  aria-label="Item name"
                />
              </div>

              <div className="inspector-field">
                <span className="inspector-field__label">Type</span>
                <span className="inspector-field__type-badge">{singleItem.type}</span>
              </div>
            </div>

            <div className="inspector-section">
              <div className="inspector-section__label">Position</div>
              <div className="inspector-grid inspector-grid--2col">
                <NumericInput
                  label="X"
                  value={singleItem.x}
                  onCommit={(v) => commitMove('x', v)}
                />
                <NumericInput
                  label="Y"
                  value={singleItem.y}
                  onCommit={(v) => commitMove('y', v)}
                />
              </div>
            </div>

            <div className="inspector-section">
              <div className="inspector-section__label">Size</div>
              <div className="inspector-grid inspector-grid--2col">
                <NumericInput
                  label="W"
                  value={singleItem.width}
                  min={1}
                  onCommit={(v) => commitResize('width', v)}
                />
                <NumericInput
                  label="H"
                  value={singleItem.height}
                  min={1}
                  onCommit={(v) => commitResize('height', v)}
                />
              </div>
            </div>

            <div className="inspector-section">
              <div className="inspector-section__label">Transform</div>
              <div className="inspector-grid inspector-grid--1col">
                <NumericInput
                  label="Rotation °"
                  value={singleItem.rotation}
                  onCommit={commitRotation}
                />
              </div>
            </div>

            <div className="inspector-color-section">
              <div className="inspector-color-section__title">Colors</div>
              <ColorPicker
                label="Fill"
                value={typeof singleItem.fill === 'string' ? singleItem.fill : DEFAULT_FILL}
                onChange={commitFill}
              />
              <ColorPicker
                label="Stroke"
                value={typeof singleItem.stroke === 'string' ? singleItem.stroke : ''}
                onChange={commitStroke}
              />
            </div>

            <div className="inspector-section">
              <button
                className="inspector-btn inspector-btn--danger"
                onClick={deleteSingleItem}
                aria-label="Delete item"
              >
                Delete Item
              </button>
            </div>
          </>
        )}

        {/* ── MULTI ITEM SELECTED ── */}
        {selectedItems.length > 1 && (
          <>
            <div className="inspector-section">
              <div className="inspector-section__label">Selection</div>
              <div className="inspector-field">
                <span className="inspector-field__label">Count</span>
                <span className="inspector-field__value inspector-multi-count">
                  {selectedItems.length} items
                </span>
              </div>
            </div>

            <div className="inspector-section">
              <div className="inspector-section__label">
                Position
                {(multiX === null || multiY === null) && (
                  <span className="inspector-mixed-badge" title="Values differ across selection">
                    mixed
                  </span>
                )}
              </div>
              <div className="inspector-grid inspector-grid--2col">
                <MixedNumericInput
                  label="X"
                  value={multiX}
                  onCommit={batchMoveX}
                />
                <MixedNumericInput
                  label="Y"
                  value={multiY}
                  onCommit={batchMoveY}
                />
              </div>
            </div>

            <div className="inspector-section">
              <div className="inspector-section__label">Nudge</div>
              <div className="inspector-nudge-grid">
                <button
                  className="inspector-nudge-btn"
                  aria-label="Nudge left"
                  title="Move left 10px"
                  onClick={() => nudgeAll(-10, 0)}
                >
                  ←
                </button>
                <button
                  className="inspector-nudge-btn"
                  aria-label="Nudge right"
                  title="Move right 10px"
                  onClick={() => nudgeAll(10, 0)}
                >
                  →
                </button>
                <button
                  className="inspector-nudge-btn"
                  aria-label="Nudge up"
                  title="Move up 10px"
                  onClick={() => nudgeAll(0, -10)}
                >
                  ↑
                </button>
                <button
                  className="inspector-nudge-btn"
                  aria-label="Nudge down"
                  title="Move down 10px"
                  onClick={() => nudgeAll(0, 10)}
                >
                  ↓
                </button>
              </div>
            </div>

            <div className="inspector-color-section">
              <div className="inspector-color-section__title">Colors</div>
              <ColorPicker
                label="Fill"
                value={multiFill}
                onChange={batchFill}
              />
              <ColorPicker
                label="Stroke"
                value={multiStroke}
                onChange={batchStroke}
              />
            </div>

            <div className="inspector-section inspector-multi-actions">
              <button
                className="inspector-btn inspector-btn--secondary"
                onClick={duplicateSelected}
                aria-label="Duplicate selected items"
              >
                Duplicate Selected ({selectedItems.length})
              </button>
              <button
                className="inspector-btn inspector-btn--danger"
                onClick={deleteAllSelected}
                aria-label="Delete selected items"
              >
                Delete Selected ({selectedItems.length})
              </button>
            </div>
          </>
        )}

      </div>
    </aside>
  );
}
