import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useHeyGenAvatar } from '@/hooks/useHeyGenAvatar';

type AvatarStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface AvatarContextValue {
  // User preference (persisted to localStorage)
  avatarEnabled: boolean;
  setAvatarEnabled: (enabled: boolean) => void;
  
  // Connection state
  status: AvatarStatus;
  isSpeaking: boolean;
  error: Error | null;
  
  // Methods
  speak: (text: string) => Promise<void>;
  interrupt: () => void;
  
  // Video element ref for WebRTC stream
  videoRef: React.RefObject<HTMLVideoElement>;
  
  // Audio mute control
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

const AvatarContext = createContext<AvatarContextValue | null>(null);

const STORAGE_KEY = 'tapaway-avatar-enabled';

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  // Load initial preference from localStorage (default: false for cost optimization)
  const [avatarEnabled, setAvatarEnabledState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });
  
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Use the HeyGen avatar hook
  const {
    status,
    isSpeaking,
    error,
    connect,
    disconnect,
    speak,
    interrupt,
  } = useHeyGenAvatar({ videoRef });
  
  // Persist preference to localStorage
  const setAvatarEnabled = useCallback((enabled: boolean) => {
    setAvatarEnabledState(enabled);
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch (e) {
      console.error('[AvatarContext] Failed to save preference:', e);
    }
  }, []);
  
  // Auto-connect/disconnect based on avatarEnabled
  useEffect(() => {
    if (avatarEnabled && status === 'idle') {
      console.log('[AvatarContext] Avatar enabled, connecting...');
      connect();
    } else if (!avatarEnabled && (status === 'connected' || status === 'connecting')) {
      console.log('[AvatarContext] Avatar disabled, disconnecting...');
      interrupt();
      disconnect();
    }
  }, [avatarEnabled, status, connect, disconnect, interrupt]);
  
  // Handle mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);
  
  // If connection fails, auto-disable avatar
  useEffect(() => {
    if (error && avatarEnabled) {
      console.error('[AvatarContext] Connection error, disabling avatar:', error);
      // Don't auto-disable - let user retry or manually disable
    }
  }, [error, avatarEnabled]);
  
  const value: AvatarContextValue = {
    avatarEnabled,
    setAvatarEnabled,
    status,
    isSpeaking,
    error,
    speak,
    interrupt,
    videoRef,
    isMuted,
    setIsMuted,
  };
  
  return (
    <AvatarContext.Provider value={value}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar(): AvatarContextValue {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error('useAvatar must be used within an AvatarProvider');
  }
  return context;
}

// Optional hook that returns null if not in provider (for conditional usage)
export function useAvatarOptional(): AvatarContextValue | null {
  return useContext(AvatarContext);
}
