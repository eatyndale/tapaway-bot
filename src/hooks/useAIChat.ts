import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseService, UserProfile } from '@/services/supabaseService';
import { ChatState, Message } from '@/components/anxiety-bot/types';
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
  isDeepeningEntry?: boolean;  // True when entering deepening (system context, not user message)
  deepeningQuestionCount?: number; // Tracks how many probing questions asked in current deepening
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

// Directive parsing - improved regex for robustness
const DIRECTIVE_RE = /<<DIRECTIVE\s+(\{[\s\S]*?\})>>+/;
const DIRECTIVE_FALLBACK_RE = /<<DIRECTIVE\s+(\{[\s\S]*?\})\}+/;
// Pattern to strip ANY directive format from visible text
const DIRECTIVE_STRIP_RE = /<<DIRECTIVE\s+\{[\s\S]*?\}[\}>]+/g;

function parseDirective(text: string): Directive | null {
  console.log('[parseDirective] Attempting to parse directive from text:', text.substring(text.length - 200));
  
  // Try primary pattern first
  let m = text.match(DIRECTIVE_RE);
  
  // Fallback: try to match directives with }} instead of >> (common AI mistake)
  if (!m) {
    console.warn('[parseDirective] Primary pattern failed, trying fallback for }} instead of >>');
    m = text.match(DIRECTIVE_FALLBACK_RE);
    if (m) {
      console.warn('[parseDirective] ✓ Found directive with }} instead of >> - fixing it');
    }
  }
  
  if (!m) {
    console.log('[parseDirective] No directive found in response');
    return null;
  }
  
  try {
    const parsed = JSON.parse(m[1]);
    console.log('[parseDirective] Successfully parsed directive:', parsed);
    return parsed;
  } catch (e) {
    console.error('[parseDirective] Failed to parse directive JSON:', e);
    console.error('[parseDirective] Attempted to parse:', m[1]);
    return null;
  }
}

