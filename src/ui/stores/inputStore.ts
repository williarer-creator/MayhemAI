/**
 * Input Store
 * Manages form state for design inputs
 */

import { create } from 'zustand';
import type { Point3D } from '../../knowledge/types';

interface EndpointConfig {
  position: Point3D;
  type: 'floor' | 'wall' | 'platform' | 'opening' | 'structure';
}

interface InputState {
  // Natural language description
  description: string;

  // Endpoints
  startPoint: EndpointConfig;
  endPoint: EndpointConfig;

  // Constraints
  codes: ('IBC' | 'OSHA' | 'ADA')[];
  buildingType: 'commercial' | 'residential' | 'industrial';

  // Configuration
  projectName: string;
  machineType: 'mill' | 'lathe' | 'router';
  materialPreference: string;

  // Output format toggles
  outputFormats: {
    gcode: boolean;
    dxf: boolean;
    bom: boolean;
    cutList: boolean;
    assemblyInstructions: boolean;
  };

  // Actions
  setDescription: (text: string) => void;
  setStartPoint: (point: Partial<EndpointConfig>) => void;
  setEndPoint: (point: Partial<EndpointConfig>) => void;
  toggleCode: (code: 'IBC' | 'OSHA' | 'ADA') => void;
  setBuildingType: (type: 'commercial' | 'residential' | 'industrial') => void;
  setProjectName: (name: string) => void;
  setMachineType: (type: 'mill' | 'lathe' | 'router') => void;
  setMaterialPreference: (material: string) => void;
  toggleOutputFormat: (format: keyof InputState['outputFormats']) => void;
  loadTemplate: (template: {
    description: string;
    startPoint?: Partial<EndpointConfig>;
    endPoint?: Partial<EndpointConfig>;
  }) => void;
  reset: () => void;
}

const defaultState = {
  description: '',
  startPoint: {
    position: { x: 0, y: 0, z: 0 },
    type: 'floor' as const,
  },
  endPoint: {
    position: { x: 4000, y: 0, z: 3000 },
    type: 'opening' as const,
  },
  codes: ['IBC' as const],
  buildingType: 'commercial' as const,
  projectName: 'Untitled Project',
  machineType: 'mill' as const,
  materialPreference: 'carbon-steel',
  outputFormats: {
    gcode: true,
    dxf: true,
    bom: true,
    cutList: true,
    assemblyInstructions: true,
  },
};

export const useInputStore = create<InputState>((set) => ({
  ...defaultState,

  setDescription: (text) => set({ description: text }),

  setStartPoint: (point) => set((state) => ({
    startPoint: { ...state.startPoint, ...point },
  })),

  setEndPoint: (point) => set((state) => ({
    endPoint: { ...state.endPoint, ...point },
  })),

  toggleCode: (code) => set((state) => ({
    codes: state.codes.includes(code)
      ? state.codes.filter((c) => c !== code)
      : [...state.codes, code],
  })),

  setBuildingType: (type) => set({ buildingType: type }),

  setProjectName: (name) => set({ projectName: name }),

  setMachineType: (type) => set({ machineType: type }),

  setMaterialPreference: (material) => set({ materialPreference: material }),

  toggleOutputFormat: (format) => set((state) => ({
    outputFormats: {
      ...state.outputFormats,
      [format]: !state.outputFormats[format],
    },
  })),

  loadTemplate: (template) => set((state) => ({
    description: template.description,
    startPoint: template.startPoint
      ? { ...state.startPoint, ...template.startPoint }
      : state.startPoint,
    endPoint: template.endPoint
      ? { ...state.endPoint, ...template.endPoint }
      : state.endPoint,
  })),

  reset: () => set(defaultState),
}));
