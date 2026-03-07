import { useState, useEffect, useRef } from "react";
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
import ChatInput from "./anxiety-bot/ChatInput";
import ChatHeader from "./anxiety-bot/ChatHeader";
import QuestionnaireView from "./anxiety-bot/QuestionnaireView";
import AdviceDisplay from "./anxiety-bot/AdviceDisplay";
import SessionComplete from "./anxiety-bot/SessionComplete";
import GreetingIntensity from "./anxiety-bot/GreetingIntensity";
import QuietIntegration from "./anxiety-bot/QuietIntegration";


const AIAnxietyBot = () => {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [chatState, setChatState] = useState<ChatState>(() => {
    const hasCompletedAssessment = localStorage.getItem('hasCompletedAssessment');
    return hasCompletedAssessment ? 'greeting-intensity' : 'questionnaire';
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
    handleTalkToTapaway,
    handleGreetingIntensity,
    handleQuietIntegrationComplete,
    handleSupportContacted
  } = useAIChat({
    onStateChange: (newState) => {
      console.log('State change:', chatState, '->', newState);
      setChatState(newState);
    },
    onSessionUpdate: (context) => {},
    onCrisisDetected: () => {
      setShowCrisisSupport(true);
    },
    onTypoCorrection: (original, corrected) => {
      console.log('[AIAnxietyBot] Typo corrected:', original, '->', corrected);
    }
  });

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (showHistory) loadChatHistory();
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
    setChatState('greeting-intensity');
    toast({
      title: "Assessment Complete",
      description: `Your anxiety level: ${session.severity} (Score: ${session.totalScore}/27)`,
    });
  };

  const handleSkipAssessment = () => {
    setChatState('greeting-intensity');
    toast({
      title: "Assessment Skipped",
      description: "You can take the assessment later from the menu.",
    });
  };

  const handleSubmit = async () => {
    if (!currentInput.trim() && !['gathering-intensity', 'post-tapping', 'tapping-breathing'].includes(chatState)) return;

    if (chatState === 'tapping-breathing') {
      const intensity = currentIntensity[0];
      await handlePostTappingIntensity(intensity);
      return;
    }

    let messageToSend = currentInput;
    let additionalContext: any = {};

    if (chatState === 'gathering-intensity' || chatState === 'post-tapping') {
      messageToSend = `${currentIntensity[0]}/10`;
      if (chatState === 'gathering-intensity') {
        additionalContext.initialIntensity = currentIntensity[0];
        additionalContext.currentIntensity = currentIntensity[0];
      } else {
        additionalContext.currentIntensity = currentIntensity[0];
      }
    }

    await sendMessage(messageToSend, chatState, additionalContext);
    setCurrentInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleContinueTapping = async (intensity: number, phraseType?: 'acknowledging' | 'partial-release' | 'full-release') => {
    await startNewTappingRound(intensity, phraseType);
  };

  const handleEndSession = async () => {
    if (sessionContext.currentIntensity !== undefined) {
      await completeTappingSession(sessionContext.currentIntensity);
    }
    setChatState('advice');
    await sendMessage(
      `I'm ready to finish. My final intensity is ${sessionContext.currentIntensity}/10. Initial was ${sessionContext.initialIntensity}/10.`,
      'advice',
      { currentIntensity: sessionContext.currentIntensity }
    );
  };

  const handleQuietIntegration = () => {
    setChatState('quiet-integration');
  };

  const handleContactSupport = () => {
    setShowCrisisSupport(true);
    handleSupportContacted();
  };

  const renderInput = () => {
    // Greeting intensity - SUDS first
    if (chatState === 'greeting-intensity') {
      return (
        <GreetingIntensity
          userName={userProfile?.first_name || 'there'}
          onSubmit={handleGreetingIntensity}
          isLoading={isLoading}
        />
      );
    }

    // Quiet Integration
    if (chatState === 'quiet-integration') {
      return (
        <QuietIntegration
          onComplete={handleQuietIntegrationComplete}
        />
      );
    }

    // Setup phase
    if (chatState === 'setup') {
      if (!sessionContext.setupStatements || sessionContext.setupStatements.length === 0) {
        return (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg space-y-3">
            <p className="text-sm font-semibold text-destructive mb-1">⚠️ Missing Setup Statements</p>
            <Button onClick={startNewSession} size="sm" variant="outline">Start New Session</Button>
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
    
    // Intensity sliders
    if (chatState === 'gathering-intensity' || chatState === 'post-tapping') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rate your intensity (0-10):</label>
            <IntensitySlider value={currentIntensity} onValueChange={setCurrentIntensity} className="w-full" />
            {intensityHistory.length > 0 && (
              <div className="text-xs text-muted-foreground">Previous ratings: {intensityHistory.join(' → ')}</div>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? 'Processing...' : 'Submit Rating'}
          </Button>
        </div>
      );
    }

    // Tapping point
    if (chatState === 'tapping-point') {
      if (!sessionContext.setupStatements || sessionContext.setupStatements.length === 0) {
        return (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg space-y-3">
            <p className="text-sm font-semibold text-destructive mb-1">⚠️ Missing Tapping Data</p>
            <div className="flex gap-2">
              <Button onClick={startNewSession} size="sm" variant="outline">Start New Session</Button>
              <Button onClick={() => setChatState('tapping-breathing')} size="sm">Skip to Breathing</Button>
            </div>
          </div>
        );
      }
      return (
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
      );
    }

    // Breathing state
    if (chatState === 'tapping-breathing') {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-lg font-semibold mb-4">Take a Deep Breath</div>
            <div className="space-y-2">
              <label className="text-sm font-medium">How are you feeling now? (0-10):</label>
              <IntensitySlider value={currentIntensity} onValueChange={setCurrentIntensity} className="w-full" />
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? 'Processing...' : 'Continue'}
          </Button>
        </div>
      );
    }

    if (chatState === 'advice' || chatState === 'complete') return null;

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

  return (
    <div className="max-w-4xl mx-auto">
      <ChatHeader 
        questionnaireSession={questionnaireSession}
        chatState={chatState}
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory(!showHistory)}
        onStartNewSession={startNewSession}
      />

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="border-0 shadow-elevated bg-gradient-to-b from-card to-card/95 backdrop-blur-sm overflow-hidden">
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
                      {sessionContext.isTearlessTrauma ? 'Gentle tapping mode' : sessionContext.problem || 'Ready to help you feel better'}
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
              <div 
                ref={scrollContainerRef}
                className="h-[500px] overflow-y-auto px-6 py-4"
              >
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    if (message.type === 'system') {
                      try {
                        const parsed = JSON.parse(message.content);
                        
                        if (parsed.type === 'post-tapping-choice') {
                          return (
                            <PostTappingChoice
                              key={message.id}
                              intensity={parsed.intensity}
                              initialIntensity={parsed.initialIntensity}
                              round={parsed.round}
                              roundsWithoutReduction={parsed.roundsWithoutReduction}
                              highSudsRounds={parsed.highSudsRounds}
                              isTearlessTrauma={parsed.isTearlessTrauma}
                              onContinueTapping={() => handleContinueTapping(parsed.intensity, parsed.phraseType)}
                              onTalkToTapaway={handleTalkToTapaway}
                              onEndSession={handleEndSession}
                              onQuietIntegration={handleQuietIntegration}
                              onContactSupport={handleContactSupport}
                            />
                          );
                        }
                        
                        if (parsed.type === 'continue-choice') {
                          return (
                            <div key={message.id} className="space-y-3 p-4 bg-secondary/50 rounded-2xl border border-border/50 shadow-soft">
                              <p className="text-sm font-medium">
                                Great progress! You've reduced your intensity from {sessionContext.initialIntensity}/10 to {parsed.intensity}/10.
                              </p>
                              <div className="flex gap-2">
                                <Button onClick={() => handleContinueTapping(parsed.intensity)} size="sm">Yes, Continue</Button>
                                <Button onClick={handleEndSession} size="sm" variant="outline">No, Finish</Button>
                              </div>
                            </div>
                          );
                        }
                      } catch (e) {}
                    }
                    
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
                          onComplete={() => setChatState('complete')}
                        />
                      );
                    }
                    
                    return <ChatMessage key={message.id} message={message} />;
                  })}
                  {isLoading && <LoadingIndicator />}
                  
                  {chatState === 'complete' && (
                    <SessionComplete 
                      onNewSession={startNewSession}
                      onViewHistory={() => setShowHistory(true)}
                    />
                  )}
                  
                  <div ref={messagesEndRef} className="h-1" />
                </div>
              </div>
              
              <div className="p-4 border-t border-border/30 bg-gradient-to-t from-muted/20 to-transparent">
                {renderInput()}
              </div>
            </CardContent>
          </Card>
        </div>

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
      
      {showCrisisSupport && (
        <CrisisSupport 
          onClose={() => setShowCrisisSupport(false)}
          onSupportContacted={handleSupportContacted}
        />
      )}
    </div>
  );
};

export default AIAnxietyBot;
