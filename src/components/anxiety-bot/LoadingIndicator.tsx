import { Bot } from "lucide-react";

const LoadingIndicator = () => {
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center shadow-soft">
        <Bot className="w-4 h-4 text-primary" />
      </div>
      
      {/* Typing Indicator Bubble */}
      <div className="bg-secondary/80 border border-border px-5 py-4 rounded-2xl rounded-bl-md shadow-soft">
        <div className="flex items-center gap-1.5">
          <div 
            className="w-2 h-2 bg-primary rounded-full animate-bounce"
            style={{ animationDuration: '0.6s' }}
          />
          <div 
            className="w-2 h-2 bg-primary rounded-full animate-bounce" 
            style={{ animationDelay: '0.15s', animationDuration: '0.6s' }}
          />
          <div 
            className="w-2 h-2 bg-primary rounded-full animate-bounce" 
            style={{ animationDelay: '0.3s', animationDuration: '0.6s' }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
