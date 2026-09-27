import { Node, Edge } from 'reactflow';

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

export function exportToExcalidraw(nodes: Node[], edges: Edge[]) {
  if (nodes.length === 0) return null;

  const elements: ExcalidrawElement[] = [];
  const nodePositionMap = new Map<string, { x: number; y: number; width: number; height: number }>();

  // 1. Convert Nodes to Excalidraw Elements (Rectangles / Shapes + Embedded Text)
  nodes.forEach((node) => {
    const width = Number(node.style?.width) || 200;
    const height = Number(node.style?.height) || 75;
    const x = node.position.x;
    const y = node.position.y;
    nodePositionMap.set(node.id, { x, y, width, height });

    const groupId = `group-${node.id}`;
    const nodeType = node.data?.type || 'service';
    const label = node.data?.label || node.data?.text || 'Service Node';
    const colors = COLOR_MAP[nodeType] || { stroke: '#6366f1', bg: '#312e8130' };

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
    }

    if (excalidrawType !== 'text') {
      // Create the container shape element
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
        strokeWidth: 2,
        strokeStyle: 'solid',
        roughness: 1,
        opacity: 100,
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
        locked: false,
      };
      elements.push(shapeElement);

      // Create text label inside the shape
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
      // Pure text note
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

    // Connect from center/bottom of source to center/top of target
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

    // Optional Edge Label (e.g. 'HTTPS', 'gRPC', 'Read/Write')
    if (edge.label && typeof edge.label === 'string') {
      const midX = startX + deltaX / 2 - 25;
      const midY = startY + deltaY / 2 - 12;

      const labelElement: ExcalidrawElement = {
        id: `label-${arrowId}`,
        type: 'text',
        x: midX,
        y: midY,
        width: Math.max(50, edge.label.length * 8),
        height: 20,
        angle: 0,
        strokeColor: '#cbd5e1',
        backgroundColor: '#18181b',
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
        text: edge.label,
        fontSize: 12,
        fontFamily: 1,
        textAlign: 'center',
        verticalAlign: 'middle',
        baseline: 12,
        containerId: null,
        originalText: edge.label,
        lineHeight: 1.25,
      };

      elements.push(labelElement);
    }
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

export function downloadExcalidrawFile(nodes: Node[], edges: Edge[], filename = 'drawarc-architecture.excalidraw') {
  const scene = exportToExcalidraw(nodes, edges);
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
