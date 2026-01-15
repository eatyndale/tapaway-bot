import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { ChatSession } from "./types";

interface AdviceDisplayProps {
  session: ChatSession;
  adviceText?: string;
  onComplete: () => void;
}

interface ParsedAdvice {
  paragraphs: string[];
  bullets: string[];
  closingLine: string;
}

const AdviceDisplay = ({ session, adviceText, onComplete }: AdviceDisplayProps) => {
  // Generate advice locally if not provided (for non-AI mode)
  const generateLocalAdvice = (session: ChatSession): ParsedAdvice => {
    const improvement = session.initialIntensity - session.currentIntensity;
    const improvementPercentage = session.initialIntensity > 0 
      ? Math.round((improvement / session.initialIntensity) * 100) 
      : 0;
    const feeling = session.feeling || 'this feeling';
    const bodyLocation = session.bodyLocation || 'your body';
    
    let paragraphs: string[] = [];
    let bullets: string[] = [];
    let closingLine = "I'm here whenever you need me. 💚";
    
    if (session.currentIntensity === 0) {
      paragraphs = [
        `You did it! You've completely released that ${feeling} that was sitting in ${bodyLocation}. This is a wonderful achievement, and you should feel proud of the work you've done today.`,
        `Your body has shown you that it knows how to let go when given the space to do so. This experience will serve you well in the future.`
      ];
      bullets = [
        "Practice this same tapping sequence whenever similar feelings arise",
        "Consider a brief 5-minute morning session to maintain emotional balance",
        "Journal about what triggered this feeling to recognize patterns",
        "Share this positive step with someone you trust"
      ];
    } else if (improvementPercentage >= 70) {
      paragraphs = [
        `Excellent work! You've reduced that ${feeling} from ${session.initialIntensity} to ${session.currentIntensity} — that's ${improvementPercentage}% improvement. The tension you were holding in ${bodyLocation} has released significantly.`,
        `The remaining intensity can often be addressed with another session when you're ready. Your body is responding well to this process.`
      ];
      bullets = [
        "Try another session in 2-3 hours when you're in a calm space",
        "Practice deep breathing throughout the day to maintain this progress",
        "Notice how your body feels different now compared to when we started",
        "Regular tapping practice makes each session more effective"
      ];
    } else if (improvementPercentage >= 40) {
      paragraphs = [
        `Good progress today. You've brought that ${feeling} down from ${session.initialIntensity} to ${session.currentIntensity}. The fact that you felt it in ${bodyLocation} tells us your body was holding onto something important.`,
        `Sometimes our emotions need time to fully release, especially when they're connected to deeper concerns. Be patient with yourself — healing is a process, not a destination.`
      ];
      bullets = [
        "Consider what underlying concerns might be connected to this feeling",
        "Practice self-compassion as you continue processing",
        "Try tapping again tomorrow to continue releasing",
        "Professional support can help if this feeling persists"
      ];
    } else {
      paragraphs = [
        `Thank you for doing this work today. You moved that ${feeling} from ${session.initialIntensity} to ${session.currentIntensity}. Even small shifts matter, and the fact that you showed up for yourself is meaningful.`,
        `Sometimes persistent feelings are pointing us toward something that needs deeper attention. That ${bodyLocation} tension you noticed is your body's way of communicating with you.`
      ];
      bullets = [
        "Different tapping approaches or phrases might work better for you",
        "Consider speaking with a counselor or therapist for additional support",
        "Reach out to friends, family, or support groups",
        "Explore additional EFT resources like guided sessions or books"
      ];
      closingLine = "I'm here whenever you need me. Take care of yourself. 💚";
    }
    
    return { paragraphs, bullets, closingLine };
  };

  // Parse the AI-generated advice text into structured format
  const parseAIAdvice = (text: string): ParsedAdvice => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    const paragraphs: string[] = [];
    const bullets: string[] = [];
    let closingLine = "";
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check if it's a bullet point (starts with -, *, •, or number)
      if (/^[-*•]\s/.test(trimmed)) {
        // Remove the bullet marker and any leading emoji
        let bulletText = trimmed.replace(/^[-*•]\s*/, '');
        // Remove leading emojis but keep the text
        bulletText = bulletText.replace(/^[\p{Emoji}\s]+/u, '').trim();
        if (bulletText) bullets.push(bulletText);
      } else if (/^\d+[.)]\s/.test(trimmed)) {
        // Numbered list
        let bulletText = trimmed.replace(/^\d+[.)]\s*/, '');
        bulletText = bulletText.replace(/^[\p{Emoji}\s]+/u, '').trim();
        if (bulletText) bullets.push(bulletText);
      } else if (trimmed.includes('💚') || trimmed.includes('here when') || trimmed.includes('here for you')) {
        // This is likely the closing line
        closingLine = trimmed;
      } else if (trimmed.length > 20 && !trimmed.startsWith('**') && !trimmed.startsWith('Try this')) {
        // Regular paragraph (not a header)
        // Remove any leading emojis
        const cleanParagraph = trimmed.replace(/^[\p{Emoji}\s]+/u, '').trim();
        if (cleanParagraph) paragraphs.push(cleanParagraph);
      }
    }
    
    // If no closing line found, add default
    if (!closingLine) {
      closingLine = "I'm here whenever you need me. 💚";
    }
    
    return { paragraphs, bullets, closingLine };
  };

  // Use AI-generated advice if provided, otherwise generate locally
  const advice = adviceText ? parseAIAdvice(adviceText) : generateLocalAdvice(session);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-5 rounded-lg border-l-4 border-l-[#94c11f]">
        <div className="flex items-center mb-4">
          <Heart className="w-5 h-5 text-[#94c11f] mr-2" />
          <h4 className="font-bold text-gray-900">Your Personalized Guidance</h4>
        </div>
        
        {/* Paragraphs */}
        <div className="space-y-3 mb-4">
          {advice.paragraphs.map((paragraph, index) => (
            <p key={index} className="text-gray-800 text-sm leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
        
        {/* Bullet points section */}
        {advice.bullets.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Try this next:</p>
            <ul className="space-y-2 ml-1">
              {advice.bullets.map((bullet, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-[#94c11f] mt-0.5">•</span>
                  <span className="text-gray-700 text-sm">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Closing line */}
        <p className="text-gray-700 text-sm mt-4 italic">
          {advice.closingLine}
        </p>
      </div>
      
      <Button 
        onClick={onComplete} 
        className="w-full bg-gradient-to-r from-[#94c11f] to-green-600 hover:from-[#7da01a] hover:to-green-700 text-white"
      >
        Complete Session
      </Button>
    </div>
  );
};

export default AdviceDisplay;
