import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, SkipForward, Volume2, VolumeX } from "lucide-react";
import eyebrowGif from "@/assets/tapping/eyebrow.gif";
import outerEyeGif from "@/assets/tapping/outer-eye.gif";
import underEyeGif from "@/assets/tapping/under-eye.gif";
import underNoseGif from "@/assets/tapping/under-nose.gif";
import chinGif from "@/assets/tapping/chin.gif";
import collarboneGif from "@/assets/tapping/collarbone.gif";
import underArmGif from "@/assets/tapping/under-arm.gif";
import topHeadGif from "@/assets/tapping/top-head.gif";

interface TappingPoint {
  name: string;
  key: string;
  position: { x: number; y: number };
  description: string;
  gifUrl: string;
}

const tappingPoints: TappingPoint[] = [
  { name: "Start of Eyebrow", key: "eyebrow", position: { x: 30, y: 15 }, description: "Inner edge of the eyebrow", gifUrl: eyebrowGif },
  { name: "Outer Eye", key: "outer-eye", position: { x: 70, y: 15 }, description: "Outer corner of the eye", gifUrl: outerEyeGif },
  { name: "Under Eye", key: "under-eye", position: { x: 50, y: 25 }, description: "Under the center of the eye", gifUrl: underEyeGif },
  { name: "Under Nose", key: "under-nose", position: { x: 50, y: 40 }, description: "Between nose and upper lip", gifUrl: underNoseGif },
  { name: "Chin", key: "chin", position: { x: 50, y: 55 }, description: "Center of the chin", gifUrl: chinGif },
  { name: "Collarbone", key: "collarbone", position: { x: 40, y: 75 }, description: "Below the collarbone", gifUrl: collarboneGif },
  { name: "Under Arm", key: "under-arm", position: { x: 85, y: 60 }, description: "4 inches below armpit", gifUrl: underArmGif },
  { name: "Top of Head", key: "top-head", position: { x: 50, y: 5 }, description: "Crown of the head", gifUrl: topHeadGif }
];

interface TappingGuideProps {
  setupStatements: string[];
  statementOrder: number[];
  aiReminderPhrases?: string[];
  reminderPhraseType?: 'acknowledging' | 'partial-release' | 'full-release';
  feeling?: string;
  bodyLocation?: string;
  problem?: string;
  onComplete: () => void;
  onPointChange?: (pointIndex: number) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const emotionToNoun: Record<string, string> = {
  'anxious': 'anxiety', 'sad': 'sadness', 'stressed': 'stress', 'overwhelmed': 'overwhelm',
  'tired': 'tiredness', 'exhausted': 'exhaustion', 'worried': 'worry', 'scared': 'fear',
  'afraid': 'fear', 'frustrated': 'frustration', 'angry': 'anger', 'depressed': 'depression',
  'nervous': 'nervousness', 'lonely': 'loneliness', 'hopeless': 'hopelessness',
  'helpless': 'helplessness', 'panicked': 'panic', 'terrified': 'terror',
  'disappointed': 'disappointment', 'guilty': 'guilt', 'ashamed': 'shame',
  'embarrassed': 'embarrassment', 'jealous': 'jealousy', 'resentful': 'resentment',
  'bitter': 'bitterness', 'insecure': 'insecurity', 'confused': 'confusion'
};

const convertToNounForm = (emotion: string): string => {
  const lower = emotion.toLowerCase().trim();
  if (emotionToNoun[lower]) return emotionToNoun[lower];
  if (lower.endsWith('ness') || lower.endsWith('tion') || lower.endsWith('ment') || 
      lower.endsWith('ity') || lower.endsWith('ion')) return lower;
  return emotion;
};

const generateReminderPhrase = (
  type: 'acknowledging' | 'partial-release' | 'full-release',
  feeling: string, bodyLocation: string, pointIndex: number, problem?: string
): string => {
  const feelingNoun = convertToNounForm(feeling);
  const problemContext = problem || 'what happened';
  
  const acknowledgingPhrases = [
    `This ${feelingNoun} in my ${bodyLocation}, ${problemContext}, but I want to let it go.`,
    `This ${feelingNoun} I'm holding, ${problemContext}, but I'm okay.`,
    `This ${feelingNoun} in my ${bodyLocation}, ${problemContext}, but I accept myself.`
  ];
  const partialReleasePhrases = [
    `This ${feelingNoun} in my ${bodyLocation}, ${problemContext}, but I'm choosing peace.`,
    `This ${feelingNoun} I'm feeling, ${problemContext}, and it's starting to shift.`,
    `This ${feelingNoun} in my ${bodyLocation}, ${problemContext}, but I'm choosing calm.`
  ];
  const fullReleasePhrases = [
    `This ${feelingNoun} in my ${bodyLocation}, ${problemContext}, I'm releasing this now.`,
    `This ${feelingNoun} I've been holding, ${problemContext}, I'm letting go.`
  ];

  let phrases: string[];
  if (pointIndex < 3) phrases = acknowledgingPhrases;
  else if (pointIndex < 6) phrases = partialReleasePhrases;
  else phrases = fullReleasePhrases;

  return phrases[pointIndex % phrases.length];
};

const TappingGuide = ({ 
  setupStatements, statementOrder, aiReminderPhrases,
  reminderPhraseType = 'acknowledging', feeling = 'this feeling',
  bodyLocation = 'body', problem, onComplete, onPointChange 
}: TappingGuideProps) => {
  const [currentPoint, setCurrentPoint] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Auto-start tapping on mount (user already interacted during setup phase)
  useEffect(() => {
    setIsPlaying(true);
    if (audioRef.current) audioRef.current.play().catch(() => {});
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => setTimeRemaining(prev => prev - 1), 1000);
    } else if (timeRemaining === 0 && isPlaying) {
      handleNext();
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining]);

