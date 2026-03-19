// Viewport constants
export const ZOOM_STEP = 0.1;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5.0;
export const DEFAULT_ZOOM = 1.0;

// ViewportState — session-only workspace state, never persisted in project files
export interface ViewportState {
  zoom: number;  // range: MIN_ZOOM–MAX_ZOOM, default: DEFAULT_ZOOM
  panX: number;  // horizontal pan offset in pixels, default: 0
  panY: number;  // vertical pan offset in pixels, default: 0
}

// ViewportAction — commands dispatched to manipulate viewport
export type ViewportAction =
  | 'viewport:zoom-in'
  | 'viewport:zoom-out'
  | 'viewport:zoom-reset'
  | 'viewport:fit'
  | 'viewport:pan';

export interface ContentBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
