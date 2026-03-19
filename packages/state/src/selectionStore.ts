import { create } from 'zustand';
import type { SelectionMode, SelectionRect, SelectionBounds } from '../../domain/src/selection.js';
import { useDocumentStore } from './documentStore.js';

export interface SelectionState {
  selectedLayerId: string | null;
  selectedItemIds: string[];

  // ── Original API (backward-compatible) ──────────────────────────────────
  selectLayer: (layerId: string | null) => void;
  selectItem: (itemId: string) => void;
  selectItems: (itemIds: string[]) => void;
  clearSelection: () => void;
  toggleItemSelection: (itemId: string) => void;

  // ── Extended multi-selection API ─────────────────────────────────────────
  /**
   * Select a single item using the given mode semantics:
   *   replace – clear current selection and select only this item
   *   add     – append this item (idempotent)
   *   toggle  – add if not selected, remove if already selected
   */
  selectWithMode: (itemId: string, mode: SelectionMode) => void;

  /**
   * Marquee / rubber-band select: collect all items whose bounding boxes
   * overlap the given rect.  Items whose id/x/y/width/height are supplied
   * by the caller (Canvas is responsible for passing the visible item list).
   */
  selectByRect: (
    rect: SelectionRect,
    items: Array<{ id: string; x: number; y: number; width: number; height: number }>,
  ) => void;

  /**
   * Compute the union bounding box of all currently-selected items by
   * looking them up in documentStore.  Returns null when nothing is selected
   * or when none of the selected ids can be found in the document.
   */
  getSelectionBounds: () => SelectionBounds | null;

  /**
   * Select every item on the given layer.
   */
  selectAll: (layerId: string) => void;

  /**
   * Invert the selection on the given layer:
   *   – items that were selected become deselected
   *   – items that were not selected become selected
   */
  invertSelection: (layerId: string) => void;

  // ── Reset ────────────────────────────────────────────────────────────────
  reset: () => void;
}

const initialState = {
  selectedLayerId: null as string | null,
  selectedItemIds: [] as string[],
};

/** Deduplicate an array while preserving insertion order. */
function dedup(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

export const useSelectionStore = create<SelectionState>()((set, get) => ({
  ...initialState,

  // ── Backward-compatible actions ──────────────────────────────────────────

  selectLayer: (layerId) => set({ selectedLayerId: layerId }),

  selectItem: (itemId) => set({ selectedItemIds: [itemId] }),

  selectItems: (itemIds) => set({ selectedItemIds: [...itemIds] }),

  clearSelection: () => set({ selectedLayerId: null, selectedItemIds: [] }),

  toggleItemSelection: (itemId) =>
    set((state) => {
      const already = state.selectedItemIds.includes(itemId);
      return {
        selectedItemIds: already
          ? state.selectedItemIds.filter((id) => id !== itemId)
          : [...state.selectedItemIds, itemId],
      };
    }),

  // ── Extended multi-selection actions ─────────────────────────────────────

  selectWithMode: (itemId, mode) =>
    set((state) => {
      switch (mode) {
        case 'replace':
          return { selectedItemIds: [itemId] };

        case 'add':
          return {
            selectedItemIds: dedup([...state.selectedItemIds, itemId]),
          };

        case 'toggle': {
          const already = state.selectedItemIds.includes(itemId);
          return {
            selectedItemIds: already
              ? state.selectedItemIds.filter((id) => id !== itemId)
              : dedup([...state.selectedItemIds, itemId]),
          };
        }

        default:
          return state;
      }
    }),

  selectByRect: (rect, items) => {
    const { x: rx, y: ry, width: rw, height: rh } = rect;
    const rectRight = rx + rw;
    const rectBottom = ry + rh;

    const matched = items
      .filter((item) => {
        const itemRight = item.x + item.width;
        const itemBottom = item.y + item.height;
        // AABB overlap test (items must intersect or be contained by the rect)
        return (
          item.x < rectRight &&
          itemRight > rx &&
          item.y < rectBottom &&
          itemBottom > ry
        );
      })
      .map((item) => item.id);

    set({ selectedItemIds: matched });
  },

  getSelectionBounds: () => {
    const { selectedItemIds } = get();
    if (selectedItemIds.length === 0) return null;

    const { layers } = useDocumentStore.getState();
    const allItems = layers.flatMap((l) => l.items);

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let found = false;

    for (const id of selectedItemIds) {
      const item = allItems.find((i) => i.id === id);
      if (!item) continue;
      found = true;
      if (item.x < minX) minX = item.x;
      if (item.y < minY) minY = item.y;
      const right = item.x + item.width;
      const bottom = item.y + item.height;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    }

    return found ? { minX, minY, maxX, maxY } : null;
  },

  selectAll: (layerId) => {
    const { layers } = useDocumentStore.getState();
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;
    set({ selectedItemIds: layer.items.map((i) => i.id) });
  },

  invertSelection: (layerId) => {
    const { layers } = useDocumentStore.getState();
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;
    set((state) => {
      const layerItemIds = new Set(layer.items.map((i) => i.id));
      const currentSet = new Set(state.selectedItemIds);
      const inverted = layer.items
        .filter((i) => !currentSet.has(i.id))
        .map((i) => i.id);
      // Items selected on OTHER layers stay selected; only layer's items are toggled
      const outsideLayer = state.selectedItemIds.filter((id) => !layerItemIds.has(id));
      return { selectedItemIds: [...outsideLayer, ...inverted] };
    });
  },

  // ── Reset ────────────────────────────────────────────────────────────────

  reset: () => set({ ...initialState, selectedItemIds: [] }),
}));
