import React from 'react';

export interface ColorPickerProps {
  label: string;
  value: string | null; // null = "mixed" for multi-select
  onChange: (color: string) => void;
}

const NEUTRAL_COLOR = '#808080';

export default function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const isMixed = value === null;

  return (
    <div className="inspector-color-row">
      <span className="color-picker-label">{label}</span>
      <input
        className="color-picker-input"
        type="color"
        value={isMixed ? NEUTRAL_COLOR : value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} color`}
      />
      {isMixed ? (
        <span className="color-mixed-indicator">mixed</span>
      ) : (
        <span className="color-picker-hex">{value}</span>
      )}
    </div>
  );
}
