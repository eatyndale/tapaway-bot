import { Message } from "./types";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.type === 'user';
  
  return (
    <div
      className={`flex items-end gap-3 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div 
        className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-soft ${
          isUser 
            ? 'bg-gradient-to-br from-primary to-primary/70' 
            : 'bg-gradient-to-br from-muted to-muted/70 border border-border/50'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-foreground/70" />
        )}
      </div>
      
      {/* Message Bubble */}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative px-4 py-3 rounded-2xl shadow-soft transition-all duration-300 ${
            isUser
              ? 'bg-gradient-to-br from-primary to-primary/90 text-white rounded-br-md'
              : 'bg-card border border-border/50 text-foreground rounded-bl-md glass'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        
        {/* Timestamp */}
        <span className={`text-[10px] text-muted-foreground/60 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
