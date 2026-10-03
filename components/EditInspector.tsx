'use client';

import React, { useState } from 'react';
import { Node } from 'reactflow';
import { DrawingStroke } from '@/lib/collaboration';
import {
  Type,
  Sliders,
  Copy,
  Trash2,
  Lock,
  Unlock,
  ChevronsUp,
  ChevronsDown,
  ChevronUp,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Sun,
  Moon,
  PenTool,
  Image as ImageIcon,
  FileDown,
  LayoutGrid,
  ArrowRightLeft,
  Palette,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus
} from 'lucide-react';

interface EditInspectorProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  selectedNode: Node | null;
  selectedStroke: DrawingStroke | null;
  onUpdateNode: (node: Node) => void;
  onUpdateStroke: (stroke: DrawingStroke) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onSendToBack: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenExcalidraw: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  onClearCanvas: () => void;
  layoutDirection: 'TB' | 'LR';
  onToggleLayoutDirection: () => void;
  onApplyLayout: () => void;
  nodesCount: number;
  strokesCount: number;
  roomId: string;
  onAddTextQuick: (fontSize: number, isBold?: boolean) => void;
  onAddStickyQuick: (color: string) => void;
  onAddShapeQuick: (shape: string) => void;
}

// Light & Dark theme-adaptive palette presets
const THEME_COLORS = [
  { label: 'Auto Theme', value: 'auto', preview: 'linear-gradient(135deg, #0f172a 50%, #ffffff 50%)' },
  { label: 'Dark Slate', value: '#0f172a', preview: '#0f172a' },
  { label: 'Slate Gray', value: '#334155', preview: '#334155' },
  { label: 'Muted Gray', value: '#64748b', preview: '#64748b' },
  { label: 'Crisp White', value: '#ffffff', preview: '#ffffff' },
  { label: 'Indigo', value: '#6366f1', preview: '#6366f1' },
  { label: 'Sky Blue', value: '#0ea5e9', preview: '#0ea5e9' },
  { label: 'Emerald Green', value: '#10b981', preview: '#10b981' },
  { label: 'Amber Gold', value: '#f59e0b', preview: '#f59e0b' },
  { label: 'Orange', value: '#f97316', preview: '#f97316' },
  { label: 'Rose Pink', value: '#f43f5e', preview: '#f43f5e' },
  { label: 'Purple', value: '#a855f7', preview: '#a855f7' },
];

const FONT_PRESETS = [14, 18, 24, 32, 48, 64];

