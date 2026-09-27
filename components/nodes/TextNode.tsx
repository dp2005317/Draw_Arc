import React, { memo, useState } from 'react';
import { useReactFlow } from 'reactflow';

export interface TextNodeData {
  text?: string;
}

function TextNode({ id, data }: { id: string; data: TextNodeData }) {
  const [text, setText] = useState(data.text || 'Double click to edit');
  const [isEditing, setIsEditing] = useState(false);
  const { setNodes } = useReactFlow();

  const handleBlur = () => {
    setIsEditing(false);
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          n.data = { ...n.data, text };
        }
        return n;
      })
    );
  };

  return (
    <div 
      className="p-2 min-w-[100px] cursor-text flex items-center justify-center"
      onDoubleClick={() => setIsEditing(true)}
    >
      {isEditing ? (
        <textarea
          autoFocus
          className="text-gray-100 bg-transparent outline-none border-none resize-none text-center w-full min-h-[40px] font-sans text-lg leading-tight"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
             if (e.key === 'Enter' && !e.shiftKey) {
               e.preventDefault();
               handleBlur();
             }
          }}
        />
      ) : (
        <div className="text-gray-100 font-sans text-lg whitespace-pre-wrap text-center select-none leading-tight border border-transparent hover:border-gray-700/50 rounded-md px-1 transition-colors">
          {text}
        </div>
      )}
    </div>
  );
}

export default memo(TextNode);
