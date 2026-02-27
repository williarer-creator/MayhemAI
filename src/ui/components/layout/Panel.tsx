/**
 * Panel Component
 * Collapsible side panel with header and content
 */

import styled from 'styled-components';
import { theme } from '../../styles/theme';

const PanelContainer = styled.aside<{ $collapsed: boolean; $width: number; $side: 'left' | 'right' }>`
  width: ${({ $collapsed, $width }) => $collapsed ? theme.panels.collapsedWidth : $width}px;
  min-width: ${({ $collapsed }) => $collapsed ? theme.panels.collapsedWidth : theme.panels.minWidth}px;
  max-width: ${theme.panels.maxWidth}px;
  height: 100%;
  background: ${theme.colors.bg.secondary};
  border-${({ $side }) => $side === 'left' ? 'right' : 'left'}: 1px solid ${theme.colors.border.subtle};
  display: flex;
  flex-direction: column;
  transition: width ${theme.transitions.normal};
  overflow: hidden;
`;

const PanelHeader = styled.div<{ $collapsed: boolean }>`
  height: 48px;
  padding: ${({ $collapsed }) => $collapsed ? '0' : `0 ${theme.spacing.md}`};
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => $collapsed ? 'center' : 'space-between'};
  border-bottom: 1px solid ${theme.colors.border.subtle};
  flex-shrink: 0;
`;

const PanelTitle = styled.h2<{ $collapsed: boolean }>`
  font-size: ${theme.typography.sizes.sm};
  font-weight: ${theme.typography.weights.semibold};
  color: ${theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  opacity: ${({ $collapsed }) => $collapsed ? 0 : 1};
  transition: opacity ${theme.transitions.fast};
`;

const CollapseButton = styled.button<{ $side: 'left' | 'right'; $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${theme.radius.sm};
  color: ${theme.colors.text.tertiary};
  transition: all ${theme.transitions.fast};
  flex-shrink: 0;

  &:hover {
    background: ${theme.colors.bg.hover};
    color: ${theme.colors.text.primary};
  }

  svg {
    width: 16px;
    height: 16px;
    transform: ${({ $side, $collapsed }) => {
      if ($side === 'left') {
        return $collapsed ? 'rotate(0deg)' : 'rotate(180deg)';
      }
      return $collapsed ? 'rotate(180deg)' : 'rotate(0deg)';
    }};
    transition: transform ${theme.transitions.fast};
  }
`;

const PanelContent = styled.div<{ $collapsed: boolean }>`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: ${({ $collapsed }) => $collapsed ? '0' : theme.spacing.md};
  opacity: ${({ $collapsed }) => $collapsed ? 0 : 1};
  pointer-events: ${({ $collapsed }) => $collapsed ? 'none' : 'auto'};
  transition: opacity ${theme.transitions.fast}, padding ${theme.transitions.normal};
`;

interface PanelProps {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  side: 'left' | 'right';
  width: number;
  children: React.ReactNode;
}

export function Panel({ title, collapsed, onToggle, side, width, children }: PanelProps) {
  return (
    <PanelContainer $collapsed={collapsed} $width={width} $side={side}>
      <PanelHeader $collapsed={collapsed}>
        {side === 'left' && (
          <>
            <PanelTitle $collapsed={collapsed}>{title}</PanelTitle>
            <CollapseButton
              $side={side}
              $collapsed={collapsed}
              onClick={onToggle}
              title={collapsed ? 'Expand panel' : 'Collapse panel'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </CollapseButton>
          </>
        )}
        {side === 'right' && (
          <>
            <CollapseButton
              $side={side}
              $collapsed={collapsed}
              onClick={onToggle}
              title={collapsed ? 'Expand panel' : 'Collapse panel'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </CollapseButton>
            <PanelTitle $collapsed={collapsed}>{title}</PanelTitle>
          </>
        )}
      </PanelHeader>
      <PanelContent $collapsed={collapsed}>
        {children}
      </PanelContent>
    </PanelContainer>
  );
}
