import { describe, it, expect, beforeEach } from 'vitest';
import { useCommandStore } from '../commandStore.js';
import { useDocumentStore } from '../documentStore.js';
import { useSelectionStore } from '../selectionStore.js';

beforeEach(() => {
  useCommandStore.getState().reset();
  useDocumentStore.getState().reset();
  useSelectionStore.getState().reset();
});

describe('commandStore — dispatch', () => {
  it('dispatch creates a command and adds it to history', () => {
    useCommandStore.getState().dispatch('layer:create', { name: 'BG' });
    const { history } = useCommandStore.getState();
    expect(history).toHaveLength(1);
    expect(history[0].type).toBe('layer:create');
    expect(history[0].payload).toEqual({ name: 'BG' });
    expect(history[0].id).toBeDefined();
    expect(history[0].timestamp).toBeDefined();
  });

  it('dispatch stores lastResult', () => {
    const result = useCommandStore.getState().dispatch('layer:create', {});
    expect(result.success).toBe(true);
    expect(useCommandStore.getState().lastResult).toEqual(result);
  });

  it('layer:create actually creates a layer in documentStore', () => {
    useCommandStore.getState().dispatch('layer:create', { name: 'Foreground' });
    const { layers } = useDocumentStore.getState();
    expect(layers).toHaveLength(1);
    expect(layers[0].name).toBe('Foreground');
  });

  it('history grows with each dispatch', () => {
    useCommandStore.getState().dispatch('layer:create', {});
    useCommandStore.getState().dispatch('layer:create', {});
    useCommandStore.getState().dispatch('layer:create', {});
    expect(useCommandStore.getState().history).toHaveLength(3);
  });

  it('layer:rename renames a layer in documentStore', () => {
    useCommandStore.getState().dispatch('layer:create', { name: 'Old' });
    const layerId = useDocumentStore.getState().layers[0].id;
    useCommandStore.getState().dispatch('layer:rename', { layerId, name: 'New' });
    expect(useDocumentStore.getState().layers[0].name).toBe('New');
  });

  it('layer:toggle-visibility toggles a layer', () => {
    useCommandStore.getState().dispatch('layer:create', {});
    const layerId = useDocumentStore.getState().layers[0].id;
    expect(useDocumentStore.getState().layers[0].visible).toBe(true);
    useCommandStore.getState().dispatch('layer:toggle-visibility', { layerId });
    expect(useDocumentStore.getState().layers[0].visible).toBe(false);
  });

  it('layer:delete removes a layer from documentStore', () => {
    useCommandStore.getState().dispatch('layer:create', {});
    const layerId = useDocumentStore.getState().layers[0].id;
    useCommandStore.getState().dispatch('layer:delete', { layerId });
    expect(useDocumentStore.getState().layers).toHaveLength(0);
  });

  it('item:add adds an item to the specified layer', () => {
    useCommandStore.getState().dispatch('layer:create', {});
    const layerId = useDocumentStore.getState().layers[0].id;
    const item = {
      name: 'Circle',
      type: 'shape',
      x: 10,
      y: 20,
      width: 50,
      height: 50,
      rotation: 0,
      data: {},
    };
    const result = useCommandStore.getState().dispatch('item:add', { layerId, item });
    expect(result.success).toBe(true);
    expect(useDocumentStore.getState().layers[0].items).toHaveLength(1);
  });

  it('item:add returns error for missing layer', () => {
    const result = useCommandStore.getState().dispatch('item:add', {
      layerId: 'nonexistent',
      item: { name: 'X', type: 'shape', x: 0, y: 0, width: 10, height: 10, rotation: 0, data: {} },
    });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('item:move updates item coordinates', () => {
    useCommandStore.getState().dispatch('layer:create', {});
    const layerId = useDocumentStore.getState().layers[0].id;
    const item = { name: 'T', type: 'text', x: 0, y: 0, width: 80, height: 30, rotation: 0, data: {} };
    useCommandStore.getState().dispatch('item:add', { layerId, item });
    const itemId = useDocumentStore.getState().layers[0].items[0].id;
    useCommandStore.getState().dispatch('item:move', { layerId, itemId, x: 100, y: 200 });
    const moved = useDocumentStore.getState().layers[0].items[0];
    expect(moved.x).toBe(100);
    expect(moved.y).toBe(200);
  });

  it('item:delete removes the item', () => {
    useCommandStore.getState().dispatch('layer:create', {});
    const layerId = useDocumentStore.getState().layers[0].id;
    const item = { name: 'Del', type: 'shape', x: 0, y: 0, width: 10, height: 10, rotation: 0, data: {} };
    useCommandStore.getState().dispatch('item:add', { layerId, item });
    const itemId = useDocumentStore.getState().layers[0].items[0].id;
    useCommandStore.getState().dispatch('item:delete', { layerId, itemId });
    expect(useDocumentStore.getState().layers[0].items).toHaveLength(0);
  });

  it('item:update patches item fields', () => {
    useCommandStore.getState().dispatch('layer:create', {});
    const layerId = useDocumentStore.getState().layers[0].id;
    const item = { name: 'Patch', type: 'shape', x: 0, y: 0, width: 10, height: 10, rotation: 0, data: {} };
    useCommandStore.getState().dispatch('item:add', { layerId, item });
    const itemId = useDocumentStore.getState().layers[0].items[0].id;
    useCommandStore.getState().dispatch('item:update', { layerId, itemId, patch: { name: 'Updated', width: 999 } });
    const updated = useDocumentStore.getState().layers[0].items[0];
    expect(updated.name).toBe('Updated');
    expect(updated.width).toBe(999);
  });

  it('clearHistory resets history and lastResult', () => {
    useCommandStore.getState().dispatch('layer:create', {});
    useCommandStore.getState().clearHistory();
    expect(useCommandStore.getState().history).toHaveLength(0);
    expect(useCommandStore.getState().lastResult).toBeNull();
  });

  it('each command gets a unique id', () => {
    useCommandStore.getState().dispatch('layer:create', {});
    useCommandStore.getState().dispatch('layer:create', {});
    const ids = useCommandStore.getState().history.map((c) => c.id);
    expect(new Set(ids).size).toBe(2);
  });
});
