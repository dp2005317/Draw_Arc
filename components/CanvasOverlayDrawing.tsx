'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useViewport, ReactFlowInstance } from 'reactflow';
import { DrawingStroke, DrawingPoint, getSvgPathFromPoints } from '@/lib/collaboration';
import { InteractionMode } from './Toolbar';

interface CanvasOverlayDrawingProps {
  mode: InteractionMode;
  drawings: DrawingStroke[];
  onDrawingsChange: (drawings: DrawingStroke[]) => void;
  activeColor: string;
  activeWidth: number;
  activeOpacity: number;
  selectedStrokeId: string | null;
  onSelectStroke: (id: string | null) => void;
  reactFlowInstance: ReactFlowInstance | null;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}

export default function CanvasOverlayDrawing({
  mode,
  drawings,
  onDrawingsChange,
  activeColor,
  activeWidth,
  activeOpacity,
  selectedStrokeId,
  onSelectStroke,
  reactFlowInstance,
  wrapperRef,
}: CanvasOverlayDrawingProps) {
  const { x, y, zoom } = useViewport();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<DrawingPoint[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const isDrawingMode = mode === 'pen' || mode === 'highlighter' || mode === 'pencil';
  const isEraserMode = mode === 'eraser';

  const getCanvasPoint = useCallback(
    (e: React.PointerEvent): DrawingPoint | null => {
      if (!wrapperRef.current || !reactFlowInstance) return null;
      const bounds = wrapperRef.current.getBoundingClientRect();
      const clientX = e.clientX - bounds.left;
      const clientY = e.clientY - bounds.top;

      return reactFlowInstance.project({ x: clientX, y: clientY });
    },
    [wrapperRef, reactFlowInstance]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDrawingMode && !isEraserMode) return;
    e.stopPropagation();

    const pt = getCanvasPoint(e);
    if (!pt) return;

    if (isEraserMode) {
      // Find nearest stroke to erase
      eraseStrokeAtPoint(pt);
      return;
    }

    setIsDrawing(true);
    setCurrentPoints([pt]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isEraserMode && e.buttons === 1) {
      const pt = getCanvasPoint(e);
      if (pt) eraseStrokeAtPoint(pt);
      return;
    }

    if (!isDrawing || !isDrawingMode) return;
    e.stopPropagation();

    const pt = getCanvasPoint(e);
    if (!pt) return;

    setCurrentPoints((prev) => [...prev, pt]);
  };

  const handlePointerUp = () => {
    if (!isDrawing || !isDrawingMode) return;
    setIsDrawing(false);

    if (currentPoints.length > 0) {
      const newStroke: DrawingStroke = {
        id: `stroke-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: mode === 'highlighter' ? 'highlighter' : mode === 'pencil' ? 'pencil' : 'pen',
        points: currentPoints,
        color: activeColor,
        width: mode === 'highlighter' ? Math.max(activeWidth * 3.5, 18) : activeWidth,
        opacity: mode === 'highlighter' ? 0.35 : activeOpacity / 100,
        zIndex: drawings.length + 1,
        createdAt: Date.now(),
      };

      onDrawingsChange([...drawings, newStroke]);
    }

    setCurrentPoints([]);
  };

  const eraseStrokeAtPoint = (pt: DrawingPoint) => {
    const threshold = 18 / zoom;
    const remaining = drawings.filter((stroke) => {
      if (stroke.isLocked) return true;
      const hitsPoint = stroke.points.some((p) => {
        const dx = p.x - pt.x;
        const dy = p.y - pt.y;
        return Math.sqrt(dx * dx + dy * dy) < threshold;
      });
      return !hitsPoint;
    });

    if (remaining.length !== drawings.length) {
      onDrawingsChange(remaining);
    }
  };

  // Active stroke path being drawn right now
  const activePathD = isDrawing && currentPoints.length > 0 ? getSvgPathFromPoints(currentPoints) : '';

  return (
    <svg
      ref={svgRef}
      className={`absolute inset-0 w-full h-full z-10 ${
        isDrawingMode ? 'cursor-crosshair pointer-events-auto' : isEraserMode ? 'cursor-pointer pointer-events-auto' : 'pointer-events-none'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
        {/* Render Saved Completed Drawings */}
        {drawings.map((stroke) => {
          if (stroke.isHidden) return null;
          const isSelected = stroke.id === selectedStrokeId;
          const pathD = getSvgPathFromPoints(stroke.points);

          return (
            <g 
              key={stroke.id} 
              className={mode === 'select' ? 'pointer-events-auto cursor-pointer' : ''}
              onClick={(e) => {
                if (mode === 'select') {
                  e.stopPropagation();
                  onSelectStroke(stroke.id);
                } else if (mode === 'eraser') {
                  e.stopPropagation();
                  onDrawingsChange(drawings.filter((d) => d.id !== stroke.id));
                }
              }}
            >
              {/* Highlight selection ring if stroke is selected */}
              {isSelected && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth={stroke.width + 6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.4}
                />
              )}

              {/* Actual Stroke */}
              <path
                d={pathD}
                fill="none"
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={stroke.opacity}
                style={{
                  mixBlendMode: stroke.type === 'highlighter' ? 'screen' : 'normal',
                }}
              />
            </g>
          );
        })}

        {/* Render Current Active Stroke Being Drawn */}
        {isDrawing && activePathD && (
          <path
            d={activePathD}
            fill="none"
            stroke={activeColor}
            strokeWidth={mode === 'highlighter' ? Math.max(activeWidth * 3.5, 18) : activeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={mode === 'highlighter' ? 0.35 : activeOpacity / 100}
            style={{
              mixBlendMode: mode === 'highlighter' ? 'screen' : 'normal',
            }}
          />
        )}
      </g>
    </svg>
  );
}
