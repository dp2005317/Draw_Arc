import React, { memo, useState, useEffect, useRef } from 'react';
import { useReactFlow, NodeResizer } from 'reactflow';

export interface TextNodeData {
  text?: string;
  fontSize?: number;
  fontFamily?: 'hand' | 'sans' | 'mono' | 'serif';
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  isBold?: boolean;
  isEditing?: boolean;
}

function TextNode({ id, data, selected }: { id: string; data: TextNodeData; selected?: boolean }) {
  const [isEditing, setIsEditing] = useState(Boolean(data.isEditing));
  const [localText, setLocalText] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setNodes } = useReactFlow();

  const fontSize = data.fontSize || 18;
  const color = data.color || 'var(--text-node-color)';
  const textAlign = data.textAlign || 'left';
  const isBold = data.isBold ?? false;

  const text = localText ?? data.text ?? 'Write something...';

  // Auto-focus and auto-expand height when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      // If default placeholder, select it so typing replaces immediately
      if (textarea.value === 'Write something...' || textarea.value === 'Type your text here...') {
        textarea.select();
      } else {
        textarea.selectionStart = textarea.value.length;
        textarea.selectionEnd = textarea.value.length;
      }
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(36, textarea.scrollHeight)}px`;
    }
  }, [isEditing]);

  const fontClass = 
    data.fontFamily === 'mono' ? 'font-mono' :
    data.fontFamily === 'sans' ? 'font-sans' :
    data.fontFamily === 'serif' ? 'font-serif' : 'font-handwriting';

  const handleBlur = () => {
    setIsEditing(false);
    const valueToCommit = (localText ?? text).trim();
    setLocalText(null);

    // If completely empty, remove this node cleanly
    if (!valueToCommit) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      return;
    }

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Escape or Cmd+Enter commits text
    if (e.key === 'Escape' || ((e.metaKey || e.ctrlKey) && e.key === 'Enter')) {
      e.preventDefault();
      handleBlur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.max(36, e.target.scrollHeight)}px`;
  };

  const startEditing = () => {
    setLocalText(data.text ?? 'Write something...');
    setIsEditing(true);
  };

  return (
    <>
      <NodeResizer 
        color="#818cf8" 
        isVisible={selected} 
        minWidth={60} 
        minHeight={28} 
      />
      <div 
        className={`min-w-[80px] p-1.5 rounded-lg transition-all relative ${
          selected ? 'ring-2 ring-indigo-500/70' : ''
        }`}
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
        {isEditing ? (
          <textarea
            ref={textareaRef}
            rows={1}
            className={`nodrag nopan nowheel w-full bg-transparent outline-none border border-indigo-500/60 rounded px-1.5 py-1 resize-none leading-relaxed transition-all shadow-sm ${fontClass} ${
              isBold ? 'font-bold' : ''
            }`}
            style={{ 
              color, 
              fontSize: `${fontSize}px`, 
              textAlign,
              minHeight: `${fontSize * 1.5}px`
            }}
            value={text}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <div 
            className={`whitespace-pre-wrap select-none leading-relaxed px-1.5 py-1 cursor-text ${fontClass} ${
              isBold ? 'font-bold' : ''
            }`}
            style={{ 
              color, 
              fontSize: `${fontSize}px`, 
              textAlign 
            }}
            title="Click to edit text"
          >
            {text}
          </div>
        )}
      </div>
    </>
  );
}

export default memo(TextNode);
