/**
 * Viewer3D Component
 * Main Three.js canvas for 3D geometry visualization
 */

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Environment } from '@react-three/drei';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

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

interface Viewer3DProps {
  showGrid?: boolean;
  showAxes?: boolean;
  hasGeometry?: boolean;
  children?: React.ReactNode;
}

export function Viewer3D({
  showGrid = true,
  showAxes = true,
  hasGeometry = false,
  children,
}: Viewer3DProps) {
  return (
    <ViewerWrapper>
      <Canvas
        shadows
        camera={{ position: [10, 10, 10], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: theme.colors.viewer.background }}
      >
        <SceneContent showGrid={showGrid} showAxes={showAxes} />
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
