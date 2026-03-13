import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import setupMeditationImg from "@/assets/setup-meditation.gif";

interface SetupPhaseProps {
  setupStatements: string[];
  onComplete: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const SECONDS_PER_STATEMENT = 15;

const SetupPhase = ({ setupStatements, onComplete, audioRef }: SetupPhaseProps) => {
  const [currentStatement, setCurrentStatement] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(SECONDS_PER_STATEMENT);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => setTimeRemaining(prev => prev - 1), 1000);
    } else if (timeRemaining === 0 && isPlaying) {
      handleNext();
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining]);

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
      if (!hasStarted) setHasStarted(true);
      setIsPlaying(true);
      if (audioRef.current) audioRef.current.play().catch(() => {});
    } else {
      setIsPlaying(false);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
      onComplete();
    }
  };

  const handleStart = () => {
    setHasStarted(true);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log('[SetupPhase] Audio play blocked:', err));
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.error('[SetupPhase] Audio play failed:', err));
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (audioRef.current) { audioRef.current.pause(); }
  };

  const progress = ((currentStatement + (SECONDS_PER_STATEMENT - timeRemaining) / SECONDS_PER_STATEMENT) / setupStatements.length) * 100;
  const currentStatementText = setupStatements[currentStatement] || "Even though I have this feeling, I deeply and completely accept myself";

  return (
    <div className="w-full space-y-3 sm:space-y-5">
      <audio ref={audioRef} src="/audio/ambient-tapping.mp3" loop preload="auto" />

      <div className="text-center space-y-1">
        <h3 className="text-base sm:text-xl font-bold text-foreground">Setup Phase</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Tap on the karate chop point while repeating each statement
        </p>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
          <span>Statement {currentStatement + 1} of {setupStatements.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="relative bg-gradient-to-b from-primary/5 to-secondary/5 rounded-lg p-2 sm:p-6 flex items-center justify-center">
        <div className="relative w-full max-w-[200px] sm:max-w-sm mx-auto">
          <img
            src={setupMeditationImg}
            alt="Karate chop point tapping"
            className="w-full h-auto rounded-lg shadow-lg"
          />
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-background/90 px-2 py-1 sm:px-3 sm:py-2 rounded-full shadow-md">
            <span className="text-xs sm:text-sm font-semibold text-foreground">
              {currentStatement + 1}/{setupStatements.length}
            </span>
          </div>
        </div>
      </div>

      <div className="text-center space-y-3">
        <div
          key={currentStatement}
          className="bg-primary/10 p-3 sm:p-4 rounded-lg border-2 border-primary/20 transition-all duration-300 animate-fade-in"
        >
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
            Repeat while tapping:
          </p>
          <p className="text-sm sm:text-lg font-semibold text-foreground leading-relaxed">
            "{currentStatementText}"
          </p>
        </div>

        {isPlaying && (
          <div className="flex items-center justify-center space-x-2 animate-fade-in">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-4 border-primary/30 bg-primary/10 flex items-center justify-center">
              <span className="text-lg sm:text-2xl font-bold text-primary">{timeRemaining}</span>
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground">seconds remaining</span>
          </div>
        )}
      </div>

      <div className="flex justify-center flex-wrap gap-2">
        {!hasStarted ? (
          <Button onClick={handleStart} className="flex items-center space-x-2" size="sm">
            <Play className="w-4 h-4" />
            <span>Start Setup</span>
          </Button>
        ) : isPlaying ? (
          <Button onClick={handlePause} variant="outline" className="flex items-center space-x-2" size="sm">
            <Pause className="w-4 h-4" />
            <span>Pause</span>
          </Button>
        ) : (
          <Button onClick={handlePlay} className="flex items-center space-x-2" size="sm">
            <Play className="w-4 h-4" />
            <span>Resume</span>
          </Button>
        )}

        <Button onClick={handleNext} variant="outline" className="flex items-center space-x-2" size="sm">
          <span>{currentStatement < setupStatements.length - 1 ? 'Skip to Next' : 'Complete Setup'}</span>
        </Button>

        <Button
          onClick={() => {
            setIsMuted(!isMuted);
            if (audioRef.current) audioRef.current.muted = !isMuted;
          }}
          variant="ghost"
          size="icon"
          className="text-muted-foreground h-8 w-8"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Tap firmly on the side of your hand (karate chop point) while saying each statement out loud or in your mind
      </p>
    </div>
  );
};

export default SetupPhase;
