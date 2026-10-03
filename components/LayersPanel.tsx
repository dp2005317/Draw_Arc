'use client';

import React, { useState } from 'react';
import { Node } from 'reactflow';
import { DrawingStroke } from '@/lib/collaboration';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Sparkles,
  Square,
  PenTool,
  StickyNote,
  Type,
  X
} from 'lucide-react';

export interface LayerItem {
  id: string;
  type: 'custom' | 'shape' | 'text' | 'sticky' | 'drawing';
  name: string;
  zIndex: number;
  isLocked?: boolean;
  isHidden?: boolean;
  color?: string;
}

interface LayersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  drawings: DrawingStroke[];
  selectedId: string | null;
  onSelect: (id: string, type: 'node' | 'drawing') => void;
  onUpdateNodes: (nodes: Node[]) => void;
  onUpdateDrawings: (drawings: DrawingStroke[]) => void;
  theme: 'dark' | 'light';
}

export default function LayersPanel({
  isOpen,
  onClose,
  nodes,
  drawings,
  selectedId,
  onSelect,
  onUpdateNodes,
  onUpdateDrawings,
  theme,
}: LayersPanelProps) {
  const [filter, setFilter] = useState<'all' | 'shapes' | 'drawings' | 'architecture'>('all');

  if (!isOpen) return null;

  // Unify nodes and drawings into a unified layer stack (highest z-index on top)
  const layerItems: LayerItem[] = [
    ...nodes.map((node, index) => {
      const isSticky = node.type === 'sticky';
      const isShape = node.type === 'shape';
      const isText = node.type === 'text';
      const type: LayerItem['type'] = isSticky ? 'sticky' : isShape ? 'shape' : isText ? 'text' : 'custom';
      
      const label = node.data?.label || node.data?.text || (isSticky ? 'Sticky Note' : isShape ? `${node.data?.shape || 'Shape'}` : isText ? 'Text Note' : 'Service Node');
      
      return {
        id: node.id,
        type,
        name: label,
        zIndex: Number(node.style?.zIndex) || index + 10,
        isLocked: (node.data?.isLocked as boolean) || false,
        isHidden: (node.data?.isHidden as boolean) || false,
        color: (node.data?.color as string) || (node.data?.strokeColor as string) || '#6366f1',
      };
    }),
    ...drawings.map((drawing) => ({
      id: drawing.id,
      type: 'drawing' as const,
      name: `${drawing.type === 'highlighter' ? 'Highlighter' : 'Pen'} Stroke`,
      zIndex: drawing.zIndex || 5,
      isLocked: drawing.isLocked || false,
      isHidden: drawing.isHidden || false,
      color: drawing.color,
    })),
  ].sort((a, b) => b.zIndex - a.zIndex);

  const filteredItems = layerItems.filter((item) => {
    if (filter === 'shapes') return item.type === 'shape' || item.type === 'sticky';
    if (filter === 'drawings') return item.type === 'drawing';
    if (filter === 'architecture') return item.type === 'custom';
    return true;
  });

  const getLayerIcon = (type: LayerItem['type']) => {
    switch (type) {
      case 'custom':
        return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
      case 'shape':
        return <Square className="w-3.5 h-3.5 text-emerald-400" />;
      case 'sticky':
        return <StickyNote className="w-3.5 h-3.5 text-amber-400" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-blue-400" />;
      case 'drawing':
        return <PenTool className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  // Reordering functions
  const handleMove = (id: string, type: LayerItem['type'], direction: 'front' | 'up' | 'down' | 'back') => {
    if (type === 'drawing') {
      const idx = drawings.findIndex((d) => d.id === id);
      if (idx === -1) return;
      const copy = [...drawings];
      const item = copy[idx];

      if (direction === 'front') {
        const maxZ = Math.max(...drawings.map((d) => d.zIndex || 0), 0) + 1;
        item.zIndex = maxZ;
      } else if (direction === 'back') {
        const minZ = Math.min(...drawings.map((d) => d.zIndex || 0), 0) - 1;
        item.zIndex = Math.max(0, minZ);
      } else if (direction === 'up') {
        item.zIndex = (item.zIndex || 0) + 1;
      } else if (direction === 'down') {
        item.zIndex = Math.max(0, (item.zIndex || 0) - 1);
      }
      onUpdateDrawings(copy);
    } else {
      const idx = nodes.findIndex((n) => n.id === id);
      if (idx === -1) return;
      const copy = [...nodes];
      const node = copy[idx];
      const currentZ = Number(node.style?.zIndex) || 10;

      if (direction === 'front') {
        node.style = { ...node.style, zIndex: currentZ + 50 };
      } else if (direction === 'back') {
        node.style = { ...node.style, zIndex: Math.max(1, currentZ - 50) };
      } else if (direction === 'up') {
        node.style = { ...node.style, zIndex: currentZ + 2 };
      } else if (direction === 'down') {
        node.style = { ...node.style, zIndex: Math.max(1, currentZ - 2) };
      }
      onUpdateNodes(copy);
    }
  };

  const handleToggleLock = (id: string, type: LayerItem['type']) => {
    if (type === 'drawing') {
      onUpdateDrawings(
        drawings.map((d) => (d.id === id ? { ...d, isLocked: !d.isLocked } : d))
      );
    } else {
      onUpdateNodes(
        nodes.map((n) =>
          n.id === id
            ? { ...n, data: { ...n.data, isLocked: !n.data?.isLocked } }
            : n
        )
      );
    }
  };

  const handleToggleVisibility = (id: string, type: LayerItem['type']) => {
    if (type === 'drawing') {
      onUpdateDrawings(
        drawings.map((d) => (d.id === id ? { ...d, isHidden: !d.isHidden } : d))
      );
    } else {
      onUpdateNodes(
        nodes.map((n) =>
          n.id === id
            ? { ...n, data: { ...n.data, isHidden: !n.data?.isHidden }, hidden: !n.hidden }
            : n
        )
      );
    }
  };

  const handleDelete = (id: string, type: LayerItem['type']) => {
    if (type === 'drawing') {
      onUpdateDrawings(drawings.filter((d) => d.id !== id));
    } else {
      onUpdateNodes(nodes.filter((n) => n.id !== id));
    }
  };

  const isLight = theme === 'light';

  return (
    <aside
      className={`fixed right-4 top-20 z-40 w-80 max-w-[90vw] rounded-2xl backdrop-blur-2xl border shadow-2xl flex flex-col max-h-[75vh] animate-in fade-in slide-in-from-right-4 transition-all duration-200 pointer-events-auto ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/40'
          : 'bg-neutral-900/95 border-neutral-800 text-neutral-100 shadow-black/60'
      }`}
      role="region"
      aria-label="Layers Manager"
    >
      {/* Header */}
      <div className={`p-3.5 border-b flex items-center justify-between ${isLight ? 'border-slate-100' : 'border-neutral-800'}`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider">Position · Layers</h3>
            <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-neutral-400'}`}>
              {layerItems.length} elements on canvas
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors ${
            isLight ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-600' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
          }`}
          title="Close layers panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className={`px-3 py-2 border-b flex items-center gap-1 text-[11px] overflow-x-auto ${isLight ? 'border-slate-100' : 'border-neutral-800'}`}>
        {(['all', 'shapes', 'drawings', 'architecture'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-2.5 py-1 rounded-lg font-medium capitalize whitespace-nowrap transition-all ${
              filter === tab
                ? isLight
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : isLight
                ? 'text-slate-500 hover:bg-slate-100'
                : 'text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center text-xs opacity-50">No elements found</div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div
                key={item.id}
                onClick={() => onSelect(item.id, item.type === 'drawing' ? 'drawing' : 'node')}
                className={`group flex items-center justify-between p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? isLight
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-sm'
                      : 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200 shadow-sm shadow-indigo-950/50'
                    : isLight
                    ? 'bg-slate-50/50 hover:bg-slate-100 border-slate-200/60'
                    : 'bg-neutral-900/60 hover:bg-neutral-800/80 border-neutral-800/80'
                }`}
              >
                {/* Left: Icon & Label */}
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  <div className="shrink-0">{getLayerIcon(item.type)}</div>
                  <span className="truncate font-medium">{item.name}</span>
                </div>

                {/* Right: Quick Canva Actions */}
                <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  {/* Reorder Buttons */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(item.id, item.type, 'front');
                    }}
                    title="Bring to Front"
                    className="p-1 rounded hover:bg-white/10"
                  >
                    <ChevronsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(item.id, item.type, 'up');
                    }}
                    title="Bring Forward"
                    className="p-1 rounded hover:bg-white/10"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(item.id, item.type, 'down');
                    }}
                    title="Send Backward"
                    className="p-1 rounded hover:bg-white/10"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(item.id, item.type, 'back');
                    }}
                    title="Send to Back"
                    className="p-1 rounded hover:bg-white/10"
                  >
                    <ChevronsDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Lock Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLock(item.id, item.type);
                    }}
                    title={item.isLocked ? 'Unlock Layer' : 'Lock Layer'}
                    className={`p-1 rounded transition-colors ${
                      item.isLocked ? 'text-amber-400' : 'hover:bg-white/10'
                    }`}
                  >
                    {item.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  {/* Visibility Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVisibility(item.id, item.type);
                    }}
                    title={item.isHidden ? 'Show Layer' : 'Hide Layer'}
                    className={`p-1 rounded transition-colors ${
                      item.isHidden ? 'text-neutral-500' : 'hover:bg-white/10'
                    }`}
                  >
                    {item.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id, item.type);
                    }}
                    title="Delete Element"
                    className="p-1 rounded text-rose-400 hover:bg-rose-500/20 transition-colors ml-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className={`p-2.5 border-t text-[10px] text-center opacity-60 ${isLight ? 'border-slate-100' : 'border-neutral-800'}`}>
        Drag layers or use arrows to manage stacking order
      </div>
    </aside>
  );
}
