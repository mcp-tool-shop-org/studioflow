import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useWorkspaceStore } from '@studioflow/state';
import { useCommandStore } from '@studioflow/state';

interface PingResponse {
  pong: boolean;
  message: string;
  timestamp: string;
}

export default function Toolbar() {
  const { panels, togglePanel } = useWorkspaceStore();
  const dispatch = useCommandStore((s) => s.dispatch);
  const [pingResult, setPingResult] = useState<string | null>(null);

  function handleNewLayer() {
    dispatch('layer:create', {});
  }

  async function handlePing() {
    try {
      const result = await invoke<PingResponse>('ping');
      setPingResult(result.message);
      setTimeout(() => setPingResult(null), 2500);
    } catch {
      setPingResult('error');
      setTimeout(() => setPingResult(null), 2500);
    }
  }

  return (
    <div className="toolbar" role="toolbar" aria-label="Main toolbar">
      <span className="toolbar__title">StudioFlow</span>

      <div className="toolbar__separator" />

      <div className="toolbar__section">
        <button
          className={`toolbar__btn${panels.layers ? ' toolbar__btn--active' : ''}`}
          onClick={() => togglePanel('layers')}
          aria-pressed={panels.layers}
          title="Toggle Layers panel"
        >
          Layers
        </button>
        <button
          className={`toolbar__btn${panels.inspector ? ' toolbar__btn--active' : ''}`}
          onClick={() => togglePanel('inspector')}
          aria-pressed={panels.inspector}
          title="Toggle Inspector panel"
        >
          Inspector
        </button>
      </div>

      <div className="toolbar__separator" />

      <div className="toolbar__section">
        <button
          className="toolbar__btn toolbar__btn--action"
          onClick={handleNewLayer}
          title="Create a new layer"
        >
          + New Layer
        </button>
      </div>

      <div className="toolbar__section toolbar__section--right">
        {pingResult !== null && (
          <span className="toolbar__ping-result" role="status">
            {pingResult}
          </span>
        )}
        <button
          className="toolbar__btn toolbar__btn--ping"
          onClick={handlePing}
          title="Ping Tauri backend"
        >
          Ping
        </button>
      </div>
    </div>
  );
}
