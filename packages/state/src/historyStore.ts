import { create } from 'zustand';
import type { CommandType } from '@studioflow/domain';
import type { HistoryEntry, DocumentSnapshot } from '@studioflow/domain';
import { UNDOABLE_COMMANDS, COMMAND_LABELS } from '@studioflow/domain';
import { useDocumentStore } from './documentStore.js';

/** Max history entries to keep */
const MAX_HISTORY = 100;

let _historyCounter = 0;
function makeHistoryId(): string {
  _historyCounter += 1;
  return `hist-${_historyCounter}`;
}

export interface HistoryStoreState {
  /** Past entries (most recent last) */
  past: HistoryEntry[];
  /** Future entries for redo (most recent undo first) */
  future: HistoryEntry[];
  /** Snapshot at last save — used to determine dirty state relative to saved baseline */
  savedSnapshot: DocumentSnapshot | null;

  // Derived
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;

  // Actions
  /** Record a command that just happened. Call BEFORE the command mutates state. */
  recordBeforeCommand: (commandId: string, commandType: CommandType, payload: Record<string, unknown>) => void;
  /** Undo the last undoable command */
  undo: () => void;
  /** Redo the last undone command */
  redo: () => void;
  /** Mark the current state as the saved baseline */
  markSaved: () => void;
  /** Check if current document state matches the saved baseline */
  isAtSavedState: () => boolean;
  /** Clear all history (e.g. on project close/new) */
  clearHistory: () => void;
  /** Reset */
  reset: () => void;
}

function takeDocumentSnapshot(): DocumentSnapshot {
  const doc = useDocumentStore.getState();
  return {
    layers: JSON.parse(JSON.stringify(doc.layers)),
    nextLayerId: doc.nextLayerId,
    nextItemId: doc.nextItemId,
  };
}

function restoreDocumentSnapshot(snapshot: DocumentSnapshot): void {
  useDocumentStore.setState({
    layers: snapshot.layers,
    nextLayerId: snapshot.nextLayerId,
    nextItemId: snapshot.nextItemId,
  });
}

function snapshotsEqual(a: DocumentSnapshot | null, b: DocumentSnapshot | null): boolean {
  if (a === null || b === null) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

function computeDerived(past: HistoryEntry[], future: HistoryEntry[]) {
  const lastUndoable = past.length > 0 ? past[past.length - 1] : null;
  const lastRedoable = future.length > 0 ? future[0] : null;
  return {
    canUndo: lastUndoable !== null,
    canRedo: lastRedoable !== null,
    undoLabel: lastUndoable ? `Undo ${lastUndoable.label}` : null,
    redoLabel: lastRedoable ? `Redo ${lastRedoable.label}` : null,
  };
}

export const useHistoryStore = create<HistoryStoreState>()((set, get) => ({
  past: [],
  future: [],
  savedSnapshot: null,
  canUndo: false,
  canRedo: false,
  undoLabel: null,
  redoLabel: null,

  recordBeforeCommand: (commandId, commandType, _payload) => {
    // Only record undoable commands
    if (!UNDOABLE_COMMANDS.includes(commandType)) return;

    const snapshot = takeDocumentSnapshot();
    const label = COMMAND_LABELS[commandType] ?? commandType;

    const entry: HistoryEntry = {
      id: makeHistoryId(),
      commandId,
      commandType,
      label,
      timestamp: new Date().toISOString(),
      beforeSnapshot: snapshot,
      undoable: true,
    };

    set((state) => {
      // New action clears redo stack
      const newPast = [...state.past, entry];
      // Enforce max history
      if (newPast.length > MAX_HISTORY) {
        newPast.shift();
      }
      return {
        past: newPast,
        future: [], // Clear redo on divergent action
        ...computeDerived(newPast, []),
      };
    });
  },

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;

    // Take snapshot of current state (for redo)
    const currentSnapshot = takeDocumentSnapshot();

    // Pop last entry
    const entry = past[past.length - 1];
    const newPast = past.slice(0, -1);

    // Restore the before-snapshot
    restoreDocumentSnapshot(entry.beforeSnapshot);

    // Push to future with current snapshot as beforeSnapshot (so redo restores forward)
    const redoEntry: HistoryEntry = {
      ...entry,
      beforeSnapshot: currentSnapshot,
    };

    const newFuture = [redoEntry, ...future];

    set({
      past: newPast,
      future: newFuture,
      ...computeDerived(newPast, newFuture),
    });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;

    // Take snapshot of current state (for undo again)
    const currentSnapshot = takeDocumentSnapshot();

    // Pop first future entry
    const entry = future[0];
    const newFuture = future.slice(1);

    // Restore the snapshot stored in the redo entry (the state after the command)
    restoreDocumentSnapshot(entry.beforeSnapshot);

    // Push to past with current snapshot
    const undoEntry: HistoryEntry = {
      ...entry,
      beforeSnapshot: currentSnapshot,
    };

    const newPast = [...past, undoEntry];

    set({
      past: newPast,
      future: newFuture,
      ...computeDerived(newPast, newFuture),
    });
  },

  markSaved: () => {
    const snapshot = takeDocumentSnapshot();
    set({ savedSnapshot: snapshot });
  },

  isAtSavedState: () => {
    const { savedSnapshot } = get();
    const current = takeDocumentSnapshot();
    return snapshotsEqual(savedSnapshot, current);
  },

  clearHistory: () => {
    _historyCounter = 0;
    set({
      past: [],
      future: [],
      savedSnapshot: null,
      ...computeDerived([], []),
    });
  },

  reset: () => {
    _historyCounter = 0;
    set({
      past: [],
      future: [],
      savedSnapshot: null,
      canUndo: false,
      canRedo: false,
      undoLabel: null,
      redoLabel: null,
    });
  },
}));
