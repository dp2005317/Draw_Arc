'use client';

import React, { useState } from 'react';
import { 
  Smartphone, 
  Server, 
  Cpu, 
  Database, 
  Zap, 
  List, 
  HardDrive, 
  Network, 
  Cloud, 
  X, 
  Plus, 
  Square,
  Circle,
  Diamond,
  Triangle,
  Star,
  StickyNote,
  Search,
  Boxes
} from 'lucide-react';

export const COMPONENT_CATALOG = [
  { type: 'client', label: 'Client / Frontend', icon: Smartphone, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { type: 'gateway', label: 'API Gateway', icon: Network, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { type: 'service', label: 'Microservice', icon: Cpu, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { type: 'db', label: 'Database', icon: Database, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  { type: 'cache', label: 'In-Memory Cache', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { type: 'queue', label: 'Message Queue', icon: List, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { type: 'storage', label: 'Object Storage', icon: HardDrive, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { type: 'loadbalancer', label: 'Load Balancer', icon: Server, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  { type: 'cloud', label: 'CDN / Cloud Edge', icon: Cloud, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
];

export const SHAPES_CATALOG = [
  { shape: 'rect', label: 'Rectangle', icon: Square, color: 'text-indigo-400' },
  { shape: 'rounded-rect', label: 'Rounded Box', icon: Square, color: 'text-sky-400' },
  { shape: 'circle', label: 'Circle / Ellipse', icon: Circle, color: 'text-emerald-400' },
  { shape: 'diamond', label: 'Decision Diamond', icon: Diamond, color: 'text-amber-400' },
  { shape: 'triangle', label: 'Triangle', icon: Triangle, color: 'text-pink-400' },
  { shape: 'star', label: 'Star Badge', icon: Star, color: 'text-yellow-400' },
];

export const STICKY_PRESETS = [
  { color: 'yellow', label: 'Yellow Note', bg: '#fef08a', text: '#713f12' },
  { color: 'pink', label: 'Pink Note', bg: '#fbcfe8', text: '#831843' },
  { color: 'blue', label: 'Blue Note', bg: '#bae6fd', text: '#0c4a6e' },
  { color: 'green', label: 'Green Note', bg: '#bbf7d0', text: '#14532d' },
  { color: 'purple', label: 'Lavender Note', bg: '#e9d5ff', text: '#581c87' },
  { color: 'dark', label: 'Charcoal Note', bg: '#27272a', text: '#f4f4f5' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (type: string, label: string) => void;
  onAddShape: (shape: string, label: string) => void;
  onAddSticky: (color: string) => void;
  theme: 'dark' | 'light';
}

export default function Sidebar({
  isOpen,
  onClose,
  onAddNode,
  onAddShape,
  onAddSticky,
  theme,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'architecture' | 'shapes' | 'stickies'>('architecture');
  const [searchQuery, setSearchQuery] = useState('');

  const isLight = theme === 'light';

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, label }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredComponents = COMPONENT_CATALOG.filter((c) =>
    c.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredShapes = SHAPES_CATALOG.filter((s) =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Elements Drawer */}
      <aside 
        className={`fixed md:absolute left-0 md:left-4 top-0 md:top-20 bottom-0 md:bottom-auto z-40 md:z-20 
          w-80 md:w-64 backdrop-blur-2xl border-r md:border md:rounded-3xl shadow-2xl p-4 flex flex-col gap-3 pointer-events-auto transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:flex'
          } ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/60'
              : 'bg-neutral-900/95 border-neutral-800 text-neutral-100 shadow-black/80'
          }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-slate-100' : 'border-neutral-800'}`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-xl ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider">Design Elements</h2>
              <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-neutral-400'}`}>
                Drag or tap to place
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`md:hidden p-1.5 rounded-lg transition-colors ${
              isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-neutral-800 text-neutral-400'
            }`}
            aria-label="Close component palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Architecture / Shapes / Stickies */}
        <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl border text-[11px] font-semibold ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-950/60 border-neutral-800'
        }`}>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-1.5 rounded-lg transition-all text-center truncate ${
              activeTab === 'architecture'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            Cloud
          </button>
          <button
            onClick={() => setActiveTab('shapes')}
            className={`py-1.5 rounded-lg transition-all text-center truncate ${
              activeTab === 'shapes'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            Shapes
          </button>
          <button
            onClick={() => setActiveTab('stickies')}
            className={`py-1.5 rounded-lg transition-all text-center truncate ${
              activeTab === 'stickies'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            Stickies
          </button>
        </div>

        {/* Search Bar */}
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/40 border-neutral-800'
        }`}>
          <Search className="w-3.5 h-3.5 opacity-40 shrink-0" />
          <input
            type="text"
            placeholder="Search elements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs outline-none"
          />
        </div>

        {/* Catalog Body */}
        <div className="overflow-y-auto max-h-[calc(100vh-210px)] md:max-h-[52vh] flex flex-col gap-1.5 pr-0.5 custom-scrollbar">
          {/* Tab 1: Cloud Architecture Components */}
          {activeTab === 'architecture' && (
            filteredComponents.map((node) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.type}
                  className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer md:cursor-grab active:cursor-grabbing border transition-all active:scale-[0.98] ${
                    isLight
                      ? 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/80 hover:border-slate-300'
                      : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800/70 hover:border-neutral-700'
                  }`}
                  onDragStart={(event) => onDragStart(event, node.type, node.label)}
                  onClick={() => onAddNode(node.type, node.label)}
                  draggable
                  title="Drag or tap to place"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg border ${node.bg}`}>
                      <Icon className={`w-4 h-4 ${node.color}`} />
                    </div>
                    <span className="text-xs font-medium truncate">
                      {node.label}
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 opacity-60 hover:opacity-100">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}

          {/* Tab 2: Shapes */}
          {activeTab === 'shapes' && (
            <div className="grid grid-cols-2 gap-1.5">
              {filteredShapes.map((shape) => {
                const Icon = shape.icon;
                return (
                  <button
                    key={shape.shape}
                    onClick={() => onAddShape(shape.shape, shape.label)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all hover:scale-105 active:scale-95 ${
                      isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${shape.color}`} />
                    <span className="text-[11px] font-medium truncate w-full">{shape.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 3: Sticky Notes */}
          {activeTab === 'stickies' && (
            <div className="grid grid-cols-2 gap-2">
              {STICKY_PRESETS.map((sticky) => (
                <button
                  key={sticky.color}
                  onClick={() => onAddSticky(sticky.color)}
                  className="p-3 rounded-xl border shadow-sm flex flex-col items-center justify-center gap-1.5 text-center transition-all hover:scale-105 active:scale-95"
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
          )}
        </div>

        <div className={`mt-auto pt-2 border-t text-[10px] text-center opacity-60 ${isLight ? 'border-slate-100' : 'border-neutral-800'}`}>
          DrawArc Studio · Architecture & Whiteboard Engine
        </div>
      </aside>
    </>
  );
}
