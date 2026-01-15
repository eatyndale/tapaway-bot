import { Button } from "@/components/ui/button";
import { RotateCcw, History, Sparkles } from "lucide-react";
import { QuestionnaireSession } from "./types";

interface ChatHeaderProps {
  questionnaireSession: QuestionnaireSession | null;
  chatState: string;
  showHistory: boolean;
  onToggleHistory: () => void;
  onStartNewSession: () => void;
}

const ChatHeader = ({ 
  questionnaireSession, 
  chatState, 
  showHistory, 
  onToggleHistory, 
  onStartNewSession 
}: ChatHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-warm">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            AI Anxiety Support
          </h1>
          {questionnaireSession && (
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${
                questionnaireSession.severity === 'Mild' || questionnaireSession.severity === 'Minimal' ? 'bg-green-500' :
                questionnaireSession.severity === 'Moderate' ? 'bg-yellow-500' :
                'bg-orange-500'
              }`} />
              <p className="text-sm text-muted-foreground">
                {questionnaireSession.severity} • Score: {questionnaireSession.totalScore}/27
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onToggleHistory}
          size="sm"
          className={`transition-all duration-300 ${showHistory ? 'bg-primary/10 border-primary/30' : ''}`}
        >
          <History className="w-4 h-4 mr-2" />
          History
        </Button>
        <Button 
          variant="outline" 
          onClick={onStartNewSession}
          size="sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          New Session
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
