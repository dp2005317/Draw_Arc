import React, { memo, useState, useEffect, useRef } from 'react';
import { useReactFlow, NodeResizer } from 'reactflow';

export interface TextNodeData {
  text?: string;
  fontSize?: number;
  fontFamily?: 'hand' | 'sans' | 'mono' | 'serif';
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  isEditing?: boolean;
}

function TextNode({ id, data, selected }: { id: string; data: TextNodeData; selected?: boolean }) {
  const [isEditing, setIsEditing] = useState(Boolean(data.isEditing));
  const [localText, setLocalText] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setNodes } = useReactFlow();

  const fontSize = data.fontSize || 20;
  const color = data.color || 'var(--text-node-color)';
  const textAlign = data.textAlign || 'left';
  const isBold = Boolean(data.isBold);
  const isItalic = Boolean(data.isItalic);
  const isUnderline = Boolean(data.isUnderline);

  const text = localText ?? data.text ?? 'Write something...';

  // Auto-focus and auto-expand height when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      if (textarea.value === 'Write something...' || textarea.value === 'Type your text here...') {
        textarea.select();
      } else {
        textarea.selectionStart = textarea.value.length;
        textarea.selectionEnd = textarea.value.length;
      }
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(fontSize * 1.5, textarea.scrollHeight)}px`;
    }
  }, [isEditing, fontSize]);

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
    e.target.style.height = `${Math.max(fontSize * 1.5, e.target.scrollHeight)}px`;
  };

  const startEditing = () => {
    setLocalText(data.text ?? 'Write something...');
    setIsEditing(true);
  };

  // Dynamic proportional font scaling during drag-resize
  const handleResize = (_: unknown, params: { width: number; height: number }) => {
    const computedFontSize = Math.max(12, Math.min(140, Math.round(params.height * 0.45)));
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: { ...n.data, fontSize: computedFontSize },
          };
        }
        return n;
      })
    );
  };

  return (
    <>
      <NodeResizer 
        color="#818cf8" 
        isVisible={selected} 
        minWidth={60} 
        minHeight={32}
        onResize={handleResize}
      />
      <div 
        className={`w-full h-full min-w-[70px] min-h-[32px] p-1.5 rounded-xl transition-all relative flex flex-col justify-center ${
          selected ? 'ring-2 ring-indigo-500/80' : ''
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
            className={`nodrag nopan nowheel w-full bg-transparent outline-none border border-indigo-500/60 rounded-lg px-2 py-1 resize-none leading-snug transition-all shadow-sm ${fontClass} ${
              isBold ? 'font-bold' : ''
            } ${isItalic ? 'italic' : ''} ${isUnderline ? 'underline' : ''}`}
            style={{ 
              color, 
              fontSize: `${fontSize}px`, 
              textAlign,
              minHeight: `${fontSize * 1.4}px`
            }}
            value={text}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <div 
            className={`w-full whitespace-pre-wrap select-none leading-snug px-2 py-1 cursor-text ${fontClass} ${
              isBold ? 'font-bold' : ''
            } ${isItalic ? 'italic' : ''} ${isUnderline ? 'underline' : ''}`}
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
