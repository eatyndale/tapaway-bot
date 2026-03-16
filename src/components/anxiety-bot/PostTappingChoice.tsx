import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, CheckCircle, AlertTriangle, Leaf, Phone } from "lucide-react";

interface PostTappingChoiceProps {
  intensity: number;
  initialIntensity: number;
  round: number;
  roundsWithoutReduction: number;
  highSudsRounds?: number;
  isTearlessTrauma?: boolean;
  onContinueTapping: () => void;
  onEndSession: () => void;
  onQuietIntegration?: () => void;
  onContactSupport?: () => void;
}

const PostTappingChoice = ({
  intensity,
  initialIntensity,
  round,
  roundsWithoutReduction,
  highSudsRounds = 0,
  isTearlessTrauma = false,
  onContinueTapping,
  onEndSession,
  onQuietIntegration,
  onContactSupport
}: PostTappingChoiceProps) => {
  const improvement = initialIntensity - intensity;
  const improvementPercent = initialIntensity > 0 ? Math.round((improvement / initialIntensity) * 100) : 0;

  // SUDS 0: Auto-complete (handled by parent, but show completion message)
  if (intensity === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4 space-y-3">
          <div className="text-center space-y-2">
            <span className="text-3xl">🎉</span>
            <h4 className="font-semibold text-foreground">Amazing work!</h4>
            <p className="text-sm text-muted-foreground">
              You've brought your intensity all the way down to 0. Let's wrap up with some advice.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // SUDS 8-10: Grounding + repeat tapping. After 3 rounds at 8-10, offer End + Contact Support
  if (intensity >= 8) {
    if (highSudsRounds >= 3) {
      return (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">
                  You've been really brave
                </h4>
                <p className="text-sm text-muted-foreground">
                  Sometimes what we're carrying needs more support than tapping alone can provide. That's completely okay — it means you're dealing with something significant.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {onContactSupport && (
                <Button 
                  onClick={onContactSupport}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Contact Support
                </Button>
              )}
              <Button 
                onClick={onEndSession}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                End Session
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
            </div>
          </CardContent>
        </Card>
      );
    }

    // SUDS 8-10 but < 3 rounds: Grounding message + auto-repeat
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">
              Let's ground ourselves first
            </h4>
            <p className="text-sm text-muted-foreground">
              Take a moment. Feel your feet on the ground. Notice 3 things you can see around you.
              You're safe right now. Let's do another gentle round of tapping.
            </p>
          </div>
          <Button 
            onClick={onContinueTapping}
            size="sm"
            className="w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Continue with Tapping
          </Button>
        </CardContent>
      </Card>
    );
  }

  // SUDS 3-7: Offer Continue or Chat. "End Session" only after 3 rounds without reduction
  if (intensity >= 3) {
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
            {roundsWithoutReduction >= 3 && (
              <Button 
                onClick={onEndSession}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                End Session
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // SUDS 1-2: 4 buttons (Continue Tapping, Chat with Tapaway, Quiet Integration, End Session)
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
          {onQuietIntegration && (
            <Button 
              onClick={onQuietIntegration}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Leaf className="w-4 h-4" />
              Quiet Integration
            </Button>
          )}
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
};

export default PostTappingChoice;
