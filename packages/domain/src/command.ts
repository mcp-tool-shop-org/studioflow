export type CommandType =
  | 'layer:create'
  | 'layer:rename'
  | 'layer:toggle-visibility'
  | 'layer:toggle-lock'
  | 'layer:delete'
  | 'layer:reorder'
  | 'item:add'
  | 'item:move'
  | 'item:resize'
  | 'item:delete'
  | 'item:update'
  | 'item:set-fill'
  | 'item:set-stroke'
  | 'project:new'
  | 'project:save'
  | 'project:save-as'
  | 'project:open'
  | 'project:close';

export interface Command {
  id: string;
  type: CommandType;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface CommandResult {
  success: boolean;
  error?: string;
  data?: unknown;
}
