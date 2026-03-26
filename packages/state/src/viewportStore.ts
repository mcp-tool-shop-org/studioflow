import { create } from 'zustand';
import {
  ZOOM_STEP,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
} from '@studioflow/domain';
import type { ViewportState, ContentBounds } from '@studioflow/domain';

export interface ViewportStoreState extends ViewportState {
  // Actions
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (level: number) => void;
  zoomReset: () => void;
  panTo: (x: number, y: number) => void;
  panBy: (dx: number, dy: number) => void;
  fitToCanvas: (
    canvasWidth: number,
    canvasHeight: number,
    contentBounds: ContentBounds
  ) => void;

  // Reset all viewport state
  reset: () => void;
}

const initialState: ViewportState = {
  zoom: DEFAULT_ZOOM,
  panX: 0,
  panY: 0,
};

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export const useViewportStore = create<ViewportStoreState>()((set) => ({
  ...initialState,

  zoomIn: () =>
    set((state) => ({
      zoom: clampZoom(parseFloat((state.zoom + ZOOM_STEP).toFixed(10))),
    })),

  zoomOut: () =>
    set((state) => ({
      zoom: clampZoom(parseFloat((state.zoom - ZOOM_STEP).toFixed(10))),
    })),

  zoomTo: (level) =>
    set({ zoom: clampZoom(level) }),

  zoomReset: () =>
    set({ zoom: DEFAULT_ZOOM }),

  panTo: (x, y) =>
    set({ panX: x, panY: y }),

  panBy: (dx, dy) =>
    set((state) => ({
      panX: state.panX + dx,
      panY: state.panY + dy,
    })),

  fitToCanvas: (canvasWidth, canvasHeight, contentBounds) => {
    if (contentBounds.width === 0 || contentBounds.height === 0) {
      return;
    }
    const scaleX = canvasWidth / contentBounds.width;
    const scaleY = canvasHeight / contentBounds.height;
    const zoom = clampZoom(Math.min(scaleX, scaleY));

    // Center the content
    const panX = (canvasWidth - contentBounds.width * zoom) / 2 - contentBounds.x * zoom;
    const panY = (canvasHeight - contentBounds.height * zoom) / 2 - contentBounds.y * zoom;

    set({ zoom, panX, panY });
  },

  reset: () =>
    set({ ...initialState }),
}));
