import { Bot } from "lucide-react";

const LoadingIndicator = () => {
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-muted to-muted/70 border border-border/50 flex items-center justify-center shadow-soft">
        <Bot className="w-4 h-4 text-foreground/70" />
      </div>
      
      {/* Typing Indicator Bubble */}
      <div className="glass border border-border/50 px-5 py-4 rounded-2xl rounded-bl-md shadow-soft">
        <div className="flex items-center gap-1.5">
          <div 
            className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
            style={{ animationDuration: '0.6s' }}
          />
          <div 
            className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" 
            style={{ animationDelay: '0.15s', animationDuration: '0.6s' }}
          />
          <div 
            className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" 
            style={{ animationDelay: '0.3s', animationDuration: '0.6s' }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
