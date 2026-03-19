import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkspaceStore } from '../workspaceStore.js';

beforeEach(() => {
  useWorkspaceStore.getState().reset();
});

describe('workspaceStore', () => {
  it('all panels visible by default', () => {
    const { panels } = useWorkspaceStore.getState();
    expect(panels.layers).toBe(true);
    expect(panels.canvas).toBe(true);
    expect(panels.inspector).toBe(true);
    expect(panels.toolbar).toBe(true);
  });

  it('activePanel is null by default', () => {
    expect(useWorkspaceStore.getState().activePanel).toBeNull();
  });

  it('togglePanel hides a visible panel', () => {
    useWorkspaceStore.getState().togglePanel('layers');
    expect(useWorkspaceStore.getState().panels.layers).toBe(false);
  });

  it('togglePanel shows a hidden panel', () => {
    useWorkspaceStore.getState().hidePanel('inspector');
    useWorkspaceStore.getState().togglePanel('inspector');
    expect(useWorkspaceStore.getState().panels.inspector).toBe(true);
  });

  it('setActivePanel records the active panel', () => {
    useWorkspaceStore.getState().setActivePanel('canvas');
    expect(useWorkspaceStore.getState().activePanel).toBe('canvas');
  });

  it('setActivePanel with null clears the active panel', () => {
    useWorkspaceStore.getState().setActivePanel('toolbar');
    useWorkspaceStore.getState().setActivePanel(null);
    expect(useWorkspaceStore.getState().activePanel).toBeNull();
  });

  it('showPanel makes a hidden panel visible', () => {
    useWorkspaceStore.getState().hidePanel('toolbar');
    useWorkspaceStore.getState().showPanel('toolbar');
    expect(useWorkspaceStore.getState().panels.toolbar).toBe(true);
  });

  it('hidePanel makes a visible panel invisible', () => {
    useWorkspaceStore.getState().hidePanel('canvas');
    expect(useWorkspaceStore.getState().panels.canvas).toBe(false);
  });

  it('reset restores all panels and clears activePanel', () => {
    useWorkspaceStore.getState().hidePanel('layers');
    useWorkspaceStore.getState().setActivePanel('inspector');
    useWorkspaceStore.getState().reset();
    const state = useWorkspaceStore.getState();
    expect(state.panels.layers).toBe(true);
    expect(state.activePanel).toBeNull();
  });
});
