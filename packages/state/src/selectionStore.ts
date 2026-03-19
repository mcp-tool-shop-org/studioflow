import { create } from 'zustand';

export interface SelectionState {
  selectedLayerId: string | null;
  selectedItemIds: string[];

  // Actions
  selectLayer: (layerId: string | null) => void;
  selectItem: (itemId: string) => void;
  selectItems: (itemIds: string[]) => void;
  clearSelection: () => void;
  toggleItemSelection: (itemId: string) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  selectedLayerId: null as string | null,
  selectedItemIds: [] as string[],
};

export const useSelectionStore = create<SelectionState>()((set, get) => ({
  ...initialState,

  selectLayer: (layerId) =>
    set({ selectedLayerId: layerId }),

  selectItem: (itemId) =>
    set({ selectedItemIds: [itemId] }),

  selectItems: (itemIds) =>
    set({ selectedItemIds: [...itemIds] }),

  clearSelection: () =>
    set({ selectedLayerId: null, selectedItemIds: [] }),

  toggleItemSelection: (itemId) =>
    set((state) => {
      const already = state.selectedItemIds.includes(itemId);
      return {
        selectedItemIds: already
          ? state.selectedItemIds.filter((id) => id !== itemId)
          : [...state.selectedItemIds, itemId],
      };
    }),

  reset: () => set({ ...initialState, selectedItemIds: [] }),
}));
