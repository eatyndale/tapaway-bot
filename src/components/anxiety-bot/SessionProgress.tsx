
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { ChatSession } from "./types";

interface SessionProgressProps {
  session: ChatSession;
}

const SessionProgress = ({ session }: SessionProgressProps) => {
  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Session Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {session.problem ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Problem</p>
              <p className="text-gray-800 text-sm">{session.problem}</p>
            </div>
            {session.feeling && (
              <div>
                <p className="text-sm font-medium text-gray-600">Feeling</p>
                <p className="text-gray-800 text-sm">{session.feeling} in {session.bodyLocation}</p>
              </div>
            )}
            {session.round > 1 && (
              <div>
                <p className="text-sm font-medium text-gray-600">Round</p>
                <p className="text-xl font-bold text-[#94c11f]">{session.round}</p>
              </div>
            )}
            {session.round > 0 && (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-600">Intensity Progress</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-500">{session.initialIntensity}</div>
                      <div className="text-xs text-gray-500">Initial</div>
                    </div>
                    <div className="flex-1 h-2 bg-gradient-to-r from-red-500 to-[#94c11f] rounded"></div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-[#94c11f]">{session.currentIntensity}</div>
                      <div className="text-xs text-gray-500">Current</div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Rounds Completed</p>
                  <p className="text-xl font-bold text-[#94c11f]">{session.round}</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Start a conversation to see your progress</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionProgress;
