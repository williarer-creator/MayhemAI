/**
 * MainLayout Component
 * Root layout with header, panels, viewer, and status bar
 */

import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { useUIStore } from '../../stores/uiStore';
import { Header } from './Header';
import { Panel } from './Panel';
import { StatusBar } from './StatusBar';

const LayoutContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${theme.colors.bg.primary};
  overflow: hidden;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const ViewerContainer = styled.div`
  flex: 1;
  position: relative;
  background: ${theme.colors.viewer.background};
  overflow: hidden;
`;

interface MainLayoutProps {
  kernelStatus: 'ready' | 'loading' | 'error';
  pipelineStatus: 'idle' | 'running' | 'success' | 'error';
  pipelineMessage?: string;
  componentCount?: number;
  totalWeight?: number;
  processingTime?: number;
  leftPanelContent: React.ReactNode;
  rightPanelContent: React.ReactNode;
  viewerContent: React.ReactNode;
}

export function MainLayout({
  kernelStatus,
  pipelineStatus,
  pipelineMessage,
  componentCount,
  totalWeight,
  processingTime,
  leftPanelContent,
  rightPanelContent,
  viewerContent,
}: MainLayoutProps) {
  const {
    leftPanelCollapsed,
    rightPanelCollapsed,
    leftPanelWidth,
    rightPanelWidth,
    toggleLeftPanel,
    toggleRightPanel,
  } = useUIStore();

  return (
    <LayoutContainer>
      <Header kernelStatus={kernelStatus} />

      <MainContent>
        <Panel
          title="Design Input"
          collapsed={leftPanelCollapsed}
          onToggle={toggleLeftPanel}
          side="left"
          width={leftPanelWidth}
        >
          {leftPanelContent}
        </Panel>

        <ViewerContainer>
          {viewerContent}
        </ViewerContainer>

        <Panel
          title="Output"
          collapsed={rightPanelCollapsed}
          onToggle={toggleRightPanel}
          side="right"
          width={rightPanelWidth}
        >
          {rightPanelContent}
        </Panel>
      </MainContent>

      <StatusBar
        pipelineStatus={pipelineStatus}
        pipelineMessage={pipelineMessage}
        componentCount={componentCount}
        totalWeight={totalWeight}
        processingTime={processingTime}
      />
    </LayoutContainer>
  );
}
