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
import { useInputStore, usePipelineStore } from './ui/stores';
import styled from 'styled-components';

// Styled components for panels
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

const StatusItem = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm};
  background: ${({ $active }) => $active ? theme.colors.bg.hover : theme.colors.bg.primary};
  border-radius: ${theme.radius.sm};
  font-size: ${theme.typography.sizes.sm};
  transition: background ${theme.transitions.fast};
`;

const StatusDot = styled.span<{ $status: 'pending' | 'running' | 'completed' | 'failed' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $status }) => theme.colors.pipeline[$status]};
  ${({ $status }) => $status === 'running' && `
    animation: pulse 1s ease-in-out infinite;
  `}

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;

const ResultCard = styled.div`
  background: ${theme.colors.bg.primary};
  border-radius: ${theme.radius.sm};
  padding: ${theme.spacing.sm};
  margin-top: ${theme.spacing.sm};
`;

const ResultLabel = styled.span`
  color: ${theme.colors.text.tertiary};
  font-size: ${theme.typography.sizes.xs};
`;

const ResultValue = styled.span`
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.sizes.sm};
  font-weight: ${theme.typography.weights.medium};
`;

const BOMTable = styled.table`
  width: 100%;
  font-size: ${theme.typography.sizes.xs};
  margin-top: ${theme.spacing.sm};

  th, td {
    padding: ${theme.spacing.xs};
    text-align: left;
    border-bottom: 1px solid ${theme.colors.border.subtle};
  }

  th {
    color: ${theme.colors.text.tertiary};
    font-weight: ${theme.typography.weights.medium};
  }

  td {
    color: ${theme.colors.text.secondary};
  }
`;

const ErrorBanner = styled.div`
  background: rgba(252, 129, 129, 0.1);
  border: 1px solid ${theme.colors.accent.error};
  border-radius: ${theme.radius.sm};
  padding: ${theme.spacing.sm};
  color: ${theme.colors.accent.error};
  font-size: ${theme.typography.sizes.sm};
`;

const WarningBanner = styled.div`
  background: rgba(246, 173, 85, 0.1);
  border: 1px solid ${theme.colors.accent.highlight};
  border-radius: ${theme.radius.sm};
  padding: ${theme.spacing.sm};
  color: ${theme.colors.accent.highlight};
  font-size: ${theme.typography.sizes.sm};
  max-height: 100px;
  overflow-y: auto;
`;

const SuccessBanner = styled.div`
  background: rgba(72, 187, 120, 0.1);
  border: 1px solid ${theme.colors.accent.success};
  border-radius: ${theme.radius.sm};
  padding: ${theme.spacing.sm};
  color: ${theme.colors.accent.success};
  font-size: ${theme.typography.sizes.sm};
