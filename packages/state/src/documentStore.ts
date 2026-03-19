import { create } from 'zustand';
import type { Project, Layer, LayerItem, LayerItemType } from '@studioflow/domain';

export interface DocumentState {
  project: Project | null;
  layers: Layer[];
  nextLayerId: number;
  nextItemId: number;

  // Project actions
  setProject: (project: Project) => void;

  // Layer actions
  addLayer: (name?: string) => Layer;
  removeLayer: (layerId: string) => void;
  renameLayer: (layerId: string, name: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  reorderLayer: (layerId: string, newOrder: number) => void;

  // Item actions
  addItem: (layerId: string, item: Omit<LayerItem, 'id'>) => LayerItem | null;
  removeItem: (layerId: string, itemId: string) => void;
  updateItem: (layerId: string, itemId: string, patch: Partial<Omit<LayerItem, 'id'>>) => void;
  moveItem: (layerId: string, itemId: string, x: number, y: number) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  project: null as Project | null,
  layers: [] as Layer[],
  nextLayerId: 1,
  nextItemId: 1,
};

export const useDocumentStore = create<DocumentState>()((set, get) => ({
  ...initialState,

  setProject: (project) => set({ project }),

  addLayer: (name?: string) => {
    const { nextLayerId, layers } = get();
    const id = `layer-${nextLayerId}`;
    const newLayer: Layer = {
      id,
      name: name ?? `Layer ${nextLayerId}`,
      visible: true,
      locked: false,
      order: layers.length,
      items: [],
    };
    set((state) => ({
      layers: [...state.layers, newLayer],
      nextLayerId: state.nextLayerId + 1,
    }));
    return newLayer;
  },

  removeLayer: (layerId) =>
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== layerId),
    })),

  renameLayer: (layerId, name) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === layerId ? { ...l, name } : l)),
    })),

  toggleLayerLock: (layerId) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, locked: !l.locked } : l,
      ),
    })),

  toggleLayerVisibility: (layerId) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l,
      ),
    })),

  reorderLayer: (layerId, newOrder) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, order: newOrder } : l,
      ),
    })),

  addItem: (layerId, itemData) => {
    const { nextItemId } = get();
    const layer = get().layers.find((l) => l.id === layerId);
    if (!layer) return null;

    const id = `item-${nextItemId}`;
    const newItem: LayerItem = { id, ...itemData };

    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, items: [...l.items, newItem] } : l,
      ),
      nextItemId: state.nextItemId + 1,
    }));
    return newItem;
  },

  removeItem: (layerId, itemId) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId
          ? { ...l, items: l.items.filter((i) => i.id !== itemId) }
          : l,
      ),
    })),

  updateItem: (layerId, itemId, patch) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId
          ? {
              ...l,
              items: l.items.map((i) =>
                i.id === itemId ? { ...i, ...patch } : i,
              ),
            }
          : l,
      ),
    })),

  moveItem: (layerId, itemId, x, y) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId
          ? {
              ...l,
              items: l.items.map((i) =>
                i.id === itemId ? { ...i, x, y } : i,
              ),
            }
          : l,
      ),
    })),

  reset: () => set({ ...initialState, layers: [], nextLayerId: 1, nextItemId: 1 }),
}));
