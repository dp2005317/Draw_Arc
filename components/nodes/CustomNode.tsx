import React, { useState } from 'react';
import { Handle, Position, useReactFlow, NodeResizer } from 'reactflow';
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
} from 'lucide-react';

const iconMap: Record<string, { icon: React.ReactNode; color: string; badge: string }> = {
  client: { 
    icon: <Smartphone className="w-5 h-5 text-blue-400" />, 
    color: 'border-blue-500/30 hover:border-blue-500/60 shadow-blue-950/20',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
  },
  gateway: { 
    icon: <Network className="w-5 h-5 text-purple-400" />, 
    color: 'border-purple-500/30 hover:border-purple-500/60 shadow-purple-950/20',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
  },
  service: { 
    icon: <Cpu className="w-5 h-5 text-emerald-400" />, 
    color: 'border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-950/20',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
  },
  db: { 
    icon: <Database className="w-5 h-5 text-rose-400" />, 
    color: 'border-rose-500/30 hover:border-rose-500/60 shadow-rose-950/20',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
  },
  cache: { 
    icon: <Zap className="w-5 h-5 text-amber-400" />, 
    color: 'border-amber-500/30 hover:border-amber-500/60 shadow-amber-950/20',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
  },
  queue: { 
    icon: <List className="w-5 h-5 text-orange-400" />, 
    color: 'border-orange-500/30 hover:border-orange-500/60 shadow-orange-950/20',
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
  },
  storage: { 
    icon: <HardDrive className="w-5 h-5 text-cyan-400" />, 
    color: 'border-cyan-500/30 hover:border-cyan-500/60 shadow-cyan-950/20',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
  },
  loadbalancer: { 
    icon: <Server className="w-5 h-5 text-indigo-400" />, 
    color: 'border-indigo-500/30 hover:border-indigo-500/60 shadow-indigo-950/20',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
  },
  load_balancer: { 
    icon: <Server className="w-5 h-5 text-indigo-400" />, 
    color: 'border-indigo-500/30 hover:border-indigo-500/60 shadow-indigo-950/20',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
  },
  cloud: { 
    icon: <Cloud className="w-5 h-5 text-sky-400" />, 
    color: 'border-sky-500/30 hover:border-sky-500/60 shadow-sky-950/20',
    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20' 
  }
};

export interface CustomNodeData {
  label: string;
  type: string;
}

export default function CustomNode({ 
  id, 
  data, 
  selected 
}: { 
  id: string; 
  data: CustomNodeData; 
  selected?: boolean 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || 'Untitled Node');
  const { setNodes } = useReactFlow();

  const typeConfig = iconMap[data.type] || {
    icon: <Cloud className="w-5 h-5 text-gray-400" />,
    color: 'border-neutral-700/50 hover:border-neutral-600 shadow-neutral-950/20',
    badge: 'bg-neutral-800 text-neutral-400 border-neutral-700'
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          n.data = { ...n.data, label };
        }
        return n;
      })
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <>
      <NodeResizer 
        color="#6366f1" 
        isVisible={selected} 
        minWidth={160} 
        minHeight={65} 
      />
      <div 
        className={`relative w-full h-full px-3.5 py-2.5 rounded-2xl theme-node-card backdrop-blur-md 
          border ${typeConfig.color} shadow-xl flex items-center space-x-3 group transition-all duration-200 
          hover:shadow-2xl ${selected ? 'ring-2 ring-indigo-500/80 shadow-indigo-500/20' : ''}
        `}
        onDoubleClick={handleDoubleClick}
      >
        {/* Handles on 4 sides for seamless LR & TB auto-layout & manual wiring */}
        <Handle 
          id="target-top"
          type="target" 
          position={Position.Top} 
          className="w-2.5 h-2.5 !bg-indigo-400 border-2 !border-[var(--node-bg)] opacity-60 group-hover:opacity-100 transition-opacity" 
        />
        <Handle 
          id="target-left"
          type="target" 
          position={Position.Left} 
          className="w-2.5 h-2.5 !bg-indigo-400 border-2 !border-[var(--node-bg)] opacity-60 group-hover:opacity-100 transition-opacity" 
        />
        <Handle 
          id="source-right"
          type="source" 
          position={Position.Right} 
          className="w-2.5 h-2.5 !bg-indigo-400 border-2 !border-[var(--node-bg)] opacity-60 group-hover:opacity-100 transition-opacity" 
        />
        <Handle 
          id="source-bottom"
          type="source" 
          position={Position.Bottom} 
          className="w-2.5 h-2.5 !bg-indigo-400 border-2 !border-[var(--node-bg)] opacity-60 group-hover:opacity-100 transition-opacity" 
        />

        {/* Icon Container */}
        <div className="p-2 theme-node-icon rounded-xl shrink-0 border shadow-inner">
          {typeConfig.icon}
        </div>

        {/* Node Body */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md border ${typeConfig.badge}`}>
              {data.type}
            </span>
          </div>

          {isEditing ? (
            <input
              autoFocus
              className="nodrag nopan nowheel text-xs theme-node-text font-semibold bg-transparent border border-indigo-500 rounded px-1.5 py-0.5 outline-none w-full"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <div 
              className="text-xs theme-node-text font-semibold cursor-text select-none truncate opacity-90 hover:opacity-100"
              title="Double click to rename"
            >
              {data.label}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
