/**
 * dirtyTracker — subscribe-based tracker that calls persistenceStore.markDirty()
 * whenever documentStore changes state, but only AFTER an initial project load.
 *
 * It is intentionally NOT a Zustand middleware so that it can span two stores
 * without coupling their creation order.
 *
 * Call `initDirtyTracker()` once at app startup (after stores are created).
 * Returns an unsubscribe function.
 */
import { useDocumentStore } from './documentStore.js';
import { usePersistenceStore } from './persistenceStore.js';

let _unsubscribe: (() => void) | null = null;

export function initDirtyTracker(): () => void {
  // Unsubscribe from any prior subscription (idempotent re-init)
  if (_unsubscribe) {
    _unsubscribe();
    _unsubscribe = null;
  }

  // Track whether we have ever received a "settled" state after load.
  // We start with a snapshot; any change from that baseline = user edit.
  let previousProject = useDocumentStore.getState().project;
  let previousLayers = useDocumentStore.getState().layers;
  let initialized = false;

  const unsubscribe = useDocumentStore.subscribe((state) => {
    // On the very first notification after subscription, just capture baseline.
    if (!initialized) {
      previousProject = state.project;
      previousLayers = state.layers;
      initialized = true;
      return;
    }

    // Suppress dirty-marking while a project is being loaded
    if (usePersistenceStore.getState()._isLoadingProject) {
      previousProject = state.project;
      previousLayers = state.layers;
      return;
    }

    // Check if something actually changed
    const projectChanged = state.project !== previousProject;
    const layersChanged = state.layers !== previousLayers;

    if (projectChanged || layersChanged) {
      previousProject = state.project;
      previousLayers = state.layers;
      usePersistenceStore.getState().markDirty();
    }
  });

  _unsubscribe = unsubscribe;
  return unsubscribe;
}

/**
 * Reset the dirty tracker (useful for tests).
 */
export function resetDirtyTracker(): void {
  if (_unsubscribe) {
    _unsubscribe();
    _unsubscribe = null;
  }
}
