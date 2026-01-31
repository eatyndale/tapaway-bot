import { useState, useCallback, useRef, useEffect } from 'react';
import StreamingAvatar, { AvatarQuality, StreamingEvents } from '@heygen/streaming-avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type AvatarStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface UseHeyGenAvatarOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
}

interface UseHeyGenAvatarReturn {
  status: AvatarStatus;
  isSpeaking: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  speak: (text: string) => Promise<void>;
  interrupt: () => void;
}

// Speech queue item
interface SpeechQueueItem {
  text: string;
  resolve: () => void;
  reject: (error: Error) => void;
}

export function useHeyGenAvatar({ videoRef }: UseHeyGenAvatarOptions): UseHeyGenAvatarReturn {
  const [status, setStatus] = useState<AvatarStatus>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const speechQueueRef = useRef<SpeechQueueItem[]>([]);
  const isProcessingQueueRef = useRef(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const IDLE_DISCONNECT_MS = 2 * 60 * 1000; // 2 minutes
  
  // Reset idle timer
  const resetIdleTimer = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    idleTimeoutRef.current = setTimeout(() => {
      console.log('[useHeyGenAvatar] Idle timeout - disconnecting to save costs');
      disconnect();
      toast({
        title: "Avatar Disconnected",
        description: "Disconnected due to inactivity. Toggle avatar on to reconnect.",
      });
    }, IDLE_DISCONNECT_MS);
  }, []);
  
  // Process speech queue
  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || speechQueueRef.current.length === 0) {
      return;
    }
    
    if (!avatarRef.current || status !== 'connected') {
      // Clear queue if not connected
      speechQueueRef.current.forEach(item => 
        item.reject(new Error('Avatar not connected'))
      );
      speechQueueRef.current = [];
      return;
    }
    
    isProcessingQueueRef.current = true;
    const item = speechQueueRef.current.shift();
    
    if (!item) {
      isProcessingQueueRef.current = false;
      return;
    }
    
    try {
      setIsSpeaking(true);
      resetIdleTimer();
      
      // Clean text for speech (remove markdown, emojis, etc.)
      const cleanText = item.text
        .replace(/\*\*/g, '') // Remove bold
        .replace(/\*/g, '') // Remove italics
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`/g, '') // Remove inline code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
        .replace(/[^\w\s.,!?'-]/g, ' ') // Remove special chars except punctuation
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      if (!cleanText) {
        item.resolve();
        isProcessingQueueRef.current = false;
        processQueue();
        return;
      }
      
      console.log('[useHeyGenAvatar] Speaking:', cleanText.substring(0, 50) + '...');
      await avatarRef.current.speak({ text: cleanText });
      
      item.resolve();
    } catch (e) {
      console.error('[useHeyGenAvatar] Speech error:', e);
      item.reject(e instanceof Error ? e : new Error('Speech failed'));
    } finally {
      setIsSpeaking(false);
      isProcessingQueueRef.current = false;
      // Process next item in queue
      processQueue();
    }
  }, [status, resetIdleTimer]);
  
  // Connect to HeyGen
  const connect = useCallback(async () => {
    if (status === 'connecting' || status === 'connected') {
      console.log('[useHeyGenAvatar] Already connecting/connected');
      return;
    }
    
    setStatus('connecting');
    setError(null);
    
    try {
      console.log('[useHeyGenAvatar] Getting token via edge function...');
      
      // Get access token from edge function
      const { data, error: fnError } = await supabase.functions.invoke('heygen-session', {
        body: { action: 'create_token' },
      });
      
      if (fnError) {
        throw new Error(fnError.message || 'Failed to get token');
      }
      
      if (!data?.token) {
        throw new Error('Invalid token response');
      }
      
      console.log('[useHeyGenAvatar] Token received, initializing SDK...');
      
      // Initialize StreamingAvatar SDK with the token
      const avatar = new StreamingAvatar({ token: data.token });
      avatarRef.current = avatar;
      
      // Set up event handlers
      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log('[useHeyGenAvatar] Stream ready');
        if (videoRef.current && event.detail) {
          videoRef.current.srcObject = event.detail;
          videoRef.current.play().catch(e => console.error('Video play failed:', e));
        }
        setStatus('connected');
        resetIdleTimer();
        
        toast({
          title: "Avatar Connected",
          description: "AI avatar is ready to speak.",
        });
      });
      
      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('[useHeyGenAvatar] Stream disconnected');
        setStatus('idle');
        avatarRef.current = null;
        sessionIdRef.current = null;
      });
      
      // Start the avatar session - SDK handles everything internally
      const sessionInfo = await avatar.createStartAvatar({
        quality: AvatarQuality.Medium,
        avatarName: 'Anna_public_3_20240108',
      });
      
      sessionIdRef.current = sessionInfo?.session_id || null;
      console.log('[useHeyGenAvatar] Avatar session started:', sessionIdRef.current);
      
    } catch (e) {
      console.error('[useHeyGenAvatar] Connection error:', e);
      setStatus('error');
      setError(e instanceof Error ? e : new Error('Connection failed'));
      avatarRef.current = null;
      sessionIdRef.current = null;
      
      toast({
        variant: "destructive",
        title: "Avatar Connection Failed",
        description: "Continuing with text-only mode.",
      });
    }
  }, [status, videoRef, resetIdleTimer]);
  
  // Disconnect from HeyGen
  const disconnect = useCallback(async () => {
    console.log('[useHeyGenAvatar] Disconnecting...');
    
    // Clear idle timer
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    
    // Clear speech queue
    speechQueueRef.current.forEach(item => 
      item.reject(new Error('Disconnected'))
    );
    speechQueueRef.current = [];
    isProcessingQueueRef.current = false;
    
    // Stop avatar
    if (avatarRef.current) {
      try {
        await avatarRef.current.stopAvatar();
      } catch (e) {
        console.error('[useHeyGenAvatar] Error stopping avatar:', e);
      }
      avatarRef.current = null;
    }
    
    // Close session via edge function
    if (sessionIdRef.current) {
      try {
        await supabase.functions.invoke('heygen-session', {
          body: { action: 'close', sessionId: sessionIdRef.current },
        });
      } catch (e) {
        console.error('[useHeyGenAvatar] Error closing session:', e);
      }
      sessionIdRef.current = null;
    }
    
    // Clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setStatus('idle');
    setIsSpeaking(false);
    setError(null);
  }, [videoRef]);
  
  // Add text to speech queue
  const speak = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;
    
    return new Promise((resolve, reject) => {
      speechQueueRef.current.push({ text, resolve, reject });
      processQueue();
    });
  }, [processQueue]);
  
  // Interrupt current speech and clear queue
  const interrupt = useCallback(() => {
    console.log('[useHeyGenAvatar] Interrupting speech');
    
    // Clear queue
    speechQueueRef.current.forEach(item => 
      item.reject(new Error('Interrupted'))
    );
    speechQueueRef.current = [];
    isProcessingQueueRef.current = false;
    
    // Interrupt avatar
    if (avatarRef.current) {
      avatarRef.current.interrupt().catch(e => 
        console.error('[useHeyGenAvatar] Interrupt error:', e)
      );
    }
    
    setIsSpeaking(false);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);
  
  return {
    status,
    isSpeaking,
    error,
    connect,
    disconnect,
    speak,
    interrupt,
  };
}
