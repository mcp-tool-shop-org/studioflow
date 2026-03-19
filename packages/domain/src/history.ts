import type { CommandType } from './command.js';
import type { Layer } from './layer.js';

/** A snapshot of document state before a command was applied */
export interface DocumentSnapshot {
  layers: Layer[];
  nextLayerId: number;
  nextItemId: number;
}

/** A recorded history entry for an undoable command */
export interface HistoryEntry {
  id: string;
  commandId: string;
  commandType: CommandType;
  label: string;
  timestamp: string;
  /** State snapshot before this command was applied */
  beforeSnapshot: DocumentSnapshot;
  /** Whether this entry can be undone */
  undoable: boolean;
}

/** Command types that are undoable (document-mutating) */
export const UNDOABLE_COMMANDS: readonly CommandType[] = [
  'layer:create',
  'layer:rename',
  'layer:toggle-visibility',
  'layer:delete',
  'item:add',
  'item:move',
  'item:delete',
  'item:update',
] as const;

/** Command types that are NOT undoable (persistence, project lifecycle) */
export const NON_UNDOABLE_COMMANDS: readonly CommandType[] = [
  'project:new',
  'project:save',
  'project:save-as',
  'project:open',
  'project:close',
] as const;

/** Human-readable labels for command types */
export const COMMAND_LABELS: Record<CommandType, string> = {
  'layer:create': 'Add Layer',
  'layer:rename': 'Rename Layer',
  'layer:toggle-visibility': 'Toggle Layer Visibility',
  'layer:delete': 'Delete Layer',
  'item:add': 'Add Item',
  'item:move': 'Move Item',
  'item:delete': 'Delete Item',
  'item:update': 'Update Item',
  'project:new': 'New Project',
  'project:save': 'Save Project',
  'project:save-as': 'Save Project As',
  'project:open': 'Open Project',
  'project:close': 'Close Project',
};
