'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
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

import NextImage from 'next/image';
import CustomNode from './nodes/CustomNode';
import GenericNode from './nodes/GenericNode';
import TextNode from './nodes/TextNode';
import Sidebar from './Sidebar';
import Toolbar, { InteractionMode } from './Toolbar';
import { getLayoutedElements } from '@/lib/layout';
import { downloadExcalidrawFile } from '@/lib/excalidraw';
import { 
  Loader2, 
  Sparkles, 
  PanelLeft, 
  LayoutGrid, 
  Trash2, 
  Image as ImageIcon,
  FileDown,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRightLeft,
  PenTool
} from 'lucide-react';

const nodeTypes = {
  custom: CustomNode,
  shape: GenericNode,
  text: TextNode,
};

const PRESET_PROMPTS = [
  { label: '🛒 E-Commerce Store', prompt: 'Design scalable multi-tenant e-commerce platform with order processing and inventory' },
  { label: '📸 Social Feed (Instagram)', prompt: 'Design Instagram clone microservices with newsfeed, media upload, and caching' },
  { label: '💬 WebSocket Chat', prompt: 'Design real-time chat architecture with WebSockets, presence cluster, and Kafka' },
  { label: '🎬 Video Streaming', prompt: 'Design Netflix-scale video streaming architecture with transcoding and edge CDN' },
  { label: '💳 Payment Gateway', prompt: 'Design high-availability Stripe-like payment processing architecture with idempotency' },
];

export default function DiagramCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('pan');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Auto-dismiss toast notification
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const onConnect = useCallback(
    (params: Connection | Edge) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 },
            labelStyle: { fill: '#ffffff', fontWeight: 600, fontSize: 11 },
            labelBgStyle: { fill: '#171717', color: '#fff', fillOpacity: 0.95 },
            labelBgPadding: [6, 4] as [number, number],
            labelBgBorderRadius: 6,
          },
          eds
        )
      ),
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
      showToast(`Added ${label}`, 'info');
    },
    [reactFlowInstance, setNodes]
  );

  // Tap-to-add for mobile touch devices and rapid addition
  const handleAddNodeFromSidebar = (type: string, label: string) => {
    if (!reactFlowInstance || !reactFlowWrapper.current) return;
    
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    // Place around the center with slight offset
    const jitterX = (Math.random() - 0.5) * 80;
    const jitterY = (Math.random() - 0.5) * 80;

    const position = reactFlowInstance.project({
      x: bounds.width / 2 + jitterX,
      y: bounds.height / 2 + jitterY,
    });

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position,
      data: { label, type },
    };

    setNodes((nds) => nds.concat(newNode));
    showToast(`Added ${label}`, 'info');

    // On mobile screens, auto-close sidebar after adding
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const applyLayout = useCallback(
    (currentNodes: Node[], currentEdges: Edge[], direction: 'TB' | 'LR' = layoutDirection) => {
      if (currentNodes.length === 0) return;
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        currentNodes,
        currentEdges,
        direction
      );
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);

      // Center viewport on new layout
      setTimeout(() => {
        reactFlowInstance?.fitView({ padding: 0.2, duration: 400 });
      }, 50);
    },
    [layoutDirection, reactFlowInstance, setNodes, setEdges]
  );

  const toggleLayoutDirection = () => {
    const nextDir = layoutDirection === 'TB' ? 'LR' : 'TB';
    setLayoutDirection(nextDir);
    applyLayout(nodes, edges, nextDir);
    showToast(`Auto-layout set to ${nextDir === 'TB' ? 'Top-to-Bottom' : 'Left-to-Right'}`, 'info');
  };

  const handleGenerate = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const query = customPrompt || prompt;
    if (!query.trim()) return;

    setIsLoading(true);
    showToast('Synthesizing production architecture with Mistral AI...', 'info');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate diagram');
      }

      if (!data.nodes || !data.edges) {
        throw new Error('Invalid architecture response schema');
      }

interface ApiNode {
  id: string;
  type?: string;
  data: {
    label: string;
    type: string;
  };
}

