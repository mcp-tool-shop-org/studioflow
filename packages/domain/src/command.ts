export type CommandType =
  | 'layer:create'
  | 'layer:rename'
  | 'layer:toggle-visibility'
  | 'layer:delete'
  | 'item:add'
  | 'item:move'
  | 'item:delete'
  | 'item:update';

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
