/**
 * Header Component
 * Top bar with logo, status, and global actions
 */

import styled from 'styled-components';
import { theme } from '../../styles/theme';

const HeaderContainer = styled.header`
  height: ${theme.panels.headerHeight}px;
  background: ${theme.colors.gradients.header};
  border-bottom: 1px solid ${theme.colors.border.subtle};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${theme.spacing.lg};
  z-index: ${theme.zIndex.header};
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const Logo = styled.h1`
  font-size: ${theme.typography.sizes.xl};
  font-weight: ${theme.typography.weights.bold};
  background: ${theme.colors.gradients.accent};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Tagline = styled.span`
  font-size: ${theme.typography.sizes.sm};
  color: ${theme.colors.text.secondary};

  @media (max-width: 768px) {
    display: none;
  }
`;

const StatusSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.lg};
`;

const StatusIndicator = styled.div<{ $status: 'ready' | 'loading' | 'error' }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.typography.sizes.sm};
  color: ${theme.colors.text.secondary};

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: ${theme.radius.full};
    background: ${({ $status }) => {
      switch ($status) {
        case 'ready': return theme.colors.accent.success;
        case 'loading': return theme.colors.accent.highlight;
        case 'error': return theme.colors.accent.error;
      }
    }};
    ${({ $status }) => $status === 'loading' && `
      animation: pulse 1.5s ease-in-out infinite;
    `}
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;

const ActionsSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${theme.radius.md};
  color: ${theme.colors.text.secondary};
  transition: all ${theme.transitions.fast};

  &:hover {
    background: ${theme.colors.bg.hover};
    color: ${theme.colors.text.primary};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

interface HeaderProps {
  kernelStatus: 'ready' | 'loading' | 'error';
}

export function Header({ kernelStatus }: HeaderProps) {
  return (
    <HeaderContainer>
      <LogoSection>
        <Logo>MayhemAI</Logo>
        <Tagline>AI-Powered Engineering Design</Tagline>
      </LogoSection>

      <StatusSection>
        <StatusIndicator $status={kernelStatus}>
          {kernelStatus === 'ready' && 'Engine Ready'}
          {kernelStatus === 'loading' && 'Loading Engine...'}
          {kernelStatus === 'error' && 'Engine Error'}
        </StatusIndicator>
      </StatusSection>

      <ActionsSection>
        <ActionButton title="Settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </ActionButton>
        <ActionButton title="Help">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </ActionButton>
      </ActionsSection>
    </HeaderContainer>
  );
}