interface ApiEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

      const newNodes = (data.nodes as ApiNode[]).map((node) => ({
        ...node,
        position: { x: 0, y: 0 },
      }));

      const newEdges = (data.edges as ApiEdge[]).map((edge) => ({
        ...edge,
        type: 'smoothstep',
        animated: edge.animated ?? true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        labelStyle: { fill: '#ffffff', fontWeight: 600, fontSize: 11 },
        labelBgStyle: { fill: '#171717', color: '#fff', fillOpacity: 0.95 },
        labelBgPadding: [6, 4] as [number, number],
        labelBgBorderRadius: 6,
      }));

      applyLayout(newNodes, newEdges, layoutDirection);
      if (!customPrompt) setPrompt('');
      showToast(`Generated architecture with ${newNodes.length} services!`, 'success');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Generation failed. Please try again.';
      console.error('Architecture generation error:', err);
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = useCallback(async () => {
    if (nodes.length === 0) return;
    setIsExporting(true);
    showToast('Rendering high-resolution PDF...', 'info');

    try {
      const el = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!el) throw new Error('Canvas viewport not found');

      const dataUrl = await toPng(el, {
        backgroundColor: '#0a0a0a',
        quality: 1,
        pixelRatio: 2,
      });

      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const pdfWidth = img.width;
        const pdfHeight = img.height;
        const orientation = pdfWidth > pdfHeight ? 'l' : 'p';

        const pdf = new jsPDF({
          orientation,
          unit: 'px',
          format: [pdfWidth, pdfHeight],
        });

        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('drawarc-architecture.pdf');
        showToast('PDF exported successfully!', 'success');
        setIsExporting(false);
      };
    } catch (err) {
      console.error('Failed to export PDF', err);
      showToast('Failed to export PDF', 'error');
      setIsExporting(false);
    }
  }, [nodes]);

  const handleDownloadPng = useCallback(async () => {
    if (nodes.length === 0) return;
    setIsExporting(true);
    showToast('Rendering PNG image...', 'info');

    try {
      const el = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!el) throw new Error('Canvas viewport not found');

      const dataUrl = await toPng(el, {
        backgroundColor: '#0a0a0a',
        quality: 1,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = 'drawarc-architecture.png';
      link.href = dataUrl;
      link.click();

      showToast('PNG image exported successfully!', 'success');
    } catch (err) {
      console.error('Failed to export PNG', err);
      showToast('Failed to export PNG', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [nodes]);

  const handleDownloadExcalidraw = useCallback(() => {
    if (nodes.length === 0) return;
    const success = downloadExcalidrawFile(nodes, edges);
    if (success) {
      showToast('Exported to Excalidraw (.excalidraw)! Open in excalidraw.com', 'success');
    } else {
      showToast('Failed to export to Excalidraw', 'error');
    }
  }, [nodes, edges]);

  const handleClearCanvas = () => {
    if (nodes.length === 0) return;
    if (window.confirm('Are you sure you want to clear the canvas?')) {
      setNodes([]);
      setEdges([]);
      showToast('Canvas cleared', 'info');
    }
  };

  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-full bg-neutral-950 text-neutral-100 overflow-hidden font-sans relative select-none">
        
        {/* Floating Toast Notification */}
        {toast && (
          <div 
            className={`fixed top-24 md:top-20 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl backdrop-blur-xl border shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 text-xs font-medium ${
              toast.type === 'error' 
                ? 'bg-rose-950/90 text-rose-200 border-rose-800/60 shadow-rose-950/50' 
                : toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800/60 shadow-emerald-950/50'
                : 'bg-neutral-900/90 text-neutral-200 border-neutral-800 shadow-black/50'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="ml-2 p-0.5 rounded-md hover:bg-white/10 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Component Palette Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          onAddNode={handleAddNodeFromSidebar}
        />

        {/* Bottom Interactive Toolbar */}
        <Toolbar mode={interactionMode} setMode={setInteractionMode} />

        {/* Top Floating App Bar & AI Prompt */}
        <header className="absolute top-0 left-0 right-0 z-30 p-2 md:p-3 pointer-events-none flex flex-col items-center gap-2">
          
          <div className="w-full max-w-6xl flex items-center justify-between gap-2 pointer-events-auto">
            
            {/* Left Brand & Palette Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 rounded-xl backdrop-blur-xl border transition-all flex items-center gap-1.5 shadow-lg ${
                  isSidebarOpen 
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30' 
                    : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border-neutral-800 hover:text-white'
                }`}
                title="Toggle Components Palette"
                aria-label="Toggle Components Palette"
              >
                <PanelLeft className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-semibold">Components</span>
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 shadow-lg">
                <NextImage 
                  src="/logo.png" 
                  alt="DrawArc Logo" 
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain brightness-0 invert" 
                />
                <span className="font-bold text-xs tracking-tight text-white hidden sm:inline">DrawArc</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  AI Studio
                </span>
              </div>
            </div>

            {/* Center: AI Generation Form */}
            <form 
              onSubmit={(e) => handleGenerate(e)} 
              className="flex-1 max-w-xl flex items-center bg-neutral-900/80 backdrop-blur-xl p-1 md:p-1.5 rounded-2xl border border-neutral-800 shadow-2xl transition-all focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20"
            >
              <div className="pl-2.5 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe system (e.g., Instagram clone, E-commerce, Uber backend)..."
                className="flex-1 bg-transparent border-none outline-none text-neutral-100 placeholder-neutral-500 px-2.5 py-1 text-xs md:text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-medium text-xs shadow-md shrink-0 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Designing...</span>
                  </>
                ) : (
                  <>
                    <span>Generate</span>
                  </>
                )}
              </button>
            </form>

            {/* Right: Quick Action Controls */}
            <div className="flex items-center gap-1.5">
              {/* Layout Re-alignment */}
              {nodes.length > 0 && (
                <>
                  <button
                    onClick={() => applyLayout(nodes, edges, layoutDirection)}
                    className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all shadow-lg"
                    title="Auto-reorganize layout"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleLayoutDirection}
                    className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all shadow-lg flex items-center gap-1"
                    title={`Switch Layout: currently ${layoutDirection === 'TB' ? 'Top-to-Bottom' : 'Left-to-Right'}`}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span className="text-[10px] font-mono font-bold hidden lg:inline">{layoutDirection}</span>
                  </button>

                  {/* Export Actions */}
                  <button
                    onClick={handleDownloadExcalidraw}
                    disabled={isExporting}
                    className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-amber-400 hover:text-amber-300 transition-all shadow-lg flex items-center gap-1.5 text-xs font-medium"
                    title="Export to Excalidraw format (.excalidraw) for editing in excalidraw.com"
                  >
                    <PenTool className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">Excalidraw</span>
                  </button>

                  <button
                    onClick={handleDownloadPng}
                    disabled={isExporting}
                    className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all shadow-lg hidden sm:flex items-center gap-1 text-xs"
                    title="Export as PNG image"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span className="hidden lg:inline">PNG</span>
                  </button>

                  <button
                    onClick={handleDownloadPdf}
                    disabled={isExporting}
                    className="px-2.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 text-xs font-medium"
                    title="Export as high-res PDF"
                  >
                    <FileDown className="w-4 h-4" />
                    <span className="hidden sm:inline">Export PDF</span>
                  </button>

                  <button
                    onClick={handleClearCanvas}
                    className="p-2 rounded-xl bg-neutral-900/80 hover:bg-rose-950/40 border border-neutral-800 hover:border-rose-800/50 text-neutral-400 hover:text-rose-400 transition-all shadow-lg"
                    title="Clear Canvas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

          </div>

          {/* Preset Chips (Visible when canvas is empty or collapsed) */}
          {nodes.length === 0 && (
            <div className="w-full max-w-4xl flex items-center justify-center gap-1.5 overflow-x-auto py-1 px-2 pointer-events-auto custom-scrollbar">
              <span className="text-[11px] text-neutral-500 font-medium whitespace-nowrap mr-1 hidden sm:inline">
                Suggested Architectures:
              </span>
              {PRESET_PROMPTS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setPrompt(preset.prompt);
                    handleGenerate(undefined, preset.prompt);
                  }}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800/80 hover:border-neutral-700 text-neutral-300 hover:text-white text-[11px] font-medium whitespace-nowrap transition-all shadow-md active:scale-95"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

        </header>

        {/* Main Canvas Area */}
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
                    data: { text: 'Double click to edit note' },
                  };
                  setNodes((nds) => nds.concat(newNode));
                } else {
                  const newNode: Node = {
                    id: `shape-${Date.now()}`,
                    type: 'shape',
                    position,
                    data: { shape: interactionMode, label: '' },
                    style: { width: 110, height: 110 },
                  };
                  setNodes((nds) => nds.concat(newNode));
                }
                setInteractionMode('select');
                showToast(`Created ${interactionMode} element`, 'info');
              }
            }}
            onNodeClick={(_, node) => {
              if (interactionMode === 'eraser') {
                setNodes((nds) => nds.filter((n) => n.id !== node.id));
                setEdges((eds) => eds.filter((e) => e.source !== node.id && e.target !== node.id));
                showToast('Node removed', 'info');
              }
            }}
            onEdgeClick={(_, edge) => {
              if (interactionMode === 'eraser') {
                setEdges((eds) => eds.filter((e) => e.id !== edge.id));
                showToast('Connection removed', 'info');
              }
            }}
            panOnDrag={interactionMode === 'pan'}
            selectionOnDrag={interactionMode === 'select'}
            panOnScroll={interactionMode === 'select' || interactionMode === 'eraser'}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.08}
            maxZoom={2.5}
            deleteKeyCode={['Backspace', 'Delete']}
            className="bg-dot-pattern"
          >
            <Background color="#262626" gap={18} />
            <Controls className="!bg-neutral-900 !border-neutral-800 !rounded-xl !overflow-hidden !shadow-2xl fill-neutral-300" />
            
            {/* Bottom-right Status Badge */}
            <Panel position="bottom-right" className="text-neutral-500 text-[11px] p-2 flex items-center gap-2 pointer-events-none">
              <span className="hidden sm:inline">DrawArc Principal Architect · Powered by Mistral AI</span>
              {nodes.length > 0 && (
                <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-md text-neutral-400 font-mono text-[10px]">
                  {nodes.length} nodes · {edges.length} edges
                </span>
              )}
            </Panel>
          </ReactFlow>
        </div>

      </div>
    </ReactFlowProvider>
  );
}
