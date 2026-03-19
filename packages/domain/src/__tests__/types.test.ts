import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  Project,
  ProjectMeta,
  Layer,
  LayerItem,
  Command,
  CommandType,
  CommandResult,
  Selection,
  WorkspaceState,
  PanelVisibility,
} from '../index.js';

describe('Project types', () => {
  it('constructs a valid Project', () => {
    const project: Project = {
      id: 'proj-1',
      name: 'My Project',
      createdAt: '2026-03-19T00:00:00.000Z',
      updatedAt: '2026-03-19T00:00:00.000Z',
      schemaVersion: 1,
    };
    expect(project.id).toBe('proj-1');
    expect(project.schemaVersion).toBe(1);
  });

  it('constructs a valid ProjectMeta (subset of Project)', () => {
    const meta: ProjectMeta = {
      id: 'proj-1',
      name: 'My Project',
      updatedAt: '2026-03-19T00:00:00.000Z',
    };
    expect(meta.id).toBe('proj-1');
    // ProjectMeta must not include createdAt or schemaVersion
    expectTypeOf(meta).not.toHaveProperty('createdAt');
    expectTypeOf(meta).not.toHaveProperty('schemaVersion');
  });
});

describe('Layer types', () => {
  it('constructs a valid LayerItem', () => {
    const item: LayerItem = {
      id: 'item-1',
      name: 'Rectangle',
      type: 'shape',
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      rotation: 0,
      data: { fill: '#ff0000' },
    };
    expect(item.type).toBe('shape');
    expect(item.data).toEqual({ fill: '#ff0000' });
  });

  it('constructs a valid Layer with items', () => {
    const layer: Layer = {
      id: 'layer-1',
      name: 'Background',
      visible: true,
      locked: false,
      order: 0,
      items: [
        {
          id: 'item-1',
          name: 'Bg Shape',
          type: 'image',
          x: 0,
          y: 0,
          width: 1280,
          height: 720,
          rotation: 0,
          data: {},
        },
      ],
    };
    expect(layer.visible).toBe(true);
    expect(layer.items).toHaveLength(1);
  });

  it('constructs a valid Selection', () => {
    const selection: Selection = {
      selectedLayerId: 'layer-1',
      selectedItemIds: ['item-1', 'item-2'],
    };
    expect(selection.selectedLayerId).toBe('layer-1');
    expect(selection.selectedItemIds).toHaveLength(2);
  });

  it('constructs a Selection with null layer', () => {
    const empty: Selection = {
      selectedLayerId: null,
      selectedItemIds: [],
    };
    expect(empty.selectedLayerId).toBeNull();
    expect(empty.selectedItemIds).toHaveLength(0);
  });
});

describe('Command types', () => {
  it('constructs a valid Command', () => {
    const cmd: Command = {
      id: 'cmd-1',
      type: 'layer:create',
      payload: { name: 'New Layer' },
      timestamp: '2026-03-19T00:00:00.000Z',
    };
    expect(cmd.type).toBe('layer:create');
    expect(cmd.payload).toEqual({ name: 'New Layer' });
  });

  it('CommandType covers all expected values', () => {
    const types: CommandType[] = [
      'layer:create',
      'layer:rename',
      'layer:toggle-visibility',
      'layer:delete',
      'item:add',
      'item:move',
      'item:delete',
      'item:update',
    ];
    expect(types).toHaveLength(8);
  });

  it('constructs a successful CommandResult', () => {
    const result: CommandResult = { success: true, data: { id: 'layer-2' } };
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('constructs a failed CommandResult', () => {
    const result: CommandResult = { success: false, error: 'Layer not found' };
    expect(result.success).toBe(false);
    expect(result.error).toBe('Layer not found');
  });
});

describe('WorkspaceState types', () => {
  it('constructs a valid WorkspaceState', () => {
    const panels: PanelVisibility = {
      layers: true,
      canvas: true,
      inspector: true,
      toolbar: true,
    };
    const state: WorkspaceState = {
      panels,
      activePanel: 'canvas',
    };
    expect(state.activePanel).toBe('canvas');
    expect(state.panels.layers).toBe(true);
  });

  it('constructs a WorkspaceState with null activePanel', () => {
    const state: WorkspaceState = {
      panels: {
        layers: false,
        canvas: true,
        inspector: false,
        toolbar: true,
      },
      activePanel: null,
    };
    expect(state.activePanel).toBeNull();
    expect(state.panels.canvas).toBe(true);
  });
});
