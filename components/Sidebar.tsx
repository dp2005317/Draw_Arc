import React from 'react';
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
  Layers 
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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (type: string, label: string) => void;
}

export default function Sidebar({ isOpen, onClose, onAddNode }: SidebarProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, label }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside 
        className={`fixed md:absolute left-0 md:left-4 top-0 md:top-20 bottom-0 md:bottom-auto z-40 md:z-20 
          w-72 md:w-56 bg-neutral-950/95 md:bg-neutral-900/90 backdrop-blur-xl border-r md:border border-neutral-800 
          md:rounded-2xl shadow-2xl p-4 flex flex-col gap-3 pointer-events-auto transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:flex'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">Components</h2>
              <p className="text-[10px] text-neutral-400 hidden md:block">Drag or tap to add</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            aria-label="Close component palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drag or Tap instructions banner for mobile */}
        <div className="block md:hidden bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-2 text-[11px] text-indigo-300">
          💡 Tap any cloud primitive to place it onto the active canvas.
        </div>

        {/* Component List */}
        <div className="overflow-y-auto max-h-[calc(100vh-140px)] md:max-h-[58vh] flex flex-col gap-1.5 pr-0.5 custom-scrollbar">
          {COMPONENT_CATALOG.map((node) => {
            const Icon = node.icon;
            return (
              <div
                key={node.type}
                className="group flex items-center justify-between p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 
                  cursor-pointer md:cursor-grab active:cursor-grabbing border border-neutral-800/70 hover:border-neutral-700 
                  transition-all active:scale-[0.98]"
                onDragStart={(event) => onDragStart(event, node.type, node.label)}
                onClick={() => onAddNode(node.type, node.label)}
                draggable
                title="Drag or tap to place"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg border ${node.bg}`}>
                    <Icon className={`w-4 h-4 ${node.color}`} />
                  </div>
                  <span className="text-xs text-neutral-300 group-hover:text-white font-medium truncate">
                    {node.label}
                  </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-neutral-400 hover:text-white">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-2 border-t border-neutral-800/80 text-[10px] text-neutral-500 text-center">
          DrawArc Cloud Primitives v1.0
        </div>
      </aside>
    </>
  );
}
