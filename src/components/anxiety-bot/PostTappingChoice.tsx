import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, CheckCircle, AlertTriangle, Leaf, Phone, Pause } from "lucide-react";

interface PostTappingChoiceProps {
  intensity: number;
  initialIntensity: number;
  round: number;
  roundsWithoutReduction: number;
  highSudsRounds?: number;
  isTearlessTrauma?: boolean;
  postBodyBased?: boolean;
  onContinueTapping: () => void;
  onBodyBasedContinue?: () => void;
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
  postBodyBased = false,
  onContinueTapping,
  onBodyBasedContinue,
  onEndSession,
  onQuietIntegration,
  onContactSupport
}: PostTappingChoiceProps) => {
  const improvement = initialIntensity - intensity;

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

  // ═══ SUDS 8-10: Post body-based round → final exit options ONLY ═══
  if (intensity >= 8 && postBodyBased) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">
                You've shown real courage today
              </h4>
              <p className="text-sm text-muted-foreground">
                Sometimes what we're carrying needs more support than tapping alone can provide right now. That's completely okay — it means you're dealing with something significant. You might find it helpful to come back to this later or work with a practitioner.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
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
          </div>
        </CardContent>
      </Card>
    );
  }

  // ═══ SUDS 8-10 + 3 rounds: Three-option card with grounding ═══
  if (intensity >= 8 && highSudsRounds >= 3) {
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
                Take a moment. Feel your feet on the ground. Notice 3 things you can see around you.
                You're safe right now. The intensity is staying high, so let's shift our approach.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {onBodyBasedContinue && (
              <Button 
                onClick={onBodyBasedContinue}
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Continue Tapping
              </Button>
            )}
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
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              End Session
            </Button>
          </div>

          <p className="text-xs text-muted-foreground italic">
            You can pause and take slow breaths or look around your space.
          </p>
        </CardContent>
      </Card>
    );
  }

  // SUDS 8-10 but < 3 rounds: Grounding message + auto-repeat
  if (intensity >= 8) {
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

  // SUDS 3-7: Offer Continue (no End Session unless stagnation, which is handled by auto-transition now)
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
          </div>
        </CardContent>
      </Card>
    );
  }

  // SUDS 1-2: 3 buttons (Continue Tapping, Quiet Integration, End Session)
  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <span className="text-lg">🎉</span>
            Great progress!
          </h4>
          <p className="text-sm text-muted-foreground">
            You've reduced your intensity from {initialIntensity}/10 to {intensity}/10. 
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
