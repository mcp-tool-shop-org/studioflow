export type PanelId = 'layers' | 'canvas' | 'inspector' | 'toolbar';

export type PanelVisibility = Record<PanelId, boolean>;

export interface WorkspaceState {
  panels: PanelVisibility;
  activePanel: PanelId | null;
}
