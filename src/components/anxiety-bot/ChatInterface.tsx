
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send } from "lucide-react";
import { ChatState, Message, ChatSession } from "./types";

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
  renderSessionComplete
}: ChatInterfaceProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const renderMessage = (message: Message) => {
    if (message.type === 'system') {
      if (message.content === 'setup-statements') {
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium text-blue-600 mb-2">Choose the setup statement that resonates most with you:</p>
            {session.setupStatements.map((statement, index) => (
              <Button
                key={index}
                variant={selectedSetupStatement === index ? "default" : "outline"}
                className="w-full text-left justify-start h-auto p-3 whitespace-normal"
                onClick={() => onSetupStatementSelect(index)}
                disabled={selectedSetupStatement !== null}
              >
                <span className="font-bold mr-2">{index + 1}.</span>
                "{statement}"
              </Button>
            ))}
          </div>
        );
      }
      
      if (message.content === 'tapping-guide' && isTapping) {
        return (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#94c11f] to-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">{currentTappingPoint + 1}</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                {tappingPoints[currentTappingPoint].name}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Tap gently while saying:
              </p>
              <div className="bg-white p-2 rounded border mb-4">
                <em>"{session.reminderPhrases[currentTappingPoint]}"</em>
              </div>
              <Button onClick={onNextTappingPoint} className="w-full bg-gradient-to-r from-[#94c11f] to-green-600 hover:from-[#7da01a] hover:to-green-700 text-white">
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
    }

    return (
      <div className={`p-3 rounded-lg ${
        message.type === 'bot'
          ? 'bg-blue-50 border-l-4 border-l-blue-500'
          : 'bg-green-50 border-l-4 border-l-[#94c11f] ml-8'
      }`}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-gray-600">
            {message.type === 'bot' ? 'Assistant' : 'You'}
          </p>
          <p className="text-xs text-gray-400">
            {message.timestamp.toLocaleTimeString()}
          </p>
        </div>
        <p className="text-gray-800 whitespace-pre-line">{message.content}</p>
      </div>
    );
  };

  const renderInput = () => {
    if (isTapping || chatState === 'advice' || chatState === 'complete') return null;

    switch (chatState) {
      case 'conversation':
        return (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            placeholder="Tell me what's on your mind..."
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="min-h-[80px] resize-none"
            rows={3}
          />
        );
      
      case 'gathering-intensity':
      case 'post-tapping':
        return (
          <div className="space-y-4">
            <div className="px-4">
              <Slider
                value={currentIntensity}
                onValueChange={setCurrentIntensity}
                max={10}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>0 - No intensity</span>
                <span className="font-bold text-lg text-gray-800">{currentIntensity[0]}</span>
                <span>10 - Extreme intensity</span>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center">
          <Bot className="w-5 h-5 mr-2 text-[#94c11f]" />
          EFT Tapping Assistant
        </CardTitle>
        <CardDescription>
          Current session: {session.problem || 'New session'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                {renderMessage(message)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Input Area */}
        <div className="flex-shrink-0 mt-4 pt-4 border-t">
          <div className="space-y-3">
            {renderInput()}
            {!isTapping && (
              <div className="flex justify-end">
                <Button 
                  onClick={onSubmit} 
                  disabled={!currentInput.trim() && !['gathering-intensity', 'post-tapping'].includes(chatState)}
                  className="flex items-center bg-gradient-to-r from-[#94c11f] to-green-600 hover:from-[#7da01a] hover:to-green-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
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
