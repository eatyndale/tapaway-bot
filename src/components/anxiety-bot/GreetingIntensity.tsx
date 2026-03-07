import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";

interface GreetingIntensityProps {
  userName: string;
  onSubmit: (intensity: number) => void;
  isLoading?: boolean;
}

const GreetingIntensity = ({ userName, onSubmit, isLoading = false }: GreetingIntensityProps) => {
  const [intensity, setIntensity] = useState([5]);

  const getIntensityLabel = (value: number) => {
    if (value === 0) return "Completely calm";
    if (value <= 2) return "Mostly settled";
    if (value <= 4) return "Some discomfort";
    if (value <= 6) return "Moderate distress";
    if (value <= 8) return "High distress";
    return "Extreme distress";
  };

  const getIntensityEmoji = (value: number) => {
    if (value === 0) return "😌";
    if (value <= 2) return "🙂";
    if (value <= 4) return "😐";
    if (value <= 6) return "😟";
    if (value <= 8) return "😰";
    return "😣";
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            How are you feeling right now, {userName}?
          </h3>
          <p className="text-sm text-muted-foreground">
            On a scale of 0 to 10, how intense is your distress right now?
          </p>
        </div>

        <div className="space-y-4 px-2">
          <div className="text-center">
            <span className="text-4xl">{getIntensityEmoji(intensity[0])}</span>
            <div className="flex items-baseline justify-center gap-1 mt-2">
              <span className="text-4xl font-bold text-primary">{intensity[0]}</span>
              <span className="text-muted-foreground text-sm">/10</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {getIntensityLabel(intensity[0])}
            </p>
          </div>
          
          <Slider
            value={intensity}
            onValueChange={setIntensity}
            max={10}
            min={0}
            step={1}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 — Calm</span>
            <span>10 — Extreme</span>
          </div>
        </div>

        <Button 
          onClick={() => onSubmit(intensity[0])} 
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? 'Processing...' : 'Continue'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GreetingIntensity;
