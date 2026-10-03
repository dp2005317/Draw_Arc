'use client';

import React, { useState } from 'react';
import { Node } from 'reactflow';
import { DrawingStroke } from '@/lib/collaboration';
import { COMPONENT_CATALOG, SHAPES_CATALOG, STICKY_PRESETS } from './Sidebar';
import {
  Boxes,
  Shapes,
  Type,
  PenTool,
  LayoutTemplate,
  Layers as LayersIcon,
  X,
  Search,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  StickyNote,
  GripVertical
} from 'lucide-react';
import { InteractionMode } from './Toolbar';

export type RailTab = 'elements' | 'shapes' | 'text' | 'draw' | 'templates' | 'layers' | null;

interface StudioLeftRailProps {
  activeTab: RailTab;
  onSelectTab: (tab: RailTab) => void;
  onCloseDrawer: () => void;
  onAddNode: (type: string, label: string) => void;
  onAddShape: (shape: string, label: string) => void;
  onAddSticky: (color: string) => void;
  onAddTextQuick: (fontSize: number, isBold?: boolean) => void;
  interactionMode: InteractionMode;
  setInteractionMode: (mode: InteractionMode) => void;
  activeColor: string;
  setActiveColor: (color: string) => void;
  onSelectTemplate: (prompt: string) => void;
  nodes: Node[];
  drawings: DrawingStroke[];
  selectedId: string | null;
  onSelectElement: (id: string, type: 'node' | 'drawing') => void;
  onUpdateNodes: (nodes: Node[]) => void;
  onUpdateDrawings: (drawings: DrawingStroke[]) => void;
  theme: 'dark' | 'light';
}

const TEMPLATES = [
  { 
    title: '🛒 E-Commerce & Retail', 
    desc: 'Scalable storefront with cart, payment & order queues', 
    prompt: 'Design scalable multi-tenant e-commerce platform with order processing and inventory' 
  },
  { 
    title: '📸 Social Feed (Instagram)', 
    desc: 'Media upload, newsfeed fanout, caching & edge CDN', 
    prompt: 'Design Instagram clone microservices with newsfeed, media upload, and caching' 
  },
  { 
    title: '💬 Real-Time Chat (WhatsApp)', 
    desc: 'WebSockets, presence cluster, Kafka message broker', 
    prompt: 'Design real-time chat architecture with WebSockets, presence cluster, and Kafka' 
  },
  { 
    title: '🎬 Video Streaming (Netflix)', 
    desc: 'Video transcoding, adaptive streaming & edge caches', 
    prompt: 'Design Netflix-scale video streaming architecture with transcoding and edge CDN' 
  },
  { 
    title: '💳 Fintech & Payments (Stripe)', 
    desc: 'Idempotency, payment gateways, ledger & audit logs', 
    prompt: 'Design high-availability Stripe-like payment processing architecture with idempotency' 
  },
  { 
    title: '🚗 Rideshare System (Uber)', 
    desc: 'Geospatial indexing, driver dispatch, surge pricing', 
    prompt: 'Design Uber rideshare architecture with geospatial dispatch and driver matching' 
  },
];

