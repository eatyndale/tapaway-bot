import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAIChat } from "@/hooks/useAIChat";
import { ChatState, QuestionnaireSession } from "./anxiety-bot/types";
import { supabaseService } from "@/services/supabaseService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Bot, Sparkles } from "lucide-react";
import ChatHistory from "./anxiety-bot/ChatHistory";
import SessionProgress from "./anxiety-bot/SessionProgress";
import IntensitySlider from "./anxiety-bot/IntensitySlider";
import TappingGuide from "./anxiety-bot/TappingGuide";
import SetupPhase from "./anxiety-bot/SetupPhase";
import PostTappingChoice from "./anxiety-bot/PostTappingChoice";
import CrisisSupport from "./anxiety-bot/CrisisSupport";
import ChatMessage from "./anxiety-bot/ChatMessage";
import LoadingIndicator from "./anxiety-bot/LoadingIndicator";
import SetupStatements from "./anxiety-bot/SetupStatements";
import ChatInput from "./anxiety-bot/ChatInput";
import SessionActions from "./anxiety-bot/SessionActions";
import ChatHeader from "./anxiety-bot/ChatHeader";
import QuestionnaireView from "./anxiety-bot/QuestionnaireView";
import AdviceDisplay from "./anxiety-bot/AdviceDisplay";
import SessionComplete from "./anxiety-bot/SessionComplete";
import StreamingAvatar from "./anxiety-bot/StreamingAvatar";
import { AvatarProvider, useAvatarOptional } from "@/contexts/AvatarContext";


