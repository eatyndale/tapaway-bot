import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Heart } from "lucide-react";
import { supabaseService } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";

interface AuthFormProps {
  onSuccess: () => void;
  onBack: () => void;
  message?: string;
}

const AuthForm = ({ onSuccess, onBack, message }: AuthFormProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [ageGroup, setAgeGroup] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [signUpEmailSent, setSignUpEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let result;
      if (isLogin) {
        result = await supabaseService.signIn(email, password);
        if (result.error) {
          const errorMessage = supabaseService.parseAuthError(result.error);
          throw new Error(errorMessage);
        }
        onSuccess();
      } else {
        // Validate required fields for signup
        if (!industry.trim() || !ageGroup.trim()) {
          throw new Error("Please fill in all required fields including Industry and Age Group");
        }
        result = await supabaseService.signUp(name, email, password, industry, ageGroup);
        if (result.error) {
          const errorMessage = supabaseService.parseAuthError(result.error);
          throw new Error(errorMessage);
        }
        setSignUpEmailSent(true);
        toast({
          title: "Check your email!",
          description: "We've sent a verification link to your inbox.",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    setError("");

    try {
      const { error } = await supabaseService.resendConfirmationEmail(email);
      if (error) {
        const errorMessage = supabaseService.parseAuthError(error);
        throw new Error(errorMessage);
      }
      
      toast({
        title: "Email resent!",
        description: "Check your inbox for the new verification link.",
      });
      
      // Start 60-second cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to resend email";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabaseService.resetPasswordForEmail(email);
      if (error) {
        throw new Error(error.message);
      }
      
      setResetEmailSent(true);
      toast({
        title: "Password reset email sent!",
        description: "Check your inbox for the reset link.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 hover:bg-white/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isForgotPassword ? "Reset Password" : (isLogin ? "Welcome Back" : "Create Account")}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isForgotPassword 
                ? "Enter your email to receive a password reset link"
                : (message || (isLogin 
                  ? "Sign in to continue your anxiety reduction journey" 
                  : "Start your journey to inner peace today"
                ))
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isForgotPassword ? (
              <>
                {resetEmailSent ? (
                  <div className="text-center space-y-4">
                    <div className="text-green-600 p-4 bg-green-50 rounded-lg">
                      <p className="font-medium">Email sent successfully!</p>
                      <p className="text-sm mt-2">Check your inbox for the password reset link.</p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setResetEmailSent(false);
                        setEmail("");
                      }}
                      className="text-primary hover:text-primary/80"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border-gray-300 focus:border-primary"
                      />
                    </div>
                    {error && (
                      <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded">
                        {error}
                      </div>
                    )}
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {loading ? "..." : "Send Reset Link"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setError("");
                      }}
                      className="w-full text-primary hover:text-primary/80"
                    >
                      Back to Sign In
                    </Button>
                  </form>
                )}
              </>
            ) : signUpEmailSent ? (
              <div className="space-y-4">
                <div className="text-center space-y-3 p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Check your email</h3>
                    <p className="text-sm text-gray-600 mt-2">
                      We sent a verification link to <strong>{email}</strong>
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1 mt-4">
                    <p>• Click the link in the email to verify your account</p>
                    <p>• Check your spam folder if you don't see it</p>
                    <p>• The link expires after 24 hours</p>
                  </div>
                </div>
                
                {error && (
                  <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded">
                    {error}
                  </div>
                )}
                
                <Button
                  onClick={handleResendEmail}
                  disabled={loading || resendCooldown > 0}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Verification Email"}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSignUpEmailSent(false);
                    setEmail("");
                    setPassword("");
                    setName("");
                    setIndustry("");
                    setAgeGroup("");
                    setError("");
                  }}
                  className="w-full text-primary hover:text-primary/80"
                >
                  Use a Different Email
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="border-gray-300 focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          type="text"
                          placeholder="e.g., Healthcare, Education, Technology"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          required
                          className="border-gray-300 focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ageGroup">Age Group</Label>
                        <Input
                          id="ageGroup"
                          type="text"
                          placeholder="e.g., 18-24, 25-34, 35-44"
                          value={ageGroup}
                          onChange={(e) => setAgeGroup(e.target.value)}
                          required
                          className="border-gray-300 focus:border-primary"
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-gray-300 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">Password</Label>
                      {isLogin && (
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-gray-300 focus:border-primary"
                    />
                  </div>
                  {error && (
                    <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded">
                      {error}
                    </div>
                  )}
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {loading ? "..." : (isLogin ? "Sign In" : "Create Account")}
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError("");
                    }}
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    {isLogin 
                      ? "Don't have an account? Sign up" 
                      : "Already have an account? Sign in"
                    }
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthForm;
