import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  useDocumentStore,
  useSelectionStore,
  useCommandStore,
  useHistoryStore,
} from '@studioflow/state';

// Mock @tauri-apps/api/core so invoke doesn't fail in tests
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({
    pong: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
  }),
}));

// Import component after mocks
import Inspector from '../Inspector';

// Reset stores before each test
beforeEach(() => {
  useDocumentStore.getState().reset();
  useSelectionStore.getState().reset();
  useCommandStore.getState().reset();
  useHistoryStore.getState().reset();
});

// ── helpers ──────────────────────────────────────────────────────────────────

/** Create a layer and add N items to it; returns { layerId, itemIds } */
function setupLayerWithItems(
  count: number,
  baseX = 0,
  sameX = false,
): { layerId: string; itemIds: string[] } {
  const layer = useDocumentStore.getState().addLayer('Test Layer');
  const itemIds: string[] = [];
  for (let i = 0; i < count; i++) {
    const item = useDocumentStore.getState().addItem(layer.id, {
      name: `Item ${i + 1}`,
      type: 'shape',
      x: sameX ? baseX : baseX + i * 100,
      y: 0,
      width: 50,
      height: 50,
      rotation: 0,
      data: {},
    });
    if (item) itemIds.push(item.id);
  }
  return { layerId: layer.id, itemIds };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Inspector', () => {
  // 1 — Empty state
  it('shows "Nothing selected" when nothing is selected', () => {
    render(<Inspector />);
    expect(screen.getByText(/nothing selected/i)).toBeTruthy();
  });

  // 2 — Single item selected: identity fields render
  it('shows item name and type when a single item is selected', () => {
    const { layerId, itemIds } = setupLayerWithItems(1);
    act(() => {
      useSelectionStore.getState().selectLayer(layerId);
      useSelectionStore.getState().selectItem(itemIds[0]);
    });
    render(<Inspector />);
    // Name input should be present with the item name
    const nameInput = screen.getByLabelText(/item name/i) as HTMLInputElement;
    expect(nameInput).toBeTruthy();
    expect(nameInput.value).toBe('Item 1');
  });

  // 3 — Single item: position inputs
  it('shows X and Y position fields for a single selected item', () => {
    const { layerId, itemIds } = setupLayerWithItems(1, 42);
    act(() => {
      useSelectionStore.getState().selectLayer(layerId);
      useSelectionStore.getState().selectItem(itemIds[0]);
    });
    render(<Inspector />);
    const xInput = screen.getByLabelText('X') as HTMLInputElement;
    expect(xInput).toBeTruthy();
    expect(parseFloat(xInput.value)).toBe(42);
  });

  // 4 — Multi-select: shows item count
  it('shows the selection count when multiple items are selected', () => {
    const { layerId, itemIds } = setupLayerWithItems(3);
    act(() => {
      useSelectionStore.getState().selectLayer(layerId);
      useSelectionStore.getState().selectItems(itemIds);
    });
    render(<Inspector />);
    expect(screen.getByText(/3 items/)).toBeTruthy();
  });

  // 5 — Multi-select: mixed X values show placeholder "—"
  it('shows mixed placeholder "—" for X when items have different positions', () => {
    // Items at x=0, x=100, x=200
    const { layerId, itemIds } = setupLayerWithItems(3, 0, false);
    act(() => {
      useSelectionStore.getState().selectLayer(layerId);
      useSelectionStore.getState().selectItems(itemIds);
    });
    render(<Inspector />);
    const xInput = screen.getByLabelText('X') as HTMLInputElement;
    expect(xInput.getAttribute('placeholder')).toBe('—');
  });

  // 6 — Multi-select: uniform X value shows the value (no mixed indicator)
  it('shows the shared X value when all selected items have the same position', () => {
    // Items all at x=50
    const { layerId, itemIds } = setupLayerWithItems(2, 50, true);
    act(() => {
      useSelectionStore.getState().selectLayer(layerId);
      useSelectionStore.getState().selectItems(itemIds);
    });
    render(<Inspector />);
    const xInput = screen.getByLabelText('X') as HTMLInputElement;
    // No mixed placeholder — should have a numeric value of 50
    expect(xInput.getAttribute('placeholder')).toBeNull();
    expect(xInput.value).toBe('50');
  });

  // 7 — Multi-select: "Delete Selected" removes all items
  it('dispatches item:delete for every selected item when Delete Selected is clicked', () => {
    const { layerId, itemIds } = setupLayerWithItems(3);
    act(() => {
      useSelectionStore.getState().selectLayer(layerId);
      useSelectionStore.getState().selectItems(itemIds);
    });
    render(<Inspector />);

    const deleteBtn = screen.getByRole('button', { name: /delete selected/i });
    act(() => {
      fireEvent.click(deleteBtn);
    });

    const layer = useDocumentStore.getState().layers.find((l) => l.id === layerId);
    expect(layer?.items.length ?? 0).toBe(0);
  });

  // 8 — Multi-select: "Duplicate Selected" creates copies
  it('dispatches item:add for each selected item when Duplicate Selected is clicked', () => {
    const { layerId, itemIds } = setupLayerWithItems(2);
    act(() => {
      useSelectionStore.getState().selectLayer(layerId);
      useSelectionStore.getState().selectItems(itemIds);
    });
    render(<Inspector />);

    const duplicateBtn = screen.getByRole('button', { name: /duplicate selected/i });
    act(() => {
      fireEvent.click(duplicateBtn);
    });

    const layer = useDocumentStore.getState().layers.find((l) => l.id === layerId);
    // Started with 2, duplicated 2 → should now have 4
    expect((layer?.items.length ?? 0)).toBe(4);
  });

  // 9 — Multi-select: Nudge up moves all selected items up by 10px
  it('moves all selected items up by 10px when Nudge up is clicked', () => {
    const { layerId, itemIds } = setupLayerWithItems(2, 0, true);
    // Both items start at y=0
    act(() => {
      useSelectionStore.getState().selectLayer(layerId);
      useSelectionStore.getState().selectItems(itemIds);
    });
    render(<Inspector />);

    const nudgeUpBtn = screen.getByRole('button', { name: /nudge up/i });
    act(() => {
      fireEvent.click(nudgeUpBtn);
    });

    const layer = useDocumentStore.getState().layers.find((l) => l.id === layerId);
    // All items should have moved to y = -10
    layer?.items.forEach((item) => {
      expect(item.y).toBe(-10);
    });
  });

  // 10 — Multi-select: Nudge left moves all selected items left by 10px
  it('moves all selected items left by 10px when Nudge left is clicked', () => {
    const { layerId, itemIds } = setupLayerWithItems(2, 50, true);
    // Both items start at x=50
    act(() => {
      useSelectionStore.getState().selectLayer(layerId);
      useSelectionStore.getState().selectItems(itemIds);
    });
    render(<Inspector />);

    const nudgeLeftBtn = screen.getByRole('button', { name: /nudge left/i });
    act(() => {
      fireEvent.click(nudgeLeftBtn);
    });

    const layer = useDocumentStore.getState().layers.find((l) => l.id === layerId);
    // All items should have moved to x = 40
    layer?.items.forEach((item) => {
      expect(item.x).toBe(40);
    });
  });

  // 11 — Multi-select: Nudge right moves all selected items right by 10px
  it('moves all selected items right by 10px when Nudge right is clicked', () => {
    const { layerId, itemIds } = setupLayerWithItems(2, 0, true);
    act(() => {
      useSelectionStore.getState().selectLayer(layerId);
      useSelectionStore.getState().selectItems(itemIds);
    });
    render(<Inspector />);

    const nudgeRightBtn = screen.getByRole('button', { name: /nudge right/i });
    act(() => {
      fireEvent.click(nudgeRightBtn);
    });

    const layer = useDocumentStore.getState().layers.find((l) => l.id === layerId);
    layer?.items.forEach((item) => {
      expect(item.x).toBe(10);
    });
  });

  // 12 — Multi-select: Nudge down moves all selected items down by 10px
  it('moves all selected items down by 10px when Nudge down is clicked', () => {
    const { layerId, itemIds } = setupLayerWithItems(2, 0, true);
    act(() => {
      useSelectionStore.getState().selectLayer(layerId);
      useSelectionStore.getState().selectItems(itemIds);
    });
    render(<Inspector />);

    const nudgeDownBtn = screen.getByRole('button', { name: /nudge down/i });
    act(() => {
      fireEvent.click(nudgeDownBtn);
    });

    const layer = useDocumentStore.getState().layers.find((l) => l.id === layerId);
    layer?.items.forEach((item) => {
      expect(item.y).toBe(10);
    });
  });

  // 13 — Multi-select: duplicate offsets position by +20
  it('offsets duplicated items by +20px on both axes', () => {
    const { layerId, itemIds } = setupLayerWithItems(1, 100, true);
    // y=0 for this item
    act(() => {
      useSelectionStore.getState().selectLayer(layerId);
      useSelectionStore.getState().selectItems(itemIds);
    });
    render(<Inspector />);

    // Select both items so multi-select section renders
    // Actually setupLayerWithItems(1, ...) gives only 1 item → singleItem renders
    // We need 2 items for multi-select. Let's add another item and select both.
    act(() => {
      const item2 = useDocumentStore.getState().addItem(layerId, {
        name: 'Item 2',
        type: 'shape',
        x: 100,
        y: 0,
        width: 50,
        height: 50,
        rotation: 0,
        data: {},
      });
      if (item2) {
        useSelectionStore.getState().selectItems([...itemIds, item2.id]);
      }
    });

    // Re-render with updated state
    const { unmount } = render(<Inspector />);
    const duplicateBtn = screen.getAllByRole('button', { name: /duplicate selected/i })[0];
    act(() => {
      fireEvent.click(duplicateBtn);
    });
    unmount();

    const layer = useDocumentStore.getState().layers.find((l) => l.id === layerId);
    // Original 2 + 2 duplicates = 4
    expect(layer?.items.length).toBe(4);
    // Duplicates should have x = original.x + 20
    const originals = layer!.items.slice(0, 2);
    const copies = layer!.items.slice(2);
    copies.forEach((copy, idx) => {
      expect(copy.x).toBe(originals[idx].x + 20);
      expect(copy.y).toBe(originals[idx].y + 20);
    });
  });

  // 14 — Color pickers appear when a single item is selected
  it('shows fill and stroke color pickers when a single item is selected', () => {
    const { layerId, itemIds } = setupLayerWithItems(1);
    act(() => {
      useSelectionStore.getState().selectLayer(layerId);
      useSelectionStore.getState().selectItem(itemIds[0]);
    });
    render(<Inspector />);
    expect(screen.getByLabelText('Fill color')).toBeTruthy();
    expect(screen.getByLabelText('Stroke color')).toBeTruthy();
    expect(screen.getByText('Colors')).toBeTruthy();
  });

  // 15 — Changing fill color dispatches item:set-fill command
  it('dispatches item:set-fill when fill color is changed', () => {
    const { layerId, itemIds } = setupLayerWithItems(1);
    act(() => {
      useSelectionStore.getState().selectLayer(layerId);
      useSelectionStore.getState().selectItem(itemIds[0]);
    });
    render(<Inspector />);

    const fillInput = screen.getByLabelText('Fill color') as HTMLInputElement;
    act(() => {
      fireEvent.change(fillInput, { target: { value: '#ff0000' } });
    });

    const layer = useDocumentStore.getState().layers.find((l) => l.id === layerId);
    const item = layer?.items.find((i) => i.id === itemIds[0]);
    expect(item?.fill).toBe('#ff0000');
  });

  // 16 — Multi-select with different fills shows "mixed"
  it('shows "mixed" indicator when multi-selected items have different fills', () => {
    const layer = useDocumentStore.getState().addLayer('Color Layer');
    const item1 = useDocumentStore.getState().addItem(layer.id, {
      name: 'Red',
      type: 'shape',
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      rotation: 0,
      data: {},
    });
    if (item1) useDocumentStore.getState().setItemFill(layer.id, item1.id, '#ff0000');
    const item2 = useDocumentStore.getState().addItem(layer.id, {
      name: 'Blue',
      type: 'shape',
      x: 100,
      y: 0,
      width: 50,
      height: 50,
      rotation: 0,
      data: {},
    });
    if (item2) useDocumentStore.getState().setItemFill(layer.id, item2.id, '#0000ff');
    act(() => {
      useSelectionStore.getState().selectLayer(layer.id);
      useSelectionStore.getState().selectItems([item1!.id, item2!.id]);
    });
    render(<Inspector />);
    // Should show "mixed" for the fill color picker
    const mixedIndicators = screen.getAllByText('mixed');
    expect(mixedIndicators.length).toBeGreaterThanOrEqual(1);
  });

  // 17 — Multi-select color change dispatches item:set-fill for all items
  it('dispatches item:set-fill for all selected items when fill color is changed in multi-select', () => {
    const layer = useDocumentStore.getState().addLayer('Batch Layer');
    const item1 = useDocumentStore.getState().addItem(layer.id, {
      name: 'A',
      type: 'shape',
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      rotation: 0,
      data: {},
    });
    if (item1) useDocumentStore.getState().setItemFill(layer.id, item1.id, '#ff0000');
    const item2 = useDocumentStore.getState().addItem(layer.id, {
      name: 'B',
      type: 'shape',
      x: 100,
      y: 0,
      width: 50,
      height: 50,
      rotation: 0,
      data: {},
    });
    if (item2) useDocumentStore.getState().setItemFill(layer.id, item2.id, '#0000ff');
    act(() => {
      useSelectionStore.getState().selectLayer(layer.id);
      useSelectionStore.getState().selectItems([item1!.id, item2!.id]);
    });
    render(<Inspector />);

    // There are two fill color inputs (fill + stroke per section); get the first fill one
    const fillInputs = screen.getAllByLabelText('Fill color');
    act(() => {
      fireEvent.change(fillInputs[0], { target: { value: '#00ff00' } });
    });

    const updatedLayer = useDocumentStore.getState().layers.find((l) => l.id === layer.id);
    updatedLayer?.items.forEach((item) => {
      expect(item.fill).toBe('#00ff00');
    });
  });
});
