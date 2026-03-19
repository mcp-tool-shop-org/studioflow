import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useDocumentStore, useSelectionStore, useWorkspaceStore, useCommandStore } from '@studioflow/state';

// Mock @tauri-apps/api/core so invoke doesn't fail in tests
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({ pong: true, message: 'pong', timestamp: new Date().toISOString() }),
}));

// Import components after mocks
import Workspace from '../Workspace';
import Toolbar from '../Toolbar';
import LayersPanel from '../LayersPanel';

// Reset stores before each test
beforeEach(() => {
  useDocumentStore.getState().reset();
  useSelectionStore.getState().reset();
  useWorkspaceStore.getState().reset();
  useCommandStore.getState().reset();
});

describe('Workspace', () => {
  it('renders without crashing', () => {
    const { container } = render(<Workspace />);
    expect(container).toBeTruthy();
  });

  it('renders the workspace root element', () => {
    const { container } = render(<Workspace />);
    const root = container.querySelector('.workspace-root');
    expect(root).toBeTruthy();
  });

  it('renders the workspace body with canvas', () => {
    render(<Workspace />);
    expect(screen.getByRole('main')).toBeTruthy();
  });

  it('shows layers panel by default', () => {
    render(<Workspace />);
    // Layers panel is visible by default — the aside element should be present
    const layersPanel = screen.getByLabelText(/layers panel/i);
    expect(layersPanel).toBeTruthy();
  });
});

describe('Toolbar', () => {
  it('renders with StudioFlow title', () => {
    render(<Toolbar />);
    expect(screen.getByText('StudioFlow')).toBeTruthy();
  });

  it('renders the New Layer button', () => {
    render(<Toolbar />);
    const btn = screen.getByRole('button', { name: /new layer/i });
    expect(btn).toBeTruthy();
  });

  it('renders Layers toggle button', () => {
    render(<Toolbar />);
    expect(screen.getByRole('button', { name: /^layers$/i })).toBeTruthy();
  });

  it('renders Inspector toggle button', () => {
    render(<Toolbar />);
    expect(screen.getByRole('button', { name: /^inspector$/i })).toBeTruthy();
  });

  it('clicking New Layer dispatches layer:create and adds a layer to the store', () => {
    render(<Toolbar />);
    const btn = screen.getByRole('button', { name: /new layer/i });
    fireEvent.click(btn);
    const layers = useDocumentStore.getState().layers;
    expect(layers.length).toBe(1);
  });

  it('renders Ping button', () => {
    render(<Toolbar />);
    expect(screen.getByRole('button', { name: /^ping$/i })).toBeTruthy();
  });
});

describe('LayersPanel', () => {
  it('shows no layers message when store is empty', () => {
    render(<LayersPanel />);
    expect(screen.getByText(/no layers yet/i)).toBeTruthy();
  });

  it('shows layers from the document store', () => {
    useDocumentStore.getState().addLayer('Background');
    useDocumentStore.getState().addLayer('Foreground');
    render(<LayersPanel />);
    expect(screen.getByText('Background')).toBeTruthy();
    expect(screen.getByText('Foreground')).toBeTruthy();
  });

  it('selects a layer when clicked', () => {
    useDocumentStore.getState().addLayer('My Layer');
    render(<LayersPanel />);
    const item = screen.getByText('My Layer');
    fireEvent.click(item);
    const { selectedLayerId } = useSelectionStore.getState();
    expect(selectedLayerId).toBe('layer-1');
  });

  it('renders Add Layer button', () => {
    render(<LayersPanel />);
    expect(screen.getByRole('button', { name: /add new layer/i })).toBeTruthy();
  });

  it('clicking Add Layer creates a new layer in the store', () => {
    render(<LayersPanel />);
    const btn = screen.getByRole('button', { name: /add new layer/i });
    fireEvent.click(btn);
    expect(useDocumentStore.getState().layers.length).toBe(1);
  });

  it('highlights the selected layer', () => {
    useDocumentStore.getState().addLayer('Selected');
    useSelectionStore.getState().selectLayer('layer-1');
    render(<LayersPanel />);
    const items = document.querySelectorAll('.layer-item--selected');
    expect(items.length).toBe(1);
  });
});
