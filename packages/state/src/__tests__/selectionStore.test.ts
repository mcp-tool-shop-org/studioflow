import { describe, it, expect, beforeEach } from 'vitest';
import { useSelectionStore } from '../selectionStore.js';
import { useDocumentStore } from '../documentStore.js';

beforeEach(() => {
  useSelectionStore.getState().reset();
  useDocumentStore.getState().reset();
});

// ── Original 9 tests (unchanged) ─────────────────────────────────────────────

describe('selectionStore', () => {
  it('starts with nothing selected', () => {
    const { selectedLayerId, selectedItemIds } = useSelectionStore.getState();
    expect(selectedLayerId).toBeNull();
    expect(selectedItemIds).toHaveLength(0);
  });

  it('selectLayer sets the active layer', () => {
    useSelectionStore.getState().selectLayer('layer-1');
    expect(useSelectionStore.getState().selectedLayerId).toBe('layer-1');
  });

  it('selectLayer with null clears the layer selection', () => {
    useSelectionStore.getState().selectLayer('layer-1');
    useSelectionStore.getState().selectLayer(null);
    expect(useSelectionStore.getState().selectedLayerId).toBeNull();
  });

  it('selectItem sets exactly one item', () => {
    useSelectionStore.getState().selectItems(['a', 'b']);
    useSelectionStore.getState().selectItem('c');
    expect(useSelectionStore.getState().selectedItemIds).toEqual(['c']);
  });

  it('selectItems replaces the full item selection', () => {
    useSelectionStore.getState().selectItems(['item-1', 'item-2', 'item-3']);
    expect(useSelectionStore.getState().selectedItemIds).toEqual(['item-1', 'item-2', 'item-3']);
  });

  it('clearSelection resets layer and items', () => {
    useSelectionStore.getState().selectLayer('layer-2');
    useSelectionStore.getState().selectItems(['item-1']);
    useSelectionStore.getState().clearSelection();
    const state = useSelectionStore.getState();
    expect(state.selectedLayerId).toBeNull();
    expect(state.selectedItemIds).toHaveLength(0);
  });

  it('toggleItemSelection adds item when not selected', () => {
    useSelectionStore.getState().toggleItemSelection('item-1');
    expect(useSelectionStore.getState().selectedItemIds).toContain('item-1');
  });

  it('toggleItemSelection removes item when already selected', () => {
    useSelectionStore.getState().selectItems(['item-1', 'item-2']);
    useSelectionStore.getState().toggleItemSelection('item-1');
    expect(useSelectionStore.getState().selectedItemIds).toEqual(['item-2']);
  });

  it('reset clears everything', () => {
    useSelectionStore.getState().selectLayer('layer-5');
    useSelectionStore.getState().selectItems(['x', 'y']);
    useSelectionStore.getState().reset();
    const state = useSelectionStore.getState();
    expect(state.selectedLayerId).toBeNull();
    expect(state.selectedItemIds).toHaveLength(0);
  });

  // ── New 12 tests ──────────────────────────────────────────────────────────

  // selectWithMode
  it('selectWithMode replace clears existing selection and sets new item', () => {
    useSelectionStore.getState().selectItems(['a', 'b']);
    useSelectionStore.getState().selectWithMode('c', 'replace');
    expect(useSelectionStore.getState().selectedItemIds).toEqual(['c']);
  });

  it('selectWithMode add appends without duplicates', () => {
    useSelectionStore.getState().selectItems(['a', 'b']);
    useSelectionStore.getState().selectWithMode('c', 'add');
    expect(useSelectionStore.getState().selectedItemIds).toEqual(['a', 'b', 'c']);
    // Adding same item again is idempotent
    useSelectionStore.getState().selectWithMode('c', 'add');
    expect(useSelectionStore.getState().selectedItemIds).toEqual(['a', 'b', 'c']);
  });

  it('selectWithMode toggle adds item when not selected', () => {
    useSelectionStore.getState().selectItems(['a']);
    useSelectionStore.getState().selectWithMode('b', 'toggle');
    expect(useSelectionStore.getState().selectedItemIds).toContain('b');
    expect(useSelectionStore.getState().selectedItemIds).toContain('a');
  });

  it('selectWithMode toggle removes item when already selected', () => {
    useSelectionStore.getState().selectItems(['a', 'b']);
    useSelectionStore.getState().selectWithMode('a', 'toggle');
    expect(useSelectionStore.getState().selectedItemIds).toEqual(['b']);
  });

  // selectByRect
  it('selectByRect selects items whose bounding boxes overlap the rect', () => {
    const items = [
      { id: 'i1', x: 10, y: 10, width: 20, height: 20 }, // inside rect
      { id: 'i2', x: 100, y: 100, width: 20, height: 20 }, // outside rect
      { id: 'i3', x: 25, y: 25, width: 10, height: 10 }, // inside rect
    ];
    useSelectionStore.getState().selectByRect({ x: 0, y: 0, width: 50, height: 50 }, items);
    const ids = useSelectionStore.getState().selectedItemIds;
    expect(ids).toContain('i1');
    expect(ids).toContain('i3');
    expect(ids).not.toContain('i2');
  });

  it('selectByRect with empty area selects nothing', () => {
    const items = [
      { id: 'i1', x: 200, y: 200, width: 30, height: 30 },
    ];
    useSelectionStore.getState().selectByRect({ x: 0, y: 0, width: 10, height: 10 }, items);
    expect(useSelectionStore.getState().selectedItemIds).toHaveLength(0);
  });

  // selectAll
  it('selectAll selects all items on the given layer', () => {
    const layer = useDocumentStore.getState().addLayer('L1');
    useDocumentStore.getState().addItem(layer.id, { name: 'A', type: 'shape', x: 0, y: 0, width: 10, height: 10, rotation: 0, data: {} });
    useDocumentStore.getState().addItem(layer.id, { name: 'B', type: 'shape', x: 20, y: 20, width: 10, height: 10, rotation: 0, data: {} });

    useSelectionStore.getState().selectAll(layer.id);
    const ids = useSelectionStore.getState().selectedItemIds;
    expect(ids).toHaveLength(2);
  });

  // invertSelection
  it('invertSelection toggles all items on the layer', () => {
    const layer = useDocumentStore.getState().addLayer('L1');
    useDocumentStore.getState().addItem(layer.id, { name: 'A', type: 'shape', x: 0, y: 0, width: 10, height: 10, rotation: 0, data: {} });
    useDocumentStore.getState().addItem(layer.id, { name: 'B', type: 'shape', x: 20, y: 20, width: 10, height: 10, rotation: 0, data: {} });
    useDocumentStore.getState().addItem(layer.id, { name: 'C', type: 'shape', x: 40, y: 40, width: 10, height: 10, rotation: 0, data: {} });

    const layerState = useDocumentStore.getState().layers.find((l) => l.id === layer.id)!;
    // Select only the first item
    useSelectionStore.getState().selectItems([layerState.items[0].id]);
    // Invert: first is deselected, second and third are selected
    useSelectionStore.getState().invertSelection(layer.id);

    const ids = useSelectionStore.getState().selectedItemIds;
    expect(ids).not.toContain(layerState.items[0].id);
    expect(ids).toContain(layerState.items[1].id);
    expect(ids).toContain(layerState.items[2].id);
  });

  // getSelectionBounds
  it('getSelectionBounds returns correct union bounds for selected items', () => {
    const layer = useDocumentStore.getState().addLayer('L1');
    useDocumentStore.getState().addItem(layer.id, { name: 'A', type: 'shape', x: 0, y: 0, width: 10, height: 10, rotation: 0, data: {} });
    useDocumentStore.getState().addItem(layer.id, { name: 'B', type: 'shape', x: 20, y: 15, width: 30, height: 5, rotation: 0, data: {} });

    const layerState = useDocumentStore.getState().layers.find((l) => l.id === layer.id)!;
    useSelectionStore.getState().selectItems(layerState.items.map((i) => i.id));

    const bounds = useSelectionStore.getState().getSelectionBounds();
    expect(bounds).not.toBeNull();
    expect(bounds!.minX).toBe(0);
    expect(bounds!.minY).toBe(0);
    expect(bounds!.maxX).toBe(50); // 20 + 30
    expect(bounds!.maxY).toBe(20); // 15 + 5
  });

  it('getSelectionBounds returns null when nothing is selected', () => {
    expect(useSelectionStore.getState().getSelectionBounds()).toBeNull();
  });

  // Backward compat explicit checks
  it('backward compat: selectItem still sets exactly one item', () => {
    useSelectionStore.getState().selectItem('solo');
    expect(useSelectionStore.getState().selectedItemIds).toEqual(['solo']);
  });

  it('backward compat: toggleItemSelection still works', () => {
    useSelectionStore.getState().selectItems(['x', 'y']);
    useSelectionStore.getState().toggleItemSelection('x');
    expect(useSelectionStore.getState().selectedItemIds).toEqual(['y']);
    useSelectionStore.getState().toggleItemSelection('z');
    expect(useSelectionStore.getState().selectedItemIds).toContain('z');
  });

  it('backward compat: clearSelection still clears layer and items', () => {
    useSelectionStore.getState().selectLayer('l1');
    useSelectionStore.getState().selectItems(['a', 'b', 'c']);
    useSelectionStore.getState().clearSelection();
    const state = useSelectionStore.getState();
    expect(state.selectedLayerId).toBeNull();
    expect(state.selectedItemIds).toHaveLength(0);
  });
});
