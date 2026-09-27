import React from 'react';
import { 
  Hand, 
  MousePointer2, 
  Square, 
  Circle, 
  Diamond, 
  Type, 
  Eraser 
} from 'lucide-react';

export type InteractionMode = 'pan' | 'select' | 'rect' | 'circle' | 'diamond' | 'text' | 'eraser';

interface ToolbarProps {
  mode: InteractionMode;
  setMode: (mode: InteractionMode) => void;
}

export default function Toolbar({ mode, setMode }: ToolbarProps) {
  const tools: { id: InteractionMode; icon: React.ComponentType<{ className?: string }>; label: string; shortcut?: string }[] = [
    { id: 'pan', icon: Hand, label: 'Pan Canvas', shortcut: 'H' },
    { id: 'select', icon: MousePointer2, label: 'Select & Move', shortcut: 'V' },
    { id: 'rect', icon: Square, label: 'Rectangle', shortcut: 'R' },
    { id: 'circle', icon: Circle, label: 'Circle', shortcut: 'C' },
    { id: 'diamond', icon: Diamond, label: 'Decision Diamond', shortcut: 'D' },
    { id: 'text', icon: Type, label: 'Text Note', shortcut: 'T' },
    { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
  ];

  return (
    <div 
      className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 
        flex items-center gap-1 bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 
        rounded-2xl shadow-2xl p-1.5 pointer-events-auto max-w-[95vw] overflow-x-auto custom-scrollbar"
      role="toolbar"
      aria-label="Canvas Drawing and Interaction Tools"
    >
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = mode === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => setMode(tool.id)}
            className={`relative group px-2.5 py-2 md:p-2 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
              isActive 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
            }`}
            title={`${tool.label} ${tool.shortcut ? `(${tool.shortcut})` : ''}`}
            aria-pressed={isActive}
            aria-label={tool.label}
          >
            <Icon className="w-4 h-4 md:w-5 md:h-5" />
            
            {/* Tooltip on Desktop hover */}
            <span className="hidden md:group-hover:flex absolute -top-9 left-1/2 -translate-x-1/2 
              bg-neutral-950 text-neutral-200 text-[10px] font-medium px-2 py-1 rounded-md 
              border border-neutral-800 shadow-xl whitespace-nowrap pointer-events-none items-center gap-1">
              <span>{tool.label}</span>
              {tool.shortcut && <kbd className="text-neutral-500 font-mono text-[9px]">[{tool.shortcut}]</kbd>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
