import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';

const nodeWidth = 220;
const nodeHeight = 85;

export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
) => {
  if (nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Create a new dagre graph instance on every layout execution to avoid stale graph state
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 60,
    ranksep: 80,
    marginx: 40,
    marginy: 40
  });

  const isHorizontal = direction === 'LR';

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    // Only set edges where both source and target exist in the graph
    if (nodes.some(n => n.id === edge.source) && nodes.some(n => n.id === edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    if (nodeWithPosition) {
      node.targetPosition = isHorizontal ? Position.Left : Position.Top;
      node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

      // Adjust from dagre center-point to React Flow top-left anchor
      node.position = {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      };
    }

    return node;
  });

  return { nodes: layoutedNodes, edges };
};
