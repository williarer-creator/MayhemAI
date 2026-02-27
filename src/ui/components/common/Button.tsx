/**
 * Button Component
 * Styled button with variants
 */

import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

const sizeStyles = {
  sm: css`
    height: 32px;
    padding: 0 ${theme.spacing.md};
    font-size: ${theme.typography.sizes.sm};
    gap: ${theme.spacing.xs};
  `,
  md: css`
    height: 40px;
    padding: 0 ${theme.spacing.lg};
    font-size: ${theme.typography.sizes.md};
    gap: ${theme.spacing.sm};
  `,
  lg: css`
    height: 48px;
    padding: 0 ${theme.spacing.xl};
    font-size: ${theme.typography.sizes.lg};
    gap: ${theme.spacing.sm};
  `,
};

const variantStyles = {
  primary: css`
    background: ${theme.colors.gradients.accent};
    color: ${theme.colors.bg.primary};
    font-weight: ${theme.typography.weights.semibold};

    &:hover:not(:disabled) {
      box-shadow: ${theme.shadows.glow};
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  `,
  secondary: css`
    background: ${theme.colors.bg.tertiary};
    color: ${theme.colors.text.primary};
    border: 1px solid ${theme.colors.border.default};

    &:hover:not(:disabled) {
      background: ${theme.colors.bg.hover};
      border-color: ${theme.colors.border.strong};
    }
  `,
  ghost: css`
    background: transparent;
    color: ${theme.colors.text.secondary};

    &:hover:not(:disabled) {
      background: ${theme.colors.bg.hover};
      color: ${theme.colors.text.primary};
    }
  `,
  danger: css`
    background: ${theme.colors.accent.error};
    color: white;

    &:hover:not(:disabled) {
      background: #e53e3e;
      transform: translateY(-1px);
    }
  `,
};

export const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${theme.radius.md};
  font-weight: ${theme.typography.weights.medium};
  white-space: nowrap;
  transition: all ${theme.transitions.fast};
  cursor: pointer;

  ${({ size = 'md' }) => sizeStyles[size]}
  ${({ variant = 'primary' }) => variantStyles[variant]}
  ${({ fullWidth }) => fullWidth && css`width: 100%;`}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${({ loading }) => loading && css`
    position: relative;
    color: transparent !important;
    pointer-events: none;

    &::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: ${theme.radius.full};
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `}

  svg {
    width: 1em;
    height: 1em;
    flex-shrink: 0;
  }
`;

// Icon-only button variant
export const IconButton = styled.button<{ $size?: 'sm' | 'md' | 'lg' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${theme.radius.md};
  color: ${theme.colors.text.secondary};
  background: transparent;
  transition: all ${theme.transitions.fast};

  ${({ $size = 'md' }) => {
    const sizes = { sm: 28, md: 36, lg: 44 };
    const iconSizes = { sm: 14, md: 18, lg: 22 };
    return css`
      width: ${sizes[$size]}px;
      height: ${sizes[$size]}px;
      svg {
        width: ${iconSizes[$size]}px;
        height: ${iconSizes[$size]}px;
      }
    `;
  }}

  &:hover:not(:disabled) {
    background: ${theme.colors.bg.hover};
    color: ${theme.colors.text.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
