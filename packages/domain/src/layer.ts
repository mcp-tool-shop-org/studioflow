import type { ColorValue } from './color.js';

export type LayerItemType = 'shape' | 'text' | 'image' | 'group';

export interface LayerItem {
  id: string;
  name: string;
  type: LayerItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  data: Record<string, unknown>;
  fill?: ColorValue;
  stroke?: ColorValue;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  order: number;
  items: LayerItem[];
}

export interface Selection {
  selectedLayerId: string | null;
  selectedItemIds: string[];
}
