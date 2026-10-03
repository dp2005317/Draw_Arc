'use client';

import React from 'react';
import { useViewport } from 'reactflow';
import { Collaborator } from '@/lib/collaboration';
import { MousePointer2 } from 'lucide-react';

interface LiveCursorsProps {
  collaborators: Record<string, Collaborator>;
  currentUserId: string;
}

export default function LiveCursors({ collaborators, currentUserId }: LiveCursorsProps) {
  const { x, y, zoom } = useViewport();

  const remoteUsers = Object.values(collaborators).filter(
    (col) => col.id !== currentUserId && col.cursor !== null
  );

  if (remoteUsers.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {remoteUsers.map((user) => {
        if (!user.cursor) return null;
        // Project canvas coordinate to screen coordinate
        const screenX = user.cursor.x * zoom + x;
        const screenY = user.cursor.y * zoom + y;

        return (
          <div
            key={user.id}
            className="absolute transition-all duration-75 ease-out flex items-start gap-1"
            style={{
              transform: `translate3d(${screenX}px, ${screenY}px, 0)`,
            }}
          >
            {/* Colored Arrow Pointer */}
            <MousePointer2
              className="w-4 h-4 drop-shadow-md -rotate-45"
              style={{
                color: user.color,
                fill: user.color,
              }}
            />

            {/* User Name Pill */}
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white shadow-lg whitespace-nowrap -mt-1 ml-0.5"
              style={{
                backgroundColor: user.color,
              }}
            >
              {user.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
