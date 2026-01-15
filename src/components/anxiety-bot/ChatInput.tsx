import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { ChatState } from "./types";

interface ChatInputProps {
  chatState: ChatState;
  currentInput: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
}

const ChatInput = ({ 
  chatState, 
  currentInput, 
  onInputChange, 
  onSubmit, 
  onKeyPress, 
  isLoading 
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current && !isLoading) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  return (
    <div className="relative flex items-end gap-3 p-1">
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={currentInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={
            chatState === 'conversation' 
              ? "Tell me what's on your mind..." 
              : "Type your response..."
          }
          className="min-h-[52px] max-h-[150px] resize-none pr-4 bg-background/50 transition-all duration-300 focus:shadow-warm"
          rows={1}
          disabled={isLoading}
        />
      </div>
      
      <Button 
        onClick={onSubmit} 
        disabled={isLoading || !currentInput.trim()}
        size="icon"
        className="h-11 w-11 rounded-xl shadow-warm hover:shadow-elevated transition-all duration-300 hover:-translate-y-0.5"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};

export default ChatInput;