// Inner component that uses avatar context
const AIAnxietyBotInner = () => {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [chatState, setChatState] = useState<ChatState>(() => {
    const hasCompletedAssessment = localStorage.getItem('hasCompletedAssessment');
    return hasCompletedAssessment ? 'conversation' : 'questionnaire';
  });
  const [currentInput, setCurrentInput] = useState("");
  const [currentIntensity, setCurrentIntensity] = useState([5]);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isTapping, setIsTapping] = useState(false);
  const [selectedSetupStatement, setSelectedSetupStatement] = useState<number | null>(null);
  const [questionnaireSession, setQuestionnaireSession] = useState<QuestionnaireSession | null>(null);
  const [showCrisisSupport, setShowCrisisSupport] = useState(false);

  const { 
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
  } = useAIChat({
    onStateChange: (newState) => {
      console.log('State change:', chatState, '->', newState);
      setChatState(newState);
    },
    onSessionUpdate: (context) => {
      // Update local state based on AI conversation
    },
    onCrisisDetected: () => {
      setShowCrisisSupport(true);
    },
    onTypoCorrection: (original, corrected) => {
      // Silently apply corrections - no toast notification
      console.log('[AIAnxietyBot] Typo corrected:', original, '->', corrected);
    }
  });

  // Avatar context for speaking bot messages
  const avatarContext = useAvatarOptional();
  
  // Callback to speak bot messages via avatar when enabled
  const handleBotMessage = useCallback((text: string) => {
    if (avatarContext?.avatarEnabled && avatarContext.status === 'connected') {
      avatarContext.speak(text).catch(e => 
        console.error('[AIAnxietyBot] Avatar speech failed:', e)
      );
    }
  }, [avatarContext]);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);
  
  // Speak the latest bot message when it arrives
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.type === 'bot' && !isLoading) {
      handleBotMessage(lastMessage.content);
    }
  }, [messages, isLoading, handleBotMessage]);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (showHistory) {
      loadChatHistory();
    }
  }, [showHistory]);

  const loadChatHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { sessions } = await supabaseService.getChatSessions(user.id);
        setChatHistory(sessions || []);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleQuestionnaireComplete = (session: QuestionnaireSession) => {
    setQuestionnaireSession(session);
    localStorage.setItem('hasCompletedAssessment', 'true');
    setChatState('conversation');
    toast({
      title: "Assessment Complete",
      description: `Your anxiety level: ${session.severity} (Score: ${session.totalScore}/27)`,
    });
  };

  const handleSkipAssessment = () => {
    setChatState('conversation');
    toast({
      title: "Assessment Skipped",
      description: "You can take the assessment later from the menu.",
    });
  };

  const handleSubmit = async () => {
    if (!currentInput.trim() && !['gathering-intensity', 'post-tapping', 'tapping-breathing'].includes(chatState)) return;

    // Special handling for tapping-breathing state - call handlePostTappingIntensity directly
    if (chatState === 'tapping-breathing') {
      const intensity = currentIntensity[0];
      console.log('[AIAnxietyBot] Tapping-breathing intensity submitted:', intensity);
      await handlePostTappingIntensity(intensity);
      return;
    }

    let messageToSend = currentInput;
    let additionalContext: any = {};

    // Handle intensity submission
    if (chatState === 'gathering-intensity' || chatState === 'post-tapping') {
      messageToSend = `${currentIntensity[0]}/10`;
      if (chatState === 'gathering-intensity') {
        additionalContext.initialIntensity = currentIntensity[0];
        additionalContext.currentIntensity = currentIntensity[0];
      } else {
        additionalContext.currentIntensity = currentIntensity[0];
      }
    }

    // Don't pre-populate additionalContext with raw input
    // The edge function will extract clean values from the message

    await sendMessage(messageToSend, chatState, additionalContext);
    setCurrentInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSetupStatementSelect = async (index: number) => {
    setSelectedSetupStatement(index);
    const statement = sessionContext.setupStatements?.[index] || "Selected setup statement";
    await sendMessage(`I choose: "${statement}"`, 'tapping-point');
    setChatState('tapping-point');
    setIsTapping(true);
    setCurrentTappingPoint(0);
  };

  const handleTappingComplete = () => {
    setIsTapping(false);
    // Don't set state here - let TappingGuide's onComplete handle transition to tapping-breathing
  };

  const handleContinueTapping = async (intensity: number, phraseType?: 'acknowledging' | 'partial-release' | 'full-release') => {
    console.log('[AIAnxietyBot] User chose to continue tapping');
    await startNewTappingRound(intensity, phraseType);
  };

  const handleEndSession = async () => {
    console.log('[AIAnxietyBot] User chose to end session');
    
    // First, save tapping session data
    if (sessionContext.currentIntensity !== undefined) {
      await completeTappingSession(sessionContext.currentIntensity);
    }
    
    // Transition to advice state
    setChatState('advice');
    
    // Request advice from AI (with state='advice', won't be intercepted)
    await sendMessage(
      `I'm ready to finish. My final intensity is ${sessionContext.currentIntensity}/10. Initial was ${sessionContext.initialIntensity}/10.`,
      'advice',
      { currentIntensity: sessionContext.currentIntensity }
    );
  };



  const renderInput = () => {
    // Debug: log current state
    console.log('Current chat state:', chatState);
    
    // Setup phase - karate chop with setup statements
    if (chatState === 'setup') {
      console.log('[AIAnxietyBot] 🎯 Rendering setup phase');
      
      if (!sessionContext.setupStatements || sessionContext.setupStatements.length === 0) {
        return (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg space-y-3">
            <p className="text-sm font-semibold text-destructive mb-1">
              ⚠️ Missing Setup Statements
            </p>
            <Button onClick={startNewSession} size="sm" variant="outline">
              Start New Session
            </Button>
          </div>
        );
      }
      
      return (
        <SetupPhase
          setupStatements={sessionContext.setupStatements}
          onComplete={() => setChatState('tapping-point')}
        />
      );
    }
    
    // Progressive tapping states with intensity sliders
    if (chatState === 'gathering-intensity' || chatState === 'post-tapping') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Rate your intensity (0-10):
            </label>
            <IntensitySlider
              value={currentIntensity}
              onValueChange={setCurrentIntensity}
              className="w-full"
            />
            {intensityHistory.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Previous ratings: {intensityHistory.join(' → ')}
              </div>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? 'Processing...' : 'Submit Rating'}
          </Button>
        </div>
      );
    }


    // Progressive tapping point state - render TappingGuide
    if (chatState === 'tapping-point') {
      console.log('[AIAnxietyBot] 🎯 Rendering tapping-point state');
      console.log('[AIAnxietyBot] Current tapping point:', currentTappingPoint);
      console.log('[AIAnxietyBot] Setup statements:', sessionContext.setupStatements);
      console.log('[AIAnxietyBot] Statement order:', sessionContext.statementOrder);
      console.log('[AIAnxietyBot] Full session context:', sessionContext);
      
      // Safety check: ensure we have data
      if (!sessionContext.setupStatements || sessionContext.setupStatements.length === 0) {
        return (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg space-y-3">
            <div>
              <p className="text-sm font-semibold text-destructive mb-1">
                ⚠️ Missing Tapping Data
              </p>
              <p className="text-xs text-muted-foreground">
                Current state: <span className="font-mono">{chatState}</span> | Point: {currentTappingPoint}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                The AI didn't provide the required setup statements and statement order. This is likely a temporary issue.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={startNewSession} size="sm" variant="outline">
                Start New Session
              </Button>
              <Button 
                onClick={async () => {
                  console.log('[AIAnxietyBot] User skipping tapping, moving to breathing');
                  setChatState('tapping-breathing');
                }} 
                size="sm"
              >
                Skip to Breathing
              </Button>
            </div>
          </div>
        );
      }
      
      return (
        <div className="space-y-2">
          <TappingGuide
            setupStatements={sessionContext.setupStatements}
            statementOrder={sessionContext.statementOrder || [0, 1, 2, 0, 1, 2, 0, 1]}
            aiReminderPhrases={(sessionContext as any).aiReminderPhrases}
            reminderPhraseType={sessionContext.reminderPhraseType || 'acknowledging'}
            feeling={sessionContext.feeling || 'this feeling'}
            bodyLocation={sessionContext.bodyLocation || 'body'}
            problem={sessionContext.problem}
            onComplete={() => setChatState('tapping-breathing')}
            onPointChange={setCurrentTappingPoint}
          />
        </div>
      );
    }

    // Breathing state
    if (chatState === 'tapping-breathing') {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-lg font-semibold mb-4">
              Take a Deep Breath
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                How are you feeling now? (0-10):
              </label>
              <IntensitySlider
                value={currentIntensity}
                onValueChange={setCurrentIntensity}
                className="w-full"
              />
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? 'Processing...' : 'Continue'}
          </Button>
        </div>
      );
    }


    // When advice or complete, hide input area - header buttons handle actions
    if (chatState === 'advice' || chatState === 'complete') {
      return null;
    }

    // Conversation-deepening uses same UI as conversation
    if (chatState === 'conversation' || chatState === 'conversation-deepening') {
      return (
        <ChatInput
          chatState={chatState}
          currentInput={currentInput}
          onInputChange={setCurrentInput}
          onSubmit={handleSubmit}
          onKeyPress={handleKeyPress}
          isLoading={isLoading}
        />
      );
    }

    return (
      <ChatInput
        chatState={chatState}
        currentInput={currentInput}
        onInputChange={setCurrentInput}
        onSubmit={handleSubmit}
        onKeyPress={handleKeyPress}
        isLoading={isLoading}
      />
    );
  };

  const loadHistorySession = (historicalSession: any) => {
    setShowHistory(false);
    toast({
      title: "Session Loaded",
      description: `Loaded session from ${new Date(historicalSession.created_at).toLocaleDateString()}`,
    });
  };

  if (chatState === 'questionnaire') {
    return (
      <QuestionnaireView 
        onComplete={handleQuestionnaireComplete}
        onSkip={handleSkipAssessment}
      />
    );
  }

  // Check if avatar is enabled for layout
  const isAvatarEnabled = avatarContext?.avatarEnabled && avatarContext.status !== 'idle';

  return (
    <div className="max-w-5xl mx-auto">
      <ChatHeader 
        questionnaireSession={questionnaireSession}
        chatState={chatState}
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory(!showHistory)}
        onStartNewSession={startNewSession}
      />

      <div className={`grid gap-6 ${isAvatarEnabled ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
        {/* Avatar Panel - only show when enabled */}
        {isAvatarEnabled && (
          <div className="lg:col-span-1 order-first lg:order-last">
            <Card className="sticky top-4">
              <CardContent className="p-4 flex flex-col items-center">
                <StreamingAvatar size="medium" />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  AI Avatar
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Chat Interface */}
        <div className={isAvatarEnabled ? 'lg:col-span-3' : 'lg:col-span-3'}>
          <Card className="border-0 shadow-elevated bg-gradient-to-b from-card to-card/95 backdrop-blur-sm overflow-hidden">
            {/* Premium Header */}
            <CardHeader className="border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-warm">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      EFT Tapping Assistant
                      <Sparkles className="w-4 h-4 text-primary/60" />
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {sessionContext.problem || 'Ready to help you feel better'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages container with auto-scroll */}
              <div 
                ref={scrollContainerRef}
                className="h-[500px] overflow-y-auto px-6 py-4"
              >
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    // Check if this is a choice message
                    if (message.type === 'system') {
                      try {
                        const parsed = JSON.parse(message.content);
                        
                        // New post-tapping choice component
                        if (parsed.type === 'post-tapping-choice') {
                          return (
                            <PostTappingChoice
                              key={message.id}
                              intensity={parsed.intensity}
                              initialIntensity={parsed.initialIntensity}
                              round={parsed.round}
                              roundsWithoutReduction={parsed.roundsWithoutReduction}
                              onContinueTapping={() => handleContinueTapping(parsed.intensity, parsed.phraseType)}
                              onTalkToTapaway={handleTalkToTapaway}
                              onEndSession={handleEndSession}
                            />
                          );
                        }
                        
                        // Legacy continue-choice (keep for backwards compatibility)
                        if (parsed.type === 'continue-choice') {
                          return (
                            <div key={message.id} className="space-y-3 p-4 bg-secondary/50 rounded-2xl border border-border/50 shadow-soft">
                              <p className="text-sm font-medium">
                                Great progress! You've reduced your intensity from {sessionContext.initialIntensity}/10 to {parsed.intensity}/10.
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Would you like to continue tapping to bring it even lower?
                              </p>
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => handleContinueTapping(parsed.intensity)}
                                  size="sm"
                                >
                                  Yes, Continue Tapping
                                </Button>
                                <Button 
                                  onClick={handleEndSession}
                                  size="sm"
                                  variant="outline"
                                >
                                  No, I'm Ready to Finish
                                </Button>
                              </div>
                            </div>
                          );
                        }
                      } catch (e) {
                        // Not a JSON message, render normally
                      }
                    }
                    
                    // Check if this is the LAST bot message AND we're in advice state
                    const isLastBotMessage = message.type === 'bot' && index === messages.length - 1;
                    
                    if (isLastBotMessage && chatState === 'advice') {
                      return (
                        <AdviceDisplay 
                          key={message.id}
                          session={{
                            id: '',
                            timestamp: new Date(),
                            problem: sessionContext.problem || '',
                            feeling: sessionContext.feeling || '',
                            bodyLocation: sessionContext.bodyLocation || '',
                            initialIntensity: sessionContext.initialIntensity || 0,
                            currentIntensity: sessionContext.currentIntensity || 0,
                            round: sessionContext.round || 0,
                            setupStatements: sessionContext.setupStatements || [],
                            reminderPhrases: sessionContext.reminderPhrases || [],
                            isComplete: false
                          }}
                          adviceText={message.content}
                          onComplete={() => {
                            console.log('Advice complete, transitioning to complete state');
                            setChatState('complete');
                          }}
                        />
                      );
                    }
                    
                    return <ChatMessage key={message.id} message={message} />;
                  })}
                  {isLoading && <LoadingIndicator />}
                  
                  {/* Show SessionComplete component after all messages when state is complete */}
                  {chatState === 'complete' && (
                    <SessionComplete 
                      onNewSession={startNewSession}
                      onViewHistory={() => setShowHistory(true)}
                    />
                  )}
                  
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} className="h-1" />
                </div>
              </div>
              
              {/* Input area */}
              <div className="p-4 border-t border-border/30 bg-gradient-to-t from-muted/20 to-transparent">
                {renderInput()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          {showHistory ? (
            <ChatHistory 
              chatHistory={chatHistory}
              onLoadSession={loadHistorySession}
              onClose={() => setShowHistory(false)}
            />
          ) : (
            <SessionProgress session={{
              id: '',
              timestamp: new Date(),
              problem: sessionContext.problem || '',
              feeling: sessionContext.feeling || '',
              bodyLocation: sessionContext.bodyLocation || '',
              initialIntensity: sessionContext.initialIntensity || 0,
              currentIntensity: sessionContext.currentIntensity || 0,
              round: sessionContext.round || 0,
              setupStatements: sessionContext.setupStatements || [],
              reminderPhrases: sessionContext.reminderPhrases || [],
              isComplete: chatState === 'complete'
            }} />
          )}
        </div>
      </div>
      
      {/* Crisis Support Modal */}
      {showCrisisSupport && (
        <CrisisSupport onClose={() => setShowCrisisSupport(false)} />
      )}
    </div>
  );
};

// Wrapper component that provides avatar context
const AIAnxietyBot = () => {
  return (
    <AvatarProvider>
      <AIAnxietyBotInner />
    </AvatarProvider>
  );
};

export default AIAnxietyBot;