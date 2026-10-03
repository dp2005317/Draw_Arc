import { Node, Edge } from 'reactflow';
import { DrawingStroke } from './collaboration';

export interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: string;
  strokeWidth: number;
  strokeStyle: string;
  roughness: number;
  opacity: number;
  groupIds: string[];
  frameId: string | null;
  roundness: { type: number } | null;
  seed: number;
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  boundElements: { id: string; type: string }[] | null;
  updated: number;
  link: string | null;
  locked: boolean;
  [key: string]: unknown;
}

const COLOR_MAP: Record<string, { stroke: string; bg: string }> = {
  client: { stroke: '#3b82f6', bg: '#1d4ed830' },
  gateway: { stroke: '#a855f7', bg: '#7e22ce30' },
  service: { stroke: '#10b981', bg: '#04785730' },
  db: { stroke: '#f43f5e', bg: '#be123c30' },
  cache: { stroke: '#f59e0b', bg: '#b4530930' },
  queue: { stroke: '#f97316', bg: '#c2410c30' },
  storage: { stroke: '#06b6d4', bg: '#0e749030' },
  loadbalancer: { stroke: '#6366f1', bg: '#4338ca30' },
  load_balancer: { stroke: '#6366f1', bg: '#4338ca30' },
  cloud: { stroke: '#0ea5e9', bg: '#0369a130' },
};

function generateSeed(): number {
  return Math.floor(Math.random() * 2000000000);
}

