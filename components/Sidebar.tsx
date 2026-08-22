import React from 'react';
import { Smartphone, Server, Cpu, Database, Zap, List, HardDrive, Network, Cloud } from 'lucide-react';

const nodeTypes = [
  { type: 'client', label: 'Client', icon: Smartphone, color: 'text-blue-400' },
  { type: 'gateway', label: 'Gateway', icon: Network, color: 'text-purple-400' },
  { type: 'service', label: 'Service', icon: Cpu, color: 'text-green-400' },
  { type: 'db', label: 'Database', icon: Database, color: 'text-red-400' },
  { type: 'cache', label: 'Cache', icon: Zap, color: 'text-yellow-400' },
  { type: 'queue', label: 'Queue', icon: List, color: 'text-orange-400' },
  { type: 'storage', label: 'Storage', icon: HardDrive, color: 'text-teal-400' },
  { type: 'load_balancer', label: 'Load Balancer', icon: Server, color: 'text-indigo-400' },
  { type: 'cloud', label: 'Cloud', icon: Cloud, color: 'text-gray-400' },
];

export default function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, label }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="absolute left-4 top-24 z-10 w-48 bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 pointer-events-auto transition-all">
      <div className="flex justify-center items-center mb-1 px-2">
        <img src="/logo.png" alt="DrawArc Logo" className="w-12 h-auto object-contain drop-shadow-md brightness-0 invert" />
      </div>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Drag Components</div>
      <div className="overflow-y-auto max-h-[60vh] flex flex-col gap-2 pr-1 custom-scrollbar">
        {nodeTypes.map((node) => (
          <div
            key={node.type}
            className="flex items-center gap-3 p-2 rounded-xl bg-gray-800 hover:bg-gray-700 cursor-grab active:cursor-grabbing border border-gray-700/50 transition-colors"
            onDragStart={(event) => onDragStart(event, node.type, node.label)}
            draggable
          >
            <node.icon className={`w-5 h-5 ${node.color}`} />
            <span className="text-sm text-gray-200 font-medium">{node.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
