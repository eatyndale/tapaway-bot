import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsVerifying(false);
        // Start countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              navigate("/");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } else {
        // No session yet, wait a bit and redirect to home
        setTimeout(() => navigate("/"), 2000);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleContinue = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          {isVerifying ? (
            <>
              <div className="mx-auto w-16 h-16 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl">Verifying your email...</CardTitle>
              <CardDescription>Please wait while we complete your verification</CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 flex items-center justify-center bg-primary/10 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-primary animate-in zoom-in duration-500" />
              </div>
              <CardTitle className="text-2xl">Email Verified Successfully!</CardTitle>
              <CardDescription>
                Your account has been confirmed. You're all set to start using TapAway.
              </CardDescription>
            </>
          )}
        </CardHeader>
        {!isVerifying && (
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Redirecting to your dashboard in {countdown} second{countdown !== 1 ? 's' : ''}...
            </div>
            <Button 
              onClick={handleContinue} 
              className="w-full"
              size="lg"
            >
              Continue to Dashboard
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default AuthCallback;