  useEffect(() => { onPointChange?.(currentPoint); }, [currentPoint, onPointChange]);

  useEffect(() => {
    if (audioRef.current && !isPlaying) audioRef.current.pause();
  }, [isPlaying]);

  useEffect(() => {
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; } };
  }, []);

  const handleNext = () => {
    if (currentPoint < tappingPoints.length - 1) {
      setCurrentPoint(prev => prev + 1);
      setTimeRemaining(15);
      setIsPlaying(true);
      if (audioRef.current) audioRef.current.play().catch(() => {});
    } else {
      setIsPlaying(false);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
      onComplete();
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (audioRef.current) audioRef.current.play().catch(() => {});
  };

  const handlePause = () => { setIsPlaying(false); };

  const handleReset = () => {
    setCurrentPoint(0); setTimeRemaining(15); setIsPlaying(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  };

  const progress = ((currentPoint + (15 - timeRemaining) / 15) / tappingPoints.length) * 100;
  const currentTappingPoint = tappingPoints[currentPoint];
  
  let statementText: string;
  if (aiReminderPhrases && aiReminderPhrases.length >= 8 && aiReminderPhrases[currentPoint]) {
    statementText = aiReminderPhrases[currentPoint];
  } else {
    const statementIdx = statementOrder[currentPoint] ?? 0;
    const setupStatementText = setupStatements[statementIdx] || null;
    if (setupStatementText) {
      statementText = setupStatementText;
    } else {
      statementText = generateReminderPhrase(reminderPhraseType, feeling, bodyLocation, currentPoint, problem);
    }
  }

  return (
    <div className="w-full space-y-3 sm:space-y-5">
      <audio ref={audioRef} src="/audio/ambient-tapping.mp3" loop preload="auto" autoPlay />

      <div className="space-y-1">
        <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
          <span>Point {currentPoint + 1} of {tappingPoints.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="relative bg-gradient-to-b from-primary/5 to-secondary/5 rounded-lg p-2 sm:p-6 flex items-center justify-center min-h-[180px] sm:min-h-[300px]">
        <div className="relative w-full max-w-[200px] sm:max-w-sm mx-auto">
          <img
            key={currentPoint}
            src={currentTappingPoint.gifUrl}
            alt={`Tapping point: ${currentTappingPoint.name}`}
            className="w-full h-auto rounded-lg shadow-lg animate-fade-in"
          />
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-background/90 px-2 py-1 sm:px-3 sm:py-2 rounded-full shadow-md">
            <span className="text-xs sm:text-sm font-semibold text-foreground">
              {currentPoint + 1}/{tappingPoints.length}
            </span>
          </div>
        </div>
      </div>

      <div className="text-center space-y-3">
        <div className="space-y-1">
          <h3 className="text-base sm:text-xl font-bold text-foreground">
            {currentTappingPoint.name}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {currentTappingPoint.description}
          </p>
        </div>

        <div className="bg-card p-2 sm:p-4 rounded-lg border-2 border-primary/20">
          <p className="text-sm sm:text-lg font-medium text-foreground">
            Tap while saying:
          </p>
          <p className="text-primary font-semibold mt-1 text-sm sm:text-base">
            "{statementText}"
          </p>
        </div>

        {isPlaying && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-primary/20 flex items-center justify-center">
              <span className="text-lg sm:text-xl font-bold text-primary">{timeRemaining}</span>
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground">seconds remaining</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {isPlaying ? (
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
          <SkipForward className="w-4 h-4" />
          <span>Next Point</span>
        </Button>

        <Button
          onClick={() => { setIsMuted(!isMuted); if (audioRef.current) audioRef.current.muted = !isMuted; }}
          variant="ghost" size="icon" className="text-muted-foreground h-8 w-8"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>

        {currentPoint > 0 && (
          <Button onClick={handleReset} variant="ghost" className="text-muted-foreground" size="sm">
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};

export default TappingGuide;
