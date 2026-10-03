'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactFlow, {
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
import StickyNoteNode from './nodes/StickyNoteNode';
import Sidebar from './Sidebar';
import Toolbar, { InteractionMode } from './Toolbar';
import PropertyBar from './PropertyBar';
import LayersPanel from './LayersPanel';
import CanvasOverlayDrawing from './CanvasOverlayDrawing';
import LiveCursors from './LiveCursors';
import ShareModal from './ShareModal';

import { getLayoutedElements } from '@/lib/layout';
import { downloadExcalidrawFile } from '@/lib/excalidraw';
import { 
  DrawingStroke, 
  Collaborator, 
  generateRoomId, 
  getRandomCollaborator, 
  getShareableUrl 
} from '@/lib/collaboration';

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
  PenTool,
  Share2,
  Sun,
  Moon,
  Layers,
  Undo2,
  Redo2
} from 'lucide-react';

const nodeTypes = {
  custom: CustomNode,
  shape: GenericNode,
  text: TextNode,
  sticky: StickyNoteNode,
};

const PRESET_PROMPTS = [
  { label: '🛒 E-Commerce Store', prompt: 'Design scalable multi-tenant e-commerce platform with order processing and inventory' },
  { label: '📸 Social Feed (Instagram)', prompt: 'Design Instagram clone microservices with newsfeed, media upload, and caching' },
  { label: '💬 WebSocket Chat', prompt: 'Design real-time chat architecture with WebSockets, presence cluster, and Kafka' },
  { label: '🎬 Video Streaming', prompt: 'Design Netflix-scale video streaming architecture with transcoding and edge CDN' },
  { label: '💳 Payment Gateway', prompt: 'Design high-availability Stripe-like payment processing architecture with idempotency' },
];

interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
  drawings: DrawingStroke[];
}

function InnerDiagramCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [drawings, setDrawings] = useState<DrawingStroke[]>([]);
  const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);

  // Undo / Redo History
  const historyRef = useRef<HistorySnapshot[]>([{ nodes: [], edges: [], drawings: [] }]);
  const historyIndexRef = useRef<number>(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const isUndoRedoingRef = useRef(false);

  // Tools & Styling
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('pan');
  const [activeColor, setActiveColor] = useState<string>('#6366f1');
  const [activeWidth, setActiveWidth] = useState<number>(2);

  // UI Panels
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('drawarc-theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  // AI & Layout
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Multiplayer Collaboration State
  const [roomId, setRoomId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('room') || generateRoomId();
    }
    return 'arc-main';
  });

  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; color: string }>(() => {
    return getRandomCollaborator();
  });

  const shareUrl = useMemo(() => getShareableUrl(roomId), [roomId]);
  const [collaborators, setCollaborators] = useState<Record<string, Collaborator>>({});
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const lastSyncTimestampRef = useRef<number>(0);

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Synchronize document theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('drawarc-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    showToast(`Switched to ${nextTheme === 'light' ? 'Light Mode ☀️' : 'Dark Mode 🌙'}`, 'info');
  };

  // Toast Helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Push Snapshot to Undo History
  const pushToHistory = useCallback((newNodes: Node[], newEdges: Edge[], newDrawings: DrawingStroke[]) => {
    if (isUndoRedoingRef.current) return;

    const currentIdx = historyIndexRef.current;
    const newHistory = historyRef.current.slice(0, currentIdx + 1);

    newHistory.push({
      nodes: JSON.parse(JSON.stringify(newNodes)),
      edges: JSON.parse(JSON.stringify(newEdges)),
      drawings: JSON.parse(JSON.stringify(newDrawings)),
    });

    if (newHistory.length > 40) newHistory.shift();

    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  // Push local updates to remote room & BroadcastChannel
  const pushStateUpdate = useCallback(
    (newNodes = nodes, newEdges = edges, newDrawings = drawings, recordHistory = true) => {
      if (recordHistory) {
        pushToHistory(newNodes, newEdges, newDrawings);
      }

      const now = Date.now();
      lastSyncTimestampRef.current = now;

      // Broadcast to local tabs
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'SYNC_STATE',
          senderId: currentUser.id,
          nodes: newNodes,
          edges: newEdges,
          drawings: newDrawings,
        });
      }

      // Sync to Next.js API server
      if (roomId) {
        fetch(`/api/room/${roomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodes: newNodes,
            edges: newEdges,
            drawings: newDrawings,
            collaborator: {
              id: currentUser.id,
              name: currentUser.name,
              color: currentUser.color,
            },
          }),
        }).catch(() => {});
      }
    },
    [nodes, edges, drawings, currentUser, roomId, pushToHistory]
  );

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;

    isUndoRedoingRef.current = true;
    historyIndexRef.current -= 1;
    const snapshot = historyRef.current[historyIndexRef.current];

    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    setDrawings(snapshot.drawings);
    setSelectedStrokeId(null);

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);

    pushStateUpdate(snapshot.nodes, snapshot.edges, snapshot.drawings, false);
    showToast('Undo', 'info');

    setTimeout(() => {
      isUndoRedoingRef.current = false;
    }, 50);
  }, [pushStateUpdate, setNodes, setEdges, showToast]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;

    isUndoRedoingRef.current = true;
    historyIndexRef.current += 1;
    const snapshot = historyRef.current[historyIndexRef.current];

    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    setDrawings(snapshot.drawings);
    setSelectedStrokeId(null);

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);

    pushStateUpdate(snapshot.nodes, snapshot.edges, snapshot.drawings, false);
    showToast('Redo', 'info');

    setTimeout(() => {
      isUndoRedoingRef.current = false;
    }, 50);
  }, [pushStateUpdate, setNodes, setEdges, showToast]);

  // Universal Delete Action
  const handleDeleteSelected = useCallback(() => {
    const hasSelectedNodes = nodes.some((n) => n.selected);
    const hasSelectedEdges = edges.some((e) => e.selected);
    const hasSelectedStroke = selectedStrokeId !== null;

    if (!hasSelectedNodes && !hasSelectedEdges && !hasSelectedStroke) {
      showToast('Click an element first to delete it', 'info');
      return;
    }

    const updatedNodes = nodes.filter((n) => !n.selected);
    const updatedEdges = edges.filter((e) => {
      if (e.selected) return false;
      const sourceDeleted = nodes.some((n) => n.id === e.source && n.selected);
      const targetDeleted = nodes.some((n) => n.id === e.target && n.selected);
      return !sourceDeleted && !targetDeleted;
    });
    const updatedDrawings = drawings.filter((d) => d.id !== selectedStrokeId);

    setNodes(updatedNodes);
    setEdges(updatedEdges);
    setDrawings(updatedDrawings);
    setSelectedStrokeId(null);

    pushStateUpdate(updatedNodes, updatedEdges, updatedDrawings, true);
    showToast('Deleted item', 'info');
  }, [nodes, edges, drawings, selectedStrokeId, pushStateUpdate, setNodes, setEdges, showToast]);

  // Keyboard Shortcuts: Undo (Ctrl+Z), Redo (Ctrl+Y / Cmd+Shift+Z), Delete (Delete / Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || (activeEl as HTMLElement)?.isContentEditable;

      // Don't hijack keyboard shortcuts when user is typing in a text field
      if (isInput) return;

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z (without shift)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl+Y or Cmd+Shift+Z
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Tool shortcut keys
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'h') setInteractionMode('pan');
        else if (key === 'v') setInteractionMode('select');
        else if (key === 'p') setInteractionMode('pen');
        else if (key === 'b') setInteractionMode('highlighter');
        else if (key === 'r') setInteractionMode('rect');
        else if (key === 'c') setInteractionMode('circle');
        else if (key === 'd') setInteractionMode('diamond');
        else if (key === 's') setInteractionMode('sticky');
        else if (key === 't') setInteractionMode('text');
        else if (key === 'e') setInteractionMode('eraser');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelected, handleUndo, handleRedo]);

  // Room URL Synchronization & BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('room')) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('room', roomId);
      window.history.replaceState({}, '', newUrl.toString());
    }

    try {
      const channel = new BroadcastChannel(`drawarc-room-${roomId}`);
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        const data = event.data;
        if (!data || data.senderId === currentUser.id) return;

        if (data.type === 'SYNC_STATE') {
          if (data.nodes) setNodes(data.nodes);
          if (data.edges) setEdges(data.edges);
          if (data.drawings) setDrawings(data.drawings);
        } else if (data.type === 'CURSOR_MOVE') {
          setCollaborators((prev) => ({
            ...prev,
            [data.senderId]: {
              id: data.senderId,
              name: data.senderName,
              color: data.senderColor,
              cursor: data.cursor,
              lastActive: Date.now(),
            },
          }));
        }
      };
    } catch {
      // Fallback
    }

    return () => {
      broadcastChannelRef.current?.close();
    };
  }, [roomId, currentUser.id, setNodes, setEdges]);

  // Periodic Serverless Room Sync Polling
  useEffect(() => {
    if (!roomId) return;

    let isMounted = true;

    const syncWithServer = async () => {
      try {
        const res = await fetch(`/api/room/${roomId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();

        if (isMounted && data && data.updatedAt > lastSyncTimestampRef.current) {
          lastSyncTimestampRef.current = data.updatedAt;
          if (Array.isArray(data.nodes) && data.nodes.length > 0 && nodes.length === 0) {
            setNodes(data.nodes);
          }
          if (Array.isArray(data.edges) && data.edges.length > 0 && edges.length === 0) {
            setEdges(data.edges);
          }
          if (Array.isArray(data.drawings) && data.drawings.length > 0 && drawings.length === 0) {
            setDrawings(data.drawings);
          }
          if (data.collaborators) {
            setCollaborators(data.collaborators);
          }
        }
      } catch {
        // Silently tolerate transient offline/network pauses
      }
    };

    syncWithServer();
    const interval = setInterval(syncWithServer, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId, nodes.length, edges.length, drawings.length, setNodes, setEdges]);

  // Cursor Move Broadcast
  const handlePointerMoveCanvas = useCallback(
    (e: React.PointerEvent) => {
      if (!reactFlowInstance || !reactFlowWrapper.current) return;
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const canvasPt = reactFlowInstance.project({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'CURSOR_MOVE',
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderColor: currentUser.color,
          cursor: canvasPt,
        });
      }
    },
    [reactFlowInstance, currentUser]
  );

  // Connection Handler
  const onConnect = useCallback(
    (params: Connection | Edge) => {
      setEdges((eds) => {
        const nextEds = addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            style: { stroke: activeColor || '#6366f1', strokeWidth: 2 },
            labelStyle: { fill: theme === 'light' ? '#0f172a' : '#ffffff', fontWeight: 600, fontSize: 11 },
            labelBgStyle: { fill: theme === 'light' ? '#ffffff' : '#171717', fillOpacity: 0.95 },
            labelBgPadding: [6, 4] as [number, number],
            labelBgBorderRadius: 6,
          },
          eds
        );
        pushStateUpdate(nodes, nextEds, drawings, true);
        return nextEds;
      });
    },
    [setEdges, activeColor, theme, nodes, drawings, pushStateUpdate]
  );

  // Drag & Drop from Elements
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      const dataString = event.dataTransfer.getData('application/reactflow');
      if (!dataString || !bounds || !reactFlowInstance) return;

      const { type, label } = JSON.parse(dataString);
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position,
        data: { label, type },
      };

      const nextNodes = [...nodes, newNode];
      setNodes(nextNodes);
      pushStateUpdate(nextNodes, edges, drawings, true);
      showToast(`Added ${label}`, 'info');
    },
    [reactFlowInstance, nodes, edges, drawings, setNodes, pushStateUpdate, showToast]
  );

  // Add from Sidebar Handlers
  const handleAddNodeFromSidebar = (type: string, label: string) => {
    if (!reactFlowInstance || !reactFlowWrapper.current) return;
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.project({
      x: bounds.width / 2 + (Math.random() - 0.5) * 80,
      y: bounds.height / 2 + (Math.random() - 0.5) * 80,
    });

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position,
      data: { label, type },
    };

    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    pushStateUpdate(nextNodes, edges, drawings, true);
    showToast(`Added ${label}`, 'info');
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleAddShapeFromSidebar = (shape: string, label: string) => {
    if (!reactFlowInstance || !reactFlowWrapper.current) return;
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.project({
      x: bounds.width / 2 + (Math.random() - 0.5) * 80,
      y: bounds.height / 2 + (Math.random() - 0.5) * 80,
    });

    const newNode: Node = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      position,
      data: { 
        shape, 
        label, 
        color: theme === 'light' ? '#ffffff' : '#18181b',
        strokeColor: activeColor,
        strokeWidth: 2,
        strokeStyle: 'solid',
        opacity: 100
      },
      style: { width: 120, height: 120 },
    };

    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    pushStateUpdate(nextNodes, edges, drawings, true);
    showToast(`Added ${label}`, 'info');
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleAddStickyFromSidebar = (color: string) => {
    if (!reactFlowInstance || !reactFlowWrapper.current) return;
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.project({
      x: bounds.width / 2 + (Math.random() - 0.5) * 80,
      y: bounds.height / 2 + (Math.random() - 0.5) * 80,
    });

    const newNode: Node = {
      id: `sticky-${Date.now()}`,
      type: 'sticky',
      position,
      data: { color, text: 'New Note...', author: currentUser.name, isEditing: true },
      style: { width: 160, height: 140 },
    };

    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    pushStateUpdate(nextNodes, edges, drawings, true);
    showToast('Added Sticky Note', 'info');
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  // Direct Click to Add Shapes / Text / Stickies on Canvas
  const handlePaneClick = (event: React.MouseEvent) => {
    setSelectedStrokeId(null);

    if (['rect', 'rounded-rect', 'circle', 'diamond', 'triangle', 'star', 'sticky', 'text'].includes(interactionMode)) {
      if (!reactFlowWrapper.current || !reactFlowInstance) return;
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      let newNode: Node;

      if (interactionMode === 'text') {
        newNode = {
          id: `text-${Date.now()}`,
          type: 'text',
          position,
          data: { 
            text: 'Write something...', 
            isEditing: true, 
            fontSize: 20, 
            color: theme === 'light' ? '#0f172a' : '#f4f4f5' 
          },
          selected: true,
        };
      } else if (interactionMode === 'sticky') {
        newNode = {
          id: `sticky-${Date.now()}`,
          type: 'sticky',
          position,
          data: { color: 'yellow', text: 'New Note', author: currentUser.name, isEditing: true },
          style: { width: 160, height: 140 },
          selected: true,
        };
      } else {
        newNode = {
          id: `shape-${Date.now()}`,
          type: 'shape',
          position,
          data: { 
            shape: interactionMode, 
            label: '',
            color: theme === 'light' ? '#ffffff' : '#18181b',
            strokeColor: activeColor,
            strokeWidth: activeWidth,
            strokeStyle: 'solid',
            opacity: 100
          },
          style: { width: 110, height: 110 },
          selected: true,
        };
      }

      // Unselect existing nodes
      const nextNodes: Node[] = [...nodes.map((n) => ({ ...n, selected: false })), newNode];
      setNodes(nextNodes);
      pushStateUpdate(nextNodes, edges, drawings, true);
      setInteractionMode('select');
      showToast(`Created ${interactionMode} element`, 'info');
    }
  };

  // Auto Layout
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
      pushStateUpdate(layoutedNodes, layoutedEdges, drawings, true);

      setTimeout(() => {
        reactFlowInstance?.fitView({ padding: 0.2, duration: 400 });
      }, 50);
    },
    [layoutDirection, reactFlowInstance, setNodes, setEdges, drawings, pushStateUpdate]
  );

  const toggleLayoutDirection = () => {
    const nextDir = layoutDirection === 'TB' ? 'LR' : 'TB';
    setLayoutDirection(nextDir);
    applyLayout(nodes, edges, nextDir);
    showToast(`Layout set to ${nextDir === 'TB' ? 'Top-to-Bottom' : 'Left-to-Right'}`, 'info');
  };

  // AI Generator
  const handleGenerate = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const query = customPrompt || prompt;
    if (!query.trim()) return;

    setIsLoading(true);
    showToast('Synthesizing production architecture with AI...', 'info');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to generate diagram');
      if (!data.nodes || !data.edges) throw new Error('Invalid architecture schema returned');

      interface ApiNode {
        id: string;
        type?: string;
        data: { label: string; type: string };
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
        style: { stroke: activeColor || '#6366f1', strokeWidth: 2 },
        labelStyle: { fill: theme === 'light' ? '#0f172a' : '#ffffff', fontWeight: 600, fontSize: 11 },
        labelBgStyle: { fill: theme === 'light' ? '#ffffff' : '#171717', fillOpacity: 0.95 },
        labelBgPadding: [6, 4] as [number, number],
        labelBgBorderRadius: 6,
      }));

      applyLayout(newNodes, newEdges, layoutDirection);
      if (!customPrompt) setPrompt('');
      showToast(`Generated architecture with ${newNodes.length} services!`, 'success');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Generation failed. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Export Handlers
  const handleDownloadPdf = useCallback(async () => {
    if (nodes.length === 0 && drawings.length === 0) return;
    setIsExporting(true);
    showToast('Rendering high-resolution PDF...', 'info');

    try {
      const el = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!el) throw new Error('Canvas viewport not found');

      const dataUrl = await toPng(el, {
        backgroundColor: theme === 'light' ? '#ffffff' : '#09090b',
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
        pdf.save('drawarc-diagram.pdf');
        showToast('PDF exported successfully!', 'success');
        setIsExporting(false);
      };
    } catch (err) {
      console.error('Failed to export PDF', err);
      showToast('Failed to export PDF', 'error');
      setIsExporting(false);
    }
  }, [nodes.length, drawings.length, theme, showToast]);

  const handleDownloadPng = useCallback(async () => {
    if (nodes.length === 0 && drawings.length === 0) return;
    setIsExporting(true);
    showToast('Rendering PNG image...', 'info');

    try {
      const el = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!el) throw new Error('Canvas viewport not found');

      const dataUrl = await toPng(el, {
        backgroundColor: theme === 'light' ? '#ffffff' : '#09090b',
        quality: 1,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = 'drawarc-diagram.png';
      link.href = dataUrl;
      link.click();
      showToast('PNG image exported successfully!', 'success');
    } catch (err) {
      console.error('Failed to export PNG', err);
      showToast('Failed to export PNG', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [nodes.length, drawings.length, theme, showToast]);

  const handleDownloadExcalidraw = useCallback(() => {
    if (nodes.length === 0 && drawings.length === 0) return;
    const success = downloadExcalidrawFile(nodes, edges, drawings);
    if (success) {
      showToast('Exported to Excalidraw format (.excalidraw)!', 'success');
    } else {
      showToast('Failed to export to Excalidraw', 'error');
    }
  }, [nodes, edges, drawings, showToast]);

  const handleClearCanvas = () => {
    if (nodes.length === 0 && drawings.length === 0) return;
    if (window.confirm('Clear all elements and drawings on canvas?')) {
      setNodes([]);
      setEdges([]);
      setDrawings([]);
      setSelectedStrokeId(null);
      pushStateUpdate([], [], [], true);
      showToast('Canvas cleared', 'info');
    }
  };

  // Selected Element for PropertyBar
  const selectedNode = useMemo(() => nodes.find((n) => n.selected) || null, [nodes]);
  const selectedStroke = useMemo(() => drawings.find((d) => d.id === selectedStrokeId) || null, [drawings, selectedStrokeId]);

  const handleDuplicateSelected = () => {
    if (selectedNode) {
      const duplicatedNode: Node = {
        ...selectedNode,
        id: `node-${Date.now()}`,
        position: {
          x: selectedNode.position.x + 30,
          y: selectedNode.position.y + 30,
        },
        selected: true,
      };
      const updatedNodes: Node[] = [...nodes.map((n) => ({ ...n, selected: false })), duplicatedNode];
      setNodes(updatedNodes);
      pushStateUpdate(updatedNodes, edges, drawings, true);
      showToast('Duplicated element', 'info');
    } else if (selectedStroke) {
      const duplicatedStroke: DrawingStroke = {
        ...selectedStroke,
        id: `stroke-${Date.now()}`,
        points: selectedStroke.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })),
      };
      const updatedDrawings = [...drawings, duplicatedStroke];
      setDrawings(updatedDrawings);
      setSelectedStrokeId(duplicatedStroke.id);
      pushStateUpdate(nodes, edges, updatedDrawings, true);
      showToast('Duplicated stroke', 'info');
    }
  };

  const isLight = theme === 'light';

  return (
    <div 
      className={`flex h-screen w-full overflow-hidden font-sans relative select-none transition-colors duration-200 ${
        isLight ? 'bg-white text-slate-800' : 'bg-neutral-950 text-neutral-100'
      }`}
    >
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed top-24 md:top-20 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl backdrop-blur-2xl border shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 text-xs font-medium ${
            toast.type === 'error' 
              ? 'bg-rose-950/90 text-rose-200 border-rose-800/60 shadow-rose-950/50' 
              : toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800/60 shadow-emerald-950/50'
              : isLight
              ? 'bg-white/95 text-slate-800 border-slate-200 shadow-slate-300/60'
              : 'bg-neutral-900/95 text-neutral-200 border-neutral-800 shadow-black/50'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            className="ml-2 p-0.5 rounded-md hover:bg-neutral-500/20 text-neutral-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Property Formatting Bar (Visible when element selected) */}
      <PropertyBar
        selectedNode={selectedNode}
        selectedStroke={selectedStroke}
        onUpdateNode={(updated) => {
          const updatedNodes = nodes.map((n) => (n.id === updated.id ? updated : n));
          setNodes(updatedNodes);
          pushStateUpdate(updatedNodes, edges, drawings, true);
        }}
        onUpdateStroke={(updated) => {
          const updatedDrawings = drawings.map((d) => (d.id === updated.id ? updated : d));
          setDrawings(updatedDrawings);
          pushStateUpdate(nodes, edges, updatedDrawings, true);
        }}
        onDuplicate={handleDuplicateSelected}
        onDelete={handleDeleteSelected}
        onToggleLayers={() => setIsLayersOpen(!isLayersOpen)}
        isLayersOpen={isLayersOpen}
        theme={theme}
      />

      {/* Sidebar: Elements Drawer */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onAddNode={handleAddNodeFromSidebar}
        onAddShape={handleAddShapeFromSidebar}
        onAddSticky={handleAddStickyFromSidebar}
        theme={theme}
      />

      {/* Layers Panel: Stacking Order */}
      <LayersPanel
        isOpen={isLayersOpen}
        onClose={() => setIsLayersOpen(false)}
        nodes={nodes}
        drawings={drawings}
        selectedId={selectedNode ? selectedNode.id : selectedStrokeId}
        onSelect={(id, type) => {
          if (type === 'drawing') {
            setSelectedStrokeId(id);
            setNodes(nodes.map((n) => ({ ...n, selected: false })));
          } else {
            setSelectedStrokeId(null);
            setNodes(nodes.map((n) => ({ ...n, selected: n.id === id })));
          }
        }}
        onUpdateNodes={(updatedNodes) => {
          setNodes(updatedNodes);
          pushStateUpdate(updatedNodes, edges, drawings, true);
        }}
        onUpdateDrawings={(updatedDrawings) => {
          setDrawings(updatedDrawings);
          pushStateUpdate(nodes, edges, updatedDrawings, true);
        }}
        theme={theme}
      />

      {/* Collaboration Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        roomId={roomId}
        shareUrl={shareUrl}
        collaborators={collaborators}
        currentUserId={currentUser.id}
        userName={currentUser.name}
        onUpdateUserName={(newName) => {
          const updatedUser = { ...currentUser, name: newName };
          setCurrentUser(updatedUser);
          showToast(`Display name updated to "${newName}"`, 'success');
        }}
        onGenerateNewRoom={() => {
          const newRoom = generateRoomId();
          setRoomId(newRoom);
          const newUrl = getShareableUrl(newRoom);
          window.history.pushState({}, '', newUrl);
          setNodes([]);
          setEdges([]);
          setDrawings([]);
          showToast('Generated fresh room workspace!', 'success');
        }}
        theme={theme}
      />

      {/* Bottom Interactive Whiteboard Toolbar */}
      <Toolbar 
        mode={interactionMode} 
        setMode={setInteractionMode}
        activeColor={activeColor}
        setActiveColor={setActiveColor}
        activeWidth={activeWidth}
        setActiveWidth={setActiveWidth}
        theme={theme}
      />

      {/* Top Floating App Bar */}
      <header className="absolute top-0 left-0 right-0 z-30 p-2 md:p-3 pointer-events-none flex flex-col items-center gap-2">
        <div className="w-full max-w-7xl flex items-center justify-between gap-2 pointer-events-auto">
          
          {/* Left Brand & Palette Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-2xl backdrop-blur-xl border transition-all flex items-center gap-1.5 shadow-lg ${
                isSidebarOpen 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30' 
                  : isLight
                  ? 'bg-white/90 hover:bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 border-neutral-800 hover:text-white'
              }`}
              title="Toggle Elements Palette"
              aria-label="Toggle Elements Palette"
            >
              <PanelLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Elements</span>
            </button>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl backdrop-blur-xl border shadow-lg ${
              isLight ? 'bg-white/90 border-slate-200' : 'bg-neutral-900/90 border-neutral-800'
            }`}>
              <NextImage 
                src="/logo.png" 
                alt="DrawArc Logo" 
                width={20}
                height={20}
                className={`w-5 h-5 object-contain ${isLight ? '' : 'brightness-0 invert'}`} 
              />
              <span className="font-bold text-xs tracking-tight hidden sm:inline">DrawArc</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                Studio Pro
              </span>
            </div>

            {/* Undo & Redo Quick Buttons */}
            <div className={`flex items-center gap-0.5 p-1 rounded-2xl backdrop-blur-xl border shadow-lg ${
              isLight ? 'bg-white/90 border-slate-200' : 'bg-neutral-900/90 border-neutral-800'
            }`}>
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className={`p-1.5 rounded-xl transition-all ${
                  canUndo 
                    ? isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-neutral-200 hover:bg-neutral-800' 
                    : 'opacity-30 cursor-not-allowed'
                }`}
                title="Undo (Ctrl+Z / ⌘Z)"
                aria-label="Undo"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className={`p-1.5 rounded-xl transition-all ${
                  canRedo 
                    ? isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-neutral-200 hover:bg-neutral-800' 
                    : 'opacity-30 cursor-not-allowed'
                }`}
                title="Redo (Ctrl+Y / ⌘Shift+Z)"
                aria-label="Redo"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center: AI Architecture Prompt */}
          <form 
            onSubmit={(e) => handleGenerate(e)} 
            className={`flex-1 max-w-xl flex items-center backdrop-blur-2xl p-1 md:p-1.5 rounded-2xl border shadow-2xl transition-all focus-within:ring-2 focus-within:ring-indigo-500/30 ${
              isLight 
                ? 'bg-white/90 border-slate-200 focus-within:border-indigo-500/60' 
                : 'bg-neutral-900/90 border-neutral-800 focus-within:border-indigo-500/60'
            }`}
          >
            <div className="pl-2.5 text-indigo-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Generate architecture (e.g. Netflix video stream, Uber rides)..."
              className="flex-1 bg-transparent border-none outline-none px-2.5 py-1 text-xs md:text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-500/20 disabled:text-neutral-400 text-white px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-medium text-xs shadow-md shrink-0 active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Synthesizing...</span>
                </>
              ) : (
                <span>AI Generate</span>
              )}
            </button>
          </form>

          {/* Right Controls: Share, Theme, Layers, Delete, Export */}
          <div className="flex items-center gap-1.5">
            {/* Share / Invite Button */}
            <button
              onClick={() => setIsShareOpen(true)}
              className="px-3 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 text-xs font-bold"
              title="Generate Sharable Editable Link for Multiplayer Collaboration"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
              {Object.keys(collaborators).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            {/* Layers Toggle */}
            <button
              onClick={() => setIsLayersOpen(!isLayersOpen)}
              className={`p-2 rounded-2xl backdrop-blur-xl border transition-all shadow-lg ${
                isLayersOpen
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30'
                  : isLight
                  ? 'bg-white/90 hover:bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
              }`}
              title="Toggle Layers Stack"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-2xl backdrop-blur-xl border transition-all shadow-lg ${
                isLight
                  ? 'bg-white/90 hover:bg-slate-100 text-amber-500 border-slate-200'
                  : 'bg-neutral-900/90 hover:bg-neutral-800 text-indigo-400 border-neutral-800'
              }`}
              title={`Switch to ${isLight ? 'Dark Mode' : 'Light Mode'}`}
              aria-label="Toggle theme"
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Delete Selected Item Button */}
            {(selectedNode || selectedStroke) && (
              <button
                onClick={handleDeleteSelected}
                className="p-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 shadow-lg transition-all"
                title="Delete Selected Item (Delete / Backspace)"
                aria-label="Delete Selected Item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Layout Reorganization */}
            {nodes.length > 0 && (
              <>
                <button
                  onClick={() => applyLayout(nodes, edges, layoutDirection)}
                  className={`p-2 rounded-2xl backdrop-blur-xl border transition-all shadow-lg ${
                    isLight ? 'bg-white/90 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800'
                  }`}
                  title="Auto-reorganize layout"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleLayoutDirection}
                  className={`p-2 rounded-2xl backdrop-blur-xl border transition-all shadow-lg flex items-center gap-1 ${
                    isLight ? 'bg-white/90 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800'
                  }`}
                  title={`Switch Layout: currently ${layoutDirection === 'TB' ? 'Top-to-Bottom' : 'Left-to-Right'}`}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span className="text-[10px] font-mono font-bold hidden lg:inline">{layoutDirection}</span>
                </button>
              </>
            )}

            {/* Export Actions */}
            {(nodes.length > 0 || drawings.length > 0) && (
              <>
                <button
                  onClick={handleDownloadExcalidraw}
                  disabled={isExporting}
                  className={`p-2 rounded-2xl backdrop-blur-xl border transition-all shadow-lg flex items-center gap-1.5 text-xs font-semibold ${
                    isLight ? 'bg-white/90 hover:bg-slate-100 border-slate-200 text-amber-600' : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 text-amber-400'
                  }`}
                  title="Export to Excalidraw format (.excalidraw)"
                >
                  <PenTool className="w-4 h-4 text-amber-500" />
                  <span className="hidden xl:inline">Excalidraw</span>
                </button>

                <button
                  onClick={handleDownloadPng}
                  disabled={isExporting}
                  className={`p-2 rounded-2xl backdrop-blur-xl border transition-all shadow-lg hidden md:flex items-center gap-1 text-xs ${
                    isLight ? 'bg-white/90 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800'
                  }`}
                  title="Export as PNG image"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="hidden lg:inline">PNG</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                  className="px-2.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 text-xs font-semibold"
                  title="Export high-res PDF"
                >
                  <FileDown className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF</span>
                </button>

                <button
                  onClick={handleClearCanvas}
                  className={`p-2 rounded-2xl backdrop-blur-xl border transition-all shadow-lg hover:text-rose-500 ${
                    isLight ? 'bg-white/90 hover:bg-rose-50 border-slate-200 text-slate-400' : 'bg-neutral-900/90 hover:bg-rose-950/40 border-neutral-800 text-neutral-400'
                  }`}
                  title="Clear All Elements"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Suggestion Preset Chips */}
        {nodes.length === 0 && drawings.length === 0 && (
          <div className="w-full max-w-4xl flex items-center justify-center gap-1.5 overflow-x-auto py-1 px-2 pointer-events-auto custom-scrollbar">
            <span className="text-[11px] font-medium opacity-60 whitespace-nowrap mr-1 hidden sm:inline">
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
                className={`px-2.5 py-1 rounded-xl border text-[11px] font-medium whitespace-nowrap transition-all shadow-md active:scale-95 ${
                  isLight
                    ? 'bg-white/90 hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Infinite Canvas Viewport (Clear Background, Zero Dots) */}
      <div 
        className="flex-1 h-full w-full relative bg-clean-canvas" 
        ref={reactFlowWrapper}
        onPointerMove={handlePointerMoveCanvas}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onPaneClick={handlePaneClick}
          onNodeClick={(_, node) => {
            if (interactionMode === 'eraser') {
              const updatedNodes = nodes.filter((n) => n.id !== node.id);
              const updatedEdges = edges.filter((e) => e.source !== node.id && e.target !== node.id);
              setNodes(updatedNodes);
              setEdges(updatedEdges);
              pushStateUpdate(updatedNodes, updatedEdges, drawings, true);
              showToast('Node removed', 'info');
            }
          }}
          onEdgeClick={(_, edge) => {
            if (interactionMode === 'eraser') {
              const updatedEdges = edges.filter((e) => e.id !== edge.id);
              setEdges(updatedEdges);
              pushStateUpdate(nodes, updatedEdges, drawings, true);
              showToast('Connection removed', 'info');
            }
          }}
          panOnDrag={interactionMode === 'pan'}
          selectionOnDrag={interactionMode === 'select'}
          panOnScroll={interactionMode === 'select' || interactionMode === 'eraser'}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.05}
          maxZoom={3}
          deleteKeyCode={['Backspace', 'Delete']}
          className="bg-clean-canvas"
        >
          <Controls className="!rounded-2xl !overflow-hidden !shadow-2xl" />

          {/* Multiplayer Remote Cursors Overlay */}
          <LiveCursors 
            collaborators={collaborators} 
            currentUserId={currentUser.id} 
          />

          {/* Freehand SVG Drawing Overlay synced with ReactFlow */}
          <CanvasOverlayDrawing
            mode={interactionMode}
            drawings={drawings}
            onDrawingsChange={(newDrawings) => {
              setDrawings(newDrawings);
              pushStateUpdate(nodes, edges, newDrawings, true);
            }}
            activeColor={activeColor}
            activeWidth={activeWidth}
            activeOpacity={100}
            selectedStrokeId={selectedStrokeId}
            onSelectStroke={(id) => {
              setSelectedStrokeId(id);
              setNodes(nodes.map((n) => ({ ...n, selected: false })));
            }}
            reactFlowInstance={reactFlowInstance}
            wrapperRef={reactFlowWrapper}
          />

          {/* Bottom-right Status Badge */}
          <Panel position="bottom-right" className="text-[11px] p-2 flex items-center gap-2 pointer-events-none opacity-80">
            <span className="hidden sm:inline">DrawArc · Architecture & Whiteboard Studio</span>
            {(nodes.length > 0 || drawings.length > 0) && (
              <span className={`border px-2 py-0.5 rounded-lg font-mono text-[10px] ${
                isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
              }`}>
                {nodes.length} nodes · {drawings.length} strokes
              </span>
            )}
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export default function DiagramCanvas() {
  return (
    <ReactFlowProvider>
      <InnerDiagramCanvas />
    </ReactFlowProvider>
  );
}
