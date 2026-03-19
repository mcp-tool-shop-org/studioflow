import { create } from 'zustand';
import type { Command, CommandResult, CommandType } from '@studioflow/domain';
import { useDocumentStore } from './documentStore.js';
import { useSelectionStore } from './selectionStore.js';

export interface CommandStoreState {
  history: Command[];
  lastResult: CommandResult | null;

  // Actions
  dispatch: (type: CommandType, payload: Record<string, unknown>) => CommandResult;
  clearHistory: () => void;
  reset: () => void;
}

let _commandCounter = 0;

function makeId(): string {
  _commandCounter += 1;
  return `cmd-${_commandCounter}`;
}

function executeCommand(
  type: CommandType,
  payload: Record<string, unknown>,
): CommandResult {
  try {
    const doc = useDocumentStore.getState();
    const sel = useSelectionStore.getState();

    switch (type) {
      case 'layer:create': {
        const name = typeof payload.name === 'string' ? payload.name : undefined;
        const layer = doc.addLayer(name);
        return { success: true, data: { id: layer.id } };
      }

      case 'layer:rename': {
        const { layerId, name } = payload;
        if (typeof layerId !== 'string' || typeof name !== 'string') {
          return { success: false, error: 'layer:rename requires layerId and name strings' };
        }
        doc.renameLayer(layerId, name);
        return { success: true };
      }

      case 'layer:toggle-visibility': {
        const { layerId } = payload;
        if (typeof layerId !== 'string') {
          return { success: false, error: 'layer:toggle-visibility requires layerId string' };
        }
        doc.toggleLayerVisibility(layerId);
        return { success: true };
      }

      case 'layer:delete': {
        const { layerId } = payload;
        if (typeof layerId !== 'string') {
          return { success: false, error: 'layer:delete requires layerId string' };
        }
        doc.removeLayer(layerId);
        return { success: true };
      }

      case 'item:add': {
        const { layerId, item } = payload;
        if (typeof layerId !== 'string' || typeof item !== 'object' || item === null) {
          return { success: false, error: 'item:add requires layerId and item object' };
        }
        const added = doc.addItem(layerId, item as Parameters<typeof doc.addItem>[1]);
        if (!added) {
          return { success: false, error: `Layer ${layerId} not found` };
        }
        return { success: true, data: { id: added.id } };
      }

      case 'item:move': {
        const { layerId, itemId, x, y } = payload;
        if (
          typeof layerId !== 'string' ||
          typeof itemId !== 'string' ||
          typeof x !== 'number' ||
          typeof y !== 'number'
        ) {
          return { success: false, error: 'item:move requires layerId, itemId, x, y' };
        }
        doc.moveItem(layerId, itemId, x, y);
        return { success: true };
      }

      case 'item:delete': {
        const { layerId, itemId } = payload;
        if (typeof layerId !== 'string' || typeof itemId !== 'string') {
          return { success: false, error: 'item:delete requires layerId and itemId strings' };
        }
        doc.removeItem(layerId, itemId);
        return { success: true };
      }

      case 'item:update': {
        const { layerId, itemId, patch } = payload;
        if (
          typeof layerId !== 'string' ||
          typeof itemId !== 'string' ||
          typeof patch !== 'object' ||
          patch === null
        ) {
          return { success: false, error: 'item:update requires layerId, itemId, and patch object' };
        }
        doc.updateItem(layerId, itemId, patch as Parameters<typeof doc.updateItem>[2]);
        return { success: true };
      }

      default: {
        const _exhaustive: never = type;
        return { success: false, error: `Unknown command type: ${_exhaustive}` };
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export const useCommandStore = create<CommandStoreState>()((set) => ({
  history: [],
  lastResult: null,

  dispatch: (type, payload) => {
    const command: Command = {
      id: makeId(),
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    const result = executeCommand(type, payload);

    set((state) => ({
      history: [...state.history, command],
      lastResult: result,
    }));

    return result;
  },

  clearHistory: () => set({ history: [], lastResult: null }),

  reset: () => {
    _commandCounter = 0;
    set({ history: [], lastResult: null });
  },
}));
