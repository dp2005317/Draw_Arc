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
import StudioLeftRail, { RailTab } from './StudioLeftRail';
import EditInspector from './EditInspector';
import Toolbar, { InteractionMode } from './Toolbar';
import CanvasOverlayDrawing from './CanvasOverlayDrawing';
import LiveCursors from './LiveCursors';
import ShareModal from './ShareModal';

import { getLayoutedElements } from '@/lib/layout';
import { exportToExcalidraw, downloadExcalidrawFile } from '@/lib/excalidraw';
import { synthesizeArchitecture } from '@/app/api/generate/route';
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
  Trash2, 
  CheckCircle2,
  AlertCircle,
  X,
  PenTool,
  Share2,
  Sun,
  Moon,
  Undo2,
  Redo2,
  SlidersHorizontal
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
  const [activeLeftTab, setActiveLeftTab] = useState<RailTab>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(true);
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

  // Selected element detection
  const selectedNode = useMemo(() => nodes.find((n) => n.selected) || null, [nodes]);
  const selectedStroke = useMemo(() => drawings.find((d) => d.id === selectedStrokeId) || null, [drawings, selectedStrokeId]);

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
    showToast('Item deleted', 'info');
  }, [nodes, edges, drawings, selectedStrokeId, pushStateUpdate, setNodes, setEdges, showToast]);

  // Keyboard Shortcuts: Delete, Undo, Redo, Tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || (activeEl as HTMLElement)?.isContentEditable;
      if (isInput) return;

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl+Y / Cmd+Shift+Z
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const hasSelection = nodes.some((n) => n.selected) || edges.some((e) => e.selected) || selectedStrokeId !== null;
        if (hasSelection) {
          e.preventDefault();
          handleDeleteSelected();
          return;
        }
      }

      // Tool switching
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleDeleteSelected, nodes, edges, selectedStrokeId]);

  // BroadcastChannel & Remote Room Synchronization
  useEffect(() => {
    const channel = new BroadcastChannel(`drawarc-room-${roomId}`);
    broadcastChannelRef.current = channel;

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data || data.senderId === currentUser.id) return;

      if (data.type === 'SYNC_STATE') {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setDrawings(data.drawings || []);
      } else if (data.type === 'CURSOR') {
        setCollaborators((prev) => ({
          ...prev,
          [data.senderId]: {
            id: data.senderId,
            name: data.userName,
            color: data.userColor,
            cursor: data.cursor,
            lastActive: Date.now(),
          },
        }));
      }
    };

    const pollRemoteRoom = async () => {
      try {
        const res = await fetch(`/api/room/${roomId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.updatedAt && data.updatedAt > lastSyncTimestampRef.current) {
          lastSyncTimestampRef.current = data.updatedAt;
          if (Array.isArray(data.nodes)) setNodes(data.nodes);
          if (Array.isArray(data.edges)) setEdges(data.edges);
          if (Array.isArray(data.drawings)) setDrawings(data.drawings);
        }

        if (data.collaborators) {
          const activeOthers: Record<string, Collaborator> = {};
          const now = Date.now();
          Object.entries(data.collaborators as Record<string, Collaborator>).forEach(([id, c]) => {
            if (id !== currentUser.id && now - c.lastActive < 30000) {
              activeOthers[id] = c;
            }
          });
          setCollaborators(activeOthers);
        }
      } catch {}
    };

    pollRemoteRoom();
    const interval = setInterval(pollRemoteRoom, 2500);

    return () => {
      clearInterval(interval);
      channel.close();
    };
  }, [roomId, currentUser.id, setNodes, setEdges]);

  // Broadcast cursor movements to collaborators
  const handlePointerMoveCanvas = useCallback(
    (e: React.PointerEvent) => {
      if (!reactFlowInstance || !reactFlowWrapper.current) return;
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const canvasPos = reactFlowInstance.project({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'CURSOR',
          senderId: currentUser.id,
          userName: currentUser.name,
          userColor: currentUser.color,
          cursor: canvasPos,
        });
      }
    },
    [reactFlowInstance, currentUser]
  );

  // Connect Nodes
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const newEdge: Edge = {
        ...params,
        source: params.source,
        target: params.target,
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: activeColor || '#6366f1', strokeWidth: 2 },
      };
      const updatedEdges = addEdge(newEdge, edges);
      setEdges(updatedEdges);
      pushStateUpdate(nodes, updatedEdges, drawings, true);
    },
    [edges, nodes, drawings, activeColor, pushStateUpdate, setEdges]
  );

  // Drag-and-drop Elements onto Canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData) return;

      const data = JSON.parse(rawData);
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: data.type === 'shape' ? 'shape' : 'custom',
        position,
        data: { 
          label: data.label, 
          type: data.type,
          shape: data.shape || 'rect',
          color: theme === 'light' ? '#ffffff' : '#18181b',
          strokeColor: activeColor || '#6366f1',
          strokeWidth: activeWidth || 2,
          strokeStyle: 'solid',
          opacity: 100
        },
        selected: true,
      };

      const updatedNodes = [...nodes.map((n) => ({ ...n, selected: false })), newNode];
      setNodes(updatedNodes);
      pushStateUpdate(updatedNodes, edges, drawings, true);
      showToast(`Added ${data.label}`, 'success');
    },
    [reactFlowInstance, nodes, edges, drawings, activeColor, activeWidth, theme, pushStateUpdate, setNodes, showToast]
  );

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
            fontSize: 22, 
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
          style: { width: 170, height: 150 },
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
          style: { width: 120, height: 120 },
          selected: true,
        };
      }

      const nextNodes: Node[] = [...nodes.map((n) => ({ ...n, selected: false })), newNode];
      setNodes(nextNodes);
      pushStateUpdate(nextNodes, edges, drawings, true);
      setInteractionMode('select');
      setIsEditPanelOpen(true);
    }
  };

  // Add Elements via Left Rail
  const handleAddNodeFromRail = (type: string, label: string) => {
    if (!reactFlowWrapper.current || !reactFlowInstance) return;
    const center = reactFlowInstance.project({
      x: reactFlowWrapper.current.clientWidth / 2,
      y: reactFlowWrapper.current.clientHeight / 2,
    });
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position: center,
      data: { label, type },
      selected: true,
    };
    const nextNodes = [...nodes.map((n) => ({ ...n, selected: false })), newNode];
    setNodes(nextNodes);
    pushStateUpdate(nextNodes, edges, drawings, true);
    showToast(`Added ${label}`, 'success');
  };

  const handleAddShapeFromRail = (shape: string, label: string) => {
    if (!reactFlowWrapper.current || !reactFlowInstance) return;
    const center = reactFlowInstance.project({
      x: reactFlowWrapper.current.clientWidth / 2,
      y: reactFlowWrapper.current.clientHeight / 2,
    });
    const newNode: Node = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      position: center,
      data: {
        shape,
        label,
        color: theme === 'light' ? '#ffffff' : '#18181b',
        strokeColor: activeColor || '#6366f1',
        strokeWidth: activeWidth || 2,
        strokeStyle: 'solid',
        opacity: 100,
      },
      style: { width: 120, height: 120 },
      selected: true,
    };
    const nextNodes = [...nodes.map((n) => ({ ...n, selected: false })), newNode];
    setNodes(nextNodes);
    pushStateUpdate(nextNodes, edges, drawings, true);
    showToast(`Added ${label}`, 'success');
  };

  const handleAddStickyFromRail = (color: string) => {
    if (!reactFlowWrapper.current || !reactFlowInstance) return;
    const center = reactFlowInstance.project({
      x: reactFlowWrapper.current.clientWidth / 2,
      y: reactFlowWrapper.current.clientHeight / 2,
    });
    const newNode: Node = {
      id: `sticky-${Date.now()}`,
      type: 'sticky',
      position: center,
      data: { color, text: 'New Note...', author: currentUser.name, isEditing: true },
      style: { width: 170, height: 150 },
      selected: true,
    };
    const nextNodes = [...nodes.map((n) => ({ ...n, selected: false })), newNode];
    setNodes(nextNodes);
    pushStateUpdate(nextNodes, edges, drawings, true);
    showToast('Added Sticky Note', 'success');
  };

  // Quick Insert functions for Edit Inspector
  const handleAddTextQuick = useCallback((fontSize = 24, isBold = false) => {
    if (!reactFlowWrapper.current || !reactFlowInstance) return;
    const center = reactFlowInstance.project({
      x: reactFlowWrapper.current.clientWidth / 2,
      y: reactFlowWrapper.current.clientHeight / 2,
    });
    const newNode: Node = {
      id: `text-${Date.now()}`,
      type: 'text',
      position: center,
      data: {
        text: 'Write something...',
        isEditing: true,
        fontSize,
        isBold,
        color: theme === 'light' ? '#0f172a' : '#f4f4f5',
      },
      selected: true,
    };
    const nextNodes = [...nodes.map((n) => ({ ...n, selected: false })), newNode];
    setNodes(nextNodes);
    setIsEditPanelOpen(true);
    pushStateUpdate(nextNodes, edges, drawings, true);
    showToast('Added Text element', 'info');
  }, [reactFlowInstance, theme, nodes, edges, drawings, pushStateUpdate, setNodes, showToast]);

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

  // Resilient AI Generator with Infallible Client-side Fallback
  const handleGenerate = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const query = customPrompt || prompt;
    if (!query.trim()) return;

    setIsLoading(true);
    showToast('Synthesizing production architecture with AI...', 'info');

    try {
      interface ArchDataNode {
        id: string;
        type?: string;
        data: { label: string; type: string };
      }
      interface ArchDataEdge {
        id: string;
        source: string;
        target: string;
        label?: string;
        animated?: boolean;
      }
      interface ArchPayload {
        nodes: ArchDataNode[];
        edges: ArchDataEdge[];
      }

      let data: ArchPayload | null = null;

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: query }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.nodes) && Array.isArray(json.edges)) {
            data = json as ArchPayload;
          }
        }
      } catch {
        // Fallback to local client synthesis
      }

      // If remote API encountered any error, rate-limit, or network issue, synthesize immediately locally!
      if (!data) {
        data = synthesizeArchitecture(query) as ArchPayload;
      }

      const newNodes = data.nodes.map((node) => ({
        ...node,
        position: { x: 0, y: 0 },
      }));

      const newEdges = data.edges.map((edge) => ({
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

  // Direct Excalidraw Opener + Clipboard Copy + Backup File
  const handleOpenExcalidraw = useCallback(() => {
    if (nodes.length === 0 && drawings.length === 0) {
      window.open('https://excalidraw.com', '_blank');
      showToast('Opened Excalidraw.com in a new tab!', 'info');
      return;
    }

    const scene = exportToExcalidraw(nodes, edges, drawings);
    if (scene) {
      const jsonStr = JSON.stringify(scene, null, 2);
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(jsonStr).catch(() => {});
      }
      downloadExcalidrawFile(nodes, edges, drawings);
      window.open('https://excalidraw.com', '_blank');
      showToast('Opening Excalidraw.com! Diagram JSON copied to clipboard — press Ctrl+V / ⌘V in Excalidraw to paste your canvas!', 'success');
    } else {
      window.open('https://excalidraw.com', '_blank');
    }
  }, [nodes, edges, drawings, showToast]);

  // Export PDF
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
        const orientation = img.width > img.height ? 'l' : 'p';
        const pdf = new jsPDF(orientation, 'pt', [img.width, img.height]);
        pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
        pdf.save('drawarc-architecture.pdf');
        showToast('PDF exported successfully!', 'success');
      };
    } catch (err) {
      console.error('Failed to export PDF', err);
      showToast('Failed to export PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [nodes.length, drawings.length, theme, showToast]);

  // Export PNG
  const handleDownloadPng = useCallback(async () => {
    if (nodes.length === 0 && drawings.length === 0) return;
    setIsExporting(true);
    showToast('Generating PNG image...', 'info');

    try {
      const el = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!el) throw new Error('Canvas viewport not found');

      const dataUrl = await toPng(el, {
        backgroundColor: theme === 'light' ? '#ffffff' : '#09090b',
        quality: 1,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = 'drawarc-architecture.png';
      link.href = dataUrl;
      link.click();
      showToast('PNG image downloaded!', 'success');
    } catch (err) {
      console.error('Failed to export PNG', err);
      showToast('Failed to export PNG', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [nodes.length, drawings.length, theme, showToast]);

  // Clear Canvas
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

  // Duplicate Selected Element
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

  // Layer Stacking (Z-Index)
  const handleBringToFront = useCallback(() => {
    if (selectedNode) {
      const maxZ = Math.max(10, ...nodes.map((n) => Number(n.style?.zIndex) || 10));
      const updated = nodes.map((n) => (n.id === selectedNode.id ? { ...n, style: { ...n.style, zIndex: maxZ + 10 } } : n));
      setNodes(updated);
      pushStateUpdate(updated, edges, drawings, true);
    } else if (selectedStrokeId) {
      const maxZ = Math.max(5, ...drawings.map((d) => d.zIndex || 5));
      const updated = drawings.map((d) => (d.id === selectedStrokeId ? { ...d, zIndex: maxZ + 10 } : d));
      setDrawings(updated);
      pushStateUpdate(nodes, edges, updated, true);
    }
  }, [selectedNode, selectedStrokeId, nodes, edges, drawings, pushStateUpdate, setNodes]);

  const handleBringForward = useCallback(() => {
    if (selectedNode) {
      const updated = nodes.map((n) => (n.id === selectedNode.id ? { ...n, style: { ...n.style, zIndex: (Number(n.style?.zIndex) || 10) + 1 } } : n));
      setNodes(updated);
      pushStateUpdate(updated, edges, drawings, true);
    } else if (selectedStrokeId) {
      const updated = drawings.map((d) => (d.id === selectedStrokeId ? { ...d, zIndex: (d.zIndex || 5) + 1 } : d));
      setDrawings(updated);
      pushStateUpdate(nodes, edges, updated, true);
    }
  }, [selectedNode, selectedStrokeId, nodes, edges, drawings, pushStateUpdate, setNodes]);

  const handleSendBackward = useCallback(() => {
    if (selectedNode) {
      const updated = nodes.map((n) => (n.id === selectedNode.id ? { ...n, style: { ...n.style, zIndex: Math.max(1, (Number(n.style?.zIndex) || 10) - 1) } } : n));
      setNodes(updated);
      pushStateUpdate(updated, edges, drawings, true);
    } else if (selectedStrokeId) {
      const updated = drawings.map((d) => (d.id === selectedStrokeId ? { ...d, zIndex: Math.max(1, (d.zIndex || 5) - 1) } : d));
      setDrawings(updated);
      pushStateUpdate(nodes, edges, updated, true);
    }
  }, [selectedNode, selectedStrokeId, nodes, edges, drawings, pushStateUpdate, setNodes]);

  const handleSendToBack = useCallback(() => {
    if (selectedNode) {
      const minZ = Math.min(10, ...nodes.map((n) => Number(n.style?.zIndex) || 10));
      const updated = nodes.map((n) => (n.id === selectedNode.id ? { ...n, style: { ...n.style, zIndex: Math.max(1, minZ - 10) } } : n));
      setNodes(updated);
      pushStateUpdate(updated, edges, drawings, true);
    } else if (selectedStrokeId) {
      const minZ = Math.min(5, ...drawings.map((d) => d.zIndex || 5));
      const updated = drawings.map((d) => (d.id === selectedStrokeId ? { ...d, zIndex: Math.max(1, minZ - 5) } : d));
      setDrawings(updated);
      pushStateUpdate(nodes, edges, updated, true);
    }
  }, [selectedNode, selectedStrokeId, nodes, edges, drawings, pushStateUpdate, setNodes]);

  // Update Node and Stroke
  const handleUpdateNode = useCallback((updated: Node) => {
    const updatedNodes = nodes.map((n) => (n.id === updated.id ? updated : n));
    setNodes(updatedNodes);
    pushStateUpdate(updatedNodes, edges, drawings, true);
  }, [nodes, edges, drawings, pushStateUpdate, setNodes]);

  const handleUpdateStroke = useCallback((updated: DrawingStroke) => {
    const updatedDrawings = drawings.map((d) => (d.id === updated.id ? updated : d));
    setDrawings(updatedDrawings);
    pushStateUpdate(nodes, edges, updatedDrawings, true);
  }, [nodes, edges, drawings, pushStateUpdate]);

  const isLight = theme === 'light';

  return (
    <div 
      className={`flex h-screen w-screen overflow-hidden font-sans relative select-none transition-colors duration-200 ${
        isLight ? 'bg-white text-slate-800' : 'bg-neutral-950 text-neutral-100'
      }`}
    >
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed top-20 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl backdrop-blur-2xl border shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 text-xs font-medium ${
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

      {/* 1. Slim Left Navigation Rail & Drawer (Canva & Modern Studio Style) */}
      <StudioLeftRail
        activeTab={activeLeftTab}
        onSelectTab={setActiveLeftTab}
        onCloseDrawer={() => setActiveLeftTab(null)}
        onAddNode={handleAddNodeFromRail}
        onAddShape={handleAddShapeFromRail}
        onAddSticky={handleAddStickyFromRail}
        onAddTextQuick={handleAddTextQuick}
        interactionMode={interactionMode}
        setInteractionMode={setInteractionMode}
        activeColor={activeColor}
        setActiveColor={setActiveColor}
        onSelectTemplate={(tmplPrompt) => {
          setPrompt(tmplPrompt);
          handleGenerate(undefined, tmplPrompt);
        }}
        nodes={nodes}
        drawings={drawings}
        selectedId={selectedNode?.id || selectedStrokeId}
        onSelectElement={(id, type) => {
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

      {/* 2. Main Studio Work Area */}
      <div className="flex-1 flex flex-col h-full w-full relative pl-16 md:pl-18 select-none">
        
        {/* Top Header */}
        <header className="absolute top-0 left-16 md:left-18 right-0 z-20 p-2 md:p-3 pointer-events-none flex flex-col items-center gap-2">
          <div className="w-full max-w-7xl flex items-center justify-between gap-2 pointer-events-auto">
            
            {/* Left Brand Badge + Undo/Redo */}
            <div className="flex items-center gap-2">
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

            {/* Center: Infallible AI Architecture Prompt Input */}
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

            {/* Right Controls: Share, Excalidraw, Theme, Inspector Toggle */}
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

              {/* Direct Open in Excalidraw */}
              <button
                onClick={handleOpenExcalidraw}
                disabled={isExporting}
                className={`p-2 rounded-2xl backdrop-blur-xl border transition-all shadow-lg flex items-center gap-1.5 text-xs font-semibold ${
                  isLight ? 'bg-white/90 hover:bg-slate-100 border-slate-200 text-amber-600' : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 text-amber-400'
                }`}
                title="Open directly in Excalidraw (copies JSON to clipboard & opens excalidraw.com)"
              >
                <PenTool className="w-4 h-4 text-amber-500" />
                <span className="hidden xl:inline">Excalidraw</span>
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

              {/* Edit Inspector Toggle Tab */}
              <button
                onClick={() => setIsEditPanelOpen(!isEditPanelOpen)}
                className={`p-2 rounded-2xl backdrop-blur-xl border transition-all shadow-lg flex items-center gap-1 text-xs font-semibold ${
                  isEditPanelOpen
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30'
                    : isLight
                    ? 'bg-white/90 hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                }`}
                title="Toggle Edit Inspector Panel"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden lg:inline">Edit</span>
              </button>
            </div>
          </div>

          {/* Preset Chips */}
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

        {/* Main Infinite Canvas (Clear Solid Background, Zero Dots) */}
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

        {/* Bottom Tool Dock */}
        <Toolbar 
          mode={interactionMode} 
          setMode={setInteractionMode}
          activeColor={activeColor}
          setActiveColor={setActiveColor}
          activeWidth={activeWidth}
          setActiveWidth={setActiveWidth}
          theme={theme}
        />
      </div>

      {/* 3. Dedicated Right-Side Properties & Edit Inspector */}
      <EditInspector
        isOpen={isEditPanelOpen}
        onToggleOpen={() => setIsEditPanelOpen(!isEditPanelOpen)}
        selectedNode={selectedNode}
        selectedStroke={selectedStroke}
        onUpdateNode={handleUpdateNode}
        onUpdateStroke={handleUpdateStroke}
        onDuplicate={handleDuplicateSelected}
        onDelete={handleDeleteSelected}
        onBringToFront={handleBringToFront}
        onBringForward={handleBringForward}
        onSendBackward={handleSendBackward}
        onSendToBack={handleSendToBack}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenExcalidraw={handleOpenExcalidraw}
        onExportPng={handleDownloadPng}
        onExportPdf={handleDownloadPdf}
        onClearCanvas={handleClearCanvas}
        layoutDirection={layoutDirection}
        onToggleLayoutDirection={toggleLayoutDirection}
        onApplyLayout={() => applyLayout(nodes, edges, layoutDirection)}
        nodesCount={nodes.length}
        strokesCount={drawings.length}
        roomId={roomId}
        onAddTextQuick={handleAddTextQuick}
        onAddStickyQuick={handleAddStickyFromRail}
        onAddShapeQuick={(shape) => handleAddShapeFromRail(shape, shape)}
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
