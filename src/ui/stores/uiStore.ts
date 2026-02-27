/**
 * UI Store
 * Manages UI state: panels, modals, notifications
 */

import { create } from 'zustand';
import { theme } from '../styles/theme';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  // Panel states
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  leftPanelWidth: number;
  rightPanelWidth: number;

  // Active tabs/sections
  inputTab: 'design' | 'environment' | 'settings';
  outputSection: string | null;

  // Modals
  activeModal: string | null;

  // Notifications
  notifications: Notification[];

  // Actions
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  setInputTab: (tab: 'design' | 'environment' | 'settings') => void;
  setOutputSection: (section: string | null) => void;
  showModal: (id: string) => void;
  hideModal: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  leftPanelWidth: theme.panels.defaultWidth,
  rightPanelWidth: theme.panels.defaultWidth,
  inputTab: 'design',
  outputSection: 'progress',
  activeModal: null,
  notifications: [],

  // Panel actions
  toggleLeftPanel: () => set((state) => ({
    leftPanelCollapsed: !state.leftPanelCollapsed,
  })),

  toggleRightPanel: () => set((state) => ({
    rightPanelCollapsed: !state.rightPanelCollapsed,
  })),

  setLeftPanelWidth: (width) => set({
    leftPanelWidth: Math.max(theme.panels.minWidth, Math.min(theme.panels.maxWidth, width)),
  }),

  setRightPanelWidth: (width) => set({
    rightPanelWidth: Math.max(theme.panels.minWidth, Math.min(theme.panels.maxWidth, width)),
  }),

  // Tab/section actions
  setInputTab: (tab) => set({ inputTab: tab }),
  setOutputSection: (section) => set({ outputSection: section }),

  // Modal actions
  showModal: (id) => set({ activeModal: id }),
  hideModal: () => set({ activeModal: null }),

  // Notification actions
  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = { ...notification, id };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove after duration (default 5 seconds)
    const duration = notification.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
  },

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
}));
