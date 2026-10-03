'use client';

import React, { useState } from 'react';
import { Node } from 'reactflow';
import { DrawingStroke } from '@/lib/collaboration';
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  Sliders,
  Type,
  Layers
} from 'lucide-react';

const COLOR_SWATCHES = [
  '#f43f5e', // Rose
  '#ec4899', // Pink
  '#a855f7', // Purple
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#84cc16', // Lime
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#ffffff', // White
  '#18181b', // Dark
];

interface PropertyBarProps {
  selectedNode: Node | null;
  selectedStroke: DrawingStroke | null;
  onUpdateNode: (node: Node) => void;
  onUpdateStroke: (stroke: DrawingStroke) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLayers: () => void;
  isLayersOpen: boolean;
  theme: 'dark' | 'light';
}

export default function PropertyBar({
  selectedNode,
  selectedStroke,
  onUpdateNode,
  onUpdateStroke,
  onDuplicate,
  onDelete,
  onToggleLayers,
  isLayersOpen,
  theme,
}: PropertyBarProps) {
  const [activePicker, setActivePicker] = useState<'fill' | 'stroke' | 'opacity' | null>(null);

  if (!selectedNode && !selectedStroke) return null;

  const isLight = theme === 'light';

  // Extract current values based on what is selected
  const currentColor = selectedStroke
    ? selectedStroke.color
    : (selectedNode?.data?.color as string) || '#1e1e24';

  const currentStrokeColor = selectedStroke
    ? selectedStroke.color
    : (selectedNode?.data?.strokeColor as string) || '#6366f1';

  const currentStrokeWidth = selectedStroke
    ? selectedStroke.width
    : (selectedNode?.data?.strokeWidth as number) || 2;

  const currentOpacity = selectedStroke
    ? Math.round(selectedStroke.opacity * 100)
    : (selectedNode?.data?.opacity as number) || 100;

  const currentFontFamily = (selectedNode?.data?.fontFamily as string) || 'hand';
  const isLocked = selectedStroke ? selectedStroke.isLocked : (selectedNode?.data?.isLocked as boolean);

  const handleColorChange = (hex: string, target: 'fill' | 'stroke') => {
    if (selectedStroke) {
      onUpdateStroke({ ...selectedStroke, color: hex });
    } else if (selectedNode) {
      if (target === 'fill') {
        onUpdateNode({
          ...selectedNode,
          data: { ...selectedNode.data, color: hex },
        });
      } else {
        onUpdateNode({
          ...selectedNode,
          data: { ...selectedNode.data, strokeColor: hex },
        });
      }
    }
  };

  const handleStrokeWidthChange = (width: number) => {
    if (selectedStroke) {
      onUpdateStroke({ ...selectedStroke, width });
    } else if (selectedNode) {
      onUpdateNode({
        ...selectedNode,
        data: { ...selectedNode.data, strokeWidth: width },
      });
    }
  };

  const handleStrokeStyleChange = (style: 'solid' | 'dashed' | 'dotted') => {
    if (selectedNode) {
      onUpdateNode({
        ...selectedNode,
        data: { ...selectedNode.data, strokeStyle: style },
      });
    }
  };

  const handleOpacityChange = (val: number) => {
    if (selectedStroke) {
      onUpdateStroke({ ...selectedStroke, opacity: val / 100 });
    } else if (selectedNode) {
      onUpdateNode({
        ...selectedNode,
        data: { ...selectedNode.data, opacity: val },
      });
    }
  };

  const handleFontFamilyChange = (font: 'hand' | 'sans' | 'mono') => {
    if (selectedNode) {
      onUpdateNode({
        ...selectedNode,
        data: { ...selectedNode.data, fontFamily: font },
      });
    }
  };

  const handleToggleLock = () => {
    if (selectedStroke) {
      onUpdateStroke({ ...selectedStroke, isLocked: !selectedStroke.isLocked });
    } else if (selectedNode) {
      onUpdateNode({
        ...selectedNode,
        data: { ...selectedNode.data, isLocked: !isLocked },
      });
    }
  };

  return (
    <div
      className={`fixed top-14 md:top-16 left-1/2 -translate-x-1/2 z-30 max-w-[95vw] px-3 py-1.5 rounded-2xl backdrop-blur-2xl border shadow-2xl flex items-center gap-2 overflow-x-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 pointer-events-auto ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/50'
          : 'bg-neutral-900/95 border-neutral-800 text-neutral-100 shadow-black/60'
      }`}
      role="toolbar"
      aria-label="Formatting Property Bar"
    >
      {/* Fill Color Swatch */}
      <div className="relative flex items-center gap-1.5">
        <button
          onClick={() => setActivePicker(activePicker === 'fill' ? null : 'fill')}
          className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-neutral-500/10 transition-colors text-xs font-medium"
          title="Fill Color"
        >
          <span 
            className="w-4 h-4 rounded-full border border-black/20 shadow-sm shrink-0" 
            style={{ backgroundColor: currentColor }} 
          />
          <span className="hidden sm:inline text-[11px]">Color</span>
        </button>

        {activePicker === 'fill' && (
          <div 
            className={`absolute top-10 left-0 p-2.5 rounded-xl border shadow-2xl z-50 flex flex-wrap gap-1.5 w-44 backdrop-blur-xl ${
              isLight ? 'bg-white border-slate-200' : 'bg-neutral-900 border-neutral-700'
            }`}
          >
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch}
                onClick={() => {
                  handleColorChange(swatch, 'fill');
                  setActivePicker(null);
                }}
                className="w-6 h-6 rounded-full border border-black/20 hover:scale-110 transition-transform shadow-sm"
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stroke / Border Color Swatch (for shapes/nodes) */}
      {selectedNode && (
        <div className="relative flex items-center gap-1.5">
          <button
            onClick={() => setActivePicker(activePicker === 'stroke' ? null : 'stroke')}
            className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-neutral-500/10 transition-colors text-xs font-medium"
            title="Border / Stroke Color"
          >
            <span 
              className="w-4 h-4 rounded-full border-2 shadow-sm shrink-0" 
              style={{ borderColor: currentStrokeColor, backgroundColor: 'transparent' }} 
            />
            <span className="hidden sm:inline text-[11px]">Border</span>
          </button>

          {activePicker === 'stroke' && (
            <div 
              className={`absolute top-10 left-0 p-2.5 rounded-xl border shadow-2xl z-50 flex flex-wrap gap-1.5 w-44 backdrop-blur-xl ${
                isLight ? 'bg-white border-slate-200' : 'bg-neutral-900 border-neutral-700'
              }`}
            >
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  onClick={() => {
                    handleColorChange(swatch, 'stroke');
                    setActivePicker(null);
                  }}
                  className="w-6 h-6 rounded-full border border-black/20 hover:scale-110 transition-transform shadow-sm"
                  style={{ backgroundColor: swatch }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stroke Width Selector */}
      <div className="flex items-center gap-0.5 border-l border-neutral-500/20 pl-2">
        {[1, 2, 4, 8].map((w) => (
          <button
            key={w}
            onClick={() => handleStrokeWidthChange(w)}
            className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all ${
              currentStrokeWidth === w
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'hover:bg-neutral-500/10 opacity-70'
            }`}
            title={`Stroke width ${w}px`}
          >
            {w}px
          </button>
        ))}
      </div>

      {/* Stroke Style: Solid / Dashed / Dotted (for nodes) */}
      {selectedNode && (
        <div className="flex items-center gap-0.5 border-l border-neutral-500/20 pl-2">
          {(['solid', 'dashed', 'dotted'] as const).map((st) => (
            <button
              key={st}
              onClick={() => handleStrokeStyleChange(st)}
              className={`px-1.5 py-0.5 rounded-lg text-[10px] font-medium capitalize transition-all ${
                selectedNode.data?.strokeStyle === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'hover:bg-neutral-500/10 opacity-70'
              }`}
              title={`Border style: ${st}`}
            >
              {st}
            </button>
          ))}
        </div>
      )}

      {/* Font Family Selector (For text/sticky/shapes) */}
      {selectedNode && (selectedNode.type === 'text' || selectedNode.type === 'sticky' || selectedNode.type === 'shape') && (
        <div className="flex items-center gap-1 border-l border-neutral-500/20 pl-2">
          <Type className="w-3.5 h-3.5 opacity-60" />
          <select
            value={currentFontFamily}
            onChange={(e) => handleFontFamilyChange(e.target.value as 'hand' | 'sans' | 'mono')}
            className={`text-[11px] font-medium py-1 px-1.5 rounded-lg border outline-none cursor-pointer ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-neutral-800 border-neutral-700 text-neutral-200'
            }`}
          >
            <option value="hand">Handwritten</option>
            <option value="sans">Clean Sans</option>
            <option value="mono">Code Mono</option>
          </select>
        </div>
      )}

      {/* Opacity Slider */}
      <div className="relative flex items-center gap-1.5 border-l border-neutral-500/20 pl-2">
        <button
          onClick={() => setActivePicker(activePicker === 'opacity' ? null : 'opacity')}
          className="flex items-center gap-1 px-2 py-1 rounded-xl hover:bg-neutral-500/10 text-xs font-medium"
          title="Opacity"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="text-[11px]">{currentOpacity}%</span>
        </button>

        {activePicker === 'opacity' && (
          <div 
            className={`absolute top-10 left-0 p-3 rounded-xl border shadow-2xl z-50 w-44 backdrop-blur-xl ${
              isLight ? 'bg-white border-slate-200' : 'bg-neutral-900 border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
              <span>Opacity</span>
              <span>{currentOpacity}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={currentOpacity}
              onChange={(e) => handleOpacityChange(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>
        )}
      </div>

      {/* Layers Panel Shortcut */}
      <div className="flex items-center gap-1 border-l border-neutral-500/20 pl-2">
        <button
          onClick={onToggleLayers}
          className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold transition-all ${
            isLayersOpen
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'hover:bg-neutral-500/10 opacity-80'
          }`}
          title="Toggle Layers panel"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[11px]">Layers</span>
        </button>
      </div>

      {/* Actions: Duplicate, Lock, Delete */}
      <div className="flex items-center gap-1 border-l border-neutral-500/20 pl-2">
        <button
          onClick={onDuplicate}
          className="p-1.5 rounded-lg hover:bg-neutral-500/10 transition-colors"
          title="Duplicate Element (Ctrl+D / Cmd+D)"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleToggleLock}
          className={`p-1.5 rounded-lg transition-colors ${isLocked ? 'text-amber-400' : 'hover:bg-neutral-500/10'}`}
          title={isLocked ? 'Unlock Element' : 'Lock Element'}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/20 transition-colors"
          title="Delete Element (Delete / Backspace)"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