// Helper function to extract setup statements from AI response (legacy fallback)
const extractSetupStatements = (response: string): string[] => {
  const statements: string[] = [];
  const lines = response.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('"Even though') && trimmed.endsWith('"')) {
      // Remove quotes and add to statements
      statements.push(trimmed.slice(1, -1));
    } else if (trimmed.startsWith('Even though')) {
      // Direct statement without quotes
      statements.push(trimmed);
    }
  }
  
  return statements;
};

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

  const initializeChatSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get user profile to include industry and age_group
        const { profile } = await supabaseService.getProfile(user.id);
        
        const { session } = await supabaseService.getOrCreateChatSession(
          user.id,
          profile?.industry || null,
          profile?.age_group || null
        );
        if (session) {
          setCurrentChatSession(session.id);
          
          // Load existing messages if any
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
            // Only add greeting if no existing messages
            createInitialGreeting(session.id);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing chat session:', error);
    }
  };

  const createInitialGreeting = (sessionId: string) => {
    const greetingMessage: Message = {
      id: `greeting-${Date.now()}`,
      type: 'bot',
      content: `Hello ${userProfile?.first_name || 'there'}! 💙 I'm here to help you work through what you're feeling using EFT tapping. What's been weighing on you lately?`,
      timestamp: new Date(),
      sessionId: sessionId
    };
    setMessages([greetingMessage]);
    setConversationHistory([greetingMessage]);
  };

  const sendMessage = useCallback(async (
    userMessage: string, 
    chatState: ChatState,
    additionalContext?: Partial<SessionContext>
  ) => {
    if (!userProfile || !currentChatSession) return;

    setIsLoading(true);

    // Enhanced typo correction and validation
    const correctionResult = SpellChecker.correctWithFuzzyMatching(userMessage);
    let processedMessage = correctionResult.corrected;
    
    // Notify about corrections if any were made
    if (correctionResult.changes.length > 0 && onTypoCorrection) {
      onTypoCorrection(userMessage, processedMessage);
    }

    // Check if this is a deepening entry (system context, not a real user message)
    const isDeepeningEntry = (additionalContext as any)?.isDeepeningEntry === true;
    
    // Add user message ONLY if it's not a deepening entry (those are hidden)
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessage, // Keep original for display
      timestamp: new Date(),
      sessionId: currentChatSession
    };

    const updatedMessages = isDeepeningEntry ? [...messages] : [...messages, userMsg];
    if (!isDeepeningEntry) {
      setMessages(updatedMessages);
    }

    // Update session context with intensity tracking
    const updatedContext = { ...sessionContext, ...additionalContext };

    // NEW: Intercept post-tapping or tapping-breathing intensity submission
    if ((chatState === 'post-tapping' || chatState === 'tapping-breathing') && additionalContext?.currentIntensity !== undefined) {
      console.log('[useAIChat] Post-tapping/breathing intensity detected - frontend will handle decision');
      
      // Update session context
      setSessionContext(updatedContext);
      onSessionUpdate(updatedContext);
      
      // Track intensity
      const newHistory = [...intensityHistory, additionalContext.currentIntensity];
      setIntensityHistory(newHistory);
      
      // Add user message
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: userMessage,
        timestamp: new Date(),
        sessionId: currentChatSession
      };
      setMessages(prev => [...prev, userMsg]);
      
      // Frontend handles the decision (don't call AI yet)
      await handlePostTappingIntensity(additionalContext.currentIntensity);
      
      setIsLoading(false);
      return; // Exit early - frontend is in control now
    }
    
    // Track intensity changes
    if (additionalContext?.currentIntensity !== undefined) {
      const newHistory = [...intensityHistory, additionalContext.currentIntensity];
      setIntensityHistory(newHistory);
    }
    
    // Create tapping session when initial intensity is collected
    if (chatState === 'gathering-intensity' && additionalContext?.initialIntensity) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && updatedContext.problem && updatedContext.feeling && updatedContext.bodyLocation) {
        // Get user profile for industry and age_group
        const { profile } = await supabaseService.getProfile(user.id);
        
        const { session: tappingSession } = await supabaseService.createTappingSession(user.id, {
          problem: updatedContext.problem,
          feeling: updatedContext.feeling,
          body_location: updatedContext.bodyLocation,
          initial_intensity: additionalContext.initialIntensity,
          industry: profile?.industry || null,
          age_group: profile?.age_group || null
        });
        if (tappingSession) {
          updatedContext.tappingSessionId = tappingSession.id;
          updatedContext.round = 1;
        }
      }
    }
    
    setSessionContext(updatedContext);
    onSessionUpdate(updatedContext);

    try {
      // Get last assistant message for context
      const lastAssistantMessage = conversationHistory
        .filter(m => m.type === 'bot')
        .slice(-1)[0]?.content || '';
      
      // Call AI function with enhanced context
      const { data, error } = await supabase.functions.invoke('eft-chat', {
        body: {
          message: processedMessage, // Use corrected message for AI processing
          chatState,
          userName: userProfile.first_name,
          sessionContext: updatedContext,
          conversationHistory: conversationHistory.slice(-20), // Increased context window
          currentTappingPoint,
          intensityHistory,
          lastAssistantMessage  // NEW: pass for classification context
        }
      });

      if (error) throw error;

      // Parse directive and strip it from visible content
      const directive = parseDirective(data.response);
      // Strip ALL directive formats from visible text (handles >>, }}, >>> variants)
      let visibleContent = data.response.replace(DIRECTIVE_STRIP_RE, '').trim();
      
      // DEFENSIVE: Strip leaked setup statements from visible content if transitioning to setup
      if (directive?.next_state === 'setup' && directive.setup_statements) {
        // Remove numbered lists of "Even though..." statements
        visibleContent = visibleContent
          .replace(/\d+\.\s*"?Even though[^"]*"?\.?\s*/gi, '')
          .replace(/\d+\.\s*Even though[^.]*\.\s*/gi, '')
          .replace(/Even though[^.]*deeply and completely accept myself[^.]*\.?\s*/gi, '')
          .replace(/Shall we start tapping on these\??/gi, '')
          .replace(/Here are some new setup statements[^:]*:\s*/gi, '')
          .replace(/Let's tap on this new layer[^.]*\.\s*/gi, "Let's tap on this new layer.")
          .trim();
        console.log('[useAIChat] Stripped leaked setup statements from visible content');
      }

      console.log('[useAIChat] AI Response received. Has directive:', !!directive);
      console.log('[useAIChat] Current state:', chatState);

      // Use cleaned extracted values from edge function
      if (data.extractedContext) {
        if (data.extractedContext.problem) updatedContext.problem = data.extractedContext.problem;
        if (data.extractedContext.feeling) updatedContext.feeling = data.extractedContext.feeling;
        if (data.extractedContext.bodyLocation) updatedContext.bodyLocation = data.extractedContext.bodyLocation;
        if (data.extractedContext.currentIntensity !== undefined) {
          updatedContext.currentIntensity = data.extractedContext.currentIntensity;
        }
        // Persist deepeningQuestionCount from server
        if (data.extractedContext.deepeningQuestionCount !== undefined) {
          updatedContext.deepeningQuestionCount = data.extractedContext.deepeningQuestionCount;
        }
        setSessionContext(updatedContext);
        onSessionUpdate(updatedContext);
      }

      // Add AI response with stripped content
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

      // Apply directive-first flow
      if (directive) {
        const next = directive.next_state;
        console.log('[useAIChat] Directive next_state:', next);
        console.log('[useAIChat] Directive tapping_point:', directive.tapping_point);
        
        // Start-of-round: store statements + order (for both 'setup' and 'tapping-point' transitions)
        if ((next === 'setup' || next === 'tapping-point') && directive.setup_statements) {
          const setupStatements = directive.setup_statements ?? updatedContext.setupStatements ?? [];
          const statementOrder = directive.statement_order ?? updatedContext.statementOrder ?? [0, 1, 2, 0, 1, 2, 1, 0];
          console.log('[useAIChat] Storing setup statements:', setupStatements);
          console.log('[useAIChat] Storing statement order:', statementOrder);
          updatedContext.setupStatements = setupStatements;
          updatedContext.statementOrder = statementOrder;
          setSessionContext(updatedContext);
          onSessionUpdate(updatedContext);
          
          // Reset tapping point for new round
          if (next === 'setup') {
            setCurrentTappingPoint(0);
          }
        }

        // Point advancement: update current tapping point
        if (next === 'tapping-point' && typeof directive.tapping_point === 'number') {
          console.log('[useAIChat] Setting tapping point to:', directive.tapping_point);
          setCurrentTappingPoint(directive.tapping_point);
        }

        // State transition with validation
        if (next && next !== chatState) {
          console.log('[useAIChat] Transitioning state from', chatState, 'to', next);
          
          // Validate state transitions (warning only, don't block)
          const validTransitions: Record<string, string[]> = {
            'conversation': ['gathering-intensity', 'conversation-deepening'],
            'conversation-deepening': ['setup', 'conversation-deepening'],
            'gathering-intensity': ['setup'],
            'setup': ['tapping-point'],
            'tapping-point': ['tapping-point', 'tapping-breathing'],
            'tapping-breathing': ['post-tapping'],
            'post-tapping': ['setup', 'conversation', 'conversation-deepening', 'advice'],
            'advice': ['complete', 'conversation']
          };
          
          const allowedNextStates = validTransitions[chatState] || [];
          if (!allowedNextStates.includes(next)) {
            console.warn(`[useAIChat] ⚠️ UNEXPECTED TRANSITION: ${chatState} → ${next}`);
            console.warn('[useAIChat] Expected transitions:', allowedNextStates);
            console.warn('[useAIChat] Allowing transition anyway - trusting AI directive');
          }
          
          // Always allow the transition
          onStateChange(next as ChatState);
        }
      } else {
        console.log('[useAIChat] No directive found, using fallback logic');
        
        // Fallback: Extract setup statements if present in response
        if (visibleContent.includes('Even though')) {
          const setupStatements = extractSetupStatements(visibleContent);
          if (setupStatements.length > 0) {
            console.log('[useAIChat] Extracted setup statements (fallback):', setupStatements);
            updatedContext.setupStatements = setupStatements;
            setSessionContext(updatedContext);
            onSessionUpdate(updatedContext);
          }
        }

        // Handle state transitions based on AI response and current state (use visibleContent)
        const nextState = determineNextState(chatState, visibleContent);
        if (nextState && nextState !== chatState) {
          console.log('[useAIChat] Fallback state transition from', chatState, 'to', nextState);
          onStateChange(nextState);
        }
      }

      // Update chat session in database
      // Generate session name based on emotions if we have session context
      let sessionName;
      if (updatedContext.feeling || updatedContext.problem) {
        sessionName = supabaseService.generateSessionName(
          updatedContext.feeling || 'anxiety', 
          updatedContext.problem
        );
      }
      
      await supabaseService.updateChatSession(currentChatSession, {
        messages: finalMessages,
        crisis_detected: data.crisisDetected || false,
        session_name: sessionName
      });

      // Handle crisis detection
      if (data.crisisDetected) {
        setCrisisDetected(true);
        onCrisisDetected?.();
        onStateChange('complete'); // End session and show crisis resources
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        type: 'bot',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        sessionId: currentChatSession
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, userProfile, currentChatSession, sessionContext, conversationHistory, onStateChange, onSessionUpdate, onCrisisDetected]);

  const startNewTappingRound = useCallback(async (currentIntensity: number, phraseType?: 'acknowledging' | 'partial-release' | 'full-release') => {
    console.log('[useAIChat] Starting new tapping round with intensity:', currentIntensity);
    
    // Generate new setup statements based on current intensity and phrase type
    const feeling = sessionContext.feeling || 'this feeling';
    const bodyLocation = sessionContext.bodyLocation || 'my body';
    const problem = sessionContext.problem || 'this issue';
    
    // Determine reminder phrase type based on intensity if not provided
    const determinedPhraseType = phraseType || (
      currentIntensity > 3 ? 'acknowledging' : 
      currentIntensity > 0 ? 'partial-release' : 
      'full-release'
    );
    
    const newSetupStatements = [
      `Even though I still have this ${feeling} in my ${bodyLocation}, I deeply and completely accept myself`,
      `Even though ${problem} is still affecting me, I choose to accept myself anyway`,
      `Even with this remaining ${feeling}, I'm making progress and I accept myself`
    ];
    
    const statementOrder = [0, 1, 2, 0, 1, 2, 1, 0]; // Standard order
    
    // Increment round number
    const newRound = (sessionContext.round || 1) + 1;
    
    // Update session context with phrase type and preserve deepening tracking
    const updatedContext = {
      ...sessionContext,
      currentIntensity: currentIntensity,
      round: newRound,
      setupStatements: newSetupStatements,
      statementOrder: statementOrder,
      reminderPhraseType: determinedPhraseType,
      // Preserve deepening tracking
      totalRoundsWithoutReduction: sessionContext.totalRoundsWithoutReduction || 0,
      deepeningAttempts: sessionContext.deepeningAttempts || 0,
      isDeepening: false // Reset deepening flag for new round
    };
    
    setSessionContext(updatedContext);
    onSessionUpdate(updatedContext);
    
    // Update tapping session with new round count
    if (updatedContext.tappingSessionId) {
      await supabaseService.updateTappingSession(updatedContext.tappingSessionId, {
        rounds_completed: newRound,
        final_intensity: currentIntensity
      });
    }
    
    // Reset tapping point to 0
    setCurrentTappingPoint(0);
    
    // Add system message to show we're starting a new round BEFORE state change
    const roundMessage: Message = {
      id: `round-${Date.now()}`,
      type: 'bot',
      content: `Let's do another round of tapping to bring that ${feeling} down even more. Take a deep breath...`,
      timestamp: new Date(),
      sessionId: currentChatSession
    };
    
    setMessages(prev => [...prev, roundMessage]);
    setConversationHistory(prev => [...prev, roundMessage]);
    
    // Go to setup phase first (karate chop), then tapping sequence
    setTimeout(() => {
      onStateChange('setup');
    }, 0);
    
  }, [sessionContext, currentChatSession, onStateChange, onSessionUpdate, setCurrentTappingPoint, setMessages, setConversationHistory]);

  const completeTappingSession = useCallback(async (finalIntensity: number) => {
    if (sessionContext.tappingSessionId) {
      await supabaseService.updateTappingSession(sessionContext.tappingSessionId, {
        final_intensity: finalIntensity,
        rounds_completed: sessionContext.round || 1,
        completed_at: new Date().toISOString()
      });
    }
  }, [sessionContext]);

  const handlePostTappingIntensity = useCallback(async (newIntensity: number) => {
    console.log('[useAIChat] Post-tapping intensity received:', newIntensity);
    console.log('[useAIChat] Initial intensity was:', sessionContext.initialIntensity);
    
    const initialIntensity = sessionContext.initialIntensity || 10;
    const previousIntensity = sessionContext.currentIntensity || initialIntensity;
    const improvement = initialIntensity - newIntensity;
    const roundImprovement = previousIntensity - newIntensity;
    
    // Track rounds without reduction
    const noReduction = roundImprovement <= 0;
    const roundsWithoutReduction = noReduction 
      ? (sessionContext.roundsWithoutReduction || 0) + 1 
      : 0;
    
    // Track total rounds without meaningful reduction (intensity still >= 5)
    const totalRoundsWithoutReduction = newIntensity >= 5 
      ? (sessionContext.totalRoundsWithoutReduction || 0) + 1
      : 0;
    
    // Determine reminder phrase type for next round
    let phraseType: 'acknowledging' | 'partial-release' | 'full-release';
    if (newIntensity > 3) {
      phraseType = 'acknowledging';
    } else if (roundImprovement >= 3 && roundImprovement <= 5) {
      phraseType = 'partial-release';
    } else {
      phraseType = 'full-release';
    }
    
    // Update context with tracking info
    const updatedContext = {
      ...sessionContext,
      currentIntensity: newIntensity,
      roundsWithoutReduction,
      totalRoundsWithoutReduction,
      reminderPhraseType: phraseType,
      previousIntensities: [...(sessionContext.previousIntensities || []), newIntensity]
    };
    setSessionContext(updatedContext);
    onSessionUpdate(updatedContext);
    
    // Decision logic based on intensity
    if (newIntensity === 0) {
      // Perfect! Complete session and go to advice
      console.log('[useAIChat] Intensity is 0 - completing session and transitioning to advice');
      
      await completeTappingSession(newIntensity);
      onStateChange('advice');
      
      await sendMessage(
        `My intensity is now 0/10. Initial was ${initialIntensity}/10.`,
        'advice',
        { currentIntensity: 0 }
      );
      
    } else if (totalRoundsWithoutReduction >= 3) {
      // 3-STRIKE LIMIT: After 3 rounds without reducing below 5, go to advice
      console.log('[useAIChat] 3-strike limit reached - transitioning to advice');
      
      await completeTappingSession(newIntensity);
      onStateChange('advice');
      
      await sendMessage(
        `After ${sessionContext.round || 3} rounds, my intensity is at ${newIntensity}/10. Initial was ${initialIntensity}/10. We've tried deepening ${sessionContext.deepeningAttempts || 0} times.`,
        'advice',
        { currentIntensity: newIntensity, totalRoundsWithoutReduction }
      );
      
    } else if (newIntensity >= 5 && totalRoundsWithoutReduction >= 1) {
      // AUTO-DEEPENING: Intensity still >= 5 after a round, trigger deepening conversation
      console.log('[useAIChat] Intensity still >= 5, triggering conversation-deepening state');
      
      const deepeningContext = {
        ...updatedContext,
        isDeepening: true,
        deepeningAttempts: 0  // Start at 0 - will be incremented on actual user responses
      };
      
      setSessionContext(deepeningContext);
      onSessionUpdate(deepeningContext);
      
      // Transition to dedicated deepening state (not regular conversation)
      onStateChange('conversation-deepening');
      
      // Send MINIMAL entry marker to get AI's first probing question
      // This is NOT a user message - it's hidden system context
      // CRITICAL: Keep marker minimal to avoid biasing AI evaluation
      await sendMessage(
        `[DEEPENING_ENTRY]`,
        'conversation-deepening',
        { ...deepeningContext, isDeepeningEntry: true, deepeningQuestionCount: 0 }
      );
      
    } else {
      // Show post-tapping choice UI (handles all cases: low intensity, good progress)
      console.log('[useAIChat] Showing post-tapping choice UI');
      
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
          phraseType
        }),
        timestamp: new Date(),
        sessionId: currentChatSession
      };
      
      setMessages(prev => [...prev, choiceMessage]);
      setConversationHistory(prev => [...prev, choiceMessage]);
    }
  }, [sessionContext, currentChatSession, messages, onStateChange, sendMessage, setConversationHistory, setMessages, completeTappingSession, onSessionUpdate]);

  // Handle "Talk to Tapaway" - go back to conversation for deeper inquiry
  const handleTalkToTapaway = useCallback(async () => {
    console.log('[useAIChat] User chose to talk to Tapaway for deeper inquiry');
    
    const updatedContext = {
      ...sessionContext,
      returningFromTapping: true,
      deepeningLevel: (sessionContext.deepeningLevel || 0) + 1
    };
    setSessionContext(updatedContext);
    onSessionUpdate(updatedContext);
    
    // Add a message to indicate we're going back to chat
    const transitionMessage: Message = {
      id: `transition-${Date.now()}`,
      type: 'bot',
      content: `Let's explore this a bit more. What else is on your mind about this ${sessionContext.feeling || 'feeling'}? Sometimes there's more underneath the surface.`,
      timestamp: new Date(),
      sessionId: currentChatSession
    };
    
    setMessages(prev => [...prev, transitionMessage]);
    setConversationHistory(prev => [...prev, transitionMessage]);
    
    onStateChange('conversation');
  }, [sessionContext, currentChatSession, onStateChange, onSessionUpdate]);

  const determineNextState = (currentState: ChatState, aiResponse: string): ChatState | null => {
    console.log('[determineNextState] FALLBACK LOGIC - Current state:', currentState);
    console.log('[determineNextState] AI response preview:', aiResponse.substring(0, 150));
    
    const response = aiResponse.toLowerCase();
    
    // Explicit state machine with keyword detection
    switch (currentState) {
      case 'conversation':
        // In conversation mode, look for intensity collection keywords
        if (response.includes('scale of 0') || 
            response.includes('how intense') ||
            response.includes('0-10') ||
            response.includes('rate the intensity')) {
          console.log('[determineNextState] Transition: conversation → gathering-intensity');
          return 'gathering-intensity';
        }
        break;
        
      case 'gathering-intensity':
        if (response.includes('tapping') || response.includes('visual guide') || response.includes('follow along') || response.includes('setup') || response.includes('karate chop')) {
          console.log('[useAIChat] Detected setup/tapping transition, moving to setup');
          return 'setup';
        }
        console.log('[useAIChat] ⚠️ Fallback: assuming transition to setup');
        return 'setup';

      case 'tapping-point':
        if (currentTappingPoint < 7) {
          console.log('[determineNextState] Continue tapping-point, current point:', currentTappingPoint);
          return 'tapping-point';
        } else {
          console.log('[determineNextState] Transition: tapping-point → tapping-breathing');
          return 'tapping-breathing';
        }
        
      case 'tapping-breathing':
        if (response.includes('how are you feeling') || 
            response.includes('ready to rate') ||
            response.includes('deep breath')) {
          console.log('[determineNextState] Transition: tapping-breathing → post-tapping');
          return 'post-tapping';
        }
        break;
        
      case 'post-tapping':
        // Check if intensity is still high
        if (sessionContext.currentIntensity && sessionContext.currentIntensity > 3) {
          console.log('[determineNextState] High intensity, restarting: post-tapping → tapping-point');
          return 'tapping-point';
        }
        if (response.includes('amazing work') || 
            response.includes('meditation library') ||
            response.includes('well done')) {
          console.log('[determineNextState] Transition: post-tapping → advice');
          return 'advice';
        }
        break;
        
      case 'advice':
        console.log('[determineNextState] Transition: advice → complete');
        return 'complete';
    }
    
    console.log('[determineNextState] No transition detected, staying in:', currentState);
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
          onStateChange('conversation');
          
          // Add initial greeting
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
    handleTalkToTapaway
  };
};