import React, { memo, useState } from 'react';
import { NodeResizer, Handle, Position, useReactFlow } from 'reactflow';

export interface GenericNodeData {
  shape?: 'rect' | 'rounded-rect' | 'circle' | 'diamond' | 'triangle' | 'star' | 'cylinder' | 'cloud' | string;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
  label?: string;
  fontFamily?: 'hand' | 'sans' | 'mono';
  textColor?: string;
}

function GenericNode({ id, data, selected }: { id: string; data: GenericNodeData; selected: boolean }) {
  const {
    shape = 'rect',
    color = 'var(--shape-default-fill)',
    strokeColor = 'var(--shape-default-stroke)',
    strokeWidth = 2,
    strokeStyle = 'solid',
    opacity = 100,
    label = '',
    fontFamily = 'hand',
    textColor = 'var(--node-text)',
  } = data;

  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState(label);
  const { setNodes } = useReactFlow();

  const handleBlur = () => {
    setIsEditing(false);
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          n.data = { ...n.data, label: labelText };
        }
        return n;
      })
    );
  };

  let borderRadius = '6px';
  let clipPath = 'none';

  if (shape === 'rounded-rect') borderRadius = '18px';
  if (shape === 'circle') borderRadius = '50%';
  if (shape === 'diamond') clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
  if (shape === 'triangle') clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
  if (shape === 'star') clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
  if (shape === 'cylinder') borderRadius = '12px';

  const fontClass = fontFamily === 'mono' ? 'font-mono' : fontFamily === 'sans' ? 'font-sans' : 'font-handwriting';

  return (
    <>
      <NodeResizer 
        color="#6366f1" 
        isVisible={selected} 
        minWidth={48} 
        minHeight={48} 
      />

      <div 
        className="w-full h-full relative group flex items-center justify-center transition-all"
        style={{ opacity: opacity / 100 }}
      >
        {/* Connection Handles */}
        <Handle id="top" type="target" position={Position.Top} className="!w-2 !h-2 !bg-indigo-500 opacity-0 group-hover:opacity-100" />
        <Handle id="bottom" type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-indigo-500 opacity-0 group-hover:opacity-100" />
        <Handle id="left" type="target" position={Position.Left} className="!w-2 !h-2 !bg-indigo-500 opacity-0 group-hover:opacity-100" />
        <Handle id="right" type="source" position={Position.Right} className="!w-2 !h-2 !bg-indigo-500 opacity-0 group-hover:opacity-100" />

        {/* Visual Shape Container */}
        <div 
          className={`w-full h-full flex items-center justify-center p-2.5 transition-all shadow-md
            ${selected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-neutral-900' : ''}
          `}
          style={{
            backgroundColor: color,
            borderWidth: `${strokeWidth}px`,
            borderColor: strokeColor,
            borderStyle: strokeStyle,
            borderRadius,
            clipPath,
          }}
          onClick={(e) => {
            if (selected) {
              e.stopPropagation();
              setIsEditing(true);
            }
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          {isEditing ? (
            <input
              autoFocus
              className={`nodrag nopan nowheel bg-transparent outline-none text-center w-full px-1 text-xs md:text-sm font-medium ${fontClass}`}
              style={{ color: textColor }}
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleBlur();
                if (e.key === 'Escape') handleBlur();
              }}
            />
          ) : (
            <span 
              className={`text-xs md:text-sm font-medium px-2 text-center pointer-events-none select-none break-words leading-tight ${fontClass}`}
              style={{ color: textColor }}
            >
              {labelText || (shape === 'diamond' ? 'Decision' : '')}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

export default memo(GenericNode);
