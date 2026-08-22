'use client';

import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  Edge,
  Node,
  ReactFlowProvider,
  ReactFlowInstance,
  Connection,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

import CustomNode from './nodes/CustomNode';
import GenericNode from './nodes/GenericNode';
import TextNode from './nodes/TextNode';
import Sidebar from './Sidebar';
import Toolbar, { InteractionMode } from './Toolbar';
import { getLayoutedElements } from '@/lib/layout';
import { Loader2, Send, Download } from 'lucide-react';

const nodeTypes = {
  custom: CustomNode,
  shape: GenericNode,
  text: TextNode,
};

export default function DiagramCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('pan');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true, style: { stroke: '#4f46e5', strokeWidth: 2 }, labelStyle: { fill: '#ffffff', fontWeight: 600, fontSize: 12 }, labelBgStyle: { fill: '#1f2937', color: '#fff', fillOpacity: 1 }, labelBgPadding: [8, 4], labelBgBorderRadius: 4 }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const dataString = event.dataTransfer.getData('application/reactflow');
      
      if (!dataString || !reactFlowBounds || !reactFlowInstance) return;

      const { type, label } = JSON.parse(dataString);

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position,
        data: { label, type },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onLayout = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        currentNodes,
        currentEdges
      );
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    },
    [setNodes, setEdges]
  );

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      
      if (data.error) {
        alert('Error: ' + data.error);
        return;
      }

      const newNodes = data.nodes.map((node: any) => ({
        ...node,
        position: { x: 0, y: 0 },
      }));
      
      const newEdges = data.edges.map((edge: any) => ({
        ...edge,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#4f46e5', strokeWidth: 2 },
        labelStyle: { fill: '#ffffff', fontWeight: 600, fontSize: 12 },
        labelBgStyle: { fill: '#1f2937', color: '#fff', fillOpacity: 1 },
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 4,
      }));

      onLayout(newNodes, newEdges);
      setPrompt('');
    } catch (err) {
      console.error(err);
      alert('Failed to generate diagram. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = useCallback(() => {
    if (nodes.length === 0) return;
    
    // Target the react-flow viewport to get the whole diagram
    const el = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!el) return;

    toPng(el, { 
      backgroundColor: '#0a0a0a',
      quality: 1,
      pixelRatio: 2, // High resolution for PDF
    })
      .then((dataUrl) => {
        // Create an image to get the actual dimensions
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          // Calculate PDF size based on image dimensions to perfectly fit the architecture
          const pdfWidth = img.width;
          const pdfHeight = img.height;
          
          // Determine orientation based on aspect ratio
          const orientation = pdfWidth > pdfHeight ? 'l' : 'p';
          
          const pdf = new jsPDF({
            orientation,
            unit: 'px',
            format: [pdfWidth, pdfHeight]
          });
          
          pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save('architecture-diagram.pdf');
        };
      })
      .catch((err) => {
        console.error('Failed to download PDF', err);
        alert('Failed to generate PDF');
      });
  }, [nodes]);

  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-full bg-[#0a0a0a] text-white overflow-hidden font-sans relative">
        <Sidebar />
        <Toolbar mode={interactionMode} setMode={setInteractionMode} />
        
        <div className="absolute top-0 w-full p-4 z-10 flex justify-center pointer-events-none mt-2">
          <form 
            onSubmit={handleGenerate} 
            className="flex items-center space-x-2 bg-gray-900/80 backdrop-blur-md p-2 rounded-2xl border border-gray-800 shadow-2xl pointer-events-auto w-full max-w-3xl transition-all hover:bg-gray-900/90"
          >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Design scalable MERN deployment architecture"
            className="flex-1 bg-transparent border-none outline-none text-gray-100 placeholder-gray-500 px-4 py-2"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white p-3 rounded-xl transition-colors flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>

      <div className="flex-1 h-full w-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onPaneClick={(event) => {
            if (['rect', 'circle', 'diamond', 'text'].includes(interactionMode)) {
              const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
              if (!reactFlowBounds || !reactFlowInstance) return;
              
              const position = reactFlowInstance.project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
              });

              if (interactionMode === 'text') {
                const newNode: Node = {
                  id: `text-${Date.now()}`,
                  type: 'text',
                  position,
                  data: { text: 'New Text' },
                };
                setNodes((nds) => nds.concat(newNode));
              } else {
                const newNode: Node = {
                  id: `shape-${Date.now()}`,
                  type: 'shape',
                  position,
                  data: { shape: interactionMode, label: '' },
                  style: { width: 100, height: 100 },
                };
                setNodes((nds) => nds.concat(newNode));
              }
              setInteractionMode('select');
            }
          }}
          onNodeClick={(_, node) => {
            if (interactionMode === 'eraser') {
              setNodes((nds) => nds.filter((n) => n.id !== node.id));
            }
          }}
          onEdgeClick={(_, edge) => {
            if (interactionMode === 'eraser') {
              setEdges((eds) => eds.filter((e) => e.id !== edge.id));
            }
          }}
          panOnDrag={interactionMode === 'pan'}
          selectionOnDrag={interactionMode === 'select'}
          panOnScroll={interactionMode === 'select' || interactionMode === 'eraser'}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          deleteKeyCode={['Backspace', 'Delete']}
          className="bg-dot-pattern"
        >
          <Background color="#333" gap={16} />
          <Controls className="bg-gray-900 border-gray-800 fill-white" />
          <Panel position="top-right" className="p-4">
            {nodes.length > 0 && (
              <button
                onClick={handleDownloadPdf}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            )}
          </Panel>
          <Panel position="bottom-right" className="text-gray-500 text-xs p-2">
            ArchMind AI Generator
          </Panel>
        </ReactFlow>
      </div>
    </div>
  </ReactFlowProvider>
  );
}
