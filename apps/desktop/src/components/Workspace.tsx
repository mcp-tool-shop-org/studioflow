import { useWorkspaceStore } from '@studioflow/state';
import Toolbar from './Toolbar';
import LayersPanel from './LayersPanel';
import Canvas from './Canvas';
import Inspector from './Inspector';

export default function Workspace() {
  const { panels } = useWorkspaceStore();

  return (
    <div className="workspace-root">
      <Toolbar />
      <div className="workspace-body">
        {panels.layers && <LayersPanel />}
        <Canvas />
        {panels.inspector && <Inspector />}
      </div>
    </div>
  );
}
