/**
 * Global Styles
 * CSS reset and base styles for MayhemAI
 */

import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

export const GlobalStyles = createGlobalStyle`
  /* CSS Reset */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* Root element */
  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.sizes.md};
    font-weight: ${theme.typography.weights.normal};
    line-height: 1.5;
    color: ${theme.colors.text.primary};
    background: ${theme.colors.bg.primary};
    overflow: hidden;
  }

  #root {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  /* Headings */
  h1, h2, h3, h4, h5, h6 {
    font-weight: ${theme.typography.weights.semibold};
    line-height: 1.2;
  }

  h1 { font-size: ${theme.typography.sizes['3xl']}; }
  h2 { font-size: ${theme.typography.sizes['2xl']}; }
  h3 { font-size: ${theme.typography.sizes.xl}; }
  h4 { font-size: ${theme.typography.sizes.lg}; }

  /* Links */
  a {
    color: ${theme.colors.accent.primary};
    text-decoration: none;
    transition: color ${theme.transitions.fast};

    &:hover {
      color: ${theme.colors.accent.secondary};
    }
  }

  /* Code */
  code, pre {
    font-family: ${theme.typography.monoFamily};
    font-size: ${theme.typography.sizes.sm};
  }

  pre {
    background: ${theme.colors.bg.tertiary};
    padding: ${theme.spacing.md};
    border-radius: ${theme.radius.md};
    overflow-x: auto;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${theme.colors.bg.secondary};
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.border.strong};
    border-radius: ${theme.radius.full};

    &:hover {
      background: ${theme.colors.text.tertiary};
    }
  }

  /* Selection */
  ::selection {
    background: ${theme.colors.accent.primary};
    color: ${theme.colors.bg.primary};
  }

  /* Focus outline */
  :focus-visible {
    outline: 2px solid ${theme.colors.accent.primary};
    outline-offset: 2px;
  }

  /* Remove focus outline for mouse users */
  :focus:not(:focus-visible) {
    outline: none;
  }

  /* Button reset */
  button {
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    border: none;
    background: none;
    color: inherit;
  }

  /* Input reset */
  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    background: transparent;
    border: none;

    &::placeholder {
      color: ${theme.colors.text.tertiary};
    }
  }

  /* Table reset */
  table {
    border-collapse: collapse;
    width: 100%;
  }

  /* List reset */
  ul, ol {
    list-style: none;
  }

  /* Image */
  img {
    max-width: 100%;
    height: auto;
    display: block;
  }

  /* Canvas - for Three.js */
  canvas {
    display: block;
  }
`;
