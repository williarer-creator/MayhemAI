/**
 * StatusBar Component
 * Bottom bar with pipeline status and metrics
 */

import styled from 'styled-components';
import { theme } from '../../styles/theme';

const StatusBarContainer = styled.footer`
  height: ${theme.panels.statusBarHeight}px;
  background: ${theme.colors.bg.secondary};
  border-top: 1px solid ${theme.colors.border.subtle};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${theme.spacing.md};
  font-size: ${theme.typography.sizes.xs};
  color: ${theme.colors.text.tertiary};
`;

const StatusSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.lg};
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
`;

const StatusLabel = styled.span`
  color: ${theme.colors.text.tertiary};
`;

const StatusValue = styled.span<{ $highlight?: boolean }>`
  color: ${({ $highlight }) => $highlight ? theme.colors.accent.primary : theme.colors.text.secondary};
  font-family: ${theme.typography.monoFamily};
`;

const PipelineStatus = styled.div<{ $status: 'idle' | 'running' | 'success' | 'error' }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: ${theme.radius.full};
    background: ${({ $status }) => {
      switch ($status) {
        case 'idle': return theme.colors.text.tertiary;
        case 'running': return theme.colors.accent.secondary;
        case 'success': return theme.colors.accent.success;
        case 'error': return theme.colors.accent.error;
      }
    }};
    ${({ $status }) => $status === 'running' && `
      animation: pulse 1s ease-in-out infinite;
    `}
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;

interface StatusBarProps {
  pipelineStatus: 'idle' | 'running' | 'success' | 'error';
  pipelineMessage?: string;
  componentCount?: number;
  totalWeight?: number;
  processingTime?: number;
}

export function StatusBar({
  pipelineStatus,
  pipelineMessage,
  componentCount,
  totalWeight,
  processingTime,
}: StatusBarProps) {
  return (
    <StatusBarContainer>
      <StatusSection>
        <PipelineStatus $status={pipelineStatus}>
          {pipelineStatus === 'idle' && 'Ready'}
          {pipelineStatus === 'running' && (pipelineMessage || 'Processing...')}
          {pipelineStatus === 'success' && 'Complete'}
          {pipelineStatus === 'error' && 'Error'}
        </PipelineStatus>
      </StatusSection>

      <StatusSection>
        {componentCount !== undefined && (
          <StatusItem>
            <StatusLabel>Components:</StatusLabel>
            <StatusValue $highlight>{componentCount}</StatusValue>
          </StatusItem>
        )}

        {totalWeight !== undefined && (
          <StatusItem>
            <StatusLabel>Weight:</StatusLabel>
            <StatusValue>{totalWeight.toFixed(1)} kg</StatusValue>
          </StatusItem>
        )}

        {processingTime !== undefined && (
          <StatusItem>
            <StatusLabel>Time:</StatusLabel>
            <StatusValue>{processingTime}ms</StatusValue>
          </StatusItem>
        )}
      </StatusSection>
    </StatusBarContainer>
  );
}
