import { create } from 'zustand';
import type { PanelId, PanelVisibility } from '@studioflow/domain';

export interface WorkspaceStoreState {
  panels: PanelVisibility;
  activePanel: PanelId | null;

  // Actions
  togglePanel: (panelId: PanelId) => void;
  setActivePanel: (panelId: PanelId | null) => void;
  showPanel: (panelId: PanelId) => void;
  hidePanel: (panelId: PanelId) => void;

  // Reset
  reset: () => void;
}

const defaultPanels: PanelVisibility = {
  layers: true,
  canvas: true,
  inspector: true,
  toolbar: true,
};

const initialState = {
  panels: { ...defaultPanels },
  activePanel: null as PanelId | null,
};

export const useWorkspaceStore = create<WorkspaceStoreState>()((set) => ({
  ...initialState,

  togglePanel: (panelId) =>
    set((state) => ({
      panels: { ...state.panels, [panelId]: !state.panels[panelId] },
    })),

  setActivePanel: (panelId) =>
    set({ activePanel: panelId }),

  showPanel: (panelId) =>
    set((state) => ({
      panels: { ...state.panels, [panelId]: true },
    })),

  hidePanel: (panelId) =>
    set((state) => ({
      panels: { ...state.panels, [panelId]: false },
    })),

  reset: () =>
    set({ panels: { ...defaultPanels }, activePanel: null }),
}));
