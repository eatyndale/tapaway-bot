
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseService } from "@/services/supabaseService";
import type { UserProfile } from "@/services/supabaseService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, LogOut, User, Activity, ArrowLeft } from "lucide-react";
import Questionnaire from "@/components/Questionnaire";
import AIAnxietyBot from "@/components/AIAnxietyBot";
import BottomNav, { type TabId } from "@/components/BottomNav";
import HomeTab from "@/components/tabs/HomeTab";
import HistoryTab from "@/components/tabs/HistoryTab";
import ProfileTab from "@/components/tabs/ProfileTab";
import { useIsMobile } from "@/hooks/use-mobile";

type DashboardState = 'welcome' | 'questionnaire' | 'bot' | 'at-risk';

interface DashboardProps {
  onSignOut: () => void;
}

const Dashboard = ({ onSignOut }: DashboardProps) => {
  const [currentState, setCurrentState] = useState<DashboardState>('welcome');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hasAssessments, setHasAssessments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const isMobile = useIsMobile();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { profile, error: profileError } = await supabaseService.getProfile(user.id);
        if (!profileError && profile) {
          setUserProfile(profile);
        }

        const { assessments, error: assessmentsError } = await supabaseService.getAssessments(user.id);
        if (!assessmentsError && assessments.length > 0) {
          setHasAssessments(true);
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
    window.open('tel:988', '_self');
  };

  const handleFindTherapist = () => {
    window.open('https://www.psychologytoday.com/us/therapists', '_blank');
  };

  const handleBackToWelcome = () => {
    setCurrentState('welcome');
    setActiveTab('home');
  };

  const handleStartTapping = () => {
    setCurrentState('bot');
    setActiveTab('tap');
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === 'tap') {
      setCurrentState('bot');
    } else if (tab === 'home') {
      setCurrentState('welcome');
    }
  };

  // Non-tab states (questionnaire, at-risk, bot on desktop)
  const renderOverlayState = () => {
    if (currentState === 'questionnaire') {
      return (
        <div>
          <Button variant="ghost" onClick={handleBackToWelcome} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Questionnaire onComplete={handleQuestionnaireComplete} />
        </div>
      );
    }
    if (currentState === 'at-risk') {
      return (
        <div>
          <Button variant="ghost" onClick={handleBackToWelcome} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">We're Here to Support You</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Based on your responses, we recommend connecting with a mental health professional. 
              You're not alone, and help is available.
            </p>
            <div className="space-y-4">
              <Card className="border-l-4 border-l-destructive bg-destructive/5">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-2">Crisis Support</h3>
                  <p className="text-sm text-muted-foreground mb-3">If you're in immediate danger, please call emergency services or the 988 Suicide & Crisis Lifeline.</p>
                  <Button onClick={handleGetImmediateHelp} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Call 988 Now
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-primary bg-primary/5">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-2">Professional Support</h3>
                  <p className="text-sm text-muted-foreground mb-3">Connect with licensed therapists and counselors in your area.</p>
                  <Button onClick={handleFindTherapist} variant="outline">
                    Find a Therapist
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Render active tab content for mobile
  const renderTabContent = () => {
    // If in a special state, show that instead
    const overlay = renderOverlayState();
    if (overlay) return overlay;

    switch (activeTab) {
      case "home":
        return <HomeTab onStartTapping={handleStartTapping} />;
      case "tap":
        return <AIAnxietyBot />;
      case "history":
        return <HistoryTab />;
      case "profile":
        return <ProfileTab onSignOut={onSignOut} />;
    }
  };

  // Desktop: original welcome view
  const renderDesktopWelcome = () => {
    const overlay = renderOverlayState();
    if (overlay) return overlay;

    if (currentState === 'bot') {
      return (
        <div>
          <Button variant="ghost" onClick={handleBackToWelcome} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <AIAnxietyBot />
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Welcome to Your Anxiety Reduction Journey
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose how you'd like to begin today.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentState('questionnaire')}>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-primary" />
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
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Anxiety Reduction Bot</CardTitle>
              <CardDescription>
                Start working with our bot to reduce anxiety using EFT tapping techniques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Start Chatting</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/2323e4a7-8630-4879-88a4-0b0c0be5aba7.png" 
              alt="Tapaway" 
              className="h-8"
            />
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-muted-foreground hidden sm:inline">Hello, {userProfile?.first_name || 'User'}</span>
            {!isMobile && (
              <Button variant="ghost" size="sm" onClick={onSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
        {isMobile ? renderTabContent() : renderDesktopWelcome()}
      </main>

      {/* Mobile bottom nav */}
      {isMobile && <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />}
    </div>
  );
};

export default Dashboard;
