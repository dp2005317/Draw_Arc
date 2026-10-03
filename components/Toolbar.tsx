'use client';

import React, { useState } from 'react';
import { 
  Hand, 
  MousePointer2, 
  PenTool,
  Paintbrush,
  Square, 
  Circle, 
  Diamond, 
  Triangle,
  Star,
  StickyNote,
  Type, 
  Eraser,
  ChevronDown
} from 'lucide-react';

export type InteractionMode = 
  | 'pan' 
  | 'select' 
  | 'pen' 
  | 'highlighter' 
  | 'pencil'
  | 'rect' 
  | 'rounded-rect'
  | 'circle' 
  | 'diamond' 
  | 'triangle'
  | 'star'
  | 'sticky' 
  | 'text' 
  | 'eraser';

interface ToolbarProps {
  mode: InteractionMode;
  setMode: (mode: InteractionMode) => void;
  activeColor: string;
  setActiveColor: (color: string) => void;
  activeWidth: number;
  setActiveWidth: (width: number) => void;
  theme: 'dark' | 'light';
}

const PRESET_COLORS = [
  '#f43f5e', // Rose
  '#ec4899', // Pink
  '#a855f7', // Purple
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#f4f4f5', // Light
  '#18181b', // Dark
];

export default function Toolbar({
  mode,
  setMode,
  activeColor,
  setActiveColor,
  activeWidth,
  setActiveWidth,
  theme,
}: ToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showShapesMenu, setShowShapesMenu] = useState(false);

  const isLight = theme === 'light';

  const isShapeMode = ['rect', 'rounded-rect', 'circle', 'diamond', 'triangle', 'star'].includes(mode);

  return (
    <div 
      className={`fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-30 
        flex items-center gap-1.5 backdrop-blur-2xl border rounded-2xl shadow-2xl p-1.5 pointer-events-auto max-w-[95vw] overflow-x-auto custom-scrollbar transition-all duration-200 ${
          isLight 
            ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/60' 
            : 'bg-neutral-900/95 border-neutral-800 text-neutral-100 shadow-black/70'
        }`}
      role="toolbar"
      aria-label="Canvas Drawing, Whiteboard and Interaction Tools"
    >
      {/* 1. Pan Tool */}
      <button
        onClick={() => setMode('pan')}
        className={`relative group p-2 md:p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
          mode === 'pan'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
        }`}
        title="Pan Canvas (H)"
        aria-label="Pan Canvas"
      >
        <Hand className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {/* 2. Select & Move Tool */}
      <button
        onClick={() => setMode('select')}
        className={`relative group p-2 md:p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
          mode === 'select'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
        }`}
        title="Select & Move (V)"
        aria-label="Select & Move"
      >
        <MousePointer2 className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <div className="w-[1px] h-6 bg-neutral-500/20 mx-0.5 shrink-0" />

      {/* 3. Excalidraw Freehand Pen */}
      <button
        onClick={() => setMode('pen')}
        className={`relative group p-2 md:p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
          mode === 'pen'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
        }`}
        title="Draw with Pen (P)"
        aria-label="Draw with Pen"
      >
        <PenTool className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {/* 4. Highlighter */}
      <button
        onClick={() => setMode('highlighter')}
        className={`relative group p-2 md:p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
          mode === 'highlighter'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
        }`}
        title="Highlighter (B)"
        aria-label="Highlighter"
      >
        <Paintbrush className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <div className="w-[1px] h-6 bg-neutral-500/20 mx-0.5 shrink-0" />

      {/* 5. Shapes Dropdown / Direct Pickers */}
      <div className="relative">
        <button
          onClick={() => {
            if (isShapeMode) {
              setShowShapesMenu(!showShapesMenu);
            } else {
              setMode('rect');
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowShapesMenu(true);
          }}
          className={`relative group p-2 md:p-2.5 rounded-xl transition-all duration-150 flex items-center gap-0.5 shrink-0 ${
            isShapeMode
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
          }`}
          title="Shapes (Click or right-click to choose shape)"
          aria-label="Shapes"
        >
          {mode === 'circle' ? (
            <Circle className="w-4 h-4 md:w-5 md:h-5" />
          ) : mode === 'diamond' ? (
            <Diamond className="w-4 h-4 md:w-5 md:h-5" />
          ) : mode === 'triangle' ? (
            <Triangle className="w-4 h-4 md:w-5 md:h-5" />
          ) : mode === 'star' ? (
            <Star className="w-4 h-4 md:w-5 md:h-5" />
          ) : (
            <Square className="w-4 h-4 md:w-5 md:h-5" />
          )}
          <ChevronDown 
            className="w-3 h-3 opacity-70 cursor-pointer" 
            onClick={(e) => {
              e.stopPropagation();
              setShowShapesMenu(!showShapesMenu);
            }} 
          />
        </button>

        {showShapesMenu && (
          <div 
            className={`absolute bottom-12 left-0 p-1.5 rounded-xl border shadow-2xl flex flex-col gap-1 z-50 backdrop-blur-xl ${
              isLight ? 'bg-white border-slate-200' : 'bg-neutral-900 border-neutral-700'
            }`}
          >
            {[
              { id: 'rect', label: 'Rectangle', icon: Square },
              { id: 'circle', label: 'Circle', icon: Circle },
              { id: 'diamond', label: 'Diamond', icon: Diamond },
              { id: 'triangle', label: 'Triangle', icon: Triangle },
              { id: 'star', label: 'Star', icon: Star },
            ].map((shape) => {
              const Icon = shape.icon;
              return (
                <button
                  key={shape.id}
                  onClick={() => {
                    setMode(shape.id as InteractionMode);
                    setShowShapesMenu(false);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    mode === shape.id
                      ? 'bg-indigo-600 text-white'
                      : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-neutral-800 text-neutral-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{shape.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Sticky Note */}
      <button
        onClick={() => setMode('sticky')}
        className={`relative group p-2 md:p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
          mode === 'sticky'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
        }`}
        title="Sticky Note (S)"
        aria-label="Sticky Note"
      >
        <StickyNote className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
      </button>

      {/* 7. Text Tool */}
      <button
        onClick={() => setMode('text')}
        className={`relative group p-2 md:p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
          mode === 'text'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
        }`}
        title="Text Box (T)"
        aria-label="Text Box"
      >
        <Type className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {/* 8. Eraser Tool */}
      <button
        onClick={() => setMode('eraser')}
        className={`relative group p-2 md:p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
          mode === 'eraser'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
        }`}
        title="Eraser (E)"
        aria-label="Eraser"
      >
        <Eraser className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <div className="w-[1px] h-6 bg-neutral-500/20 mx-0.5 shrink-0" />

      {/* Quick Color Picker & Stroke Size */}
      <div className="relative flex items-center gap-1.5 pl-1">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-6 h-6 rounded-full border border-black/20 shadow-sm shrink-0 flex items-center justify-center transition-transform hover:scale-110"
          style={{ backgroundColor: activeColor }}
          title="Drawing Color"
        />

        {showColorPicker && (
          <div 
            className={`absolute bottom-12 right-0 p-3 rounded-2xl border shadow-2xl z-50 w-52 backdrop-blur-xl ${
              isLight ? 'bg-white border-slate-200' : 'bg-neutral-900 border-neutral-700'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider mb-2 opacity-70">
              Brush / Stroke Color
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setActiveColor(c);
                    setShowColorPicker(false);
                  }}
                  className="w-6 h-6 rounded-full border border-black/20 hover:scale-110 transition-transform shadow-sm"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider mb-1.5 opacity-70">
              Stroke Width
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 4, 8].map((w) => (
                <button
                  key={w}
                  onClick={() => {
                    setActiveWidth(w);
                    setShowColorPicker(false);
                  }}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeWidth === w
                      ? 'bg-indigo-600 text-white'
                      : isLight ? 'bg-slate-100 hover:bg-slate-200' : 'bg-neutral-800 hover:bg-neutral-700'
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
