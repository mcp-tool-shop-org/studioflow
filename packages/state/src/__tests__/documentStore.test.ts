import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from '../documentStore.js';

beforeEach(() => {
  useDocumentStore.getState().reset();
});

describe('documentStore — layers', () => {
  it('starts with no layers', () => {
    expect(useDocumentStore.getState().layers).toHaveLength(0);
  });

  it('addLayer creates a layer with auto-id and default values', () => {
    const layer = useDocumentStore.getState().addLayer();
    const { layers } = useDocumentStore.getState();
    expect(layers).toHaveLength(1);
    expect(layers[0].id).toBe('layer-1');
    expect(layers[0].visible).toBe(true);
    expect(layers[0].locked).toBe(false);
    expect(layers[0].items).toHaveLength(0);
    expect(layer.id).toBe('layer-1');
  });

  it('addLayer uses provided name', () => {
    useDocumentStore.getState().addLayer('Background');
    const { layers } = useDocumentStore.getState();
    expect(layers[0].name).toBe('Background');
  });

  it('addLayer increments nextLayerId on each call', () => {
    useDocumentStore.getState().addLayer();
    useDocumentStore.getState().addLayer();
    const { layers, nextLayerId } = useDocumentStore.getState();
    expect(layers).toHaveLength(2);
    expect(layers[0].id).toBe('layer-1');
    expect(layers[1].id).toBe('layer-2');
    expect(nextLayerId).toBe(3);
  });

  it('removeLayer deletes the correct layer', () => {
    useDocumentStore.getState().addLayer('A');
    useDocumentStore.getState().addLayer('B');
    useDocumentStore.getState().removeLayer('layer-1');
    const { layers } = useDocumentStore.getState();
    expect(layers).toHaveLength(1);
    expect(layers[0].name).toBe('B');
  });

  it('removeLayer on nonexistent id is a no-op', () => {
    useDocumentStore.getState().addLayer();
    useDocumentStore.getState().removeLayer('does-not-exist');
    expect(useDocumentStore.getState().layers).toHaveLength(1);
  });

  it('renameLayer updates the layer name', () => {
    useDocumentStore.getState().addLayer('Old');
    useDocumentStore.getState().renameLayer('layer-1', 'New');
    expect(useDocumentStore.getState().layers[0].name).toBe('New');
  });

  it('toggleLayerVisibility flips visible flag', () => {
    useDocumentStore.getState().addLayer();
    expect(useDocumentStore.getState().layers[0].visible).toBe(true);
    useDocumentStore.getState().toggleLayerVisibility('layer-1');
    expect(useDocumentStore.getState().layers[0].visible).toBe(false);
    useDocumentStore.getState().toggleLayerVisibility('layer-1');
    expect(useDocumentStore.getState().layers[0].visible).toBe(true);
  });

  it('reorderLayer changes the order value', () => {
    useDocumentStore.getState().addLayer();
    useDocumentStore.getState().reorderLayer('layer-1', 5);
    expect(useDocumentStore.getState().layers[0].order).toBe(5);
  });

  it('reset clears all layers and resets counters', () => {
    useDocumentStore.getState().addLayer();
    useDocumentStore.getState().addLayer();
    useDocumentStore.getState().reset();
    const state = useDocumentStore.getState();
    expect(state.layers).toHaveLength(0);
    expect(state.nextLayerId).toBe(1);
    expect(state.nextItemId).toBe(1);
    expect(state.project).toBeNull();
  });
});

describe('documentStore — items', () => {
  const baseItem = () => ({
    name: 'Rect',
    type: 'shape' as const,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    data: {},
  });

  it('addItem adds an item to the layer with auto-id', () => {
    useDocumentStore.getState().addLayer();
    useDocumentStore.getState().addItem('layer-1', baseItem());
    const layer = useDocumentStore.getState().layers[0];
    expect(layer.items).toHaveLength(1);
    expect(layer.items[0].id).toBe('item-1');
  });

  it('addItem returns null for nonexistent layer', () => {
    const result = useDocumentStore.getState().addItem('bad-layer', baseItem());
    expect(result).toBeNull();
  });

  it('addItem increments nextItemId', () => {
    useDocumentStore.getState().addLayer();
    useDocumentStore.getState().addItem('layer-1', baseItem());
    useDocumentStore.getState().addItem('layer-1', baseItem());
    expect(useDocumentStore.getState().nextItemId).toBe(3);
    expect(useDocumentStore.getState().layers[0].items).toHaveLength(2);
  });

  it('removeItem deletes the item from the layer', () => {
    useDocumentStore.getState().addLayer();
    useDocumentStore.getState().addItem('layer-1', baseItem());
    useDocumentStore.getState().removeItem('layer-1', 'item-1');
    expect(useDocumentStore.getState().layers[0].items).toHaveLength(0);
  });

  it('updateItem patches item fields', () => {
    useDocumentStore.getState().addLayer();
    useDocumentStore.getState().addItem('layer-1', baseItem());
    useDocumentStore.getState().updateItem('layer-1', 'item-1', { name: 'Updated', width: 200 });
    const item = useDocumentStore.getState().layers[0].items[0];
    expect(item.name).toBe('Updated');
    expect(item.width).toBe(200);
    expect(item.height).toBe(100); // unchanged
  });

  it('moveItem updates x and y coordinates', () => {
    useDocumentStore.getState().addLayer();
    useDocumentStore.getState().addItem('layer-1', baseItem());
    useDocumentStore.getState().moveItem('layer-1', 'item-1', 42, 99);
    const item = useDocumentStore.getState().layers[0].items[0];
    expect(item.x).toBe(42);
    expect(item.y).toBe(99);
  });

  it('fill and stroke are optional (backwards compatibility)', () => {
    useDocumentStore.getState().addLayer();
    useDocumentStore.getState().addItem('layer-1', baseItem());
    const item = useDocumentStore.getState().layers[0].items[0];
    expect(item.fill).toBeUndefined();
    expect(item.stroke).toBeUndefined();
  });

  it('setItemFill sets the fill color on an item', () => {
    useDocumentStore.getState().addLayer();
    useDocumentStore.getState().addItem('layer-1', baseItem());
    useDocumentStore.getState().setItemFill('layer-1', 'item-1', '#ff0000');
    const item = useDocumentStore.getState().layers[0].items[0];
    expect(item.fill).toBe('#ff0000');
  });

  it('setItemStroke sets the stroke color on an item', () => {
    useDocumentStore.getState().addLayer();
    useDocumentStore.getState().addItem('layer-1', baseItem());
    useDocumentStore.getState().setItemStroke('layer-1', 'item-1', '#00ff00');
    const item = useDocumentStore.getState().layers[0].items[0];
    expect(item.stroke).toBe('#00ff00');
  });

  it('setItemFill does not affect other items', () => {
    useDocumentStore.getState().addLayer();
    useDocumentStore.getState().addItem('layer-1', baseItem());
    useDocumentStore.getState().addItem('layer-1', baseItem());
    useDocumentStore.getState().setItemFill('layer-1', 'item-1', '#ff0000');
    const items = useDocumentStore.getState().layers[0].items;
    expect(items[0].fill).toBe('#ff0000');
    expect(items[1].fill).toBeUndefined();
  });

  it('setProject stores the project', () => {
    const project = {
      id: 'proj-1',
      name: 'Test',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      schemaVersion: 1,
    };
    useDocumentStore.getState().setProject(project);
    expect(useDocumentStore.getState().project).toEqual(project);
  });
});
