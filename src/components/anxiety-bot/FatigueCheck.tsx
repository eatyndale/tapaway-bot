import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Pause, CheckCircle } from "lucide-react";

interface FatigueCheckProps {
  round: number;
  intensity: number;
  onContinue: () => void;
  onPause: () => void;
  onEnd: () => void;
}

const FatigueCheck = ({ round, intensity, onContinue, onPause, onEnd }: FatigueCheckProps) => {
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">
            You've done {round} rounds
          </h4>
          <p className="text-sm text-muted-foreground">
            You've been tapping for a while now. Your intensity is at {intensity}/10. What would you like to do?
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={onContinue}
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Continue Tapping
          </Button>
          <Button 
            onClick={onPause}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Pause className="w-4 h-4" />
            Pause
          </Button>
          <Button 
            onClick={onEnd}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            End Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FatigueCheck;
