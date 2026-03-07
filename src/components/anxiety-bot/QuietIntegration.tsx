import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Volume2, VolumeX } from "lucide-react";

interface QuietIntegrationProps {
  onComplete: (response: 'settled' | 'returned' | 'unsure') => void;
}

const DURATION_SECONDS = 45;

const QuietIntegration = ({ onComplete }: QuietIntegrationProps) => {
  const [timeRemaining, setTimeRemaining] = useState(DURATION_SECONDS);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/audio/ambient-tapping.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive || isFinished) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsFinished(true);
          if (audioRef.current) audioRef.current.pause();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isFinished]);

  const handleStart = () => {
    setIsActive(true);
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      if (audioRef.current) {
        audioRef.current.muted = !prev;
      }
      return !prev;
    });
  };

  const progress = ((DURATION_SECONDS - timeRemaining) / DURATION_SECONDS) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isFinished) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-5">
          <div className="text-center space-y-3">
            <span className="text-4xl">🌿</span>
            <h3 className="text-lg font-semibold text-foreground">
              How do you feel now?
            </h3>
            <p className="text-sm text-muted-foreground">
              Take a moment to notice what's present.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => onComplete('settled')}
              variant="outline"
              className="w-full justify-start text-left h-auto py-3 px-4"
            >
              <span className="text-lg mr-3">😌</span>
              <div>
                <p className="font-medium">Yes, I feel settled</p>
                <p className="text-xs text-muted-foreground">The intensity has eased</p>
              </div>
            </Button>
            
            <Button 
              onClick={() => onComplete('returned')}
              variant="outline"
              className="w-full justify-start text-left h-auto py-3 px-4"
            >
              <span className="text-lg mr-3">🔄</span>
              <div>
                <p className="font-medium">A little has come back</p>
                <p className="text-xs text-muted-foreground">I'd like to tap on it</p>
              </div>
            </Button>
            
            <Button 
              onClick={() => onComplete('unsure')}
              variant="outline"
              className="w-full justify-start text-left h-auto py-3 px-4"
            >
              <span className="text-lg mr-3">🤔</span>
              <div>
                <p className="font-medium">I'm not sure</p>
                <p className="text-xs text-muted-foreground">Let me sit with it a bit more</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6 space-y-6">
        <audio ref={audioRef} src="/audio/ambient-tapping.mp3" loop />
        
        <div className="text-center space-y-3">
          <span className="text-4xl">🌿</span>
          <h3 className="text-lg font-semibold text-foreground">
            Quiet Integration
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For the next moment, there's nothing you need to do. Just sit and allow things to settle.
          </p>
        </div>

        {!isActive ? (
          <Button onClick={handleStart} className="w-full" size="lg">
            Begin Quiet Pause
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <img 
                src="/lovable-uploads/dc1752d1-69ff-42d2-b27b-969c6510b75d.png"
                alt="Calm meditation"
                className="w-32 h-32 object-contain opacity-70 animate-pulse"
              />
            </div>
            
            <Progress value={progress} className="h-2" />
            
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-8 w-8"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <span className="text-2xl font-mono font-bold text-primary">
                {formatTime(timeRemaining)}
              </span>
              <div className="w-8" /> {/* Spacer for centering */}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuietIntegration;