export default function StudioLeftRail({
  activeTab,
  onSelectTab,
  onCloseDrawer,
  onAddNode,
  onAddShape,
  onAddSticky,
  onAddTextQuick,
  interactionMode,
  setInteractionMode,
  activeColor,
  setActiveColor,
  onSelectTemplate,
  nodes,
  drawings,
  selectedId,
  onSelectElement,
  onUpdateNodes,
  onUpdateDrawings,
  theme,
}: StudioLeftRailProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [layerFilter, setLayerFilter] = useState<'all' | 'shapes' | 'drawings' | 'architecture'>('all');
  const [draggedLayerIndex, setDraggedLayerIndex] = useState<number | null>(null);

  const isLight = theme === 'light';
  const isDrawerOpen = activeTab !== null;

  // Filter components
  const filteredComponents = COMPONENT_CATALOG.filter((c) =>
    c.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredShapes = SHAPES_CATALOG.filter((s) =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, label }));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Compile Unified Layer Items
  const layerItems = [
    ...nodes.map((node, index) => {
      const isStickyNode = node.type === 'sticky';
      const isShapeNode = node.type === 'shape';
      const isText = node.type === 'text';
      const type = isStickyNode ? 'sticky' : isShapeNode ? 'shape' : isText ? 'text' : 'custom';
      const label = node.data?.label || node.data?.text || (isStickyNode ? 'Sticky Note' : isShapeNode ? `${node.data?.shape || 'Shape'}` : isText ? 'Text' : 'Service');

      return {
        id: node.id,
        type,
        name: label,
        zIndex: Number(node.style?.zIndex) || index + 10,
        isLocked: Boolean(node.data?.isLocked),
        isHidden: Boolean(node.data?.isHidden),
        color: (node.data?.color as string) || (node.data?.strokeColor as string) || '#6366f1',
      };
    }),
    ...drawings.map((drawing) => ({
      id: drawing.id,
      type: 'drawing' as const,
      name: `${drawing.type === 'highlighter' ? 'Highlighter' : 'Pen'} Stroke`,
      zIndex: drawing.zIndex || 5,
      isLocked: Boolean(drawing.isLocked),
      isHidden: Boolean(drawing.isHidden),
      color: drawing.color,
    })),
  ].sort((a, b) => b.zIndex - a.zIndex);

  const filteredLayers = layerItems.filter((item) => {
    if (layerFilter === 'shapes') return item.type === 'shape' || item.type === 'sticky';
    if (layerFilter === 'drawings') return item.type === 'drawing';
    if (layerFilter === 'architecture') return item.type === 'custom';
    return true;
  });

  // Layer ordering handlers
  const handleLayerMove = (id: string, delta: number) => {
    const isDrawing = drawings.some((d) => d.id === id);
    if (isDrawing) {
      const updated = drawings.map((d) => (d.id === id ? { ...d, zIndex: (d.zIndex || 5) + delta } : d));
      onUpdateDrawings(updated);
    } else {
      const updated = nodes.map((n) => {
        if (n.id === id) {
          const currentZ = Number(n.style?.zIndex) || 10;
          return { ...n, style: { ...n.style, zIndex: currentZ + delta } };
        }
        return n;
      });
      onUpdateNodes(updated);
    }
  };

  const handleLayerToggleLock = (id: string) => {
    const isDrawing = drawings.some((d) => d.id === id);
    if (isDrawing) {
      onUpdateDrawings(drawings.map((d) => (d.id === id ? { ...d, isLocked: !d.isLocked } : d)));
    } else {
      onUpdateNodes(nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, isLocked: !n.data?.isLocked } } : n)));
    }
  };

  const handleLayerToggleVisibility = (id: string) => {
    const isDrawing = drawings.some((d) => d.id === id);
    if (isDrawing) {
      onUpdateDrawings(drawings.map((d) => (d.id === id ? { ...d, isHidden: !d.isHidden } : d)));
    } else {
      onUpdateNodes(nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, isHidden: !n.data?.isHidden } } : n)));
    }
  };

  const handleLayerDelete = (id: string) => {
    const isDrawing = drawings.some((d) => d.id === id);
    if (isDrawing) {
      onUpdateDrawings(drawings.filter((d) => d.id !== id));
    } else {
      onUpdateNodes(nodes.filter((n) => n.id !== id));
    }
  };

  const handleLayerDrop = (targetIndex: number) => {
    if (draggedLayerIndex === null || draggedLayerIndex === targetIndex) return;

    const reordered = [...filteredLayers];
    const [movedItem] = reordered.splice(draggedLayerIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    const total = reordered.length;
    let updatedNodes = [...nodes];
    let updatedDrawings = [...drawings];

    reordered.forEach((item, idx) => {
      const newZ = (total - idx) * 10;
      if (item.type === 'drawing') {
        updatedDrawings = updatedDrawings.map((d) => (d.id === item.id ? { ...d, zIndex: newZ } : d));
      } else {
        updatedNodes = updatedNodes.map((n) => (n.id === item.id ? { ...n, style: { ...n.style, zIndex: newZ } } : n));
      }
    });

    onUpdateNodes(updatedNodes);
    onUpdateDrawings(updatedDrawings);
    setDraggedLayerIndex(null);
  };

  return (
    <>
      {/* 1. Slim Vertical Navigation Rail (Canva & Studio Pro Style) */}
      <nav
        className={`fixed left-0 top-0 bottom-0 z-40 w-16 md:w-18 backdrop-blur-2xl border-r shadow-xl flex flex-col items-center py-3 select-none pointer-events-auto transition-colors ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-700'
            : 'bg-neutral-950/95 border-neutral-800 text-neutral-300'
        }`}
        aria-label="Studio Tools Navigation"
      >
        {/* DrawArc Brand Glyph */}
        <div className="mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-500/30">
            A
          </div>
        </div>

        {/* Primary Studio Categories */}
        <div className="flex flex-col items-center gap-1.5 w-full px-1">
          {/* Elements */}
          <button
            onClick={() => onSelectTab(activeTab === 'elements' ? null : 'elements')}
            className={`w-full py-2.5 px-1 rounded-2xl flex flex-col items-center gap-1 transition-all ${
              activeTab === 'elements'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Cloud & Architecture Elements"
          >
            <Boxes className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight">Elements</span>
          </button>

          {/* Shapes */}
          <button
            onClick={() => onSelectTab(activeTab === 'shapes' ? null : 'shapes')}
            className={`w-full py-2.5 px-1 rounded-2xl flex flex-col items-center gap-1 transition-all ${
              activeTab === 'shapes'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Shapes & Wireframe Elements"
          >
            <Shapes className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight">Shapes</span>
          </button>

          {/* Text */}
          <button
            onClick={() => onSelectTab(activeTab === 'text' ? null : 'text')}
            className={`w-full py-2.5 px-1 rounded-2xl flex flex-col items-center gap-1 transition-all ${
              activeTab === 'text'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Text & Typography"
          >
            <Type className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight">Text</span>
          </button>

          {/* Draw / Pen */}
          <button
            onClick={() => onSelectTab(activeTab === 'draw' ? null : 'draw')}
            className={`w-full py-2.5 px-1 rounded-2xl flex flex-col items-center gap-1 transition-all ${
              activeTab === 'draw'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Freehand Pen, Brush & Eraser"
          >
            <PenTool className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight">Draw</span>
          </button>

          {/* Templates */}
          <button
            onClick={() => onSelectTab(activeTab === 'templates' ? null : 'templates')}
            className={`w-full py-2.5 px-1 rounded-2xl flex flex-col items-center gap-1 transition-all ${
              activeTab === 'templates'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Pre-Built Architecture Templates"
          >
            <LayoutTemplate className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight">Templates</span>
          </button>

          {/* Layers */}
          <button
            onClick={() => onSelectTab(activeTab === 'layers' ? null : 'layers')}
            className={`w-full py-2.5 px-1 rounded-2xl flex flex-col items-center gap-1 transition-all ${
              activeTab === 'layers'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Layer Stack & Z-Order"
          >
            <LayersIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight">Layers</span>
          </button>
        </div>
      </nav>

      {/* 2. Slide-out Drawer Panel (Docked next to rail) */}
      <aside
        className={`fixed left-16 md:left-18 top-0 bottom-0 z-30 w-80 md:w-84 backdrop-blur-2xl border-r shadow-2xl flex flex-col pointer-events-auto transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/50'
            : 'bg-neutral-900/95 border-neutral-800 text-neutral-100 shadow-black/80'
        }`}
        aria-label="Studio Drawer Palette"
      >
        {/* Drawer Header */}
        <div className={`p-3.5 border-b flex items-center justify-between ${isLight ? 'border-slate-100' : 'border-neutral-800'}`}>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider">
              {activeTab === 'elements' && 'Cloud Architecture'}
              {activeTab === 'shapes' && 'Geometric Shapes'}
              {activeTab === 'text' && 'Text & Sticky Notes'}
              {activeTab === 'draw' && 'Freehand Drawing'}
              {activeTab === 'templates' && 'Architecture Templates'}
              {activeTab === 'layers' && `Layers (${layerItems.length})`}
            </h2>
          </div>

          <button
            onClick={onCloseDrawer}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-neutral-800 text-neutral-400'
            }`}
            title="Close Drawer"
            aria-label="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar">
          {/* TAB: ELEMENTS */}
          {activeTab === 'elements' && (
            <div className="space-y-3">
              {/* Search */}
              <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/40 border-neutral-800'
              }`}>
                <Search className="w-3.5 h-3.5 opacity-40 shrink-0" />
                <input
                  type="text"
                  placeholder="Search cloud services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs outline-none"
                />
              </div>

              {/* Components List */}
              <div className="grid grid-cols-1 gap-1.5">
                {filteredComponents.map((node) => {
                  const Icon = node.icon;
                  return (
                    <div
                      key={node.type}
                      className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer md:cursor-grab active:cursor-grabbing border transition-all active:scale-[0.98] ${
                        isLight
                          ? 'bg-slate-50/80 hover:bg-slate-100 border-slate-200'
                          : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                      }`}
                      onDragStart={(event) => onDragStart(event, node.type, node.label)}
                      onClick={() => onAddNode(node.type, node.label)}
                      draggable
                      title="Drag to canvas or click to add"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg border ${node.bg}`}>
                          <Icon className={`w-4 h-4 ${node.color}`} />
                        </div>
                        <span className="text-xs font-semibold truncate">{node.label}</span>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 opacity-60">
                        <Plus className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: SHAPES */}
          {activeTab === 'shapes' && (
            <div className="space-y-3">
              <p className="text-[11px] opacity-60">Click or drag any shape onto the canvas:</p>
              <div className="grid grid-cols-2 gap-2">
                {filteredShapes.map((shape) => {
                  const Icon = shape.icon;
                  return (
                    <button
                      key={shape.shape}
                      onClick={() => onAddShape(shape.shape, shape.label)}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all hover:scale-105 active:scale-95 ${
                        isLight
                          ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                          : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${shape.color}`} />
                      <span className="text-xs font-bold truncate w-full">{shape.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: TEXT */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold">Add Typography</span>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onAddTextQuick(36, true)}
                    className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-95 ${
                      isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800'
                    }`}
                  >
                    <span className="text-xl font-bold font-sans block">Add a Heading</span>
                    <span className="text-[10px] opacity-50">36px · Bold Title</span>
                  </button>

                  <button
                    onClick={() => onAddTextQuick(24, true)}
                    className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-95 ${
                      isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800'
                    }`}
                  >
                    <span className="text-base font-semibold font-sans block">Add a Subheading</span>
                    <span className="text-[10px] opacity-50">24px · Section Header</span>
                  </button>

                  <button
                    onClick={() => onAddTextQuick(16, false)}
                    className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-95 ${
                      isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800'
                    }`}
                  >
                    <span className="text-xs font-normal font-sans block">Add Body Text</span>
                    <span className="text-[10px] opacity-50">16px · Regular Paragraph</span>
                  </button>
                </div>
              </div>

              {/* Sticky Notes */}
              <div className="space-y-2 pt-2 border-t border-neutral-500/20">
                <span className="text-xs font-bold">Sticky Notes</span>
                <div className="grid grid-cols-2 gap-2">
                  {STICKY_PRESETS.map((sticky) => (
                    <button
                      key={sticky.color}
                      onClick={() => onAddSticky(sticky.color)}
                      className="p-3 rounded-xl border shadow-sm flex flex-col items-center justify-center gap-1 text-center transition-all hover:scale-105 active:scale-95"
                      style={{
                        backgroundColor: sticky.bg,
                        color: sticky.text,
                        borderColor: 'rgba(0,0,0,0.1)',
                      }}
                    >
                      <StickyNote className="w-5 h-5" />
                      <span className="text-[11px] font-bold font-handwriting">{sticky.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: DRAW */}
          {activeTab === 'draw' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold">Drawing Instruments</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setInteractionMode('pen')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      interactionMode === 'pen'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800'
                    }`}
                  >
                    <PenTool className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Pen</span>
                  </button>

                  <button
                    onClick={() => setInteractionMode('highlighter')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      interactionMode === 'highlighter'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-400 opacity-80" />
                    <span className="text-[10px] font-bold">Highlighter</span>
                  </button>

                  <button
                    onClick={() => setInteractionMode('eraser')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      interactionMode === 'eraser'
                        ? 'bg-rose-600 text-white shadow-md'
                        : isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800'
                    }`}
                  >
                    <Trash2 className="w-5 h-5 text-rose-500" />
                    <span className="text-[10px] font-bold">Eraser</span>
                  </button>
                </div>
              </div>

              {/* Ink Color */}
              <div className="space-y-2">
                <span className="text-xs font-bold">Ink Color</span>
                <div className="grid grid-cols-6 gap-1.5">
                  {['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#f97316', '#f43f5e', '#a855f7', '#0f172a', '#ffffff'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setActiveColor(color)}
                      className={`w-full aspect-square rounded-xl border transition-transform hover:scale-110 shadow-sm ${
                        activeColor === color ? 'ring-2 ring-indigo-500 scale-105' : ''
                      } ${isLight ? 'border-slate-200' : 'border-neutral-700'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-3">
              <p className="text-[11px] opacity-60">1-click synthesis of production cloud blueprints:</p>
              <div className="flex flex-col gap-2">
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.title}
                    onClick={() => {
                      onSelectTemplate(tmpl.prompt);
                      onCloseDrawer();
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-95 ${
                      isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-600 dark:text-indigo-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{tmpl.title}</span>
                    </div>
                    <p className="text-[11px] opacity-65 mt-1 leading-snug">{tmpl.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB: LAYERS */}
          {activeTab === 'layers' && (
            <div className="space-y-3">
              {/* Layer Category Filter */}
              <div className={`grid grid-cols-4 gap-1 p-1 rounded-xl border text-[10px] font-bold ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-950/60 border-neutral-800'
              }`}>
                {(['all', 'shapes', 'drawings', 'architecture'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setLayerFilter(t)}
                    className={`py-1 rounded-lg capitalize transition-all truncate ${
                      layerFilter === t
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    {t === 'architecture' ? 'Cloud' : t}
                  </button>
                ))}
              </div>

              {/* Layer Stack Items */}
              <div className="space-y-1.5 max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar">
                {filteredLayers.length === 0 ? (
                  <div className="py-8 text-center text-xs opacity-50">
                    No elements on canvas
                  </div>
                ) : (
                  filteredLayers.map((item, idx) => {
                    const isSelected = selectedId === item.id;
                    const isDragging = draggedLayerIndex === idx;
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => setDraggedLayerIndex(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleLayerDrop(idx)}
                        onClick={() => onSelectElement(item.id, item.type === 'drawing' ? 'drawing' : 'node')}
                        className={`group flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          isDragging ? 'opacity-40 border-dashed border-indigo-500 scale-95' : ''
                        } ${
                          isSelected
                            ? 'bg-indigo-500/10 border-indigo-500/60 shadow-sm'
                            : isLight ? 'bg-slate-50/80 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/60 hover:bg-neutral-800/80 border-neutral-800'
                        } ${item.isHidden ? 'opacity-40' : ''}`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span title="Drag to reorder" className="cursor-grab shrink-0">
                            <GripVertical className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                          </span>
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium truncate max-w-[110px]">{item.name}</span>
                        </div>

                        {/* Order & Visibility Controls */}
                        <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLayerMove(item.id, 1);
                            }}
                            className="p-1 rounded hover:bg-neutral-500/20"
                            title="Bring Forward"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLayerMove(item.id, -1);
                            }}
                            className="p-1 rounded hover:bg-neutral-500/20"
                            title="Send Backward"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLayerToggleVisibility(item.id);
                            }}
                            className="p-1 rounded hover:bg-neutral-500/20"
                            title={item.isHidden ? 'Show' : 'Hide'}
                          >
                            {item.isHidden ? <EyeOff className="w-3 h-3 text-amber-500" /> : <Eye className="w-3 h-3 opacity-60" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLayerToggleLock(item.id);
                            }}
                            className="p-1 rounded hover:bg-neutral-500/20"
                            title={item.isLocked ? 'Unlock' : 'Lock'}
                          >
                            {item.isLocked ? <Lock className="w-3 h-3 text-amber-500" /> : <Unlock className="w-3 h-3 opacity-60" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLayerDelete(item.id);
                            }}
                            className="p-1 rounded hover:bg-rose-500/20 text-rose-500"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
