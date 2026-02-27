/**
 * Viewer3D Component
 * Main Three.js canvas for 3D geometry visualization
 */

import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Environment, Box, Cylinder } from '@react-three/drei';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import type { AssemblyResult, GeometryResult } from '../../../geometry/types';

const ViewerWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const ViewerOverlay = styled.div`
  position: absolute;
  top: ${theme.spacing.md};
  left: ${theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  z-index: 10;
`;

const ViewButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${theme.radius.md};
  background: ${({ $active }) => $active ? theme.colors.accent.primary : theme.colors.bg.elevated};
  color: ${({ $active }) => $active ? theme.colors.bg.primary : theme.colors.text.secondary};
  border: 1px solid ${theme.colors.border.default};
  transition: all ${theme.transitions.fast};

  &:hover {
    background: ${({ $active }) => $active ? theme.colors.accent.primary : theme.colors.bg.hover};
    color: ${theme.colors.text.primary};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const EmptyState = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: ${theme.colors.text.tertiary};
  pointer-events: none;
`;

const EmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto ${theme.spacing.md};
  opacity: 0.3;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const EmptyText = styled.p`
  font-size: ${theme.typography.sizes.lg};
  margin-bottom: ${theme.spacing.xs};
`;

const EmptySubtext = styled.p`
  font-size: ${theme.typography.sizes.sm};
`;

function SceneContent({
  showGrid,
  showAxes,
}: {
  showGrid: boolean;
  showAxes: boolean;
}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-10, 5, -5]} intensity={0.3} />

      {/* Grid */}
      {showGrid && (
        <Grid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor={theme.colors.viewer.grid}
          sectionSize={5}
          sectionThickness={1}
          sectionColor={theme.colors.border.default}
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />
      )}

      {/* Axis Helper */}
      {showAxes && (
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport
            axisColors={[
              theme.colors.viewer.axes.x,
              theme.colors.viewer.axes.y,
              theme.colors.viewer.axes.z,
            ]}
            labelColor="white"
          />
        </GizmoHelper>
      )}

      {/* Controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={1}
        maxDistance={100}
      />

      {/* Environment for reflections */}
      <Environment preset="city" />
    </>
  );
}

// Component to render a single geometry piece
function GeometryComponent({ component, color }: { component: GeometryResult; color: string }) {
  // Convert mm to meters for Three.js (scale down by 1000)
  const scale = 0.001;

  const { bounds, elementType } = component;

  // Get the diagonal vector from min to max (in CAD coordinates)
  const dx = (bounds.max.x - bounds.min.x) * scale;
  const dy = (bounds.max.y - bounds.min.y) * scale;
  const dz = (bounds.max.z - bounds.min.z) * scale;

  // Center position (CAD: X=run, Y=width, Z=height -> Three.js: X=X, Y=Z, Z=Y)
  const centerX = ((bounds.min.x + bounds.max.x) / 2) * scale;
  const centerY = ((bounds.min.z + bounds.max.z) / 2) * scale;
  const centerZ = ((bounds.min.y + bounds.max.y) / 2) * scale;

  // For diagonal elements (stringers, handrails), calculate proper orientation
  if (elementType === 'stringer' || elementType === 'handrail' || elementType === 'rail') {
    // Length is the 3D diagonal
    const length = Math.sqrt(dx * dx + dz * dz);
    const radius = elementType === 'handrail' ? 0.02 : 0.04; // 20mm or 40mm radius

    // Calculate slope angle (rotation around Z axis in Three.js)
    const slopeAngle = Math.atan2(dz, dx);

    return (
      <Cylinder
        args={[radius, radius, length, 16]}
        position={[centerX, centerY, centerZ]}
        rotation={[0, 0, -slopeAngle + Math.PI / 2]}
      >
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
      </Cylinder>
    );
  }

  // Rungs - horizontal cylinders across width
  if (elementType === 'rung') {
    const length = Math.max(dy, 0.4); // Width of rung
    const radius = 0.015; // 15mm radius

    return (
      <Cylinder
        args={[radius, radius, length, 16]}
        position={[centerX, centerY, centerZ]}
        rotation={[Math.PI / 2, 0, 0]} // Rotate to lie along Z axis (width)
      >
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
      </Cylinder>
    );
  }

  // Treads - flat boxes
  if (elementType === 'tread') {
    return (
      <Box
        args={[Math.max(dx, 0.05), 0.03, Math.max(dy, 0.05)]} // Thin in Y (height)
        position={[centerX, centerY, centerZ]}
      >
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </Box>
    );
  }

  // Surface (ramp) - angled plate
  if (elementType === 'surface') {
    // Calculate the slope
    const length = Math.sqrt(dx * dx + dz * dz);
    const slopeAngle = Math.atan2(dz, dx);
    const width = Math.max(dy, 0.5);

    return (
      <Box
        args={[length, 0.05, width]} // Thin plate
        position={[centerX, centerY, centerZ]}
        rotation={[0, 0, -slopeAngle]}
      >
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} />
      </Box>
    );
  }

  // Default box shape for other elements
  return (
    <Box
      args={[Math.max(dx, 0.05), Math.max(dz, 0.05), Math.max(dy, 0.05)]}
      position={[centerX, centerY, centerZ]}
    >
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
    </Box>
  );
}

// Component to render entire assembly
function AssemblyViewer({ assembly }: { assembly: AssemblyResult }) {
  const colors: Record<string, string> = {
    stringer: '#4a5568',
    tread: '#718096',
    handrail: '#63b3ed',
    rail: '#63b3ed',
    rung: '#a0aec0',
    surface: '#48bb78',
    default: '#667eea',
  };

  return (
    <group>
      {assembly.components.map((component, index) => (
        <GeometryComponent
          key={component.id || index}
          component={component}
          color={colors[component.elementType] || colors.default}
        />
      ))}
    </group>
  );
}

interface Viewer3DProps {
  showGrid?: boolean;
  showAxes?: boolean;
  hasGeometry?: boolean;
  assembly?: AssemblyResult | null;
  children?: React.ReactNode;
}

export function Viewer3D({
  showGrid = true,
  showAxes = true,
  hasGeometry = false,
  assembly,
  children,
}: Viewer3DProps) {
  // Calculate camera position based on assembly bounds
  const cameraPosition = useMemo((): [number, number, number] => {
    if (assembly && assembly.bounds) {
      const scale = 0.001;
      const centerX = ((assembly.bounds.min.x + assembly.bounds.max.x) / 2) * scale;
      const centerY = ((assembly.bounds.min.z + assembly.bounds.max.z) / 2) * scale;
      const centerZ = ((assembly.bounds.min.y + assembly.bounds.max.y) / 2) * scale;
      const maxDim = Math.max(
        (assembly.bounds.max.x - assembly.bounds.min.x) * scale,
        (assembly.bounds.max.z - assembly.bounds.min.z) * scale,
        (assembly.bounds.max.y - assembly.bounds.min.y) * scale
      );
      const distance = maxDim * 2;
      return [centerX + distance, centerY + distance, centerZ + distance];
    }
    return [10, 10, 10];
  }, [assembly]);

  return (
    <ViewerWrapper>
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: theme.colors.viewer.background }}
      >
        <SceneContent showGrid={showGrid} showAxes={showAxes} />
        {assembly && <AssemblyViewer assembly={assembly} />}
        {children}
      </Canvas>

      {/* View controls overlay */}
      <ViewerOverlay>
        <ViewButton $active={showGrid} title="Toggle Grid">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
        </ViewButton>
        <ViewButton $active={showAxes} title="Toggle Axes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <polyline points="8 6 12 2 16 6" />
            <polyline points="18 8 22 12 18 16" />
          </svg>
        </ViewButton>
      </ViewerOverlay>

      {/* Empty state */}
      {!hasGeometry && (
        <EmptyState>
          <EmptyIcon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </EmptyIcon>
          <EmptyText>No Geometry</EmptyText>
          <EmptySubtext>Enter a design description to generate 3D geometry</EmptySubtext>
        </EmptyState>
      )}
    </ViewerWrapper>
  );
}
