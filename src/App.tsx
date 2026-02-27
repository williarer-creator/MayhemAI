/**
 * MayhemAI - Main Application
 * AI-powered engineering design system
 */

import { useState, useEffect } from 'react';
import { ThemeProvider } from 'styled-components';
import { initKernel } from './core/kernel';
import { theme, GlobalStyles } from './ui/styles';
import { MainLayout } from './ui/components/layout';
import { Viewer3D } from './ui/components/viewer';
import { Button } from './ui/components/common';
import styled from 'styled-components';

// Temporary placeholder components until Phase 2/3/4 are complete
const PlaceholderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const Section = styled.div`
  background: ${theme.colors.bg.tertiary};
  border-radius: ${theme.radius.md};
  padding: ${theme.spacing.md};
`;

const SectionTitle = styled.h3`
  font-size: ${theme.typography.sizes.sm};
  font-weight: ${theme.typography.weights.semibold};
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.sm};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: ${theme.spacing.md};
  background: ${theme.colors.bg.primary};
  border: 1px solid ${theme.colors.border.default};
  border-radius: ${theme.radius.md};
  color: ${theme.colors.text.primary};
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.sizes.md};
  resize: vertical;
  transition: border-color ${theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${theme.colors.accent.primary};
  }

  &::placeholder {
    color: ${theme.colors.text.tertiary};
  }
`;

const InfoText = styled.p`
  color: ${theme.colors.text.tertiary};
  font-size: ${theme.typography.sizes.sm};
  line-height: 1.5;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm};
  background: ${theme.colors.bg.primary};
  border-radius: ${theme.radius.sm};
  font-size: ${theme.typography.sizes.sm};
`;

const StatusDot = styled.span<{ $status: 'pending' | 'running' | 'completed' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $status }) => theme.colors.pipeline[$status]};
`;

function App() {
  const [kernelStatus, setKernelStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    initKernel()
      .then(() => setKernelStatus('ready'))
      .catch((error) => {
        console.error('Failed to initialize kernel:', error);
        setKernelStatus('error');
      });
  }, []);

  const handleGenerate = () => {
    if (!description.trim()) return;
    setIsProcessing(true);
    // Pipeline integration will be added in Phase 3
    setTimeout(() => setIsProcessing(false), 2000);
  };

  // Left panel content - Design Input
  const leftPanelContent = (
    <PlaceholderContent>
      <Section>
        <SectionTitle>Design Description</SectionTitle>
        <TextArea
          placeholder="Describe what you want to build...&#10;&#10;Example: Build stairs from ground floor to mezzanine level door, 3 meters elevation change, commercial building, must comply with IBC and ADA requirements, steel construction preferred"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div style={{ marginTop: theme.spacing.md }}>
          <Button
            fullWidth
            onClick={handleGenerate}
            disabled={!description.trim() || kernelStatus !== 'ready'}
            loading={isProcessing}
          >
            Generate Design
          </Button>
        </div>
      </Section>

      <Section>
        <SectionTitle>Quick Templates</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDescription('Build stairs from ground floor to mezzanine level door, 3 meters elevation change, commercial building, must comply with IBC and ADA requirements, steel construction preferred')}
          >
            Stairs Between Two Points
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDescription('Create access to elevated equipment platform at 4m height, need primary stair access plus emergency ladder, OSHA compliant, outdoor installation')}
          >
            Platform Access System
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDescription('ADA compliant wheelchair ramp from parking level to building entrance, 600mm rise, maximum slope 1:12, with handrails on both sides')}
          >
            ADA Wheelchair Ramp
          </Button>
        </div>
      </Section>

      <Section>
        <SectionTitle>Endpoints</SectionTitle>
        <InfoText>
          Point A and Point B configuration will be available here.
          For now, endpoints are extracted from the description.
        </InfoText>
      </Section>
    </PlaceholderContent>
  );

  // Right panel content - Output
  const rightPanelContent = (
    <PlaceholderContent>
      <Section>
        <SectionTitle>Pipeline Progress</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <StatusItem>
            <StatusDot $status="pending" />
            <span>Input Processing</span>
          </StatusItem>
          <StatusItem>
            <StatusDot $status="pending" />
            <span>Domain Classification</span>
          </StatusItem>
          <StatusItem>
            <StatusDot $status="pending" />
            <span>Solution Generation</span>
          </StatusItem>
          <StatusItem>
            <StatusDot $status="pending" />
            <span>Geometry Generation</span>
          </StatusItem>
          <StatusItem>
            <StatusDot $status="pending" />
            <span>Manufacturing Output</span>
          </StatusItem>
        </div>
      </Section>

      <Section>
        <SectionTitle>Bill of Materials</SectionTitle>
        <InfoText>
          BOM will appear here after design generation.
        </InfoText>
      </Section>

      <Section>
        <SectionTitle>Validation</SectionTitle>
        <InfoText>
          Code compliance and validation results will be shown here.
        </InfoText>
      </Section>

      <Section>
        <SectionTitle>Export</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <Button variant="secondary" size="sm" disabled>
            Download BOM (CSV)
          </Button>
          <Button variant="secondary" size="sm" disabled>
            Download G-code
          </Button>
          <Button variant="secondary" size="sm" disabled>
            Download DXF
          </Button>
        </div>
      </Section>
    </PlaceholderContent>
  );

  // 3D Viewer content
  const viewerContent = (
    <Viewer3D
      showGrid={true}
      showAxes={true}
      hasGeometry={false}
    />
  );

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <MainLayout
        kernelStatus={kernelStatus}
        pipelineStatus={isProcessing ? 'running' : 'idle'}
        pipelineMessage={isProcessing ? 'Processing design...' : undefined}
        leftPanelContent={leftPanelContent}
        rightPanelContent={rightPanelContent}
        viewerContent={viewerContent}
      />
    </ThemeProvider>
  );
}

export default App;
