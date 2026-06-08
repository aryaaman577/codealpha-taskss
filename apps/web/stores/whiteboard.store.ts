import { create } from 'zustand';

export interface CanvasElement {
  id: string;
  type: 'draw' | 'line' | 'rect' | 'circle' | 'text';
  points: number[];
  color: string;
  size: number;
  text?: string;
}

interface WhiteboardStore {
  elements: CanvasElement[];
  tool: 'draw' | 'line' | 'rect' | 'circle' | 'text' | 'erase' | 'select';
  color: string;
  brushSize: number;
  canvasBackground: string;
  setTool: (tool: 'draw' | 'line' | 'rect' | 'circle' | 'text' | 'erase' | 'select') => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setCanvasBackground: (bg: string) => void;
  setElements: (elements: CanvasElement[]) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (index: number, element: CanvasElement) => void;
  deleteElement: (id: string) => void;
  clearCanvas: () => void;
}

export const useWhiteboardStore = create<WhiteboardStore>((set) => ({
  elements: [],
  tool: 'draw',
  color: '#6366f1',
  brushSize: 4,
  canvasBackground: '#101018',

  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setCanvasBackground: (canvasBackground) => set({ canvasBackground }),
  setElements: (elements) => set({ elements }),
  addElement: (element) => set((state) => ({ elements: [...state.elements, element] })),
  updateElement: (index, element) =>
    set((state) => {
      const copy = [...state.elements];
      copy[index] = element;
      return { elements: copy };
    }),
  deleteElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
    })),
  clearCanvas: () => set({ elements: [] }),
}));
