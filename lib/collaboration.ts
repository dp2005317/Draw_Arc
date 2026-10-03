import { Node, Edge } from 'reactflow';

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  type: 'pen' | 'highlighter' | 'pencil';
  points: DrawingPoint[];
  color: string;
  width: number;
  opacity: number;
  zIndex: number;
  isLocked?: boolean;
  isHidden?: boolean;
  createdAt: number;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
  lastActive: number;
}

export interface RoomData {
  id: string;
  nodes: Node[];
  edges: Edge[];
  drawings: DrawingStroke[];
  collaborators: Record<string, Collaborator>;
  version: number;
  updatedAt: number;
}

const COLLABORATOR_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
  '#14b8a6', // Teal
];

const COLLABORATOR_NAMES = [
  'Creative Fox',
  'Swift Architect',
  'Curious Owl',
  'Cosmic Falcon',
  'Bright Otter',
  'Wise Lynx',
  'Agile Hawk',
  'Stellar Bear',
];

export function generateRoomId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let id = 'arc-';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export function getRandomCollaborator(): { id: string; name: string; color: string } {
  const randNum = Math.floor(Math.random() * 1000);
  const color = COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];
  const name = COLLABORATOR_NAMES[Math.floor(Math.random() * COLLABORATOR_NAMES.length)];
  return {
    id: `user-${Date.now()}-${randNum}`,
    name,
    color,
  };
}

export function getShareableUrl(roomId: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('room', roomId);
  return url.toString();
}

/**
 * Creates smooth SVG path data from an array of 2D points using Catmull-Rom or Quadratic Bezier interpolation
 */
export function getSvgPathFromPoints(points: DrawingPoint[]): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  if (points.length === 2) {
    path += ` L ${points[1].x} ${points[1].y}`;
    return path;
  }

  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    path += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
  }

  const last = points[points.length - 1];
  const secondLast = points[points.length - 2];
  path += ` Q ${secondLast.x} ${secondLast.y}, ${last.x} ${last.y}`;

  return path;
}