`;

function App() {
  const [kernelStatus, setKernelStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Input store
  const {
    description,
    setDescription,
    startPoint,
    endPoint,
    codes,
    loadTemplate,
  } = useInputStore();

  // Pipeline store
  const {
    isRunning,
    statusHistory,
    result,
    aiResult,
    manufacturingPackage,
    processingTime,
    errors,
    warnings,
    runPipeline,
    resetPipeline,
  } = usePipelineStore();

  useEffect(() => {
    initKernel()
      .then(() => setKernelStatus('ready'))
      .catch((error) => {
        console.error('Failed to initialize kernel:', error);
        setKernelStatus('error');
      });
  }, []);

  const handleGenerate = async () => {
    if (!description.trim()) return;

    await runPipeline({
      description,
      endpoints: {
        start: {
          position: startPoint.position,
          type: startPoint.type,
        },
        end: {
          position: endPoint.position,
          type: endPoint.type,
        },
      },
    }, 'MayhemAI Design');
  };

  const getStageStatus = (stage: string): 'pending' | 'running' | 'completed' | 'failed' => {
    const stageInfo = statusHistory.find(s => s.stage === stage);
    if (!stageInfo) return 'pending';
    return stageInfo.status as 'pending' | 'running' | 'completed' | 'failed';
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
          disabled={isRunning}
        />
        <div style={{ marginTop: theme.spacing.md, display: 'flex', gap: theme.spacing.sm }}>
          <Button
            fullWidth
            onClick={handleGenerate}
            disabled={!description.trim() || kernelStatus !== 'ready' || isRunning}
            loading={isRunning}
          >
            {isRunning ? 'Generating...' : 'Generate Design'}
          </Button>
          {result && (
            <Button
              variant="ghost"
              onClick={resetPipeline}
              disabled={isRunning}
            >
              Reset
            </Button>
          )}
        </div>
      </Section>

      <Section>
        <SectionTitle>Quick Templates</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <Button
            variant="ghost"
            size="sm"
            disabled={isRunning}
            onClick={() => loadTemplate({
              description: 'Build stairs from ground floor to mezzanine level door, 3 meters elevation change, commercial building, must comply with IBC and ADA requirements, steel construction preferred',
              startPoint: { position: { x: 0, y: 0, z: 0 }, type: 'floor' },
              endPoint: { position: { x: 4000, y: 0, z: 3000 }, type: 'opening' },
            })}
          >
            Stairs Between Two Points
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={isRunning}
            onClick={() => loadTemplate({
              description: 'Create access to elevated equipment platform at 4m height, need primary stair access plus emergency ladder, OSHA compliant, outdoor installation',
              startPoint: { position: { x: 0, y: 0, z: 0 }, type: 'floor' },
              endPoint: { position: { x: 3000, y: 0, z: 4000 }, type: 'structure' },
            })}
          >
            Platform Access System
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={isRunning}
            onClick={() => loadTemplate({
              description: 'ADA compliant wheelchair ramp from parking level to building entrance, 600mm rise, maximum slope 1:12, with handrails on both sides',
              startPoint: { position: { x: 0, y: 0, z: 0 }, type: 'floor' },
              endPoint: { position: { x: 7200, y: 0, z: 600 }, type: 'opening' },
            })}
          >
            ADA Wheelchair Ramp
          </Button>
        </div>
      </Section>

      <Section>
        <SectionTitle>Configuration</SectionTitle>
        <InfoText>
          Start: ({startPoint.position.x}, {startPoint.position.y}, {startPoint.position.z}) - {startPoint.type}
        </InfoText>
        <InfoText>
          End: ({endPoint.position.x}, {endPoint.position.y}, {endPoint.position.z}) - {endPoint.type}
        </InfoText>
        <InfoText style={{ marginTop: theme.spacing.sm }}>
          Codes: {codes.join(', ') || 'None selected'}
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
          {[
            { stage: 'input-processing', label: 'Input Processing' },
            { stage: 'requirement-analysis', label: 'Requirement Analysis' },
            { stage: 'domain-classification', label: 'Domain Classification' },
            { stage: 'solution-generation', label: 'Solution Generation' },
            { stage: 'geometry-generation', label: 'Geometry Generation' },
            { stage: 'validation', label: 'Validation' },
            { stage: 'manufacturing-output', label: 'Manufacturing Output' },
          ].map(({ stage, label }) => (
            <StatusItem key={stage} $active={getStageStatus(stage) === 'running'}>
              <StatusDot $status={getStageStatus(stage)} />
              <span>{label}</span>
            </StatusItem>
          ))}
        </div>
      </Section>

      {errors.length > 0 && (
        <ErrorBanner>
          <strong>Errors:</strong>
          <ul style={{ margin: '4px 0 0 16px' }}>
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </ErrorBanner>
      )}

      {result?.success && (
        <SuccessBanner>
          Design generated successfully in {processingTime}ms
        </SuccessBanner>
      )}

      {aiResult && (
        <Section>
          <SectionTitle>AI Analysis</SectionTitle>
          <ResultCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <ResultLabel>Domain:</ResultLabel>
              <ResultValue>{aiResult.classification.primaryDomain}</ResultValue>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <ResultLabel>Element Type:</ResultLabel>
              <ResultValue>{aiResult.elementType.elementType}</ResultValue>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <ResultLabel>Confidence:</ResultLabel>
              <ResultValue>{(aiResult.classification.confidence * 100).toFixed(0)}%</ResultValue>
            </div>
          </ResultCard>
          {aiResult.rationale?.summary && (
            <InfoText style={{ marginTop: theme.spacing.sm }}>
              {aiResult.rationale.summary}
            </InfoText>
          )}
        </Section>
      )}

      {manufacturingPackage && (
        <>
          <Section>
            <SectionTitle>Geometry</SectionTitle>
            <ResultCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <ResultLabel>Components:</ResultLabel>
                <ResultValue>{manufacturingPackage.geometry.componentCount}</ResultValue>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <ResultLabel>Total Weight:</ResultLabel>
                <ResultValue>{manufacturingPackage.geometry.totalWeight.toFixed(1)} kg</ResultValue>
              </div>
            </ResultCard>
          </Section>

          <Section>
            <SectionTitle>Bill of Materials ({manufacturingPackage.bom.items.length} items)</SectionTitle>
            <BOMTable>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {manufacturingPackage.bom.items.slice(0, 10).map((item, i) => (
                  <tr key={i}>
                    <td>{item.itemNumber}</td>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
                {manufacturingPackage.bom.items.length > 10 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', fontStyle: 'italic' }}>
                      ... and {manufacturingPackage.bom.items.length - 10} more items
                    </td>
                  </tr>
                )}
              </tbody>
            </BOMTable>
          </Section>

          <Section>
            <SectionTitle>Validation</SectionTitle>
            <ResultCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <ResultLabel>Geometry Valid:</ResultLabel>
                <ResultValue style={{ color: manufacturingPackage.validation.geometryValid ? theme.colors.accent.success : theme.colors.accent.error }}>
                  {manufacturingPackage.validation.geometryValid ? 'Yes' : 'No'}
                </ResultValue>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <ResultLabel>Code Compliant:</ResultLabel>
                <ResultValue style={{ color: manufacturingPackage.validation.codeCompliant ? theme.colors.accent.success : theme.colors.accent.error }}>
                  {manufacturingPackage.validation.codeCompliant ? 'Yes' : 'No'}
                </ResultValue>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <ResultLabel>Mfg Feasible:</ResultLabel>
                <ResultValue style={{ color: manufacturingPackage.validation.manufacturingFeasible ? theme.colors.accent.success : theme.colors.accent.error }}>
                  {manufacturingPackage.validation.manufacturingFeasible ? 'Yes' : 'No'}
                </ResultValue>
              </div>
            </ResultCard>
          </Section>
        </>
      )}

      {warnings.length > 0 && (
        <WarningBanner>
          <strong>Warnings ({warnings.length}):</strong>
          <ul style={{ margin: '4px 0 0 16px', fontSize: '11px' }}>
            {warnings.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}
            {warnings.length > 5 && <li>... and {warnings.length - 5} more</li>}
          </ul>
        </WarningBanner>
      )}

      <Section>
        <SectionTitle>Export</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <Button variant="secondary" size="sm" disabled={!manufacturingPackage}>
            Download BOM (CSV)
          </Button>
          <Button variant="secondary" size="sm" disabled={!manufacturingPackage}>
            Download Cut List
          </Button>
          <Button variant="secondary" size="sm" disabled>
            Download G-code
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
      hasGeometry={!!manufacturingPackage}
    />
  );

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <MainLayout
        kernelStatus={kernelStatus}
        pipelineStatus={isRunning ? 'running' : result?.success ? 'success' : errors.length > 0 ? 'error' : 'idle'}
        pipelineMessage={isRunning ? 'Processing design...' : undefined}
        componentCount={manufacturingPackage?.geometry.componentCount}
        totalWeight={manufacturingPackage?.geometry.totalWeight}
        processingTime={processingTime || undefined}
        leftPanelContent={leftPanelContent}
        rightPanelContent={rightPanelContent}
        viewerContent={viewerContent}
      />
    </ThemeProvider>
  );
}

export default App;
