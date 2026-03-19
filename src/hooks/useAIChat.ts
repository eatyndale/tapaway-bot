import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseService, UserProfile } from '@/services/supabaseService';
import { ChatState, Message, SessionType } from '@/components/anxiety-bot/types';
import { SecureStorage } from '@/utils/secureStorage';
import { SpellChecker } from '@/utils/spellChecker';

interface SessionContext {
  problem?: string;
  feeling?: string;
  bodyLocation?: string;
  initialIntensity?: number;
  currentIntensity?: number;
  round?: number;
  setupStatements?: string[];
  reminderPhrases?: string[];
  aiReminderPhrases?: string[];
  statementOrder?: number[];
  tappingSessionId?: string;
  roundsWithoutReduction?: number;
  previousIntensities?: number[];
  reminderPhraseType?: 'acknowledging' | 'partial-release' | 'full-release';
  deepeningLevel?: number;
  returningFromTapping?: boolean;
  isDeepening?: boolean;
  deepeningAttempts?: number;
  totalRoundsWithoutReduction?: number;
  isDeepeningEntry?: boolean;
  deepeningQuestionCount?: number;
  // New fields for revised logic
  isTearlessTrauma?: boolean;
  peakSuds?: number;
  supportContacted?: boolean;
  quietIntegrationUsed?: boolean;
  sessionType?: SessionType;
  highSudsRounds?: number;
  bodyBasedRoundDone?: boolean;
  loopRounds?: number;
}

interface Directive {
  next_state?: string;
  tapping_point?: number | null;
  setup_statements?: string[] | null;
  statement_order?: number[] | null;
  say_index?: number | null;
  collect?: string | null;
  notes?: string;
}

interface UseAIChatProps {
  onStateChange: (state: ChatState) => void;
  onSessionUpdate: (context: SessionContext) => void;
  onCrisisDetected?: () => void;
  onTypoCorrection?: (original: string, corrected: string) => void;
}

// Directive parsing
const DIRECTIVE_RE = /<<DIRECTIVE\s+(\{[\s\S]*?\})>>+/;
const DIRECTIVE_FALLBACK_RE = /<<DIRECTIVE\s+(\{[\s\S]*?\})\}+/;
const DIRECTIVE_STRIP_RE = /<<DIRECTIVE\s+\{[\s\S]*?\}[\}>]+/g;

function parseDirective(text: string): Directive | null {
  let m = text.match(DIRECTIVE_RE);
  if (!m) {
    m = text.match(DIRECTIVE_FALLBACK_RE);
  }
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch (e) {
    console.error('[parseDirective] Failed:', e);
    return null;
  }
}

const extractSetupStatements = (response: string): string[] => {
  const statements: string[] = [];
  const lines = response.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('"Even though') && trimmed.endsWith('"')) {
      statements.push(trimmed.slice(1, -1));
    } else if (trimmed.startsWith('Even though')) {
      statements.push(trimmed);
    }
  }
  return statements;
};

// TTT generic setup statements
const TEARLESS_SETUP_STATEMENTS = [
  "Even though I have this intensity in my system, I'm open to calming now.",
  "This wave of feeling, I'm allowing myself to settle.",
  "This activation in my body, I choose to be present."
];

const TEARLESS_REMINDER_PHRASES = [
  "This intensity in my body, but I'm allowing calm.",
  "This activation, I'm choosing to be present.",
  "This energy in my system, and I'm safe right now.",
  "Whatever I'm carrying, I'm letting it soften.",
  "This feeling in my body, and I'm okay.",
  "I don't need to name it, I'm just allowing it to move.",
  "This intensity, and I'm choosing peace.",
  "Whatever this is, I'm letting it settle."
];

