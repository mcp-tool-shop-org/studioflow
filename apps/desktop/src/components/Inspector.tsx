import React, { useCallback, useRef } from 'react';
import { useDocumentStore, useSelectionStore, useCommandStore } from '@studioflow/state';

// ── helpers ──────────────────────────────────────────────────────────────────

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

  // ── numeric field commit helpers ────────────────────────────────────────
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
        {selectedItems.length > 1 && !singleItem && (
          <div className="inspector-section">
            <div className="inspector-section__label">Selection</div>
            <div className="inspector-field">
              <span className="inspector-field__label">Count</span>
              <span className="inspector-field__value">{selectedItems.length} items</span>
            </div>
            <div className="inspector-multi-actions">
              <button
                className="inspector-btn inspector-btn--danger"
                onClick={deleteAllSelected}
                aria-label="Delete all selected items"
              >
                Delete All ({selectedItems.length})
              </button>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}
