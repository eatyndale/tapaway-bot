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
    const finalSuds = session.currentIntensity;
    
    let paragraphs: string[] = [];
    let bullets: string[] = [];
    let closingLine = "I'm here whenever you need me. 💚";
    
    // ═══ REFLECTION TONE: driven by improvement percentage (no percentage mentioned) ═══
    if (finalSuds === 0) {
      paragraphs = [
        `You did it! You've completely released that ${feeling} that was sitting in ${bodyLocation}. This is a wonderful achievement, and you should feel proud of the work you've done today.`,
        `Your body has shown you that it knows how to let go when given the space to do so. This experience will serve you well in the future.`
      ];
    } else if (improvementPercentage >= 70) {
      paragraphs = [
        `Excellent work! That ${feeling} you were carrying in ${bodyLocation} has shifted significantly. You should feel really proud of the progress you've made today.`,
        `The remaining intensity can often be addressed with another session when you're ready. Your body is responding well to this process.`
      ];
    } else if (improvementPercentage >= 40) {
      paragraphs = [
        `Good progress today. That ${feeling} in ${bodyLocation} has started to shift. The fact that your body is responding tells us you're on the right track.`,
        `Sometimes our emotions need time to fully release, especially when they're connected to deeper concerns. Be patient with yourself — healing is a process, not a destination.`
      ];
    } else {
      paragraphs = [
        `Thank you for doing this work today. Every step matters, and the fact that you showed up for yourself is meaningful.`,
        `That ${feeling} in ${bodyLocation} is your body's way of communicating with you. Sometimes persistent feelings are pointing us toward something that needs deeper attention.`
      ];
    }
    
    // ═══ ACTION RECOMMENDATIONS: driven by final SUDS ═══
    if (finalSuds <= 3) {
      // Positive reinforcement, gentle close
      bullets = [
        "Practice this same tapping sequence whenever similar feelings arise",
        "Consider a brief 5-minute morning session to maintain emotional balance",
        "Journal about what came up today to recognize patterns",
        "Share this positive step with someone you trust"
      ];
    } else if (finalSuds <= 6) {
      // Suggest rest and integration, encourage returning later
      bullets = [
        "Give yourself some rest — your body has been doing important work",
        "Try another session in a few hours when you feel ready",
        "Practice deep breathing throughout the day to support integration",
        "Be gentle with yourself as your body continues to process"
      ];
    } else {
      // SUDS >= 7: Grounding, breathing, support resources
      bullets = [
        "Practice grounding: feel your feet on the floor, notice 5 things you can see",
        "Try slow belly breathing — 4 counts in, 6 counts out",
        "Reach out to someone you trust and let them know how you're feeling",
        "Contact a support line if you need to talk: 988 (call/text) or text HOME to 741741",
        "Consider working with an EFT practitioner for additional support"
      ];
      closingLine = "You've been brave today. Take care of yourself, and know that support is always available. 💚";
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
        let bulletText = trimmed.replace(/^[-*•]\s*/, '');
        bulletText = bulletText.replace(/^[\p{Emoji}\s]+/u, '').trim();
        if (bulletText) bullets.push(bulletText);
      } else if (/^\d+[.)]\s/.test(trimmed)) {
        let bulletText = trimmed.replace(/^\d+[.)]\s*/, '');
        bulletText = bulletText.replace(/^[\p{Emoji}\s]+/u, '').trim();
        if (bulletText) bullets.push(bulletText);
      } else if (trimmed.includes('💚') || trimmed.includes('here when') || trimmed.includes('here for you')) {
        closingLine = trimmed;
      } else if (trimmed.length > 20 && !trimmed.startsWith('**') && !trimmed.startsWith('Try this')) {
        const cleanParagraph = trimmed.replace(/^[\p{Emoji}\s]+/u, '').trim();
        if (cleanParagraph) paragraphs.push(cleanParagraph);
      }
    }
    
    if (!closingLine) {
      closingLine = "I'm here whenever you need me. 💚";
    }
    
    return { paragraphs, bullets, closingLine };
  };

  const advice = adviceText ? parseAIAdvice(adviceText) : generateLocalAdvice(session);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-5 rounded-lg border-l-4 border-l-[#94c11f]">
        <div className="flex items-center mb-4">
          <Heart className="w-5 h-5 text-[#94c11f] mr-2" />
          <h4 className="font-bold text-gray-900">Your Personalized Guidance</h4>
        </div>
        
        <div className="space-y-3 mb-4">
          {advice.paragraphs.map((paragraph, index) => (
            <p key={index} className="text-gray-800 text-sm leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
        
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
