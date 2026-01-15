import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import setupMeditationImg from "@/assets/setup-meditation.gif";

interface SetupPhaseProps {
  setupStatements: string[];
  onComplete: () => void;
}

const SECONDS_PER_STATEMENT = 15; // 15 seconds per statement as per spec

const SetupPhase = ({ setupStatements, onComplete }: SetupPhaseProps) => {
  const [currentStatement, setCurrentStatement] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // Don't auto-start
  const [hasStarted, setHasStarted] = useState(false); // Track if user started
  const [timeRemaining, setTimeRemaining] = useState(SECONDS_PER_STATEMENT);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  console.log('[SetupPhase] Rendered with statements:', setupStatements);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isPlaying) {
      handleNext();
    }

    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const handleNext = () => {
    if (currentStatement < setupStatements.length - 1) {
      setCurrentStatement(prev => prev + 1);
      setTimeRemaining(SECONDS_PER_STATEMENT);
    } else {
      // All statements completed
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      onComplete();
    }
  };

  const handleStart = () => {
    setHasStarted(true);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.log('[SetupPhase] Audio play blocked by browser:', err);
      });
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.error('[SetupPhase] Audio play failed:', err);
      });
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const progress = ((currentStatement + (SECONDS_PER_STATEMENT - timeRemaining) / SECONDS_PER_STATEMENT) / setupStatements.length) * 100;
  const currentStatementText = setupStatements[currentStatement] || "Even though I have this feeling, I deeply and completely accept myself";

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-6">
        <audio
          ref={audioRef}
          src="/audio/ambient-tapping.mp3"
          loop
          preload="auto"
          onError={(e) => console.error('[SetupPhase] Audio load error:', e)}
        />

        {/* Header */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-foreground">Setup Phase</h3>
          <p className="text-sm text-muted-foreground">
            Tap on the karate chop point while repeating each statement
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Statement {currentStatement + 1} of {setupStatements.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Karate Chop Image with pulse animation when playing */}
        <div className="relative bg-gradient-to-b from-primary/5 to-secondary/5 rounded-lg p-6 flex items-center justify-center">
          <div className="relative w-full max-w-sm">
            <img 
              src={setupMeditationImg} 
              alt="Karate chop point tapping"
              className="w-full h-auto rounded-lg shadow-lg"
            />
            
            {/* Statement indicator overlay */}
            <div className="absolute top-4 right-4 bg-background/90 px-3 py-2 rounded-full shadow-md">
              <span className="text-sm font-semibold text-foreground">
                {currentStatement + 1}/{setupStatements.length}
              </span>
            </div>
          </div>
        </div>

        {/* Current Statement with fade transition - key forces re-animation */}
        <div className="text-center space-y-4">
          <div 
            key={currentStatement} 
            className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20 transition-all duration-300 animate-fade-in"
          >
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Repeat while tapping:
            </p>
            <p className="text-lg font-semibold text-foreground leading-relaxed">
              "{currentStatementText}"
            </p>
          </div>

          {/* Timer */}
          {isPlaying && (
            <div className="flex items-center justify-center space-x-2 animate-fade-in">
              <div className="w-14 h-14 rounded-full border-4 border-primary/30 bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{timeRemaining}</span>
              </div>
              <span className="text-sm text-muted-foreground">seconds remaining</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-3">
          {!hasStarted ? (
            <Button onClick={handleStart} className="flex items-center space-x-2" size="lg">
              <Play className="w-5 h-5" />
              <span>Start Setup</span>
            </Button>
          ) : isPlaying ? (
            <Button onClick={handlePause} variant="outline" className="flex items-center space-x-2">
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </Button>
          ) : (
            <Button onClick={handlePlay} className="flex items-center space-x-2" size="lg">
              <Play className="w-5 h-5" />
              <span>Resume</span>
            </Button>
          )}
          
          <Button onClick={handleNext} variant="outline" className="flex items-center space-x-2">
            <span>{currentStatement < setupStatements.length - 1 ? 'Skip to Next' : 'Complete Setup'}</span>
          </Button>

          <Button 
            onClick={() => {
              setIsMuted(!isMuted);
              if (audioRef.current) {
                audioRef.current.muted = !isMuted;
              }
            }} 
            variant="ghost" 
            size="icon"
            className="text-muted-foreground"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>

        {/* Instruction reminder */}
        <p className="text-center text-xs text-muted-foreground">
          Tap firmly on the side of your hand (karate chop point) while saying each statement out loud or in your mind
        </p>
      </CardContent>
    </Card>
  );
};

export default SetupPhase;
