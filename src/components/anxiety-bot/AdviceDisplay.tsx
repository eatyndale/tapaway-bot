
import { Button } from "@/components/ui/button";
import { Heart, Lightbulb } from "lucide-react";
import { ChatSession } from "./types";

interface AdviceDisplayProps {
  session: ChatSession;
  adviceText?: string; // AI-generated advice content (optional, will generate if not provided)
  onComplete: () => void;
}

const AdviceDisplay = ({ session, adviceText, onComplete }: AdviceDisplayProps) => {
  // Generate advice locally if not provided (for non-AI mode)
  const generateAdvice = (session: ChatSession): string[] => {
    const improvement = session.initialIntensity - session.currentIntensity;
    const improvementPercentage = Math.round((improvement / session.initialIntensity) * 100);
    
    let advice = [];
    
    if (session.currentIntensity === 0) {
      advice = [
        "🎉 Congratulations! You've successfully reduced your anxiety to zero. This is a wonderful achievement!",
        "💡 Maintain Your Progress: Practice the tapping sequence you just learned whenever similar feelings arise.",
        "🌱 Daily Practice: Consider doing a quick 5-minute tapping session each morning to maintain emotional balance.",
        "📝 Keep a Journal: Write down what triggered this anxiety so you can recognize patterns in the future.",
        "🤝 Share Your Success: Let someone you trust know about this positive step you've taken for your mental health."
      ];
    } else if (improvementPercentage >= 70) {
      advice = [
        `✨ Excellent progress! You've reduced your anxiety by ${improvementPercentage}% (from ${session.initialIntensity} to ${session.currentIntensity}).`,
        "🔄 Continue Tapping: The remaining intensity can likely be reduced with another session later today.",
        "⏰ Timing Matters: Try tapping again in 2-3 hours when you're in a calm environment.",
        "🧘 Breathing Practice: Complement your tapping with deep breathing exercises throughout the day.",
        "💪 Build the Habit: Regular tapping practice makes each session more effective."
      ];
    } else if (improvementPercentage >= 40) {
      advice = [
        `👍 Good progress! You've reduced your anxiety by ${improvementPercentage}% (from ${session.initialIntensity} to ${session.currentIntensity}).`,
        "🎯 Be Patient: Sometimes our bodies need time to release deep-seated emotions.",
        "🔍 Explore Deeper: Consider if there are underlying concerns connected to this issue.",
        "🤲 Self-Compassion: Be gentle with yourself - healing is a process, not a destination.",
        "📞 Professional Support: If anxiety persists, consider speaking with a counselor or therapist."
      ];
    } else {
      advice = [
        `🌟 Every step counts! You've made some progress, reducing your anxiety from ${session.initialIntensity} to ${session.currentIntensity}.`,
        "🔬 Try Different Approaches: Sometimes different tapping styles or phrases work better.",
        "🏥 Consider Professional Help: Persistent high anxiety may benefit from professional support.",
        "👥 Support Network: Reach out to friends, family, or support groups.",
        "📚 Learn More: Explore additional EFT resources, books, or guided sessions online.",
        "⚕️ Medical Check: If anxiety is severe or interfering with daily life, consult a healthcare provider."
      ];
    }
    
    return advice;
  };

  // Parse the AI-generated advice text into individual bullet points
  const parseAdvice = (text: string): string[] => {
    // Split by newlines and filter out empty lines
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    // Filter for lines that are bullet points (start with emoji, -, *, •, or numbers)
    const bullets = lines.filter(line => {
      const trimmed = line.trim();
      return /^[\p{Emoji}\-\*•\d]/u.test(trimmed);
    });
    
    return bullets.length > 0 ? bullets : [text]; // Fallback to full text if no bullets detected
  };

  // Use AI-generated advice if provided, otherwise generate locally
  const advice = adviceText ? parseAdvice(adviceText) : generateAdvice(session);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-l-4 border-l-[#94c11f]">
        <div className="flex items-center mb-3">
          <Heart className="w-5 h-5 text-[#94c11f] mr-2" />
          <h4 className="font-bold text-gray-900">Your Personalized Guidance</h4>
        </div>
        <div className="space-y-3">
          {advice.map((tip, index) => (
            <div key={index} className="flex items-start space-x-2">
              <Lightbulb className="w-4 h-4 text-[#94c11f] mt-1 flex-shrink-0" />
              <p className="text-gray-800 text-sm leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
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
