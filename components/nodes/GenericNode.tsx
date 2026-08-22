import React, { memo } from 'react';
import { NodeResizer } from 'reactflow';

function GenericNode({ data, selected }: { data: any, selected: boolean }) {
  const { shape = 'rect', color = '#1f2937' } = data;
  
  let borderRadius = '0px';
  let clipPath = 'none';
  
  if (shape === 'circle') borderRadius = '50%';
  if (shape === 'diamond') clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';

  return (
    <>
      <NodeResizer 
        color="#4f46e5" 
        isVisible={selected} 
        minWidth={40} 
        minHeight={40} 
      />
      <div 
        className="w-full h-full border-2 border-gray-500/50 shadow-md flex items-center justify-center transition-all"
        style={{
          backgroundColor: color,
          borderRadius,
          clipPath,
        }}
      >
        <span className="text-gray-200 text-sm font-medium px-2 text-center pointer-events-none">
          {data.label}
        </span>
      </div>
    </>
  );
}

export default memo(GenericNode);
