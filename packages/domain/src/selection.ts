/**
 * Selection mode semantics:
 * - 'replace': clear existing selection, set to the given item(s)
 * - 'add':     append item(s) to the current selection (no duplicates)
 * - 'toggle':  if item is selected → deselect; if not → add to selection
 */
export type SelectionMode = 'replace' | 'add' | 'toggle';

/**
 * Axis-aligned bounding rectangle used for marquee / rubber-band selection.
 * Origin (x, y) is the top-left corner; width/height are positive values.
 */
export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Tight bounding box computed from the union of all currently-selected items.
 * Returned by getSelectionBounds(); null when nothing is selected.
 */
export interface SelectionBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
