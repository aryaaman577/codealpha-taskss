'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import AppLayout from '@/components/dashboard/AppLayout';
import { useAuthStore } from '@/stores/auth.store';
import { useWhiteboardStore } from '@/stores/whiteboard.store';
import { socket } from '@/lib/socket';
import {
  PenTool,
  Square,
  Circle,
  Type,
  Eraser,
  Trash2,
  Download,
  MousePointer,
  Sparkles,
  Undo2,
  Redo2
} from 'lucide-react';
import { toast } from 'sonner';

export default function WhiteboardPage() {
  const { user } = useAuthStore();
  const {
    elements,
    tool,
    color,
    brushSize,
    canvasBackground,
    setTool,
    setColor,
    setBrushSize,
    setElements,
    addElement,
    clearCanvas,
  } = useWhiteboardStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // History stacks for undo/redo (ImageData snapshots)
  const undoStackRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0); // trigger re-render for button states

  /** Save current canvas state to undo stack */
  const pushUndoSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    undoStackRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    // Limit stack size to prevent memory issues
    if (undoStackRef.current.length > 50) {
      undoStackRef.current.shift();
    }
    setHistoryVersion((v) => v + 1);
  }, []);

  // Join the global whiteboard room
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const whiteboardId = 'global-canvas';
    socket.emit('whiteboard:join', { whiteboardId });

    const handleIncomingAdd = (data: any) => {
      drawOnCanvas(data.startX, data.startY, data.endX, data.endY, data.color, data.size, false);
    };

    socket.on('whiteboard:object:add', handleIncomingAdd);

    // Initial canvas setup
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = canvasBackground;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Save initial blank state
        undoStackRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
        redoStackRef.current = [];
        setHistoryVersion((v) => v + 1);
      }
    }

    return () => {
      socket.off('whiteboard:object:add', handleIncomingAdd);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Save snapshot BEFORE starting a new stroke
    pushUndoSnapshot();
    // Clear redo stack on new drawing action
    redoStackRef.current = [];
    setHistoryVersion((v) => v + 1);

    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    canvas.setAttribute('data-last-x', x.toString());
    canvas.setAttribute('data-last-y', y.toString());
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const lastX = parseFloat(canvas.getAttribute('data-last-x') || '0');
    const lastY = parseFloat(canvas.getAttribute('data-last-y') || '0');

    // Erase or Draw
    const drawColor = tool === 'erase' ? canvasBackground : color;
    const drawSize = tool === 'erase' ? brushSize * 4 : brushSize;

    drawOnCanvas(lastX, lastY, x, y, drawColor, drawSize, true);

    canvas.setAttribute('data-last-x', x.toString());
    canvas.setAttribute('data-last-y', y.toString());
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Touch support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    pushUndoSnapshot();
    redoStackRef.current = [];
    setHistoryVersion((v) => v + 1);

    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    canvas.setAttribute('data-last-x', x.toString());
    canvas.setAttribute('data-last-y', y.toString());
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    const lastX = parseFloat(canvas.getAttribute('data-last-x') || '0');
    const lastY = parseFloat(canvas.getAttribute('data-last-y') || '0');

    const drawColor = tool === 'erase' ? canvasBackground : color;
    const drawSize = tool === 'erase' ? brushSize * 4 : brushSize;

    drawOnCanvas(lastX, lastY, x, y, drawColor, drawSize, true);

    canvas.setAttribute('data-last-x', x.toString());
    canvas.setAttribute('data-last-y', y.toString());
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
  };

  const drawOnCanvas = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    drawColor: string,
    size: number,
    emit: boolean
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    if (emit) {
      socket.emit('whiteboard:object:add', {
        whiteboardId: 'global-canvas',
        startX,
        startY,
        endX,
        endY,
        color: drawColor,
        size,
      });
    }
  };

  /** Undo: restore previous canvas snapshot */
  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (undoStackRef.current.length <= 1) return; // keep initial blank state

    // Pop current state and push to redo
    const currentState = undoStackRef.current.pop()!;
    redoStackRef.current.push(currentState);

    // Restore previous state
    const previousState = undoStackRef.current[undoStackRef.current.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistoryVersion((v) => v + 1);
  };

  /** Redo: restore last undone state */
  const handleRedo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (redoStackRef.current.length === 0) return;

    const stateToRestore = redoStackRef.current.pop()!;
    undoStackRef.current.push(stateToRestore);
    ctx.putImageData(stateToRestore, 0, 0);
    setHistoryVersion((v) => v + 1);
  };

  /** Clear All: undoable — saves snapshot before clearing */
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save current state before clearing (so Clear All is undoable)
    pushUndoSnapshot();
    redoStackRef.current = [];

    ctx.fillStyle = canvasBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    clearCanvas();
    toast.success('Canvas cleared — use Undo to restore');
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'syncspace-drawing.png';
    link.href = canvas.toDataURL();
    link.click();
    toast.success('Drawing downloaded!');
  };

  const tools = [
    { name: 'select', icon: <MousePointer size={16} />, label: 'Select pointer' },
    { name: 'draw', icon: <PenTool size={16} />, label: 'Draw pencil' },
    { name: 'rect', icon: <Square size={16} />, label: 'Rectangle' },
    { name: 'circle', icon: <Circle size={16} />, label: 'Circle' },
    { name: 'erase', icon: <Eraser size={16} />, label: 'Eraser brush' },
  ];

  const colors = ['#6366f1', '#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#f1f5f9'];

  const canUndo = undoStackRef.current.length > 1;
  const canRedo = redoStackRef.current.length > 0;

  return (
    <AppLayout>
      <div className="h-[calc(100vh-10rem)] flex flex-col rounded-[28px] overflow-hidden border border-border-default bg-bg-surface/50 shadow-card backdrop-blur-sm">
        {/* Controls Header toolbar */}
        <div className="h-auto min-h-[3.5rem] border-b border-border-subtle bg-bg-surface/80 flex flex-wrap items-center justify-between gap-3 px-6 py-2 z-10">
          {/* Tools Toggle Group */}
          <div className="flex gap-1.5 bg-bg-base/60 p-1 rounded-xl border border-border-subtle flex-wrap">
            {tools.map((t) => (
              <button
                key={t.name}
                onClick={() => setTool(t.name as any)}
                className={`p-2 rounded-lg text-text-secondary hover:text-white transition ${
                  tool === t.name ? 'bg-accent-primary text-white shadow-glow-sm' : ''
                }`}
                title={t.label}
              >
                {t.icon}
              </button>
            ))}
          </div>

          {/* Color picks */}
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full border border-border-subtle transition ${
                  color === c && tool !== 'erase' ? 'ring-2 ring-white scale-110' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Size pick */}
          <div className="flex items-center gap-3 min-w-[8rem]">
            <span className="text-[10px] uppercase font-bold text-text-secondary whitespace-nowrap">Brush: {brushSize}px</span>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-28 accent-accent-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-bg-base border border-border-default hover:border-border-strong text-text-secondary hover:text-white transition flex items-center gap-1.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              title="Undo (one stroke)"
            >
              <Undo2 size={14} /> Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-bg-base border border-border-default hover:border-border-strong text-text-secondary hover:text-white transition flex items-center gap-1.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo2 size={14} /> Redo
            </button>
            <button
              onClick={handleDownload}
              className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-bg-base border border-border-default hover:border-border-strong text-text-secondary hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
              title="Download canvas"
            >
              <Download size={14} /> Download
            </button>
            <button
              onClick={handleClear}
              className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-semantic-error/15 border border-semantic-error/30 text-semantic-error hover:bg-semantic-error hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
              title="Clear All (undoable)"
            >
              <Trash2 size={14} /> Clear All
            </button>
          </div>
        </div>

        {/* Drawing Canvas Area */}
        <div className="flex-1 bg-bg-base relative overflow-hidden flex items-center justify-center">
          <div className="w-full h-full">
            <canvas
              ref={canvasRef}
              width={1100}
              height={600}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-full h-full cursor-crosshair touch-none"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
