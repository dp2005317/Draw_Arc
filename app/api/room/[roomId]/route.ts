import { NextRequest, NextResponse } from 'next/server';
import { RoomData, Collaborator } from '@/lib/collaboration';

// In-memory room store for serverless and edge environments
// Note: In long-lived or multi-region setups, rooms persist in memory and are synced across active peers
const roomStore = new Map<string, RoomData>();

// Cleanup stale rooms periodically (older than 24 hours)
const MAX_ROOM_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_PAYLOAD_NODES = 500;
const MAX_PAYLOAD_DRAWINGS = 2000;

function cleanStaleRooms() {
  const now = Date.now();
  for (const [id, room] of roomStore.entries()) {
    if (now - room.updatedAt > MAX_ROOM_AGE_MS) {
      roomStore.delete(id);
    }
  }
}

interface RouteContext {
  params: Promise<{ roomId: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { roomId } = await context.params;

    // Validate room ID format for security
    if (!roomId || !/^[a-zA-Z0-9_-]{3,64}$/.test(roomId)) {
      return NextResponse.json({ error: 'Invalid room identifier format.' }, { status: 400 });
    }

    cleanStaleRooms();

    const room = roomStore.get(roomId);
    if (!room) {
      return NextResponse.json({
        id: roomId,
        nodes: [],
        edges: [],
        drawings: [],
        collaborators: {},
        version: 0,
        updatedAt: Date.now(),
      });
    }

    // Filter out inactive collaborators (inactive > 30 seconds)
    const now = Date.now();
    const activeCollaborators: Record<string, Collaborator> = {};
    for (const [userId, col] of Object.entries(room.collaborators || {})) {
      if (now - col.lastActive < 30000) {
        activeCollaborators[userId] = col;
      }
    }

    return NextResponse.json({
      ...room,
      collaborators: activeCollaborators,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { roomId } = await context.params;

    if (!roomId || !/^[a-zA-Z0-9_-]{3,64}$/.test(roomId)) {
      return NextResponse.json({ error: 'Invalid room identifier format.' }, { status: 400 });
    }

    const body = await req.json();
    const { nodes, edges, drawings, collaborator, version } = body;

    // Security bounds check
    if (nodes && Array.isArray(nodes) && nodes.length > MAX_PAYLOAD_NODES) {
      return NextResponse.json({ error: 'Exceeded maximum permitted node count' }, { status: 413 });
    }

    if (drawings && Array.isArray(drawings) && drawings.length > MAX_PAYLOAD_DRAWINGS) {
      return NextResponse.json({ error: 'Exceeded maximum permitted drawing count' }, { status: 413 });
    }

    const now = Date.now();
    let currentRoom = roomStore.get(roomId);

    if (!currentRoom) {
      currentRoom = {
        id: roomId,
        nodes: Array.isArray(nodes) ? nodes : [],
        edges: Array.isArray(edges) ? edges : [],
        drawings: Array.isArray(drawings) ? drawings : [],
        collaborators: {},
        version: version || 1,
        updatedAt: now,
      };
    } else {
      if (Array.isArray(nodes)) currentRoom.nodes = nodes;
      if (Array.isArray(edges)) currentRoom.edges = edges;
      if (Array.isArray(drawings)) currentRoom.drawings = drawings;
      currentRoom.version = (currentRoom.version || 0) + 1;
      currentRoom.updatedAt = now;
    }

    // Update active collaborator presence & cursor
    if (collaborator && collaborator.id) {
      currentRoom.collaborators[collaborator.id] = {
        ...collaborator,
        lastActive: now,
      };
    }

    // Clean up inactive users (> 30s)
    for (const [userId, col] of Object.entries(currentRoom.collaborators)) {
      if (now - col.lastActive > 30000) {
        delete currentRoom.collaborators[userId];
      }
    }

    roomStore.set(roomId, currentRoom);

    return NextResponse.json({
      success: true,
      version: currentRoom.version,
      collaborators: currentRoom.collaborators,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
