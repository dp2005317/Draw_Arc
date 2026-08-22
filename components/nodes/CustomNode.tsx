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

const iconMap: Record<string, React.ReactNode> = {
  client: <Smartphone className="w-6 h-6 text-blue-400" />,
  gateway: <Network className="w-6 h-6 text-purple-400" />,
  service: <Cpu className="w-6 h-6 text-green-400" />,
  db: <Database className="w-6 h-6 text-red-400" />,
  cache: <Zap className="w-6 h-6 text-yellow-400" />,
  queue: <List className="w-6 h-6 text-orange-400" />,
  storage: <HardDrive className="w-6 h-6 text-teal-400" />,
  load_balancer: <Server className="w-6 h-6 text-indigo-400" />,
  cloud: <Cloud className="w-6 h-6 text-gray-400" />
};

export default function CustomNode({ id, data, selected }: { id: string, data: any, selected?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const { setNodes } = useReactFlow();

  const icon = iconMap[data.type] || <Cloud className="w-6 h-6 text-gray-400" />;

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
      <NodeResizer color="#4f46e5" isVisible={selected} minWidth={150} minHeight={60} />
      <div 
        className="w-full h-full px-4 py-3 shadow-lg rounded-xl bg-gray-900 border border-gray-700/50 flex items-center space-x-3 group transition-shadow hover:shadow-xl"
        onDoubleClick={handleDoubleClick}
      >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-none opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-2 bg-gray-800 rounded-lg shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{data.type}</div>
        {isEditing ? (
          <input
            autoFocus
            className="text-sm text-gray-100 font-medium bg-gray-800 border border-indigo-500 rounded px-1 outline-none w-full mt-0.5"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <div className="text-sm text-gray-100 font-medium cursor-text select-none min-h-[20px]">{data.label}</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-none opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </>
  );
}
