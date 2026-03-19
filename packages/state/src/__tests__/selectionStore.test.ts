import { describe, it, expect, beforeEach } from 'vitest';
import { useSelectionStore } from '../selectionStore.js';

beforeEach(() => {
  useSelectionStore.getState().reset();
});

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
});
