import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  useDocumentStore,
  useSelectionStore,
  useViewportStore,
  useCommandStore,
} from '@studioflow/state';

// Mock @tauri-apps/api/core so invoke doesn't fail in tests
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({ pong: true }),
}));

// Import Canvas after mocks are registered
import Canvas from '../Canvas';

// ----------------------------------------------------------------
// Reset all stores before each test
// ----------------------------------------------------------------
beforeEach(() => {
  useDocumentStore.getState().reset();
  useSelectionStore.getState().reset();
  useViewportStore.getState().reset();
  useCommandStore.getState().reset();
});

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function addLayerWithItem() {
  const { addLayer, addItem } = useDocumentStore.getState();
  const layer = addLayer('Test Layer');
  const item = addItem(layer.id, {
    name: 'My Item',
    type: 'shape',
    x: 10,
    y: 20,
    width: 100,
    height: 80,
    rotation: 0,
    data: {},
  });
  useSelectionStore.getState().selectLayer(layer.id);
  return { layer, item };
}

// ----------------------------------------------------------------
// Canvas render tests
// ----------------------------------------------------------------
describe('Canvas', () => {
  it('renders without crashing', () => {
    const { container } = render(<Canvas />);
    expect(container).toBeTruthy();
  });

  it('has main element with canvas aria-label', () => {
    render(<Canvas />);
    const main = screen.getByRole('main', { name: /canvas/i });
    expect(main).toBeTruthy();
  });

  it('shows 100% zoom level by default', () => {
    render(<Canvas />);
    const zoomEl = screen.getByLabelText('Zoom level');
    expect(zoomEl.textContent).toBe('100%');
  });

  it('canvas transform container is present', () => {
    const { container } = render(<Canvas />);
    const transform = container.querySelector('.canvas-transform');
    expect(transform).toBeTruthy();
  });

  it('canvas transform container reflects viewport zoom state', () => {
    act(() => {
      useViewportStore.getState().zoomIn(); // zoom → 1.1
    });
    const { container } = render(<Canvas />);
    const transform = container.querySelector('.canvas-transform') as HTMLElement;
    expect(transform).toBeTruthy();
    // transform style should reference scale(1.1...)
    expect(transform.style.transform).toContain('scale(1.1');
  });

  // ----------------------------------------------------------------
  // Zoom control buttons
  // ----------------------------------------------------------------
  it('zoom in button (+) increases the viewport zoom', () => {
    render(<Canvas />);
    const btn = screen.getByRole('button', { name: /zoom in/i });
    fireEvent.click(btn);
    const zoom = useViewportStore.getState().zoom;
    expect(zoom).toBeCloseTo(1.1, 5);
  });

  it('zoom out button (−) decreases the viewport zoom', () => {
    render(<Canvas />);
    const btn = screen.getByRole('button', { name: /zoom out/i });
    fireEvent.click(btn);
    const zoom = useViewportStore.getState().zoom;
    expect(zoom).toBeCloseTo(0.9, 5);
  });

  it('reset zoom button restores zoom to 100%', () => {
    act(() => {
      useViewportStore.getState().zoomIn();
      useViewportStore.getState().zoomIn();
    });
    render(<Canvas />);
    const btn = screen.getByRole('button', { name: /reset zoom/i });
    fireEvent.click(btn);
    expect(useViewportStore.getState().zoom).toBe(1.0);
  });

  it('fit to canvas button is present', () => {
    render(<Canvas />);
    const btn = screen.getByRole('button', { name: /fit to canvas/i });
    expect(btn).toBeTruthy();
  });

  it('zoom level display updates after zoom in', () => {
    render(<Canvas />);
    const zoomEl = screen.getByLabelText('Zoom level');
    expect(zoomEl.textContent).toBe('100%');

    // Click zoom in
    const btn = screen.getByRole('button', { name: /zoom in/i });
    fireEvent.click(btn);

    // Re-read the element — React should have re-rendered
    expect(zoomEl.textContent).toBe('110%');
  });

  // ----------------------------------------------------------------
  // Item rendering & selection
  // ----------------------------------------------------------------
  it('renders items from visible layers', () => {
    addLayerWithItem();
    render(<Canvas />);
    expect(screen.getByLabelText(/Item: My Item/i)).toBeTruthy();
  });

  it('selected items have canvas-item--selected class', () => {
    const { item } = addLayerWithItem();
    act(() => {
      useSelectionStore.getState().selectItem(item!.id);
    });
    const { container } = render(<Canvas />);
    const selected = container.querySelectorAll('.canvas-item--selected');
    expect(selected.length).toBe(1);
  });

  it('non-selected items do not have canvas-item--selected class', () => {
    addLayerWithItem();
    // Do NOT select the item
    const { container } = render(<Canvas />);
    const selected = container.querySelectorAll('.canvas-item--selected');
    expect(selected.length).toBe(0);
  });

  // ----------------------------------------------------------------
  // Marquee overlay
  // ----------------------------------------------------------------
  it('marquee overlay is not rendered initially', () => {
    const { container } = render(<Canvas />);
    const marquee = container.querySelector('.canvas-marquee');
    expect(marquee).toBeNull();
  });

  it('marquee overlay appears after mousedown + mousemove on canvas-area', () => {
    const { container } = render(<Canvas />);
    const canvasArea = container.querySelector('.canvas-area') as HTMLElement;
    expect(canvasArea).toBeTruthy();

    // Simulate mousedown on the canvas area
    fireEvent.mouseDown(canvasArea, { button: 0, clientX: 50, clientY: 50 });

    // Simulate a mousemove on window (sufficient distance > 3px threshold)
    act(() => {
      fireEvent.mouseMove(window, { clientX: 100, clientY: 100 });
    });

    const marquee = container.querySelector('.canvas-marquee');
    expect(marquee).toBeTruthy();
  });

  it('marquee overlay disappears after mouseup', () => {
    const { container } = render(<Canvas />);
    const canvasArea = container.querySelector('.canvas-area') as HTMLElement;

    fireEvent.mouseDown(canvasArea, { button: 0, clientX: 50, clientY: 50 });
    act(() => {
      fireEvent.mouseMove(window, { clientX: 100, clientY: 100 });
    });

    // Sanity check — marquee appeared
    expect(container.querySelector('.canvas-marquee')).toBeTruthy();

    // Release mouse
    act(() => {
      fireEvent.mouseUp(window, { clientX: 100, clientY: 100 });
    });

    expect(container.querySelector('.canvas-marquee')).toBeNull();
  });

  // ----------------------------------------------------------------
  // Empty state
  // ----------------------------------------------------------------
  it('shows empty state when no visible layers exist', () => {
    render(<Canvas />);
    const empty = document.querySelector('.canvas-empty');
    expect(empty).toBeTruthy();
  });

  it('hides empty state when visible layers with items exist', () => {
    addLayerWithItem();
    render(<Canvas />);
    // canvas-empty should NOT be present
    const empty = document.querySelector('.canvas-empty');
    expect(empty).toBeNull();
  });

  // ----------------------------------------------------------------
  // Canvas item color rendering
  // ----------------------------------------------------------------
  it('renders item with custom fill color as backgroundColor', () => {
    const { addLayer, addItem } = useDocumentStore.getState();
    const layer = addLayer('Color Layer');
    addItem(layer.id, {
      name: 'Red Item',
      type: 'shape',
      x: 0,
      y: 0,
      width: 100,
      height: 80,
      rotation: 0,
      fill: '#ff0000',
      data: {},
    } as any);
    useSelectionStore.getState().selectLayer(layer.id);

    const { container } = render(<Canvas />);
    const itemEl = container.querySelector('.canvas-item') as HTMLElement;
    expect(itemEl).toBeTruthy();
    expect(itemEl.style.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('renders item with stroke color as border', () => {
    const { addLayer, addItem } = useDocumentStore.getState();
    const layer = addLayer('Stroke Layer');
    addItem(layer.id, {
      name: 'Stroked Item',
      type: 'shape',
      x: 0,
      y: 0,
      width: 100,
      height: 80,
      rotation: 0,
      stroke: '#00ff00',
      data: {},
    } as any);
    useSelectionStore.getState().selectLayer(layer.id);

    const { container } = render(<Canvas />);
    const itemEl = container.querySelector('.canvas-item') as HTMLElement;
    expect(itemEl).toBeTruthy();
    expect(itemEl.style.border).toBe('2px solid rgb(0, 255, 0)');
    expect(itemEl.classList.contains('canvas-item--has-stroke')).toBe(true);
  });

  it('renders item without fill/stroke using default styling', () => {
    addLayerWithItem();
    const { container } = render(<Canvas />);
    const itemEl = container.querySelector('.canvas-item') as HTMLElement;
    expect(itemEl).toBeTruthy();
    // Default fill should be #2a2a38
    expect(itemEl.style.backgroundColor).toBe('rgb(42, 42, 56)');
    // No stroke class
    expect(itemEl.classList.contains('canvas-item--has-stroke')).toBe(false);
  });
});
