import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import AuthForm from "@/components/AuthForm";
import Dashboard from "@/components/Dashboard";
import { supabaseService } from "@/services/supabaseService";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { ArrowRight, MessageCircle, Hand, CheckCircle } from "lucide-react";
import { ScienceSection } from "@/components/landing/ScienceSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { WhatIsTapaway } from "@/components/landing/WhatIsTapaway";
import { BenefitsSection } from "@/components/landing/BenefitsSection";

const Index = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<'assessment' | 'chat' | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user && pendingAction) {
        setPendingAction(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [pendingAction]);

  const handleStartAssessment = () => {
    if (!user) {
      setPendingAction('assessment');
      setShowAuth(true);
    }
  };

  const handleProceedToChat = () => {
    if (!user) {
      setPendingAction('chat');
      setShowAuth(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
  };

  const handleSignOut = async () => {
    await supabaseService.signOut();
    setUser(null);
    setSession(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Dashboard onSignOut={handleSignOut} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <img 
                src="/lovable-uploads/2323e4a7-8630-4879-88a4-0b0c0be5aba7.png" 
                alt="Tapaway" 
                className="h-14"
              />
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Hand className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Guided EFT Tapping</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground mb-6 leading-tight">
              Instant Emotional Relief.{" "}
              <span className="text-primary">Anytime. Anywhere.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
              Real-Time Support for Real-Life Stress
            </p>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Tapaway puts personalised, AI-guided tapping support in your hands—whenever you need it. 
              No waiting rooms. No referrals. Just fast relief that works.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleProceedToChat}
                className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                Start Tapping Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleStartAssessment}
                className="text-lg px-8 py-6 rounded-full"
              >
                Take Assessment First
              </Button>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path 
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Benefits Section */}
      <BenefitsSection />

      {/* Science Section */}
      <ScienceSection />

      {/* What is Tapaway Section */}
      <WhatIsTapaway />

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-orange-50/50 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to feeling better—no experience needed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center bg-card rounded-2xl p-8 shadow-soft">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
                1
              </div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                Share What's Bothering You
              </h3>
              <p className="text-muted-foreground">
                Tell us what you're feeling—no judgment, no waiting. Our AI understands and responds with empathy.
              </p>
            </div>

            <div className="text-center bg-card rounded-2xl p-8 shadow-soft">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
                2
              </div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <Hand className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                Follow Guided Tapping
              </h3>
              <p className="text-muted-foreground">
                Our AI guides you through personalised EFT sequences, showing you exactly where and how to tap.
              </p>
            </div>

            <div className="text-center bg-card rounded-2xl p-8 shadow-soft">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
                3
              </div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                Feel the Relief
              </h3>
              <p className="text-muted-foreground">
                Experience measurable reduction in stress and anxiety. Most users feel calmer within minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Your Journey to Emotional Freedom Starts Here
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands who have found relief through EFT tapping. No apps to download, 
            no waiting lists—just instant support when you need it.
          </p>
          <Button 
            size="lg" 
            onClick={handleProceedToChat}
            className="text-lg px-10 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Start Your Free Session
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-heading font-bold text-foreground">
                  {pendingAction === 'assessment' ? 'Sign in to Start Assessment' : 'Sign in to Start Tapping'}
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowAuth(false);
                    setPendingAction(null);
                  }}
                >
                  ✕
                </Button>
              </div>
              <AuthForm 
                onSuccess={handleAuthSuccess} 
                onBack={() => {
                  setShowAuth(false);
                  setPendingAction(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
