import { describe, it, expect, beforeEach } from 'vitest';
import { useViewportStore } from '../viewportStore.js';
import { ZOOM_STEP, MIN_ZOOM, MAX_ZOOM, DEFAULT_ZOOM } from '@studioflow/domain';

beforeEach(() => {
  useViewportStore.getState().reset();
});

describe('viewportStore', () => {
  // Initial state
  it('has default zoom of 1.0', () => {
    expect(useViewportStore.getState().zoom).toBe(DEFAULT_ZOOM);
    expect(useViewportStore.getState().zoom).toBe(1.0);
  });

  it('has default panX of 0', () => {
    expect(useViewportStore.getState().panX).toBe(0);
  });

  it('has default panY of 0', () => {
    expect(useViewportStore.getState().panY).toBe(0);
  });

  // zoomIn
  it('zoomIn increases zoom by ZOOM_STEP', () => {
    const before = useViewportStore.getState().zoom;
    useViewportStore.getState().zoomIn();
    const after = useViewportStore.getState().zoom;
    expect(after).toBeCloseTo(before + ZOOM_STEP, 8);
  });

  it('zoomIn clamps at MAX_ZOOM', () => {
    useViewportStore.getState().zoomTo(MAX_ZOOM);
    useViewportStore.getState().zoomIn();
    expect(useViewportStore.getState().zoom).toBe(MAX_ZOOM);
  });

  // zoomOut
  it('zoomOut decreases zoom by ZOOM_STEP', () => {
    const before = useViewportStore.getState().zoom;
    useViewportStore.getState().zoomOut();
    const after = useViewportStore.getState().zoom;
    expect(after).toBeCloseTo(before - ZOOM_STEP, 8);
  });

  it('zoomOut clamps at MIN_ZOOM', () => {
    useViewportStore.getState().zoomTo(MIN_ZOOM);
    useViewportStore.getState().zoomOut();
    expect(useViewportStore.getState().zoom).toBe(MIN_ZOOM);
  });

  // zoomReset
  it('zoomReset restores zoom to DEFAULT_ZOOM', () => {
    useViewportStore.getState().zoomTo(3.5);
    useViewportStore.getState().zoomReset();
    expect(useViewportStore.getState().zoom).toBe(DEFAULT_ZOOM);
  });

  // panTo
  it('panTo sets panX and panY', () => {
    useViewportStore.getState().panTo(100, 200);
    const state = useViewportStore.getState();
    expect(state.panX).toBe(100);
    expect(state.panY).toBe(200);
  });

  // panBy
  it('panBy adds delta to current pan', () => {
    useViewportStore.getState().panTo(50, 80);
    useViewportStore.getState().panBy(10, -20);
    const state = useViewportStore.getState();
    expect(state.panX).toBe(60);
    expect(state.panY).toBe(60);
  });

  // fitToCanvas
  it('fitToCanvas sets zoom and centers content', () => {
    useViewportStore.getState().fitToCanvas(800, 600, { x: 0, y: 0, width: 400, height: 300 });
    const state = useViewportStore.getState();
    // Both axes allow zoom=2, so zoom should be 2 (clamped at MAX_ZOOM if needed)
    expect(state.zoom).toBeCloseTo(2.0, 5);
  });

  it('fitToCanvas clamps zoom to MAX_ZOOM for very small content', () => {
    useViewportStore.getState().fitToCanvas(5000, 5000, { x: 0, y: 0, width: 1, height: 1 });
    expect(useViewportStore.getState().zoom).toBe(MAX_ZOOM);
  });

  it('fitToCanvas ignores zero-dimension content bounds', () => {
    useViewportStore.getState().zoomTo(2.5);
    useViewportStore.getState().fitToCanvas(800, 600, { x: 0, y: 0, width: 0, height: 0 });
    // Should remain unchanged
    expect(useViewportStore.getState().zoom).toBe(2.5);
  });

  // reset
  it('reset restores initial state', () => {
    useViewportStore.getState().zoomTo(3.0);
    useViewportStore.getState().panTo(150, 250);
    useViewportStore.getState().reset();
    const state = useViewportStore.getState();
    expect(state.zoom).toBe(DEFAULT_ZOOM);
    expect(state.panX).toBe(0);
    expect(state.panY).toBe(0);
  });

  // Zoom step arithmetic
  it('ZOOM_STEP is 0.1', () => {
    expect(ZOOM_STEP).toBe(0.1);
  });

  it('10 zoomIn steps from 1.0 reaches approximately 2.0', () => {
    for (let i = 0; i < 10; i++) {
      useViewportStore.getState().zoomIn();
    }
    expect(useViewportStore.getState().zoom).toBeCloseTo(2.0, 5);
  });

  it('zoomTo clamps below MIN_ZOOM', () => {
    useViewportStore.getState().zoomTo(-1);
    expect(useViewportStore.getState().zoom).toBe(MIN_ZOOM);
  });

  it('zoomTo clamps above MAX_ZOOM', () => {
    useViewportStore.getState().zoomTo(99);
    expect(useViewportStore.getState().zoom).toBe(MAX_ZOOM);
  });
});
