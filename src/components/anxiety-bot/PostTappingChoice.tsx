import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";

interface PostTappingChoiceProps {
  intensity: number;
  initialIntensity: number;
  round: number;
  roundsWithoutReduction: number;
  onContinueTapping: () => void;
  onTalkToTapaway: () => void;
  onEndSession: () => void;
}

const PostTappingChoice = ({
  intensity,
  initialIntensity,
  round,
  roundsWithoutReduction,
  onContinueTapping,
  onTalkToTapaway,
  onEndSession
}: PostTappingChoiceProps) => {
  const improvement = initialIntensity - intensity;
  const improvementPercent = initialIntensity > 0 ? Math.round((improvement / initialIntensity) * 100) : 0;
  
  // Check if we should show alternative suggestions (3 rounds without reduction)
  const showAlternativeSuggestions = roundsWithoutReduction >= 3;

  if (showAlternativeSuggestions) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">
                Let's try a different approach
              </h4>
              <p className="text-sm text-muted-foreground">
                Sometimes our emotions need a little extra care. Here are some alternatives that might help:
              </p>
            </div>
          </div>
          
          <div className="space-y-2 pl-8">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">🧘</span>
              <span>Try some deep breathing exercises</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">💧</span>
              <span>Drink some water to refresh yourself</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">💬</span>
              <span>Talk to a friend or professional for support</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button 
              onClick={onTalkToTapaway}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Talk to Tapaway
            </Button>
            <Button 
              onClick={onContinueTapping}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try One More Round
            </Button>
            <Button 
              onClick={onEndSession}
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
  }

  // Low intensity (≤3) - offer choice to continue, talk, or finish
  if (intensity <= 3) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <span className="text-lg">🎉</span>
              Great progress!
            </h4>
            <p className="text-sm text-muted-foreground">
              You've reduced your intensity from {initialIntensity}/10 to {intensity}/10 
              {improvementPercent > 0 && ` (${improvementPercent}% improvement)`}. 
              What would you like to do next?
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={onContinueTapping}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Continue Tapping
            </Button>
            <Button 
              onClick={onTalkToTapaway}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Talk to Tapaway
            </Button>
            <Button 
              onClick={onEndSession}
              size="sm"
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              I'm Done
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Higher intensity (>3) - offer continue or talk options
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">
            Round {round} Complete
          </h4>
          <p className="text-sm text-muted-foreground">
            Your intensity is at {intensity}/10. 
            {improvement > 0 
              ? ` You've made progress (down from ${initialIntensity}/10).`
              : " Let's keep working on this."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={onContinueTapping}
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Continue Tapping
          </Button>
          <Button 
            onClick={onTalkToTapaway}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Talk to Tapaway
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostTappingChoice;