export const useAIChat = ({ onStateChange, onSessionUpdate, onCrisisDetected, onTypoCorrection }: UseAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatSession, setCurrentChatSession] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sessionContext, setSessionContext] = useState<SessionContext>({});
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [currentTappingPoint, setCurrentTappingPoint] = useState(0);
  const [intensityHistory, setIntensityHistory] = useState<number[]>([]);

  // Refs to allow persistMessages to always see latest values
  const currentChatSessionRef = useRef<string | null>(null);
  useEffect(() => { currentChatSessionRef.current = currentChatSession; }, [currentChatSession]);

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      initializeChatSession();
    }
  }, [userProfile]);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { profile } = await supabaseService.getProfile(user.id);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // ─── Centralized transcript persistence ───
  // Call this after every setMessages / setConversationHistory update
  // Pass the new messages array directly so we don't rely on stale state
  const persistMessages = useCallback(async (msgs: Message[]) => {
    const sid = currentChatSessionRef.current;
    if (!sid) return;
    try {
      await supabaseService.updateChatSession(sid, { messages: msgs });
    } catch (err) {
      console.error('[persistMessages] failed:', err);
    }
  }, []);

  // Helper: append messages to state AND persist
  const appendAndPersist = useCallback(async (...newMsgs: Message[]) => {
    let updated: Message[] = [];
    setMessages(prev => {
      updated = [...prev, ...newMsgs];
      return updated;
    });
    setConversationHistory(prev => [...prev, ...newMsgs]);
    // Allow React state to settle, then persist with the computed value
    await persistMessages([...messages, ...newMsgs]);
  }, [messages, persistMessages]);

  // ─── Centralized round registration ───
  // Called every time a new set of setup statements is generated
  const registerNewRound = useCallback(async (
    ctx: SessionContext,
    newRoundNumber: number
  ) => {
    if (ctx.tappingSessionId) {
      await supabaseService.updateTappingSession(ctx.tappingSessionId, {
        rounds_completed: newRoundNumber,
        final_intensity: ctx.currentIntensity ?? ctx.initialIntensity ?? 0
      });
    }
  }, []);

  const initializeChatSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { profile } = await supabaseService.getProfile(user.id);
        const { session } = await supabaseService.getOrCreateChatSession(
          user.id,
          profile?.industry || null,
          profile?.age_group || null
        );
        if (session) {
          setCurrentChatSession(session.id);
          if (session.messages && Array.isArray(session.messages) && session.messages.length > 0) {
            const existingMessages = session.messages.map((msg: any, index: number) => ({
              id: msg.id || `msg-${index}`,
              type: msg.type,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              sessionId: session.id
            }));
            setMessages(existingMessages);
            setConversationHistory(existingMessages);
          } else {
            createInitialGreeting(session.id);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing chat session:', error);
    }
  };

  // REVISED: Greeting now asks for SUDS immediately
  const createInitialGreeting = (sessionId: string) => {
    const greetingMessage: Message = {
      id: `greeting-${Date.now()}`,
      type: 'bot',
      content: `Hello ${userProfile?.first_name || 'there'}! 💙 I'm here to help you work through what you're feeling using EFT tapping.\n\nBefore we begin, how are you feeling right now? On a scale of 0 to 10, how intense is your distress?`,
      timestamp: new Date(),
      sessionId: sessionId
    };
    const msgs = [greetingMessage];
    setMessages(msgs);
    setConversationHistory(msgs);
    // Persist greeting
    persistMessages(msgs);
  };

  // NEW: Handle the initial SUDS rating and branch to the correct path
  const handleGreetingIntensity = useCallback(async (intensity: number) => {
    console.log('[useAIChat] Greeting intensity received:', intensity);
    
    const peakSuds = intensity;
    
    // Add user message showing rating
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: `${intensity}/10`,
      timestamp: new Date(),
      sessionId: currentChatSession || undefined
    };
    const msgsAfterUser = [...messages, userMsg];
    setMessages(msgsAfterUser);
    setConversationHistory(prev => [...prev, userMsg]);
    setIntensityHistory([intensity]);

    // PATH C: SUDS 0 → Quiet Integration
    if (intensity === 0) {
      console.log('[useAIChat] PATH C: SUDS 0 → Quiet Integration');
      
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: "That's wonderful — you're already in a calm place. 🌿 Let's take a moment of quiet integration to deepen that sense of peace.",
        timestamp: new Date(),
        sessionId: currentChatSession || undefined
      };
      const allMsgs = [...msgsAfterUser, botMsg];
      setMessages(allMsgs);
      setConversationHistory(prev => [...prev, botMsg]);
      await persistMessages(allMsgs);
      
      const ctx: SessionContext = {
        initialIntensity: 0,
        currentIntensity: 0,
        peakSuds: 0,
        sessionType: 'traditional',
        quietIntegrationUsed: true,
        round: 0
      };
      setSessionContext(ctx);
      onSessionUpdate(ctx);
      onStateChange('quiet-integration');
      return;
    }

    // PATH B: SUDS 8-10 → Tearless Trauma Therapy
    if (intensity >= 8) {
      console.log('[useAIChat] PATH B: SUDS 8-10 → Tearless Trauma Therapy');
      
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: "I can feel that intensity is really high right now. You don't need to tell me what's going on — we're going to do some gentle tapping together. Just breathe. You're safe here. 💙\n\nLet's start with some grounding: feel your feet on the ground. Notice one thing you can see. Take a slow breath in... and out.",
        timestamp: new Date(),
        sessionId: currentChatSession || undefined
      };
      const allMsgs = [...msgsAfterUser, botMsg];
      setMessages(allMsgs);
      setConversationHistory(prev => [...prev, botMsg]);
      await persistMessages(allMsgs);
      
      // Create tapping session with generic data
      const { data: { user } } = await supabase.auth.getUser();
      let tappingSessionId: string | undefined;
      if (user) {
        const { profile } = await supabaseService.getProfile(user.id);
        const { session: tappingSession } = await supabaseService.createTappingSession(user.id, {
          problem: 'High intensity activation',
          feeling: 'intense distress',
          body_location: 'body',
          initial_intensity: intensity,
          industry: profile?.industry || null,
          age_group: profile?.age_group || null,
          session_type: 'tearless',
          is_tearless_trauma: true,
          peak_suds: intensity
        });
        if (tappingSession) tappingSessionId = tappingSession.id;
      }
      
      const ctx: SessionContext = {
        problem: 'High intensity activation',
        feeling: 'intense distress',
        bodyLocation: 'body',
        initialIntensity: intensity,
        currentIntensity: intensity,
        peakSuds: intensity,
        isTearlessTrauma: true,
        sessionType: 'tearless',
        round: 1,
        setupStatements: TEARLESS_SETUP_STATEMENTS,
        aiReminderPhrases: TEARLESS_REMINDER_PHRASES,
        statementOrder: [0, 1, 2, 0, 1, 2, 1, 0],
        reminderPhraseType: 'acknowledging',
        highSudsRounds: 0,
        tappingSessionId
      };
      setSessionContext(ctx);
      onSessionUpdate(ctx);
      setCurrentTappingPoint(0);
      
      // Register round 1 for TTT
      await registerNewRound(ctx, 1);
      
      // Go directly to setup (karate chop)
      onStateChange('setup');
      return;
    }

    // PATH A: SUDS 1-7 → Traditional EFT (conversation flow)
    console.log('[useAIChat] PATH A: SUDS 1-7 → Traditional EFT conversation');
    
    const ctx: SessionContext = {
      initialIntensity: intensity,
      currentIntensity: intensity,
      peakSuds: intensity,
      sessionType: 'traditional',
      round: 0
    };
    setSessionContext(ctx);
    onSessionUpdate(ctx);
    
    const botMsg: Message = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      content: `Got it — ${intensity}/10. Thanks for sharing that. 💙\n\nNow tell me, what's been weighing on you lately? What's brought that ${intensity > 4 ? 'intensity' : 'feeling'} up?`,
      timestamp: new Date(),
      sessionId: currentChatSession || undefined
    };
    const allMsgs = [...msgsAfterUser, botMsg];
    setMessages(allMsgs);
    setConversationHistory(prev => [...prev, botMsg]);
    await persistMessages(allMsgs);
    
    onStateChange('conversation');
  }, [currentChatSession, userProfile, messages, onStateChange, onSessionUpdate, persistMessages, registerNewRound]);

  // Handle Quiet Integration completion
  const handleQuietIntegrationComplete = useCallback(async (response: 'settled' | 'returned' | 'unsure') => {
    console.log('[useAIChat] Quiet Integration response:', response);
    
    const updatedContext = {
      ...sessionContext,
      quietIntegrationUsed: true
    };
    setSessionContext(updatedContext);
    onSessionUpdate(updatedContext);

    if (response === 'settled') {
      // Offer another round or end
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: "That's lovely to hear. 🌿 You've done wonderful work today.",
        timestamp: new Date(),
        sessionId: currentChatSession || undefined
      };
      const allMsgs = [...messages, botMsg];
      setMessages(allMsgs);
      setConversationHistory(prev => [...prev, botMsg]);
      await persistMessages(allMsgs);
      
      // If this was initial SUDS 0, go to advice
      if (sessionContext.initialIntensity === 0) {
        onStateChange('advice');
        await sendMessage(
          `I feel settled. My intensity is 0/10.`,
          'advice',
          { currentIntensity: 0 }
        );
      } else {
        // Complete and go to advice
        if (sessionContext.tappingSessionId) {
          await completeTappingSession(sessionContext.currentIntensity || 0);
        }
        onStateChange('advice');
        await sendMessage(
          `I feel settled after quiet integration. My final intensity is ${sessionContext.currentIntensity || 0}/10. Initial was ${sessionContext.initialIntensity}/10.`,
          'advice',
          { currentIntensity: sessionContext.currentIntensity || 0 }
        );
      }
    } else if (response === 'returned') {
      // Return to tapping flow
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: "That's perfectly okay — let's work with what's come back. We'll do another round of tapping. 💙",
        timestamp: new Date(),
        sessionId: currentChatSession || undefined
      };
      const allMsgs = [...messages, botMsg];
      setMessages(allMsgs);
      setConversationHistory(prev => [...prev, botMsg]);
      await persistMessages(allMsgs);
      
      // If we have session data, start a new tapping round
      if (sessionContext.setupStatements && sessionContext.setupStatements.length > 0) {
        await startNewTappingRound(sessionContext.currentIntensity || 3, sessionContext.reminderPhraseType);
      } else {
        // Go to conversation to gather info
        onStateChange('conversation');
      }
    } else {
      // 'unsure' → another Quiet Integration round
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: "That's completely fine. Let's take another quiet moment together. 🌿",
        timestamp: new Date(),
        sessionId: currentChatSession || undefined
      };
      const allMsgs = [...messages, botMsg];
      setMessages(allMsgs);
      setConversationHistory(prev => [...prev, botMsg]);
      await persistMessages(allMsgs);
      
      onStateChange('quiet-integration');
    }
  }, [sessionContext, currentChatSession, messages, onStateChange, onSessionUpdate, persistMessages]);

  const sendMessage = useCallback(async (
    userMessage: string, 
    chatState: ChatState,
    additionalContext?: Partial<SessionContext>
  ) => {
    if (!userProfile || !currentChatSession) return;

    setIsLoading(true);

    const correctionResult = SpellChecker.correctWithFuzzyMatching(userMessage);
    let processedMessage = correctionResult.corrected;
    
    if (correctionResult.changes.length > 0 && onTypoCorrection) {
      onTypoCorrection(userMessage, processedMessage);
    }

    const isDeepeningEntryRequest = (additionalContext as any)?.isDeepeningEntry === true;
    
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
      sessionId: currentChatSession
    };

    const updatedMessages = isDeepeningEntryRequest ? [...messages] : [...messages, userMsg];
    if (!isDeepeningEntryRequest) {
      setMessages(updatedMessages);
    }

    const requestContext = { ...sessionContext, ...additionalContext };
    const persistedContext = { ...requestContext };
    delete persistedContext.isDeepeningEntry;

    // Intercept post-tapping/breathing intensity
    if ((chatState === 'post-tapping' || chatState === 'tapping-breathing') && additionalContext?.currentIntensity !== undefined) {
      setSessionContext(persistedContext);
      onSessionUpdate(persistedContext);
      
      const newHistory = [...intensityHistory, additionalContext.currentIntensity];
      setIntensityHistory(newHistory);
      
      const intensityMsg: Message = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: userMessage,
        timestamp: new Date(),
        sessionId: currentChatSession
      };
      const msgsWithIntensity = [...messages, intensityMsg];
      setMessages(msgsWithIntensity);
      await persistMessages(msgsWithIntensity);
      
      await handlePostTappingIntensity(additionalContext.currentIntensity);
      setIsLoading(false);
      return;
    }
    
    if (additionalContext?.currentIntensity !== undefined) {
      const newHistory = [...intensityHistory, additionalContext.currentIntensity];
      setIntensityHistory(newHistory);
    }
    
    // Create tapping session when initial intensity is collected (Path A only)
    if (chatState === 'gathering-intensity' && additionalContext?.initialIntensity) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && persistedContext.problem && persistedContext.feeling && persistedContext.bodyLocation) {
        const { profile } = await supabaseService.getProfile(user.id);
        const { session: tappingSession } = await supabaseService.createTappingSession(user.id, {
          problem: persistedContext.problem,
          feeling: persistedContext.feeling,
          body_location: persistedContext.bodyLocation,
          initial_intensity: additionalContext.initialIntensity,
          industry: profile?.industry || null,
          age_group: profile?.age_group || null,
          session_type: persistedContext.sessionType || 'traditional',
          is_tearless_trauma: persistedContext.isTearlessTrauma || false,
          peak_suds: persistedContext.peakSuds || additionalContext.initialIntensity
        });
        if (tappingSession) {
          persistedContext.tappingSessionId = tappingSession.id;
          persistedContext.round = 1;
        }
      }
    }
    
    setSessionContext(persistedContext);
    onSessionUpdate(persistedContext);

    try {
      const lastAssistantMessage = conversationHistory
        .filter(m => m.type === 'bot')
        .slice(-1)[0]?.content || '';
      
      const { data, error } = await supabase.functions.invoke('eft-chat', {
        body: {
          message: processedMessage,
          chatState,
          userName: userProfile.first_name,
          sessionContext: requestContext,
          conversationHistory: conversationHistory.slice(-20),
          currentTappingPoint,
          intensityHistory,
          lastAssistantMessage
        }
      });

      if (error) throw error;

      const directive = parseDirective(data.response);
      let visibleContent = data.response.replace(DIRECTIVE_STRIP_RE, '').trim();
      
      if (!visibleContent || visibleContent.length === 0) {
        visibleContent = "I'm here with you. Can you tell me a bit more about what you're experiencing?";
      }
      
      // Strip leaked setup statements
      if (directive?.next_state === 'setup' && directive.setup_statements) {
        visibleContent = visibleContent
          .replace(/\d+\.\s*"?Even though[^"]*"?\.?\s*/gi, '')
          .replace(/\d+\.\s*Even though[^.]*\.\s*/gi, '')
          .replace(/Even though[^.]*deeply and completely accept myself[^.]*\.?\s*/gi, '')
          .replace(/Shall we start tapping on these\??/gi, '')
          .replace(/Here are some new setup statements[^:]*:\s*/gi, '')
          .replace(/Let's tap on this new layer[^.]*\.\s*/gi, "Let's tap on this new layer.")
          .trim();
      }

      // Use cleaned extracted values from edge function
      if (data.extractedContext) {
        if (data.extractedContext.problem) persistedContext.problem = data.extractedContext.problem;
        if (data.extractedContext.feeling) persistedContext.feeling = data.extractedContext.feeling;
        if (data.extractedContext.bodyLocation) persistedContext.bodyLocation = data.extractedContext.bodyLocation;
        if (data.extractedContext.currentIntensity !== undefined) {
          persistedContext.currentIntensity = data.extractedContext.currentIntensity;
        }
        if (data.extractedContext.deepeningQuestionCount !== undefined) {
          persistedContext.deepeningQuestionCount = data.extractedContext.deepeningQuestionCount;
        }
        // FIX: Never overwrite initialIntensity after it's been set during greeting
        // initialIntensity is immutable once set by handleGreetingIntensity
        if (data.extractedContext.initialIntensity !== undefined && !persistedContext.initialIntensity) {
          persistedContext.initialIntensity = data.extractedContext.initialIntensity;
        }
        setSessionContext(persistedContext);
        onSessionUpdate(persistedContext);
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        type: 'bot',
        content: visibleContent,
        timestamp: new Date(),
        sessionId: currentChatSession
      };

      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);
      setConversationHistory(finalMessages);

      if (directive) {
        const next = directive.next_state;
        
        if ((next === 'setup' || next === 'tapping-point') && directive.setup_statements) {
          const setupStatements = directive.setup_statements ?? persistedContext.setupStatements ?? [];
          const statementOrder = directive.statement_order ?? persistedContext.statementOrder ?? [0, 1, 2, 0, 1, 2, 1, 0];
          const aiReminderPhrases = (directive as any).reminder_phrases ?? persistedContext.aiReminderPhrases ?? null;
          persistedContext.setupStatements = setupStatements;
          persistedContext.statementOrder = statementOrder;
          if (aiReminderPhrases) {
            (persistedContext as any).aiReminderPhrases = aiReminderPhrases;
          }
          
          // Create tapping session if transitioning to setup from conversation (Path A skip)
          if (next === 'setup' && !persistedContext.tappingSessionId && persistedContext.problem && persistedContext.feeling && persistedContext.bodyLocation) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { profile } = await supabaseService.getProfile(user.id);
              const initialIntensity = persistedContext.initialIntensity || persistedContext.currentIntensity || 5;
              const { session: tappingSession } = await supabaseService.createTappingSession(user.id, {
                problem: persistedContext.problem,
                feeling: persistedContext.feeling,
                body_location: persistedContext.bodyLocation,
                initial_intensity: initialIntensity,
                industry: profile?.industry || null,
                age_group: profile?.age_group || null,
                session_type: persistedContext.sessionType || 'traditional',
                is_tearless_trauma: persistedContext.isTearlessTrauma || false,
                peak_suds: persistedContext.peakSuds || initialIntensity
              });
              if (tappingSession) {
                persistedContext.tappingSessionId = tappingSession.id;
              }
            }
          }

          // Register round 1 for traditional path (setup statements generated)
          const newRound = (persistedContext.round || 0) + 1;
          persistedContext.round = newRound;
          
          setSessionContext(persistedContext);
          onSessionUpdate(persistedContext);

          // Persist round count
          await registerNewRound(persistedContext, newRound);
          
          if (next === 'setup') {
            setCurrentTappingPoint(0);
          }
        }

        if (next === 'tapping-point' && typeof directive.tapping_point === 'number') {
          setCurrentTappingPoint(directive.tapping_point);
        }

        if (next && next !== chatState) {
          onStateChange(next as ChatState);
        }
      } else {
        // Fallback logic
        if (visibleContent.includes('Even though')) {
          const setupStatements = extractSetupStatements(visibleContent);
          if (setupStatements.length > 0) {
            persistedContext.setupStatements = setupStatements;
            // Register round for fallback path too
            const newRound = (persistedContext.round || 0) + 1;
            persistedContext.round = newRound;
            setSessionContext(persistedContext);
            onSessionUpdate(persistedContext);
            await registerNewRound(persistedContext, newRound);
          }
        }

        const nextState = determineNextState(chatState, visibleContent);
        if (nextState && nextState !== chatState) {
          onStateChange(nextState);
        }
      }

      // Persist transcript
      await persistMessages(finalMessages);

      // Update crisis detection
      if (data.crisisDetected) {
        await supabaseService.updateChatSession(currentChatSession, {
          crisis_detected: true
        });
        setCrisisDetected(true);
        onCrisisDetected?.();
        onStateChange('complete');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        type: 'bot',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        sessionId: currentChatSession
      };
      const errorMsgs = [...messages, errorMsg];
      setMessages(prev => [...prev, errorMsg]);
      await persistMessages(errorMsgs);
    } finally {
      setIsLoading(false);
    }
  }, [messages, userProfile, currentChatSession, sessionContext, conversationHistory, onStateChange, onSessionUpdate, onCrisisDetected, persistMessages, registerNewRound]);

  const convertEmotionToNoun = (emotion: string): string => {
    const lower = emotion.toLowerCase().trim();
    const map: Record<string, string> = {
      'anxious': 'anxiety', 'sad': 'sadness', 'stressed': 'stress',
      'overwhelmed': 'overwhelm', 'tired': 'tiredness', 'exhausted': 'exhaustion',
      'worried': 'worry', 'scared': 'fear', 'afraid': 'fear',
      'frustrated': 'frustration', 'angry': 'anger', 'depressed': 'depression',
      'nervous': 'nervousness', 'lonely': 'loneliness', 'hopeless': 'hopelessness',
      'helpless': 'helplessness', 'panicked': 'panic', 'terrified': 'terror',
      'disappointed': 'disappointment', 'guilty': 'guilt', 'ashamed': 'shame',
      'embarrassed': 'embarrassment', 'jealous': 'jealousy', 'resentful': 'resentment',
      'bitter': 'bitterness', 'insecure': 'insecurity', 'confused': 'confusion'
    };
    if (map[lower]) return map[lower];
    if (lower.endsWith('ness') || lower.endsWith('tion') || lower.endsWith('ment') || 
        lower.endsWith('ity') || lower.endsWith('ion')) return lower;
    return `${emotion} feeling`;
  };

  const startNewTappingRound = useCallback(async (currentIntensity: number, phraseType?: 'acknowledging' | 'partial-release' | 'full-release') => {
    console.log('[useAIChat] Starting new tapping round with intensity:', currentIntensity);
    
    const feeling = sessionContext.feeling || 'this feeling';
    const bodyLocation = sessionContext.bodyLocation || 'my body';
    const problem = sessionContext.problem || 'this issue';
    const isTTT = sessionContext.isTearlessTrauma;
    
    // HIGH-SUDS SAFETY FALLBACK: If intensity is 8+ use vague tearless phrases
    // regardless of whether the session started as traditional
    const useVaguePhrases = isTTT || currentIntensity >= 8;
    
    const determinedPhraseType = phraseType || (
      currentIntensity > 3 ? 'acknowledging' : 
      currentIntensity > 0 ? 'partial-release' : 
      'full-release'
    );
    
    let newSetupStatements: string[];
    let newReminderPhrases: string[] | undefined;
    
    if (useVaguePhrases) {
      // TTT or high-SUDS safety: Use generic statements
      newSetupStatements = [
        "Even though I still have this intensity in my system, I'm allowing it to settle.",
        "This remaining activation, I choose to be present and calm.",
        "Whatever I'm still carrying, I'm safe and I'm letting it soften."
      ];
      newReminderPhrases = TEARLESS_REMINDER_PHRASES;
    } else {
      const feelingNoun = convertEmotionToNoun(feeling);
      // Positive affirmations for low SUDS
      if (currentIntensity <= 3) {
        newSetupStatements = [
          `Even though I still have some of this ${feelingNoun}, I'm letting it go now`,
          `This remaining ${feelingNoun} in my ${bodyLocation}, I choose to release it`,
          `I'm releasing this last bit of ${feelingNoun} and choosing peace`
        ];
      } else {
        newSetupStatements = [
          `Even though I still have this ${feelingNoun} in my ${bodyLocation}, I deeply and completely accept myself`,
          `Even though ${problem} is still affecting me, I choose to accept myself anyway`,
          `Even with this remaining ${feelingNoun}, I'm making progress and I accept myself`
        ];
      }
    }
    
    const statementOrder = [0, 1, 2, 0, 1, 2, 1, 0];
    const newRound = (sessionContext.round || 0) + 1;
    
    // If escalating to 8+ from traditional, mark as mixed
    let sessionType = sessionContext.sessionType;
    let isTearlessTrauma = sessionContext.isTearlessTrauma;
    if (currentIntensity >= 8 && !isTTT) {
      sessionType = 'mixed';
      isTearlessTrauma = true;
    }
    // If dropping below 8 and was in tearless, keep context but allow specific phrases
    // when problem/feeling/bodyLocation context exists
    if (currentIntensity < 8 && isTTT && sessionContext.problem && sessionContext.feeling && sessionContext.bodyLocation) {
      // Only revert to specific if we have real context (not generic TTT placeholders)
      const hasRealContext = sessionContext.problem !== 'High intensity activation';
      if (hasRealContext) {
        isTearlessTrauma = false;
      }
    }
    
    const updatedContext: SessionContext = {
      ...sessionContext,
      currentIntensity: currentIntensity,
      round: newRound,
      setupStatements: newSetupStatements,
      statementOrder: statementOrder,
      reminderPhraseType: determinedPhraseType,
      totalRoundsWithoutReduction: sessionContext.totalRoundsWithoutReduction || 0,
      deepeningAttempts: sessionContext.deepeningAttempts || 0,
      isDeepening: false,
      // Update peak SUDS
      peakSuds: Math.max(sessionContext.peakSuds || 0, currentIntensity),
      sessionType,
      isTearlessTrauma
    };
    
    if (newReminderPhrases) {
      updatedContext.aiReminderPhrases = newReminderPhrases;
    }
    
    setSessionContext(updatedContext);
    onSessionUpdate(updatedContext);
    
    // Register the new round (setup statements generated = round counted)
    await registerNewRound(updatedContext, newRound);
    
    setCurrentTappingPoint(0);
    
    const roundMessage: Message = {
      id: `round-${Date.now()}`,
      type: 'bot',
      content: useVaguePhrases 
        ? `Let's do another gentle round. Take a deep breath...`
        : `Let's do another round of tapping to bring that ${feeling} down even more. Take a deep breath...`,
      timestamp: new Date(),
      sessionId: currentChatSession
    };
    
    const allMsgs = [...messages, roundMessage];
    setMessages(allMsgs);
    setConversationHistory(prev => [...prev, roundMessage]);
    await persistMessages(allMsgs);
    
    setTimeout(() => {
      onStateChange('setup');
    }, 0);
    
  }, [sessionContext, currentChatSession, messages, onStateChange, onSessionUpdate, persistMessages, registerNewRound]);

  const completeTappingSession = useCallback(async (finalIntensity: number) => {
    if (sessionContext.tappingSessionId) {
      await supabaseService.updateTappingSession(sessionContext.tappingSessionId, {
        final_intensity: finalIntensity,
        rounds_completed: sessionContext.round || 1,
        completed_at: new Date().toISOString(),
        peak_suds: sessionContext.peakSuds,
        support_contacted: sessionContext.supportContacted || false,
        quiet_integration_used: sessionContext.quietIntegrationUsed || false
      });
    }
  }, [sessionContext]);

  // REVISED: Post-tapping decision tree
  const handlePostTappingIntensity = useCallback(async (newIntensity: number) => {
    console.log('[useAIChat] Post-tapping intensity:', newIntensity, 'TTT:', sessionContext.isTearlessTrauma);
    
    const initialIntensity = sessionContext.initialIntensity || 10;
    const previousIntensity = sessionContext.currentIntensity || initialIntensity;
    const improvement = initialIntensity - newIntensity;
    const roundImprovement = previousIntensity - newIntensity;
    const isTTT = sessionContext.isTearlessTrauma;
    
    // Track rounds without reduction
    const noReduction = roundImprovement <= 0;
    const roundsWithoutReduction = noReduction 
      ? (sessionContext.roundsWithoutReduction || 0) + 1 
      : 0;
    
    // Track high SUDS rounds (8-10)
    const highSudsRounds = newIntensity >= 8 
      ? (sessionContext.highSudsRounds || 0) + 1
      : 0;
    
    // Update peak SUDS
    const peakSuds = Math.max(sessionContext.peakSuds || 0, newIntensity);
    
    // Determine reminder phrase type
    let phraseType: 'acknowledging' | 'partial-release' | 'full-release';
    if (newIntensity > 3) {
      phraseType = 'acknowledging';
    } else if (roundImprovement >= 3 && roundImprovement <= 5) {
      phraseType = 'partial-release';
    } else {
      phraseType = 'full-release';
    }
    
    const updatedContext: SessionContext = {
      ...sessionContext,
      currentIntensity: newIntensity,
      roundsWithoutReduction,
      highSudsRounds,
      peakSuds,
      reminderPhraseType: phraseType,
      previousIntensities: [...(sessionContext.previousIntensities || []), newIntensity]
    };
    setSessionContext(updatedContext);
    onSessionUpdate(updatedContext);
    
    // SUDS 0: Auto-complete → advice
    if (newIntensity === 0) {
      console.log('[useAIChat] SUDS 0 - auto-complete');
      await completeTappingSession(0);
      onStateChange('advice');
      await sendMessage(
        `My intensity is now 0/10. Initial was ${initialIntensity}/10.`,
        'advice',
        { currentIntensity: 0 }
      );
      return;
    }
    
    // SUDS 8-10: Grounding → auto-repeat. After 3 rounds at 8-10, show End + Contact Support
    if (newIntensity >= 8) {
      console.log('[useAIChat] SUDS 8-10, highSudsRounds:', highSudsRounds);
      
      // Show choice UI (PostTappingChoice handles grounding vs support based on highSudsRounds)
      const choiceMessage: Message = {
        id: `choice-${Date.now()}`,
        type: 'system',
        content: JSON.stringify({
          type: 'post-tapping-choice',
          intensity: newIntensity,
          initialIntensity,
          improvement,
          round: sessionContext.round || 1,
          roundsWithoutReduction,
          highSudsRounds,
          isTearlessTrauma: isTTT,
          phraseType
        }),
        timestamp: new Date(),
        sessionId: currentChatSession
      };
      const allMsgs = [...messages, choiceMessage];
      setMessages(allMsgs);
      setConversationHistory(prev => [...prev, choiceMessage]);
      await persistMessages(allMsgs);
      return;
    }
    
    // SUDS 3-7: Check for deepening or show choices
    if (newIntensity >= 3) {
      // If TTT and SUDS dropped to 3-7, auto-transition to traditional conversation
      if (isTTT) {
        console.log('[useAIChat] TTT SUDS dropped below 8, auto-transitioning to conversation');
        const transitionContext: SessionContext = {
          ...sessionContext,
          currentIntensity: newIntensity,
          returningFromTapping: true,
          deepeningLevel: (sessionContext.deepeningLevel || 0) + 1,
          sessionType: 'mixed',
          isTearlessTrauma: false,
          problem: undefined,
          feeling: undefined,
          bodyLocation: undefined,
        };
        setSessionContext(transitionContext);
        onSessionUpdate(transitionContext);

        const transitionMessage: Message = {
          id: `transition-${Date.now()}`,
          type: 'bot',
          content: `Your intensity has come down nicely. Let's explore what's going on so we can work through it more specifically. What's been on your mind? 💙`,
          timestamp: new Date(),
          sessionId: currentChatSession
        };
        const allMsgs = [...messages, transitionMessage];
        setMessages(allMsgs);
        setConversationHistory(prev => [...prev, transitionMessage]);
        await persistMessages(allMsgs);
        onStateChange('conversation');
        return;
      }
      
      // Traditional path: auto-deepening if stuck
      const totalRoundsWithoutReduction = newIntensity >= 5 
        ? (sessionContext.totalRoundsWithoutReduction || 0) + 1
        : 0;
      
      if (totalRoundsWithoutReduction >= 3) {
        // 3-strike: offer Quiet Integration instead of just ending
        console.log('[useAIChat] 3-strike limit - offering quiet integration');
        const choiceMessage: Message = {
          id: `choice-${Date.now()}`,
          type: 'system',
          content: JSON.stringify({
            type: 'post-tapping-choice',
            intensity: newIntensity,
            initialIntensity,
            improvement,
            round: sessionContext.round || 1,
            roundsWithoutReduction: 3,
            highSudsRounds: 0,
            phraseType
          }),
          timestamp: new Date(),
          sessionId: currentChatSession
        };
        const allMsgs = [...messages, choiceMessage];
        setMessages(allMsgs);
        setConversationHistory(prev => [...prev, choiceMessage]);
        await persistMessages(allMsgs);
        return;
      }
      
      if (newIntensity >= 5 && totalRoundsWithoutReduction >= 1) {
        // Auto-deepening
        const deepeningContext = {
          ...updatedContext,
          isDeepening: true,
          deepeningAttempts: 0,
          totalRoundsWithoutReduction
        };
        setSessionContext(deepeningContext);
        onSessionUpdate(deepeningContext);
        
        onStateChange('conversation-deepening');
        await sendMessage(
          `[DEEPENING_ENTRY]`,
          'conversation-deepening',
          { ...deepeningContext, isDeepeningEntry: true, deepeningQuestionCount: 0 }
        );
        return;
      }
      
      // Show standard choices
      const choiceMessage: Message = {
        id: `choice-${Date.now()}`,
        type: 'system',
        content: JSON.stringify({
          type: 'post-tapping-choice',
          intensity: newIntensity,
          initialIntensity,
          improvement,
          round: sessionContext.round || 1,
          roundsWithoutReduction,
          highSudsRounds: 0,
          phraseType
        }),
        timestamp: new Date(),
        sessionId: currentChatSession
      };
      const allMsgs = [...messages, choiceMessage];
      setMessages(allMsgs);
      setConversationHistory(prev => [...prev, choiceMessage]);
      await persistMessages(allMsgs);
      return;
    }
    
    // SUDS 1-2: Show 4-button choice (Continue, Chat, Quiet Integration, End)
    console.log('[useAIChat] SUDS 1-2 - showing 4 choices');
    const choiceMessage: Message = {
      id: `choice-${Date.now()}`,
      type: 'system',
      content: JSON.stringify({
        type: 'post-tapping-choice',
        intensity: newIntensity,
        initialIntensity,
        improvement,
        round: sessionContext.round || 1,
        roundsWithoutReduction,
        highSudsRounds: 0,
        phraseType
      }),
      timestamp: new Date(),
      sessionId: currentChatSession
    };
    const allMsgs = [...messages, choiceMessage];
    setMessages(allMsgs);
    setConversationHistory(prev => [...prev, choiceMessage]);
    await persistMessages(allMsgs);
    
  }, [sessionContext, currentChatSession, messages, onStateChange, sendMessage, completeTappingSession, onSessionUpdate, persistMessages]);

  const handleTalkToTapaway = useCallback(async () => {
    console.log('[useAIChat] User chose to talk to Tapaway');
    
    // If coming from TTT, mark session as mixed
    const updatedContext: SessionContext = {
      ...sessionContext,
      returningFromTapping: true,
      deepeningLevel: (sessionContext.deepeningLevel || 0) + 1,
      sessionType: sessionContext.isTearlessTrauma ? 'mixed' : sessionContext.sessionType,
      isTearlessTrauma: false,
      problem: undefined,
      feeling: undefined,
      bodyLocation: undefined,
    };
    setSessionContext(updatedContext);
    onSessionUpdate(updatedContext);
    
    const transitionMessage: Message = {
      id: `transition-${Date.now()}`,
      type: 'bot',
      content: `Let's explore this a bit more. What's on your mind? Sometimes there's more underneath the surface. 💙`,
      timestamp: new Date(),
      sessionId: currentChatSession
    };
    
    const allMsgs = [...messages, transitionMessage];
    setMessages(allMsgs);
    setConversationHistory(prev => [...prev, transitionMessage]);
    await persistMessages(allMsgs);
    
    onStateChange('conversation');
  }, [sessionContext, currentChatSession, messages, onStateChange, onSessionUpdate, persistMessages]);

  // Track support contact
  const handleSupportContacted = useCallback(async () => {
    const updatedContext = {
      ...sessionContext,
      supportContacted: true
    };
    setSessionContext(updatedContext);
    onSessionUpdate(updatedContext);
    
    if (sessionContext.tappingSessionId) {
      await supabaseService.updateTappingSession(sessionContext.tappingSessionId, {
        support_contacted: true
      });
    }
  }, [sessionContext, onSessionUpdate]);

  const determineNextState = (currentState: ChatState, aiResponse: string): ChatState | null => {
    const response = aiResponse.toLowerCase();
    
    switch (currentState) {
      case 'conversation':
        if (response.includes('scale of 0') || response.includes('how intense') ||
            response.includes('0-10') || response.includes('rate the intensity')) {
          return 'gathering-intensity';
        }
        break;
      case 'gathering-intensity':
        return 'setup';
      case 'tapping-point':
        if (currentTappingPoint < 7) return 'tapping-point';
        else return 'tapping-breathing';
      case 'tapping-breathing':
        if (response.includes('how are you feeling') || response.includes('deep breath')) {
          return 'post-tapping';
        }
        break;
      case 'advice':
        return 'complete';
    }
    
    return null;
  };

  const startNewSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { session } = await supabaseService.getOrCreateChatSession(user.id);
        if (session) {
          setCurrentChatSession(session.id);
          setMessages([]);
          setConversationHistory([]);
          setSessionContext({});
          setIntensityHistory([]);
          setCurrentTappingPoint(0);
          setCrisisDetected(false);
          
          // Start with greeting-intensity state
          onStateChange('greeting-intensity');
          createInitialGreeting(session.id);
        }
      }
    } catch (error) {
      console.error('Error starting new session:', error);
    }
  }, [userProfile]);

  return {
    messages,
    isLoading,
    sendMessage,
    startNewSession,
    sessionContext,
    userProfile,
    crisisDetected,
    currentTappingPoint,
    setCurrentTappingPoint,
    intensityHistory,
    startNewTappingRound,
    handlePostTappingIntensity,
    completeTappingSession,
    handleTalkToTapaway,
    handleGreetingIntensity,
    handleQuietIntegrationComplete,
    handleSupportContacted
  };
};
