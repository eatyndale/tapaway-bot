import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Bot, Send, Sparkles } from "lucide-react";
import { ChatState, Message, ChatSession } from "./types";
import ChatMessage from "./ChatMessage";
import LoadingIndicator from "./LoadingIndicator";

interface ChatInterfaceProps {
  chatState: ChatState;
  session: ChatSession;
  messages: Message[];
  currentInput: string;
  setCurrentInput: (value: string) => void;
  currentIntensity: number[];
  setCurrentIntensity: (value: number[]) => void;
  onSubmit: () => void;
  onSetupStatementSelect: (index: number) => void;
  onNextTappingPoint: () => void;
  selectedSetupStatement: number | null;
  isTapping: boolean;
  currentTappingPoint: number;
  tappingPoints: Array<{ name: string; key: string }>;
  renderAdvice: () => JSX.Element | null;
  renderSessionComplete: () => JSX.Element | null;
  isLoading?: boolean;
}

const ChatInterface = ({
  chatState,
  session,
  messages,
  currentInput,
  setCurrentInput,
  currentIntensity,
  setCurrentIntensity,
  onSubmit,
  onSetupStatementSelect,
  onNextTappingPoint,
  selectedSetupStatement,
  isTapping,
  currentTappingPoint,
  tappingPoints,
  renderAdvice,
  renderSessionComplete,
  isLoading = false
}: ChatInterfaceProps) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Robust auto-scroll that works with dynamic content
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, []);

  // Scroll on new messages
  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading, scrollToBottom]);

  // Also scroll when loading state changes (bot starts/stops typing)
  useEffect(() => {
    scrollToBottom();
  }, [isLoading, scrollToBottom]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const renderSystemMessage = (message: Message) => {
    if (message.content === 'setup-statements') {
      return (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm font-medium text-primary mb-3">
            Choose the setup statement that resonates most with you:
          </p>
          {session.setupStatements.map((statement, index) => (
            <button
              key={index}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                selectedSetupStatement === index
                  ? "border-primary bg-primary/10 shadow-warm"
                  : "border-border/50 bg-card hover:border-primary/30 hover:shadow-soft hover:-translate-y-0.5"
              }`}
              onClick={() => onSetupStatementSelect(index)}
              disabled={selectedSetupStatement !== null}
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold mr-3">
                {index + 1}
              </span>
              <span className="text-foreground">"{statement}"</span>
            </button>
          ))}
        </div>
      );
    }
    
    if (message.content === 'tapping-guide' && isTapping) {
      return (
        <div className="glass rounded-2xl p-6 shadow-warm animate-fade-in">
          <div className="text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <span className="text-white font-bold text-xl">{currentTappingPoint + 1}</span>
            </div>
            <h4 className="font-semibold text-lg text-foreground mb-2">
              {tappingPoints[currentTappingPoint].name}
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Tap gently while saying:
            </p>
            <div className="bg-background/80 p-4 rounded-xl border border-border/50 mb-5 shadow-soft">
              <em className="text-foreground">"{session.reminderPhrases[currentTappingPoint]}"</em>
            </div>
            <Button onClick={onNextTappingPoint} className="w-full" size="lg">
              {currentTappingPoint < tappingPoints.length - 1 ? 'Next Point' : 'Complete Sequence'}
            </Button>
          </div>
        </div>
      );
    }

    if (message.content === 'advice') {
      return renderAdvice();
    }

    if (message.content === 'session-complete') {
      return renderSessionComplete();
    }
    
    return null;
  };

  const renderInput = () => {
    if (isTapping || chatState === 'advice' || chatState === 'complete') return null;

    switch (chatState) {
      case 'conversation':
        return (
          <div className="relative">
            <Textarea
              ref={inputRef}
              placeholder="Tell me what's on your mind..."
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[100px] resize-none pr-14 bg-background/50"
              rows={3}
              disabled={isLoading}
            />
          </div>
        );
      
      case 'gathering-intensity':
      case 'post-tapping':
        return (
          <div className="space-y-5 p-4 bg-muted/30 rounded-2xl">
            <div className="px-2">
              <Slider
                value={currentIntensity}
                onValueChange={setCurrentIntensity}
                max={10}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between items-center text-sm mt-4">
                <span className="text-muted-foreground">0 - Calm</span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-primary">{currentIntensity[0]}</span>
                  <span className="text-muted-foreground text-xs">/10</span>
                </div>
                <span className="text-muted-foreground">10 - Intense</span>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className="border-0 shadow-elevated bg-gradient-to-b from-card to-card/95 backdrop-blur-sm h-[650px] flex flex-col overflow-hidden">
      {/* Premium Header */}
      <CardHeader className="flex-shrink-0 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent pb-4">
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
              <CardDescription className="text-xs">
                {session.problem || 'Ready to help you feel better'}
              </CardDescription>
            </div>
          </div>
          {/* Session indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-soft" />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="animate-fade-in">
                {message.type === 'system' ? (
                  renderSystemMessage(message)
                ) : (
                  <ChatMessage message={message} />
                )}
              </div>
            ))}
            {isLoading && <LoadingIndicator />}
            {/* Scroll anchor */}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>
        
        {/* Input Area */}
        <div className="flex-shrink-0 p-4 border-t border-border/30 bg-gradient-to-t from-muted/20 to-transparent">
          <div className="space-y-4">
            {renderInput()}
            {!isTapping && chatState !== 'advice' && chatState !== 'complete' && (
              <div className="flex justify-end">
                <Button 
                  onClick={onSubmit} 
                  disabled={isLoading || (!currentInput.trim() && !['gathering-intensity', 'post-tapping'].includes(chatState))}
                  className="group"
                  size="lg"
                >
                  <Send className="w-4 h-4 mr-2 transition-transform group-hover:translate-x-0.5" />
                  {['gathering-intensity', 'post-tapping'].includes(chatState) ? 'Confirm' : 'Send'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;
