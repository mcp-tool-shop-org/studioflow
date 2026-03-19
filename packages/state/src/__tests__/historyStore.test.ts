import { describe, it, expect, beforeEach } from 'vitest';
import { useHistoryStore } from '../historyStore.js';
import { useCommandStore } from '../commandStore.js';
import { useDocumentStore } from '../documentStore.js';
import { useSelectionStore } from '../selectionStore.js';
import { COMMAND_LABELS } from '@studioflow/domain';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function dispatch(type: Parameters<ReturnType<typeof useCommandStore.getState>['dispatch']>[0], payload: Record<string, unknown> = {}) {
  return useCommandStore.getState().dispatch(type, payload);
}

function createLayer(name?: string) {
  return dispatch('layer:create', name ? { name } : {});
}

function getHistory() {
  return useHistoryStore.getState();
}

function getLayers() {
  return useDocumentStore.getState().layers;
}

// ---------------------------------------------------------------------------
// Reset all stores before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  useHistoryStore.getState().reset();
  useCommandStore.getState().reset();
  useDocumentStore.getState().reset();
  useSelectionStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('historyStore — initial state', () => {
  it('1. starts with empty past, empty future, canUndo false, canRedo false', () => {
    const { past, future, canUndo, canRedo, undoLabel, redoLabel } = getHistory();
    expect(past).toHaveLength(0);
    expect(future).toHaveLength(0);
    expect(canUndo).toBe(false);
    expect(canRedo).toBe(false);
    expect(undoLabel).toBeNull();
    expect(redoLabel).toBeNull();
  });
});

describe('historyStore — recording', () => {
  it('2. after dispatch layer:create — past has 1 entry, canUndo true', () => {
    createLayer('BG');
    const { past, future, canUndo, canRedo } = getHistory();
    expect(past).toHaveLength(1);
    expect(future).toHaveLength(0);
    expect(canUndo).toBe(true);
    expect(canRedo).toBe(false);
    expect(past[0].commandType).toBe('layer:create');
  });

  it('6. non-undoable commands (project:save) do not create history entries', () => {
    dispatch('project:save', {});
    const { past, canUndo } = getHistory();
    expect(past).toHaveLength(0);
    expect(canUndo).toBe(false);
  });

  it('also: project:new, project:open, project:close, project:save-as are non-undoable', () => {
    dispatch('project:new', {});
    dispatch('project:open', {});
    dispatch('project:close', {});
    dispatch('project:save-as', {});
    expect(getHistory().past).toHaveLength(0);
  });
});

describe('historyStore — undo', () => {
  it('3. after layer:create then undo — layer removed, past empty, future has 1, canRedo true', () => {
    createLayer('FG');
    expect(getLayers()).toHaveLength(1);

    useHistoryStore.getState().undo();

    expect(getLayers()).toHaveLength(0);
    const { past, future, canUndo, canRedo } = getHistory();
    expect(past).toHaveLength(0);
    expect(future).toHaveLength(1);
    expect(canUndo).toBe(false);
    expect(canRedo).toBe(true);
  });

  it('9. undo when past is empty does nothing', () => {
    // No commands dispatched
    useHistoryStore.getState().undo();
    const { past, future } = getHistory();
    expect(past).toHaveLength(0);
    expect(future).toHaveLength(0);
  });

  it('7. multiple undos work in correct order', () => {
    createLayer('Layer A');
    createLayer('Layer B');
    createLayer('Layer C');
    expect(getLayers()).toHaveLength(3);

    // Undo C
    useHistoryStore.getState().undo();
    expect(getLayers()).toHaveLength(2);
    expect(getLayers().map((l) => l.name)).toEqual(['Layer A', 'Layer B']);

    // Undo B
    useHistoryStore.getState().undo();
    expect(getLayers()).toHaveLength(1);
    expect(getLayers()[0].name).toBe('Layer A');

    // Undo A
    useHistoryStore.getState().undo();
    expect(getLayers()).toHaveLength(0);

    const { past, future, canUndo } = getHistory();
    expect(past).toHaveLength(0);
    expect(future).toHaveLength(3);
    expect(canUndo).toBe(false);
  });
});

describe('historyStore — redo', () => {
  it('4. after undo then redo — layer is back, past has 1, future empty', () => {
    createLayer('Restored');
    useHistoryStore.getState().undo();
    expect(getLayers()).toHaveLength(0);

    useHistoryStore.getState().redo();

    expect(getLayers()).toHaveLength(1);
    expect(getLayers()[0].name).toBe('Restored');
    const { past, future, canUndo, canRedo } = getHistory();
    expect(past).toHaveLength(1);
    expect(future).toHaveLength(0);
    expect(canUndo).toBe(true);
    expect(canRedo).toBe(false);
  });

  it('10. redo when future is empty does nothing', () => {
    createLayer('Solo');
    // Don't undo first
    useHistoryStore.getState().redo();
    const { past, future } = getHistory();
    expect(past).toHaveLength(1);
    expect(future).toHaveLength(0);
  });

  it('8. multiple redos work in correct order', () => {
    createLayer('Layer A');
    createLayer('Layer B');
    createLayer('Layer C');

    useHistoryStore.getState().undo();
    useHistoryStore.getState().undo();
    useHistoryStore.getState().undo();
    expect(getLayers()).toHaveLength(0);

    useHistoryStore.getState().redo();
    expect(getLayers()).toHaveLength(1);
    expect(getLayers()[0].name).toBe('Layer A');

    useHistoryStore.getState().redo();
    expect(getLayers()).toHaveLength(2);
    expect(getLayers()[1].name).toBe('Layer B');

    useHistoryStore.getState().redo();
    expect(getLayers()).toHaveLength(3);
    expect(getLayers()[2].name).toBe('Layer C');

    expect(getHistory().future).toHaveLength(0);
  });
});

