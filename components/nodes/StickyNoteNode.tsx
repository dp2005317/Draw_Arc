import React, { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeResizer, useReactFlow } from 'reactflow';

export interface StickyNoteData {
  text?: string;
  color?: string;
  fontFamily?: 'hand' | 'sans' | 'mono';
  author?: string;
  isEditing?: boolean;
}

const STICKY_COLORS: Record<string, { bg: string; text: string; shadow: string; border: string }> = {
  yellow: { bg: '#fef08a', text: '#713f12', shadow: '#ca8a0440', border: '#fde047' },
  pink: { bg: '#fbcfe8', text: '#831843', shadow: '#db277740', border: '#f472b6' },
  blue: { bg: '#bae6fd', text: '#0c4a6e', shadow: '#0284c740', border: '#7dd3fc' },
  green: { bg: '#bbf7d0', text: '#14532d', shadow: '#16a34a40', border: '#86efac' },
  purple: { bg: '#e9d5ff', text: '#581c87', shadow: '#9333ea40', border: '#d8b4fe' },
  orange: { bg: '#fed7aa', text: '#7c2d12', shadow: '#ea580c40', border: '#fdba74' },
  dark: { bg: '#27272a', text: '#f4f4f5', shadow: '#00000080', border: '#3f3f46' },
};

function StickyNoteNode({ id, data, selected }: { id: string; data: StickyNoteData; selected: boolean }) {
  const [isEditing, setIsEditing] = useState(Boolean(data.isEditing));
  const [localText, setLocalText] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setNodes } = useReactFlow();

  const colorScheme = STICKY_COLORS[data.color || 'yellow'] || STICKY_COLORS.yellow;
  const fontClass = data.fontFamily === 'mono' ? 'font-mono' : data.fontFamily === 'sans' ? 'font-sans' : 'font-handwriting';

  const text = localText ?? data.text ?? 'Idea or Note...';

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      if (textareaRef.current.value === 'Idea or Note...' || textareaRef.current.value === 'New Idea or Note...') {
        textareaRef.current.select();
      }
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const valueToCommit = localText ?? text;
    setLocalText(null);
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: { ...n.data, text: valueToCommit, isEditing: false },
          };
        }
        return n;
      })
    );
  };

  const startEditing = () => {
    setLocalText(data.text ?? 'Idea or Note...');
    setIsEditing(true);
  };

  return (
    <>
      <NodeResizer 
        color="#f59e0b" 
        isVisible={selected} 
        minWidth={120} 
        minHeight={100} 
      />

      <div
        className={`relative w-full h-full p-3.5 rounded-xl shadow-xl transition-all duration-150 flex flex-col justify-between group
          ${selected ? 'ring-2 ring-indigo-500 scale-[1.01]' : 'hover:scale-[1.01]'}
        `}
        style={{
          backgroundColor: colorScheme.bg,
          color: colorScheme.text,
          border: `1px solid ${colorScheme.border}`,
          boxShadow: `0 10px 15px -3px ${colorScheme.shadow}, 0 4px 6px -4px ${colorScheme.shadow}`,
        }}
        onClick={(e) => {
          if (selected) {
            e.stopPropagation();
            startEditing();
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          startEditing();
        }}
      >
        {/* Connection Handles */}
        <Handle id="top" type="target" position={Position.Top} className="!w-2 !h-2 !bg-amber-600 opacity-0 group-hover:opacity-100" />
        <Handle id="bottom" type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-amber-600 opacity-0 group-hover:opacity-100" />
        <Handle id="left" type="target" position={Position.Left} className="!w-2 !h-2 !bg-amber-600 opacity-0 group-hover:opacity-100" />
        <Handle id="right" type="source" position={Position.Right} className="!w-2 !h-2 !bg-amber-600 opacity-0 group-hover:opacity-100" />

        {/* Note Content */}
        <div className="flex-1 w-full overflow-hidden flex items-start">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              autoFocus
              className={`nodrag nopan nowheel w-full h-full bg-transparent outline-none resize-none text-sm leading-snug ${fontClass}`}
              style={{ color: colorScheme.text }}
              value={text}
              onChange={(e) => setLocalText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  handleBlur();
                }
              }}
            />
          ) : (
            <div 
              className={`w-full text-sm leading-snug whitespace-pre-wrap select-none break-words ${fontClass}`}
              title="Click or double-click to edit note"
            >
              {text}
            </div>
          )}
        </div>

        {/* Footer with subtle folded corner effect */}
        <div className="mt-2 flex items-center justify-between text-[10px] opacity-60">
          <span className="truncate">{data.author || 'Note'}</span>
          <div 
            className="w-3.5 h-3.5 bg-black/10 rounded-tl-sm self-end -mr-2 -mb-2" 
            style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
          />
        </div>
      </div>
    </>
  );
}

export default memo(StickyNoteNode);