export default function EditInspector({
  isOpen,
  onToggleOpen,
  selectedNode,
  selectedStroke,
  onUpdateNode,
  onUpdateStroke,
  onDuplicate,
  onDelete,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  theme,
  onToggleTheme,
  onOpenExcalidraw,
  onExportPng,
  onExportPdf,
  onClearCanvas,
  layoutDirection,
  onToggleLayoutDirection,
  onApplyLayout,
  nodesCount,
  strokesCount,
  roomId,
  onAddTextQuick,
  onAddStickyQuick,
  onAddShapeQuick,
}: EditInspectorProps) {
  const [activeTab, setActiveTab] = useState<'style' | 'text' | 'arrange'>('style');
  const isLight = theme === 'light';

  const hasSelection = Boolean(selectedNode || selectedStroke);

  // Derive selection attributes
  const isTextNode = selectedNode?.type === 'text';
  const isSticky = selectedNode?.type === 'sticky';
  const isShape = selectedNode?.type === 'shape';
  const isCustom = selectedNode?.type === 'custom';

  const hasTextCapabilities = isTextNode || isSticky || isShape || isCustom;

  // Text values
  const currentText = isTextNode
    ? (selectedNode?.data?.text as string) || ''
    : (selectedNode?.data?.label as string) || (selectedNode?.data?.text as string) || '';

  const currentFontSize = isTextNode
    ? (selectedNode?.data?.fontSize as number) || 18
    : (selectedNode?.data?.fontSize as number) || 16;

  const currentFontFamily = (selectedNode?.data?.fontFamily as string) || 'hand';
  const isBold = Boolean(selectedNode?.data?.isBold);
  const isItalic = Boolean(selectedNode?.data?.isItalic);
  const isUnderline = Boolean(selectedNode?.data?.isUnderline);
  const currentTextAlign = (selectedNode?.data?.textAlign as 'left' | 'center' | 'right') || 'left';

  // Text color
  const currentTextColor = isTextNode
    ? (selectedNode?.data?.color as string) || (isLight ? '#0f172a' : '#f4f4f5')
    : (selectedNode?.data?.textColor as string) || (isLight ? '#0f172a' : '#f4f4f5');

  // Fill & Stroke values
  const currentFillColor = selectedStroke
    ? selectedStroke.color
    : (selectedNode?.data?.color as string) || (isLight ? '#ffffff' : '#18181b');

  const currentStrokeColor = selectedStroke
    ? selectedStroke.color
    : (selectedNode?.data?.strokeColor as string) || '#6366f1';

  const currentStrokeWidth = selectedStroke
    ? selectedStroke.width
    : (selectedNode?.data?.strokeWidth as number) || 2;

  const currentStrokeStyle = (selectedNode?.data?.strokeStyle as 'solid' | 'dashed' | 'dotted') || 'solid';

  const currentOpacity = selectedStroke
    ? Math.round(selectedStroke.opacity * 100)
    : (selectedNode?.data?.opacity as number) || 100;

  const isLocked = selectedStroke ? selectedStroke.isLocked : (selectedNode?.data?.isLocked as boolean);

  // Handlers for modifying text
  const handleUpdateTextValue = (text: string) => {
    if (!selectedNode) return;
    if (isTextNode) {
      onUpdateNode({
        ...selectedNode,
        data: { ...selectedNode.data, text },
      });
    } else {
      onUpdateNode({
        ...selectedNode,
        data: { ...selectedNode.data, label: text, text },
      });
    }
  };

  const handleFontSizeChange = (size: number) => {
    if (!selectedNode) return;
    const clampedSize = Math.max(10, Math.min(140, size));
    onUpdateNode({
      ...selectedNode,
      data: { ...selectedNode.data, fontSize: clampedSize },
      style: {
        ...selectedNode.style,
        minHeight: `${clampedSize * 1.5}px`,
      },
    });
  };

  const handleTextColorChange = (colorValue: string) => {
    if (!selectedNode) return;
    const finalColor = colorValue === 'auto' ? (isLight ? '#0f172a' : '#f4f4f5') : colorValue;

    if (isTextNode) {
      onUpdateNode({
        ...selectedNode,
        data: { ...selectedNode.data, color: finalColor },
      });
    } else {
      onUpdateNode({
        ...selectedNode,
        data: { ...selectedNode.data, textColor: finalColor },
      });
    }
  };

  const handleFontFamilyChange = (font: 'hand' | 'sans' | 'mono' | 'serif') => {
    if (!selectedNode) return;
    onUpdateNode({
      ...selectedNode,
      data: { ...selectedNode.data, fontFamily: font },
    });
  };

  const handleToggleBold = () => {
    if (!selectedNode) return;
    onUpdateNode({
      ...selectedNode,
      data: { ...selectedNode.data, isBold: !isBold },
    });
  };

  const handleToggleItalic = () => {
    if (!selectedNode) return;
    onUpdateNode({
      ...selectedNode,
      data: { ...selectedNode.data, isItalic: !isItalic },
    });
  };

  const handleToggleUnderline = () => {
    if (!selectedNode) return;
    onUpdateNode({
      ...selectedNode,
      data: { ...selectedNode.data, isUnderline: !isUnderline },
    });
  };

  const handleTextAlignChange = (align: 'left' | 'center' | 'right') => {
    if (!selectedNode) return;
    onUpdateNode({
      ...selectedNode,
      data: { ...selectedNode.data, textAlign: align },
    });
  };

  // Handlers for fill, border, opacity
  const handleFillColorChange = (hex: string) => {
    if (selectedStroke) {
      onUpdateStroke({ ...selectedStroke, color: hex });
    } else if (selectedNode) {
      onUpdateNode({
        ...selectedNode,
        data: { ...selectedNode.data, color: hex },
      });
    }
  };

  const handleStrokeColorChange = (hex: string) => {
    if (selectedStroke) {
      onUpdateStroke({ ...selectedStroke, color: hex });
    } else if (selectedNode) {
      onUpdateNode({
        ...selectedNode,
        data: { ...selectedNode.data, strokeColor: hex },
      });
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

  // Label badge for selected element
  const getSelectedBadge = () => {
    if (selectedStroke) return 'Freehand Drawing';
    if (isTextNode) return 'Text Element';
    if (isSticky) return 'Sticky Note';
    if (isShape) return `Shape: ${(selectedNode?.data?.shape as string) || 'Rectangle'}`;
    if (isCustom) return `Component: ${(selectedNode?.data?.type as string) || 'Service'}`;
    return 'Canvas Element';
  };

  return (
    <>
      {/* Floating Toggle Tab when Inspector is collapsed */}
      {!isOpen && (
        <button
          onClick={onToggleOpen}
          className={`fixed right-3 top-20 z-30 p-2.5 rounded-2xl backdrop-blur-2xl border shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 font-semibold text-xs ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-slate-300/60'
              : 'bg-neutral-900/95 border-neutral-800 text-neutral-200 hover:bg-neutral-800 shadow-black/70'
          }`}
          title="Open Properties & Edit Inspector"
          aria-label="Open Edit Inspector"
        >
          <ChevronLeft className="w-4 h-4 text-indigo-500" />
          <span className="hidden sm:inline">Edit</span>
          {hasSelection && (
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          )}
        </button>
      )}

      {/* Docked Right-Side Edit Inspector */}
      <aside
        className={`fixed right-0 top-0 bottom-0 z-40 w-80 md:w-84 backdrop-blur-2xl border-l shadow-2xl flex flex-col pointer-events-auto transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/60'
            : 'bg-neutral-900/95 border-neutral-800 text-neutral-100 shadow-black/80'
        }`}
        aria-label="Design and Element Properties Inspector"
      >
        {/* Header Bar */}
        <div className={`p-3.5 border-b flex items-center justify-between ${isLight ? 'border-slate-100' : 'border-neutral-800'}`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-xl ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider">
                {hasSelection ? getSelectedBadge() : 'Canvas Properties'}
              </h2>
              <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-neutral-400'}`}>
                {hasSelection ? 'Live Element Settings' : 'Global Settings & Tools'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {hasSelection && (
              <>
                <button
                  onClick={onDuplicate}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-neutral-800 text-neutral-300'
                  }`}
                  title="Duplicate (Ctrl+D / ⌘D)"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleToggleLock}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isLocked ? 'text-amber-500' : isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-neutral-800 text-neutral-300'
                  }`}
                  title={isLocked ? 'Unlock Element' : 'Lock Element'}
                >
                  {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                  title="Delete Selected (Delete / Backspace)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              onClick={onToggleOpen}
              className={`p-1.5 rounded-lg transition-colors ${
                isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-neutral-800 text-neutral-400'
              }`}
              title="Collapse Inspector"
              aria-label="Collapse Inspector"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab switcher when element is selected */}
        {hasSelection && (
          <div className={`grid ${hasTextCapabilities ? 'grid-cols-3' : 'grid-cols-2'} gap-1 p-2 border-b text-xs font-semibold ${
            isLight ? 'bg-slate-50/80 border-slate-100' : 'bg-neutral-950/40 border-neutral-800'
          }`}>
            <button
              onClick={() => setActiveTab('style')}
              className={`py-1.5 rounded-xl transition-all ${
                activeTab === 'style'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isLight ? 'text-slate-600 hover:bg-slate-200/60' : 'text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              Style
            </button>

            {hasTextCapabilities && (
              <button
                onClick={() => setActiveTab('text')}
                className={`py-1.5 rounded-xl transition-all ${
                  activeTab === 'text'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isLight ? 'text-slate-600 hover:bg-slate-200/60' : 'text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                Typography
              </button>
            )}

            <button
              onClick={() => setActiveTab('arrange')}
              className={`py-1.5 rounded-xl transition-all ${
                activeTab === 'arrange'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isLight ? 'text-slate-600 hover:bg-slate-200/60' : 'text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              Arrange
            </button>
          </div>
        )}

        {/* Inspector Body Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
          {/* ======================================================== */}
          {/* CASE A: AN ELEMENT IS SELECTED                           */}
          {/* ======================================================== */}
          {hasSelection ? (
            <>
              {/* TAB 1: STYLE (FILL, BORDER, OPACITY) */}
              {activeTab === 'style' && (
                <div className="space-y-4">
                  {/* Fill Color */}
                  {!selectedStroke && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>Fill Color</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleFillColorChange('transparent')}
                            className={`px-2 py-0.5 rounded-lg border text-[10px] font-medium transition-all ${
                              currentFillColor === 'transparent'
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : isLight ? 'border-slate-200 hover:bg-slate-100' : 'border-neutral-700 hover:bg-neutral-800'
                            }`}
                          >
                            None
                          </button>
                          <input
                            type="color"
                            value={currentFillColor.startsWith('#') ? currentFillColor : '#ffffff'}
                            onChange={(e) => handleFillColorChange(e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                            title="Custom Hex Color"
                          />
                        </div>
                      </div>

                      {/* Swatches */}
                      <div className="grid grid-cols-6 gap-1.5">
                        {THEME_COLORS.map((item) => (
                          <button
                            key={`fill-${item.value}`}
                            onClick={() => handleFillColorChange(item.value === 'auto' ? (isLight ? '#ffffff' : '#18181b') : item.value)}
                            className={`w-full aspect-square rounded-xl border transition-transform hover:scale-110 shadow-sm relative flex items-center justify-center ${
                              currentFillColor === item.value ? 'ring-2 ring-indigo-500 scale-105' : ''
                            } ${isLight ? 'border-slate-200' : 'border-neutral-700'}`}
                            style={{ background: item.preview }}
                            title={item.label}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Border / Stroke Color */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{selectedStroke ? 'Drawing Color' : 'Border Color'}</span>
                      <input
                        type="color"
                        value={currentStrokeColor.startsWith('#') ? currentStrokeColor : '#6366f1'}
                        onChange={(e) => handleStrokeColorChange(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                        title="Custom Stroke Color"
                      />
                    </div>

                    <div className="grid grid-cols-6 gap-1.5">
                      {THEME_COLORS.map((item) => (
                        <button
                          key={`stroke-${item.value}`}
                          onClick={() => handleStrokeColorChange(item.value === 'auto' ? (isLight ? '#0f172a' : '#f4f4f5') : item.value)}
                          className={`w-full aspect-square rounded-xl border transition-transform hover:scale-110 shadow-sm ${
                            currentStrokeColor === item.value ? 'ring-2 ring-indigo-500 scale-105' : ''
                          } ${isLight ? 'border-slate-200' : 'border-neutral-700'}`}
                          style={{ background: item.preview }}
                          title={item.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stroke Width */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold">Border / Stroke Width</span>
                    <div className={`grid grid-cols-5 gap-1 p-1 rounded-xl border ${
                      isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-950/60 border-neutral-800'
                    }`}>
                      {[0, 1, 2, 4, 8].map((w) => (
                        <button
                          key={`w-${w}`}
                          onClick={() => handleStrokeWidthChange(w)}
                          className={`py-1 rounded-lg text-xs font-bold transition-all ${
                            currentStrokeWidth === w
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-neutral-400 hover:bg-neutral-800'
                          }`}
                        >
                          {w === 0 ? 'None' : `${w}px`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Border Style (Solid, Dashed, Dotted) */}
                  {selectedNode && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold">Border Pattern</span>
                      <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl border ${
                        isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-950/60 border-neutral-800'
                      }`}>
                        {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                          <button
                            key={style}
                            onClick={() => handleStrokeStyleChange(style)}
                            className={`py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                              currentStrokeStyle === style
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-neutral-400 hover:bg-neutral-800'
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Opacity Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Opacity</span>
                      </span>
                      <span className="font-mono text-[11px]">{currentOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={currentOpacity}
                      onChange={(e) => handleOpacityChange(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: TYPOGRAPHY & TEXT SETTINGS */}
              {activeTab === 'text' && hasTextCapabilities && (
                <div className="space-y-4">
                  {/* Quick Text Editor */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold">Text Content</span>
                    <textarea
                      rows={2}
                      value={currentText}
                      onChange={(e) => handleUpdateTextValue(e.target.value)}
                      placeholder="Type element text..."
                      className={`w-full p-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none transition-all ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/60 border-neutral-800'
                      }`}
                    />
                  </div>

                  {/* Font Size (+ / - / Presets) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Font Size</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleFontSizeChange(currentFontSize - 2)}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                            isLight ? 'border-slate-200 hover:bg-slate-100' : 'border-neutral-700 hover:bg-neutral-800'
                          }`}
                          title="Decrease size"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-12 text-center font-mono font-bold text-xs">
                          {currentFontSize}px
                        </span>
                        <button
                          onClick={() => handleFontSizeChange(currentFontSize + 2)}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                            isLight ? 'border-slate-200 hover:bg-slate-100' : 'border-neutral-700 hover:bg-neutral-800'
                          }`}
                          title="Increase size"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Font Size Presets */}
                    <div className="grid grid-cols-6 gap-1">
                      {FONT_PRESETS.map((preset) => (
                        <button
                          key={`preset-${preset}`}
                          onClick={() => handleFontSizeChange(preset)}
                          className={`py-1 rounded-lg text-[11px] font-bold border transition-all ${
                            currentFontSize === preset
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : isLight ? 'border-slate-200 hover:bg-slate-100' : 'border-neutral-800 hover:bg-neutral-800'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    {/* Font Size Slider */}
                    <input
                      type="range"
                      min="12"
                      max="96"
                      value={currentFontSize}
                      onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Text Color (Light & Dark Theme Adaptive) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Text Color</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleTextColorChange('auto')}
                          className={`px-2 py-0.5 rounded-lg border text-[10px] font-medium transition-all ${
                            currentTextColor === 'var(--text-node-color)' || currentTextColor === (isLight ? '#0f172a' : '#f4f4f5')
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : isLight ? 'border-slate-200 hover:bg-slate-100' : 'border-neutral-700 hover:bg-neutral-800'
                          }`}
                          title="Automatically switch contrast based on theme"
                        >
                          Auto Theme
                        </button>
                        <input
                          type="color"
                          value={currentTextColor.startsWith('#') ? currentTextColor : (isLight ? '#0f172a' : '#f4f4f5')}
                          onChange={(e) => handleTextColorChange(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                          title="Custom Text Color"
                        />
                      </div>
                    </div>

                    {/* Swatches */}
                    <div className="grid grid-cols-6 gap-1.5">
                      {THEME_COLORS.map((item) => (
                        <button
                          key={`text-color-${item.value}`}
                          onClick={() => handleTextColorChange(item.value)}
                          className={`w-full aspect-square rounded-xl border transition-transform hover:scale-110 shadow-sm ${
                            currentTextColor === item.value ? 'ring-2 ring-indigo-500 scale-105' : ''
                          } ${isLight ? 'border-slate-200' : 'border-neutral-700'}`}
                          style={{ background: item.preview }}
                          title={item.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Font Family */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold">Font Family</span>
                    <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl border ${
                      isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-950/60 border-neutral-800'
                    }`}>
                      {[
                        { id: 'hand', label: 'Handwritten', font: 'font-handwriting' },
                        { id: 'sans', label: 'Clean Sans', font: 'font-sans' },
                        { id: 'serif', label: 'Modern Serif', font: 'font-serif' },
                        { id: 'mono', label: 'Code Mono', font: 'font-mono' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleFontFamilyChange(item.id as 'hand' | 'sans' | 'mono' | 'serif')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium text-left truncate transition-all ${item.font} ${
                            currentFontFamily === item.id
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-neutral-400 hover:bg-neutral-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Formatting (Bold, Italic, Underline, Alignment) */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold">Formatting & Alignment</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`flex items-center gap-0.5 p-1 rounded-xl border ${
                        isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-950/60 border-neutral-800'
                      }`}>
                        <button
                          onClick={handleToggleBold}
                          className={`p-1.5 rounded-lg transition-all ${
                            isBold ? 'bg-indigo-600 text-white' : isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-neutral-800 text-neutral-300'
                          }`}
                          title="Bold"
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleToggleItalic}
                          className={`p-1.5 rounded-lg transition-all ${
                            isItalic ? 'bg-indigo-600 text-white' : isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-neutral-800 text-neutral-300'
                          }`}
                          title="Italic"
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleToggleUnderline}
                          className={`p-1.5 rounded-lg transition-all ${
                            isUnderline ? 'bg-indigo-600 text-white' : isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-neutral-800 text-neutral-300'
                          }`}
                          title="Underline"
                        >
                          <Underline className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className={`flex items-center gap-0.5 p-1 rounded-xl border flex-1 justify-around ${
                        isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-950/60 border-neutral-800'
                      }`}>
                        <button
                          onClick={() => handleTextAlignChange('left')}
                          className={`p-1.5 rounded-lg transition-all ${
                            currentTextAlign === 'left' ? 'bg-indigo-600 text-white' : isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-neutral-800 text-neutral-300'
                          }`}
                          title="Align Left"
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleTextAlignChange('center')}
                          className={`p-1.5 rounded-lg transition-all ${
                            currentTextAlign === 'center' ? 'bg-indigo-600 text-white' : isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-neutral-800 text-neutral-300'
                          }`}
                          title="Align Center"
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleTextAlignChange('right')}
                          className={`p-1.5 rounded-lg transition-all ${
                            currentTextAlign === 'right' ? 'bg-indigo-600 text-white' : isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-neutral-800 text-neutral-300'
                          }`}
                          title="Align Right"
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ARRANGE & LAYERS */}
              {activeTab === 'arrange' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold">Stacking Order (Z-Index)</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={onBringToFront}
                        className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
                          isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                        }`}
                      >
                        <ChevronsUp className="w-4 h-4 text-indigo-500" />
                        <span>To Front</span>
                      </button>

                      <button
                        onClick={onBringForward}
                        className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
                          isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                        }`}
                      >
                        <ChevronUp className="w-4 h-4 text-indigo-500" />
                        <span>Forward</span>
                      </button>

                      <button
                        onClick={onSendBackward}
                        className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
                          isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4 text-indigo-500" />
                        <span>Backward</span>
                      </button>

                      <button
                        onClick={onSendToBack}
                        className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
                          isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                        }`}
                      >
                        <ChevronsDown className="w-4 h-4 text-indigo-500" />
                        <span>To Back</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-1.5 pt-2 border-t border-neutral-500/20">
                    <span className="text-xs font-bold">Element Actions</span>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={onDuplicate}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all ${
                          isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Copy className="w-4 h-4 text-indigo-500" />
                          <span>Duplicate Element</span>
                        </div>
                        <span className="text-[10px] font-mono opacity-50">Ctrl+D</span>
                      </button>

                      <button
                        onClick={handleToggleLock}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all ${
                          isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isLocked ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4 opacity-60" />}
                          <span>{isLocked ? 'Unlock Element' : 'Lock Element'}</span>
                        </div>
                        <span className="text-[10px] font-mono opacity-50">{isLocked ? 'Locked' : 'Unlocked'}</span>
                      </button>

                      <button
                        onClick={onDelete}
                        className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 flex items-center justify-between text-xs font-semibold transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Element</span>
                        </div>
                        <span className="text-[10px] font-mono opacity-60">Del</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ======================================================== */
            /* CASE B: NO SELECTION (CANVAS & GLOBAL WORKSPACE SETTINGS) */
            /* ======================================================== */
            <div className="space-y-4">
              {/* Direct Open in Excalidraw CTA */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-indigo-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-amber-500 text-white shadow-md">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400">Open Directly in Excalidraw</h3>
                    <p className="text-[10px] opacity-70">1-click browser launch + scene clipboard paste</p>
                  </div>
                </div>
                <button
                  onClick={onOpenExcalidraw}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Open Excalidraw.com</span>
                </button>
              </div>

              {/* Theme Settings (Light / Dark) */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold">Theme & Appearance</span>
                <button
                  onClick={onToggleTheme}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all ${
                    isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isLight ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                    <span>Theme Mode</span>
                  </div>
                  <span className="text-[11px] font-bold capitalize px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500">
                    {isLight ? 'Light Theme ☀️' : 'Dark Theme 🌙'}
                  </span>
                </button>
              </div>

              {/* Quick Add Elements */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold">Quick Insert</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => onAddTextQuick(24, true)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all hover:scale-105 active:scale-95 ${
                      isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                    }`}
                  >
                    <Type className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-bold">Text</span>
                  </button>

                  <button
                    onClick={() => onAddStickyQuick('yellow')}
                    className="p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all hover:scale-105 active:scale-95 bg-yellow-100 border-yellow-300 text-yellow-900 shadow-sm"
                  >
                    <span className="text-sm font-handwriting font-bold">📝</span>
                    <span className="text-[10px] font-bold">Sticky</span>
                  </button>

                  <button
                    onClick={() => onAddShapeQuick('rect')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all hover:scale-105 active:scale-95 ${
                      isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                    }`}
                  >
                    <div className="w-4 h-4 border-2 border-indigo-500 rounded-sm" />
                    <span className="text-[10px] font-bold">Box</span>
                  </button>
                </div>
              </div>

              {/* Layout Reorganization */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold">Architecture Layout</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={onToggleLayoutDirection}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                      isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{layoutDirection === 'TB' ? 'Top-Down' : 'Left-Right'}</span>
                  </button>

                  <button
                    onClick={onApplyLayout}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                      isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Auto Organize</span>
                  </button>
                </div>
              </div>

              {/* Export Actions */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold">Export Canvas</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={onExportPng}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                      isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                    <span>Export PNG</span>
                  </button>

                  <button
                    onClick={onExportPdf}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                      isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                    }`}
                  >
                    <FileDown className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>

              {/* Canvas Stats & Reset */}
              <div className="pt-2 border-t border-neutral-500/20 space-y-2">
                <div className="flex items-center justify-between text-[11px] opacity-70">
                  <span>Room ID: <span className="font-mono font-bold">{roomId}</span></span>
                  <span>{nodesCount} nodes · {strokesCount} strokes</span>
                </div>

                <button
                  onClick={onClearCanvas}
                  className="w-full py-2 px-3 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Entire Canvas</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-2.5 border-t text-[10px] text-center opacity-50 ${isLight ? 'border-slate-100' : 'border-neutral-800'}`}>
          DrawArc Studio · Click any element to edit properties
        </div>
      </aside>
    </>
  );
}