describe('historyStore — redo cleared on divergent action', () => {
  it('5. redo stack is cleared after a new divergent action', () => {
    createLayer('Original');
    useHistoryStore.getState().undo();

    // future has 1 entry now
    expect(getHistory().future).toHaveLength(1);

    // New divergent action
    createLayer('Divergent');

    const { future, canRedo } = getHistory();
    expect(future).toHaveLength(0);
    expect(canRedo).toBe(false);
  });
});

describe('historyStore — labels', () => {
  it('11. history labels match COMMAND_LABELS', () => {
    createLayer('Labeled');
    const entry = getHistory().past[0];
    expect(entry.label).toBe(COMMAND_LABELS['layer:create']);
    expect(entry.label).toBe('Add Layer');
    expect(getHistory().undoLabel).toBe('Undo Add Layer');

    const layerId = getLayers()[0].id;
    dispatch('layer:rename', { layerId, name: 'Renamed' });
    expect(getHistory().past[1].label).toBe(COMMAND_LABELS['layer:rename']);
    expect(getHistory().past[1].label).toBe('Rename Layer');
    expect(getHistory().undoLabel).toBe('Undo Rename Layer');
  });

  it('11b. redoLabel is correct after undo', () => {
    createLayer('LabelTest');
    useHistoryStore.getState().undo();
    expect(getHistory().redoLabel).toBe('Redo Add Layer');
  });
});

describe('historyStore — max history', () => {
  it('12. max history enforced — past.length never exceeds 100', () => {
    // Dispatch 105 layer:create commands
    for (let i = 0; i < 105; i++) {
      createLayer(`Layer ${i}`);
    }
    const { past } = getHistory();
    expect(past.length).toBeLessThanOrEqual(100);
    expect(past.length).toBe(100);
  });
});

describe('historyStore — clearHistory', () => {
  it('13. clearHistory resets past, future, canUndo, canRedo, savedSnapshot', () => {
    createLayer('A');
    createLayer('B');
    useHistoryStore.getState().undo();
    useHistoryStore.getState().markSaved();

    useHistoryStore.getState().clearHistory();

    const { past, future, canUndo, canRedo, undoLabel, redoLabel, savedSnapshot } = getHistory();
    expect(past).toHaveLength(0);
    expect(future).toHaveLength(0);
    expect(canUndo).toBe(false);
    expect(canRedo).toBe(false);
    expect(undoLabel).toBeNull();
    expect(redoLabel).toBeNull();
    expect(savedSnapshot).toBeNull();
  });
});

describe('historyStore — markSaved / isAtSavedState', () => {
  it('14. isAtSavedState is true immediately after markSaved, false after a new edit', () => {
    createLayer('Saved');

    useHistoryStore.getState().markSaved();
    expect(getHistory().isAtSavedState()).toBe(true);

    // Make a new edit
    createLayer('Dirty');
    expect(getHistory().isAtSavedState()).toBe(false);
  });

  it('14b. isAtSavedState is false before any markSaved call', () => {
    createLayer('A');
    expect(getHistory().isAtSavedState()).toBe(false);
  });

  it('15. isAtSavedState becomes true again after undo back to saved point', () => {
    createLayer('Base');
    useHistoryStore.getState().markSaved();

    // Make a new edit
    createLayer('Extra');
    expect(getHistory().isAtSavedState()).toBe(false);

    // Undo back to saved state
    useHistoryStore.getState().undo();
    expect(getHistory().isAtSavedState()).toBe(true);
  });

  it('15b. isAtSavedState goes false again after redo past the save point', () => {
    createLayer('Base');
    useHistoryStore.getState().markSaved();
    createLayer('Extra');

    useHistoryStore.getState().undo();
    expect(getHistory().isAtSavedState()).toBe(true);

    useHistoryStore.getState().redo();
    expect(getHistory().isAtSavedState()).toBe(false);
  });
});

describe('historyStore — snapshot integrity', () => {
  it('undo restores beforeSnapshot including nextLayerId counter', () => {
    createLayer('A'); // nextLayerId becomes 2
    const counterAfterFirst = useDocumentStore.getState().nextLayerId;

    createLayer('B'); // nextLayerId becomes 3

    useHistoryStore.getState().undo(); // restore to state before B

    expect(useDocumentStore.getState().nextLayerId).toBe(counterAfterFirst);
    expect(getLayers()).toHaveLength(1);
    expect(getLayers()[0].name).toBe('A');
  });

  it('item:add and item:delete are undoable and tracked in history', () => {
    createLayer('Canvas');
    const layerId = getLayers()[0].id;

    dispatch('item:add', { layerId, item: baseItem() });
    expect(getLayers()[0].items).toHaveLength(1);

    const itemId = getLayers()[0].items[0].id;
    dispatch('item:delete', { layerId, itemId });
    expect(getLayers()[0].items).toHaveLength(0);

    // past should have 3 entries: layer:create, item:add, item:delete
    expect(getHistory().past).toHaveLength(3);

    // Undo item:delete
    useHistoryStore.getState().undo();
    expect(getLayers()[0].items).toHaveLength(1);

    // Undo item:add
    useHistoryStore.getState().undo();
    expect(getLayers()[0].items).toHaveLength(0);
  });
});
