import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, History } from "lucide-react";
import ChatInterface from "./anxiety-bot/ChatInterface";
import SessionProgress from "./anxiety-bot/SessionProgress";
import LocalChatHistory from "./anxiety-bot/LocalChatHistory";
import { ChatSession as SupabaseChatSession } from "@/services/supabaseService";
import AdviceDisplay from "./anxiety-bot/AdviceDisplay";
import SessionComplete from "./anxiety-bot/SessionComplete";
import { ChatState, ChatSession, Message } from "./anxiety-bot/types";
import { supabaseService } from "@/services/supabaseService";
import { supabase } from "@/integrations/supabase/client";

const tappingPoints = [
  { name: "Top of Head", key: "top-head" },
  { name: "Start of Eyebrow", key: "eyebrow" },
  { name: "Outer Eye", key: "outer-eye" },
  { name: "Under Eye", key: "under-eye" },
  { name: "Under Nose", key: "under-nose" },
  { name: "Chin", key: "chin" },
  { name: "Collarbone", key: "collarbone" },
  { name: "Under Arm", key: "under-arm" }
];

const AnxietyBot = () => {
  const [chatState, setChatState] = useState<ChatState>('conversation');
  const [session, setSession] = useState<ChatSession>({
    id: '',
    timestamp: new Date(),
    problem: '',
    feeling: '',
    bodyLocation: '',
    initialIntensity: 0,
    currentIntensity: 0,
    round: 0,
    setupStatements: [],
    reminderPhrases: [],
    isComplete: false
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentIntensity, setCurrentIntensity] = useState([5]);
  const [isTapping, setIsTapping] = useState(false);
  const [currentTappingPoint, setCurrentTappingPoint] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSetupStatement, setSelectedSetupStatement] = useState<number | null>(null);
  const [currentSupabaseSession, setCurrentSupabaseSession] = useState<string | null>(null);
  
  useEffect(() => {
    // Load chat history from localStorage for backward compatibility
    const savedHistory = localStorage.getItem('anxietyBot-chatHistory');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
    
    // Initialize first session
    startNewSession();
  }, []);

  const startNewSession = () => {
    const newSessionId = Date.now().toString();
    const newSession: ChatSession = {
      id: newSessionId,
      timestamp: new Date(),
      problem: '',
      feeling: '',
      bodyLocation: '',
      initialIntensity: 0,
      currentIntensity: 0,
      round: 0,
      setupStatements: [],
      reminderPhrases: [],
      isComplete: false
    };
    
    setSession(newSession);
    setChatState('conversation');
    setMessages([
      {
        id: `${newSessionId}-welcome`,
        type: 'bot',
        content: "Hello! I'm here to help you work through your anxiety using EFT tapping techniques. What would you like to work on today?",
        timestamp: new Date(),
        sessionId: newSessionId
      }
    ]);
    setCurrentInput("");
    setIsTapping(false);
    setCurrentTappingPoint(0);
    setSelectedSetupStatement(null);
  };

  const addMessage = (type: 'bot' | 'user' | 'system', content: string) => {
    const newMessage: Message = {
      id: `${session.id}-${Date.now()}`,
      type,
      content,
      timestamp: new Date(),
      sessionId: session.id
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const saveSessionToHistory = () => {
    const updatedHistory = [...chatHistory, { ...session, isComplete: true }];
    setChatHistory(updatedHistory);
    localStorage.setItem('anxietyBot-chatHistory', JSON.stringify(updatedHistory));
  };

  const generateSetupStatements = (problem: string, feeling: string, bodyLocation: string, isSubsequent = false) => {
    const prefix = isSubsequent ? "Even though I STILL feel some of this" : "Even though I feel this";
    const remaining = isSubsequent ? "remaining" : "";
    
    return [
      `${prefix} ${feeling} in my ${bodyLocation} because ${problem}, I'd like to be at peace.`,
      `I ${isSubsequent ? 'STILL ' : ''}feel ${feeling} in my ${bodyLocation}, I'd like to relax now.`,
      `This ${remaining} ${feeling} in my ${bodyLocation}, ${problem}, but I want to let it go.`
    ];
  };

  const generateReminderPhrases = (problem: string, feeling: string, bodyLocation: string) => {
    return [
      `This ${feeling} in my ${bodyLocation}`,
      `I feel ${feeling}`,
      problem,
      `This ${feeling} in my ${bodyLocation}`,
      `I feel so ${feeling}`,
      `This ${feeling}`,
      `I want to let this go`,
      `I choose to relax`
    ];
  };

  const handleProblemSubmit = async () => {
    if (!currentInput.trim()) return;
    
    addMessage('user', currentInput);
    setSession(prev => ({ ...prev, problem: currentInput }));
    
    // Simple crisis detection for self-harm mentions
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'hurt myself', 'die', 'death'];
    const containsCrisisKeyword = crisisKeywords.some(keyword => 
      currentInput.toLowerCase().includes(keyword)
    );
    
    if (containsCrisisKeyword) {
      addMessage('bot', "I'm concerned about what you've shared. Your safety is important. Please consider reaching out to a mental health professional immediately.");
      addMessage('system', 'crisis-resources');
      return;
    }
    
    addMessage('bot', "Thank you for sharing that. I can hear you're going through something difficult. Tell me more about how this makes you feel emotionally.");
    setCurrentInput("");
  };

  const handleIntensitySubmit = async () => {
    const intensity = currentIntensity[0];
    addMessage('user', `${intensity}/10`);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Create tapping session in Supabase
        const { session: tappingSession, error } = await supabaseService.createTappingSession(user.id, {
          problem: session.problem,
          feeling: session.feeling,
          body_location: session.bodyLocation,
          initial_intensity: intensity
        });
        
        if (!error && tappingSession) {
          setCurrentSupabaseSession(tappingSession.id);
          setSession(prev => ({
            ...prev,
            initialIntensity: intensity,
            currentIntensity: intensity,
            round: 1,
            setupStatements: tappingSession.setup_statements,
            reminderPhrases: tappingSession.reminder_phrases
          }));
        } else {
          throw new Error('Failed to create tapping session');
        }
      } else {
        throw new Error('User not authenticated');
      }
      
      addMessage('bot', `I understand you're feeling ${session.feeling} in your ${session.bodyLocation} at a ${intensity}/10 intensity. Let's work through this together with some tapping.`);
      addMessage('system', 'setup-statements');
      
      setChatState('tapping-point');
    } catch (error) {
      // Fallback to local generation if API fails
      const statements = generateSetupStatements(session.problem, session.feeling, session.bodyLocation);
      const phrases = generateReminderPhrases(session.problem, session.feeling, session.bodyLocation);
      
      setSession(prev => ({
        ...prev,
        initialIntensity: intensity,
        currentIntensity: intensity,
        round: 1,
        setupStatements: statements,
        reminderPhrases: phrases
      }));
      
      addMessage('bot', `I understand you're feeling ${session.feeling} in your ${session.bodyLocation} at a ${intensity}/10 intensity. Let's work through this together with some tapping.`);
      addMessage('system', 'setup-statements');
      
      setChatState('tapping-point');
    }
  };

  const handleSetupStatementSelect = (index: number) => {
    setSelectedSetupStatement(index);
    const selectedStatement = session.setupStatements[index];
    addMessage('user', `I choose: "${selectedStatement}"`);
    addMessage('bot', "Perfect! Now let's begin the tapping sequence. I'll guide you through each point. Start by tapping on your karate chop point (side of your hand) while repeating your chosen setup statement 3 times.");
    addMessage('system', 'tapping-guide');
    setChatState('post-tapping');
    setIsTapping(true);
    setCurrentTappingPoint(0);
  };

  const handleNextTappingPoint = () => {
    if (currentTappingPoint < tappingPoints.length - 1) {
      setCurrentTappingPoint(prev => prev + 1);
    } else {
      setIsTapping(false);
      addMessage('bot', "Excellent! You've completed the tapping sequence. Take a deep breath in... and out. Let yourself relax for a moment.");
      addMessage('bot', "Now, thinking about the same issue, how intense does it feel on a scale of 0-10?");
      setChatState('post-tapping');
    }
  };

  const handlePostTappingIntensity = async () => {
    const newIntensity = currentIntensity[0];
    addMessage('user', `${newIntensity}/10`);
    
    setSession(prev => ({ ...prev, currentIntensity: newIntensity }));
    
    // Submit EFT feedback to Supabase
    try {
      if (currentSupabaseSession) {
        await supabaseService.updateTappingSession(currentSupabaseSession, {
          final_intensity: newIntensity,
          rounds_completed: session.round,
          completed_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.log('Failed to submit EFT feedback:', error);
    }
    
    if (newIntensity === 0) {
      addMessage('bot', "🎉 Wonderful! You've successfully reduced your anxiety to zero. Let me share some personalized advice to help you maintain this progress:");
      addMessage('system', 'advice');
      setChatState('advice');
    } else if (session.round >= 3) {
      addMessage('bot', `We've completed ${session.round} rounds. Your intensity has reduced from ${session.initialIntensity} to ${newIntensity}. Let me provide some guidance on your progress:`);
      addMessage('system', 'advice');
      setChatState('advice');
    } else {
      // Generate new EFT script for subsequent rounds using local logic
      const newStatements = generateSetupStatements(session.problem, session.feeling, session.bodyLocation, true);
      setSession(prev => ({ 
        ...prev, 
        round: prev.round + 1,
        setupStatements: newStatements 
      }));
      
      addMessage('bot', `Great progress! Your intensity has reduced from ${session.initialIntensity} to ${newIntensity}. Let's do another round of tapping with updated statements:`);
      addMessage('system', 'setup-statements');
      setChatState('tapping-point');
      setSelectedSetupStatement(null);
    }
  };

  const handleAdviceComplete = () => {
    saveSessionToHistory();
    addMessage('bot', "Thank you for using the EFT tapping assistant! Feel free to start a new session whenever you need support. Remember, healing is a journey, and you're doing great! 🌟");
    
    setTimeout(() => {
      addMessage('system', 'session-complete');
    }, 1000);
    
    setChatState('complete');
  };

  const handleNewSessionFromComplete = () => {
    startNewSession();
  };

  const handleSubmit = () => {
    switch (chatState) {
      case 'conversation':
        handleProblemSubmit();
        break;
      case 'gathering-intensity':
        handleIntensitySubmit();
        break;
      case 'post-tapping':
        handlePostTappingIntensity();
        break;
    }
  };

  const loadHistorySession = (historicalSession: ChatSession) => {
    setShowHistory(false);
    addMessage('system', `Loaded session from ${historicalSession.timestamp.toLocaleDateString()}: ${historicalSession.problem}`);
  };

  const renderAdvice = () => (
    <AdviceDisplay 
      session={session} 
      onComplete={handleAdviceComplete}
    />
  );

  const renderSessionComplete = () => (
    <SessionComplete 
      onNewSession={handleNewSessionFromComplete}
      onViewHistory={() => setShowHistory(true)}
    />
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Anxiety Reduction Chat</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center"
          >
            <History className="w-4 h-4 mr-2" />
            Chat History
          </Button>
          <Button variant="outline" onClick={startNewSession} className="flex items-center">
            <RotateCcw className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <ChatInterface
            chatState={chatState}
            session={session}
            messages={messages}
            currentInput={currentInput}
            setCurrentInput={setCurrentInput}
            currentIntensity={currentIntensity}
            setCurrentIntensity={setCurrentIntensity}
            onSubmit={handleSubmit}
            onSetupStatementSelect={handleSetupStatementSelect}
            onNextTappingPoint={handleNextTappingPoint}
            selectedSetupStatement={selectedSetupStatement}
            isTapping={isTapping}
            currentTappingPoint={currentTappingPoint}
            tappingPoints={tappingPoints}
            renderAdvice={renderAdvice}
            renderSessionComplete={renderSessionComplete}
          />
        </div>

        {/* Sidebar */}
        <div>
          {showHistory ? (
            <LocalChatHistory 
              chatHistory={chatHistory}
              onLoadSession={loadHistorySession}
            />
          ) : (
            <SessionProgress session={session} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AnxietyBot;