export function exportToExcalidraw(nodes: Node[], edges: Edge[], drawings: DrawingStroke[] = []) {
  if (nodes.length === 0 && drawings.length === 0) return null;

  const elements: ExcalidrawElement[] = [];
  const nodePositionMap = new Map<string, { x: number; y: number; width: number; height: number }>();

  // 1. Convert Nodes to Excalidraw Elements
  nodes.forEach((node) => {
    const width = Number(node.style?.width) || 200;
    const height = Number(node.style?.height) || 75;
    const x = node.position.x;
    const y = node.position.y;
    nodePositionMap.set(node.id, { x, y, width, height });

    const groupId = `group-${node.id}`;
    const nodeType = node.data?.type || 'service';
    const label = node.data?.label || node.data?.text || 'Node';
    const colors = COLOR_MAP[nodeType] || { stroke: node.data?.strokeColor || '#6366f1', bg: node.data?.color || '#312e8130' };

    let excalidrawType = 'rectangle';
    let roundness: { type: number } | null = { type: 3 };

    if (node.type === 'shape') {
      const shape = node.data?.shape;
      if (shape === 'circle') {
        excalidrawType = 'ellipse';
        roundness = null;
      } else if (shape === 'diamond') {
        excalidrawType = 'diamond';
        roundness = null;
      }
    } else if (node.type === 'text') {
      excalidrawType = 'text';
    } else if (node.type === 'sticky') {
      excalidrawType = 'rectangle';
      roundness = { type: 2 };
    }

    if (excalidrawType !== 'text') {
      // Shape element
      const shapeElement: ExcalidrawElement = {
        id: node.id,
        type: excalidrawType,
        x,
        y,
        width,
        height,
        angle: 0,
        strokeColor: colors.stroke,
        backgroundColor: colors.bg,
        fillStyle: 'solid',
        strokeWidth: node.data?.strokeWidth || 2,
        strokeStyle: 'solid',
        roughness: 1,
        opacity: node.data?.opacity || 100,
        groupIds: [groupId],
        frameId: null,
        roundness,
        seed: generateSeed(),
        version: 1,
        versionNonce: generateSeed(),
        isDeleted: false,
        boundElements: [{ id: `text-${node.id}`, type: 'text' }],
        updated: Date.now(),
        link: null,
        locked: Boolean(node.data?.isLocked),
      };
      elements.push(shapeElement);

      // Label inside shape
      const textElement: ExcalidrawElement = {
        id: `text-${node.id}`,
        type: 'text',
        x: x + 10,
        y: y + height / 2 - 12,
        width: width - 20,
        height: 24,
        angle: 0,
        strokeColor: '#f3f4f6',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 1,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        groupIds: [groupId],
        frameId: null,
        roundness: null,
        seed: generateSeed(),
        version: 1,
        versionNonce: generateSeed(),
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false,
        text: label,
        fontSize: 14,
        fontFamily: 1, // Virgil hand-drawn font
        textAlign: 'center',
        verticalAlign: 'middle',
        baseline: 14,
        containerId: node.id,
        originalText: label,
        lineHeight: 1.25,
      };
      elements.push(textElement);
    } else {
      // Standalone text note
      const textElement: ExcalidrawElement = {
        id: node.id,
        type: 'text',
        x,
        y,
        width: Math.max(120, label.length * 9),
        height: 30,
        angle: 0,
        strokeColor: '#f3f4f6',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 1,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        groupIds: [],
        frameId: null,
        roundness: null,
        seed: generateSeed(),
        version: 1,
        versionNonce: generateSeed(),
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false,
        text: label,
        fontSize: 16,
        fontFamily: 1,
        textAlign: 'center',
        verticalAlign: 'middle',
        baseline: 16,
        containerId: null,
        originalText: label,
        lineHeight: 1.25,
      };
      elements.push(textElement);
    }
  });

  // 2. Convert Edges to Excalidraw Arrows
  edges.forEach((edge, index) => {
    const source = nodePositionMap.get(edge.source);
    const target = nodePositionMap.get(edge.target);

    if (!source || !target) return;

    const startX = source.x + source.width / 2;
    const startY = source.y + source.height;
    const endX = target.x + target.width / 2;
    const endY = target.y;

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const arrowId = edge.id || `arrow-${index}`;

    const arrowElement: ExcalidrawElement = {
      id: arrowId,
      type: 'arrow',
      x: startX,
      y: startY,
      width: Math.abs(deltaX) || 1,
      height: Math.abs(deltaY) || 1,
      angle: 0,
      strokeColor: '#818cf8',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 2,
      strokeStyle: edge.animated ? 'dashed' : 'solid',
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: { type: 2 },
      seed: generateSeed(),
      version: 1,
      versionNonce: generateSeed(),
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
      points: [
        [0, 0],
        [deltaX / 2, deltaY / 2],
        [deltaX, deltaY],
      ],
      lastCommittedPoint: null,
      startBinding: {
        elementId: edge.source,
        focus: 0,
        gap: 8,
      },
      endBinding: {
        elementId: edge.target,
        focus: 0,
        gap: 8,
      },
      startArrowhead: null,
      endArrowhead: 'arrow',
    };

    elements.push(arrowElement);
  });

  // 3. Convert Freehand Drawing Strokes to Excalidraw freedraw elements
  drawings.forEach((drawing) => {
    if (!drawing.points || drawing.points.length === 0) return;

    const minX = Math.min(...drawing.points.map((p) => p.x));
    const minY = Math.min(...drawing.points.map((p) => p.y));
    const maxX = Math.max(...drawing.points.map((p) => p.x));
    const maxY = Math.max(...drawing.points.map((p) => p.y));

    const relPoints = drawing.points.map((p) => [p.x - minX, p.y - minY]);

    const freedrawElement: ExcalidrawElement = {
      id: drawing.id,
      type: 'freedraw',
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      angle: 0,
      strokeColor: drawing.color,
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: drawing.width,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: Math.round(drawing.opacity * 100),
      groupIds: [],
      frameId: null,
      roundness: null,
      seed: generateSeed(),
      version: 1,
      versionNonce: generateSeed(),
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: Boolean(drawing.isLocked),
      points: relPoints,
      pressures: [],
      simulatePressure: true,
      lastCommittedPoint: null,
    };

    elements.push(freedrawElement);
  });

  const excalidrawScene = {
    type: 'excalidraw',
    version: 2,
    source: 'https://drawarc.vercel.app',
    elements,
    appState: {
      gridSize: null,
      viewBackgroundColor: '#121212',
    },
    files: {},
  };

  return excalidrawScene;
}

export function downloadExcalidrawFile(
  nodes: Node[],
  edges: Edge[],
  drawings: DrawingStroke[] = [],
  filename = 'drawarc-architecture.excalidraw'
) {
  const scene = exportToExcalidraw(nodes, edges, drawings);
  if (!scene) return false;

  const jsonString = JSON.stringify(scene, null, 2);
  const blob = new Blob([jsonString], { type: 'application/vnd.excalidraw+json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
