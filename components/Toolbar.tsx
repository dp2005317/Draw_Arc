import React from 'react';
import { Hand, MousePointer2, Square, Circle, Diamond, Type, Eraser } from 'lucide-react';

export type InteractionMode = 'pan' | 'select' | 'rect' | 'circle' | 'diamond' | 'text' | 'eraser';

interface ToolbarProps {
  mode: InteractionMode;
  setMode: (mode: InteractionMode) => void;
}

export default function Toolbar({ mode, setMode }: ToolbarProps) {
  const tools = [
    { id: 'pan', icon: Hand, label: 'Pan' },
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'diamond', icon: Diamond, label: 'Diamond' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
  ];

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-1 pointer-events-auto">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setMode(tool.id as InteractionMode)}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
            mode === tool.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
          title={tool.label}
        >
          <tool.icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
}
