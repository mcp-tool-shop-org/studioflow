import { create } from 'zustand';
import type { Command, CommandResult, CommandType } from '@studioflow/domain';
import { useDocumentStore } from './documentStore.js';
import { useSelectionStore } from './selectionStore.js';
import { useHistoryStore } from './historyStore.js';

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

      case 'layer:toggle-lock': {
        const { layerId } = payload;
        if (typeof layerId !== 'string') {
          return { success: false, error: 'layer:toggle-lock requires layerId string' };
        }
        doc.toggleLayerLock(layerId);
        return { success: true };
      }

      case 'layer:delete': {
        const { layerId } = payload;
        if (typeof layerId !== 'string') {
          return { success: false, error: 'layer:delete requires layerId string' };
        }
        // Clear selection if deleting the selected layer
        if (sel.selectedLayerId === layerId) {
          sel.clearSelection();
        }
        doc.removeLayer(layerId);
        return { success: true };
      }

      case 'layer:reorder': {
        const { layerId, newOrder } = payload;
        if (typeof layerId !== 'string' || typeof newOrder !== 'number') {
          return { success: false, error: 'layer:reorder requires layerId and newOrder' };
        }
        doc.reorderLayer(layerId, newOrder);
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

      case 'item:resize': {
        const { layerId, itemId, width, height } = payload;
        if (typeof layerId !== 'string' || typeof itemId !== 'string' || typeof width !== 'number' || typeof height !== 'number') {
          return { success: false, error: 'item:resize requires layerId, itemId, width, height' };
        }
        doc.updateItem(layerId, itemId, { width, height });
        return { success: true };
      }

      case 'item:delete': {
        const { layerId, itemId } = payload;
        if (typeof layerId !== 'string' || typeof itemId !== 'string') {
          return { success: false, error: 'item:delete requires layerId and itemId strings' };
        }
        // Clear selection if deleting selected item
        if (sel.selectedItemIds.includes(itemId)) {
          sel.selectItems(sel.selectedItemIds.filter(id => id !== itemId));
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

      case 'item:set-fill': {
        const { layerId, itemId, color } = payload;
        if (typeof layerId !== 'string' || typeof itemId !== 'string' || typeof color !== 'string') {
          return { success: false, error: 'item:set-fill requires layerId, itemId, and color strings' };
        }
        doc.setItemFill(layerId, itemId, color);
        return { success: true };
      }

      case 'item:set-stroke': {
        const { layerId, itemId, color } = payload;
        if (typeof layerId !== 'string' || typeof itemId !== 'string' || typeof color !== 'string') {
          return { success: false, error: 'item:set-stroke requires layerId, itemId, and color strings' };
        }
        doc.setItemStroke(layerId, itemId, color);
        return { success: true };
      }

      // Persistence commands — routed through command system but handled by persistenceStore
      case 'project:new':
      case 'project:save':
      case 'project:save-as':
      case 'project:open':
      case 'project:close':
        return { success: true, data: { handler: 'persistence' } };

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

    // Record snapshot BEFORE mutation for undo support
    useHistoryStore.getState().recordBeforeCommand(command.id, type, payload);

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
