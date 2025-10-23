
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { History, ArrowLeft } from "lucide-react";
import { ChatSession as SupabaseChatSession } from "@/services/supabaseService";

interface ChatHistoryProps {
  chatHistory: SupabaseChatSession[];
  onLoadSession: (session: SupabaseChatSession) => void;
  onClose: () => void;
}

const ChatHistory = ({ chatHistory, onLoadSession, onClose }: ChatHistoryProps) => {
  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center">
          <History className="w-5 h-5 mr-2" />
          Chat History
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onClose}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Session
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {chatHistory.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No previous sessions
            </p>
          ) : (
            <div className="space-y-3">
              {chatHistory.map((historicalSession) => (
                <Card 
                  key={historicalSession.id}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onLoadSession(historicalSession)}
                >
                  <CardContent className="p-3">
                    <p className="font-medium text-sm truncate">
                      Chat Session #{historicalSession.session_number}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(historicalSession.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs bg-[#94c11f]/20 text-[#7da01a] px-2 py-1 rounded">
                        {Array.isArray(historicalSession.messages) ? historicalSession.messages.length : 0} messages
                      </span>
                      {historicalSession.crisis_detected && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Crisis Support
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ChatHistory;
