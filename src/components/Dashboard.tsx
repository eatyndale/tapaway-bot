
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseService } from "@/services/supabaseService";
import type { UserProfile } from "@/services/supabaseService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, LogOut, User, Activity, ArrowLeft } from "lucide-react";
import Questionnaire from "@/components/Questionnaire";
import AIAnxietyBot from "@/components/AIAnxietyBot";

type DashboardState = 'welcome' | 'questionnaire' | 'bot' | 'at-risk';

interface DashboardProps {
  onSignOut: () => void;
}

const Dashboard = ({ onSignOut }: DashboardProps) => {
  const [currentState, setCurrentState] = useState<DashboardState>('welcome');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hasAssessments, setHasAssessments] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Load user profile
        const { profile, error: profileError } = await supabaseService.getProfile(user.id);
        if (!profileError && profile) {
          setUserProfile(profile);
        }

        // Check for existing assessments
        const { assessments, error: assessmentsError } = await supabaseService.getAssessments(user.id);
        if (!assessmentsError && assessments.length > 0) {
          setHasAssessments(true);
          // Check if the latest assessment indicates risk
          const latestAssessment = assessments[0];
          if (latestAssessment.needs_crisis_support) {
            setCurrentState('at-risk');
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionnaireComplete = (isAtRisk: boolean) => {
    setHasAssessments(true);
    
    if (isAtRisk) {
      setCurrentState('at-risk');
    } else {
      setCurrentState('bot');
    }
  };

  const handleGetImmediateHelp = () => {
    // Open crisis hotline
    window.open('tel:988', '_self');
  };

  const handleFindTherapist = () => {
    // Open psychology today therapist finder
    window.open('https://www.psychologytoday.com/us/therapists', '_blank');
  };

  const handleBackToWelcome = () => {
    setCurrentState('welcome');
  };

  const renderCurrentView = () => {
    switch (currentState) {
      case 'questionnaire':
        return (
          <div>
            <Button variant="ghost" onClick={handleBackToWelcome} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Questionnaire onComplete={handleQuestionnaireComplete} />
          </div>
        );
      case 'bot':
        return (
          <div>
            <Button variant="ghost" onClick={handleBackToWelcome} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <AIAnxietyBot />
          </div>
        );
      case 'at-risk':
        return (
          <div>
            <Button variant="ghost" onClick={handleBackToWelcome} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">We're Here to Support You</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Based on your responses, we recommend connecting with a mental health professional. 
                You're not alone, and help is available.
              </p>
              <div className="space-y-4">
                <Card className="border-l-4 border-l-red-500 bg-red-50">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Crisis Support</h3>
                    <p className="text-sm text-gray-600 mb-3">If you're in immediate danger, please call emergency services or the 988 Suicide & Crisis Lifeline.</p>
                    <Button onClick={handleGetImmediateHelp} className="bg-red-600 hover:bg-red-700 text-white">
                      Call 988 Now
                    </Button>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500 bg-blue-50">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Professional Support</h3>
                    <p className="text-sm text-gray-600 mb-3">Connect with licensed therapists and counselors in your area.</p>
                    <Button onClick={handleFindTherapist} variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                      Find a Therapist
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to Your Anxiety Reduction Journey
              </h1>
              <p className="text-xl text-gray-600">
                Choose how you'd like to begin today.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentState('questionnaire')}>
                <CardHeader>
                  <div className="w-12 h-12 bg-[#4dbad1]/20 rounded-full flex items-center justify-center mb-4">
                    <User className="w-6 h-6 text-[#4dbad1]" />
                  </div>
                  <CardTitle>Complete Assessment</CardTitle>
                  <CardDescription>
                    Help us understand your anxiety patterns with a quick questionnaire
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Start Assessment</Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentState('bot')}>
                <CardHeader>
                  <div className="w-12 h-12 bg-[#4dbad1]/20 rounded-full flex items-center justify-center mb-4">
                    <Activity className="w-6 h-6 text-[#4dbad1]" />
                  </div>
                  <CardTitle>Anxiety Reduction Bot</CardTitle>
                  <CardDescription>
                    Start working with our bot to reduce anxiety using EFT tapping techniques
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-[#4dbad1] hover:bg-[#3da3ba] text-white">Start Chatting</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/2323e4a7-8630-4879-88a4-0b0c0be5aba7.png" 
              alt="Tapaway" 
              className="h-8"
            />
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Hello, {userProfile?.first_name || 'User'}</span>
            <Button variant="ghost" size="sm" onClick={onSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default Dashboard;
