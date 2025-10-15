import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from '@supabase/supabase-js';

// Types
export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  user_id: string;
  answers: number[];
  total_score: number;
  severity_level: string;
  recommendation: string;
  needs_crisis_support: boolean;
  created_at: string;
}

export interface TappingSession {
  id: string;
  user_id: string;
  problem: string;
  feeling: string;
  body_location: string;
  initial_intensity: number;
  final_intensity?: number;
  rounds_completed: number;
  setup_statements: string[];
  reminder_phrases: string[];
  improvement?: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  session_number: number;
  messages: any;
  crisis_detected: boolean;
  crisis_resources: any;
  created_at: string;
  updated_at: string;
}

// Assessment scoring logic
export const calculateAssessmentResult = (answers: number[]): {
  total_score: number;
  severity_level: string;
  recommendation: string;
  needs_crisis_support: boolean;
} => {
  const total_score = answers.reduce((sum, answer) => sum + answer, 0);
  
  let severity_level: string;
  let recommendation: string;
  let needs_crisis_support = false;

  if (total_score <= 4) {
    severity_level = "Minimal depression";
    recommendation = "Continue monitoring your mental health and practice self-care.";
  } else if (total_score <= 9) {
    severity_level = "Mild depression";
    recommendation = "Consider lifestyle changes and regular EFT practice. Monitor symptoms.";
  } else if (total_score <= 14) {
    severity_level = "Moderate depression";
    recommendation = "EFT tapping may help, but consider speaking with a mental health professional.";
  } else if (total_score <= 19) {
    severity_level = "Moderately severe depression";
    recommendation = "Professional mental health support is recommended alongside EFT practice.";
    needs_crisis_support = true;
  } else {
    severity_level = "Severe depression";
    recommendation = "Please seek immediate professional mental health support.";
    needs_crisis_support = true;
  }

  // Check for crisis indicators (question 9 about self-harm)
  if (answers[8] >= 1) {
    needs_crisis_support = true;
  }

  return { total_score, severity_level, recommendation, needs_crisis_support };
};

// EFT Script Generation (simplified for now)
export const generateEFTScript = (problem: string, feeling: string, bodyLocation: string): {
  setup_statements: string[];
  reminder_phrases: string[];
} => {
  const setup_statements = [
    `Even though I have this ${problem} and I feel ${feeling} in my ${bodyLocation}, I deeply and completely accept myself.`,
    `Even though I'm experiencing ${feeling} about ${problem} in my ${bodyLocation}, I choose to be patient and kind with myself.`,
    `Even though this ${feeling} about ${problem} feels overwhelming in my ${bodyLocation}, I am open to releasing it now.`
  ];

  const reminder_phrases = [
    `This ${feeling} about ${problem}`,
    `This tension in my ${bodyLocation}`,
    `This overwhelming ${feeling}`,
    `I choose to release this ${feeling}`,
    `I am safe and supported`,
    `I can handle this situation`,
    `I choose peace and calm`,
    `Releasing this ${feeling} now`
  ];

  return { setup_statements, reminder_phrases };
};

// Crisis resources
export const getCrisisResources = () => ({
  hotlines: [
    { name: "National Suicide Prevention Lifeline", number: "988", available: "24/7" },
    { name: "Crisis Text Line", number: "Text HOME to 741741", available: "24/7" },
    { name: "SAMHSA National Helpline", number: "1-800-662-4357", available: "24/7" }
  ],
  local_resources: [
    "Contact your local emergency services (911) if in immediate danger",
    "Visit your nearest hospital emergency room",
    "Contact your primary care physician or mental health provider"
  ],
  online_resources: [
    { name: "National Alliance on Mental Illness", url: "https://www.nami.org" },
    { name: "Mental Health America", url: "https://www.mhanational.org" }
  ]
});

class SupabaseService {
  // Authentication
  async signUp(firstName: string, email: string, password: string): Promise<{ user: User | null; session: Session | null; error: any }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName
        },
        emailRedirectTo: 'https://tapaway.lovable.app/'
      }
    });

    return { user: data.user, session: data.session, error };
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; session: Session | null; error: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { user: data.user, session: data.session, error };
  }

  async signOut(): Promise<{ error: any }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async getSession(): Promise<{ session: Session | null; error: any }> {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  }

  async resetPasswordForEmail(email: string): Promise<{ error: any }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { error };
  }

  async updatePassword(newPassword: string): Promise<{ error: any }> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { error };
  }

  async resendConfirmationEmail(email: string): Promise<{ error: any }> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: 'https://tapaway.lovable.app/'
      }
    });
    return { error };
  }

  parseAuthError(error: any): string {
    if (!error) return "An unknown error occurred";
    
    const message = error.message || error.error_description || error.error || "";
    
    // Handle specific error cases with user-friendly messages
    if (message.includes("Email rate limit exceeded")) {
      return "Too many email requests. Please wait 60 seconds before trying again.";
    }
    
    if (message.includes("Token has expired") || message.includes("token not found")) {
      return "This verification link has expired. Please request a new one.";
    }
    
    if (message.includes("Invalid login credentials")) {
      return "Invalid email or password. Please check your credentials.";
    }
    
    if (message.includes("Email not confirmed")) {
      return "Please verify your email address before signing in. Check your inbox for the confirmation link.";
    }
    
    if (message.includes("User already registered")) {
      return "An account with this email already exists. Please sign in instead.";
    }
    
    if (message.includes("Invalid redirect URL") || message.includes("redirect not allowed")) {
      return "Authentication configuration error. Please contact support or check your Supabase settings.";
    }
    
    if (message.includes("Password should be at least 6 characters")) {
      return "Password must be at least 6 characters long.";
    }
    
    // Return original message if no specific match
    return message;
  }

  // Profile management
  async getProfile(userId: string): Promise<{ profile: UserProfile | null; error: any }> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return { profile: data, error };
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<{ profile: UserProfile | null; error: any }> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    return { profile: data, error };
  }

  // Assessment management
  async submitAssessment(userId: string, answers: number[]): Promise<{ assessment: Assessment | null; error: any }> {
    const result = calculateAssessmentResult(answers);
    
    const { data, error } = await supabase
      .from('assessments')
      .insert({
        user_id: userId,
        answers,
        ...result
      })
      .select()
      .single();

    return { assessment: data, error };
  }

  async getAssessments(userId: string): Promise<{ assessments: Assessment[]; error: any }> {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { assessments: data || [], error };
  }

  // Tapping session management
  async createTappingSession(userId: string, sessionData: {
    problem: string;
    feeling: string;
    body_location: string;
    initial_intensity: number;
  }): Promise<{ session: TappingSession | null; error: any }> {
    const eftScript = generateEFTScript(sessionData.problem, sessionData.feeling, sessionData.body_location);
    
    const { data, error } = await supabase
      .from('tapping_sessions')
      .insert({
        user_id: userId,
        ...sessionData,
        setup_statements: eftScript.setup_statements,
        reminder_phrases: eftScript.reminder_phrases
      })
      .select()
      .single();

    return { session: data, error };
  }

  async updateTappingSession(sessionId: string, updates: {
    final_intensity?: number;
    rounds_completed?: number;
    completed_at?: string;
  }): Promise<{ session: TappingSession | null; error: any }> {
    const { data, error } = await supabase
      .from('tapping_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    return { session: data, error };
  }

  async getTappingSessions(userId: string): Promise<{ sessions: TappingSession[]; error: any }> {
    const { data, error } = await supabase
      .from('tapping_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { sessions: data || [], error };
  }

  // Chat session management
  async getOrCreateChatSession(userId: string): Promise<{ session: ChatSession | null; error: any }> {
    // Get the latest session number for this user
    const { data: lastSession } = await supabase
      .from('chat_sessions')
      .select('session_number')
      .eq('user_id', userId)
      .order('session_number', { ascending: false })
      .limit(1)
      .single();

    const nextSessionNumber = lastSession ? lastSession.session_number + 1 : 1;

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        session_number: nextSessionNumber,
        messages: []
      })
      .select()
      .single();

    return { session: data, error };
  }

  async getChatSessions(userId: string): Promise<{ sessions: ChatSession[]; error: any }> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { sessions: data || [], error };
  }

  async updateChatSession(sessionId: string, updates: {
    messages?: any[];
    crisis_detected?: boolean;
    crisis_resources?: any;
    session_name?: string;
  }): Promise<{ session: ChatSession | null; error: any }> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    return { session: data, error };
  }

  generateSessionName(emotion: string, problem?: string): string {
    if (!emotion) return `Session ${new Date().toLocaleDateString()}`;
    
    const emotionMap: Record<string, string[]> = {
      'anxiety': ['Anxious Thoughts', 'Worried Mind', 'Nervous Energy', 'Restless Feelings'],
      'anxious': ['Anxious Thoughts', 'Worried Mind', 'Nervous Energy', 'Restless Feelings'],
      'worried': ['Worried Thoughts', 'Concerned Mind', 'Uneasy Feelings', 'Apprehensive Moment'],
      'stress': ['Stressed Mind', 'Overwhelmed Feelings', 'Pressure Points', 'Tense Moment'],
      'stressed': ['Stressed Mind', 'Overwhelmed Feelings', 'Pressure Points', 'Tense Moment'],
      'fear': ['Fearful Thoughts', 'Scared Feelings', 'Frightened Mind', 'Afraid Moment'],
      'scared': ['Fearful Thoughts', 'Scared Feelings', 'Frightened Mind', 'Afraid Moment'],
      'overwhelmed': ['Overwhelmed Mind', 'Too Much Feeling', 'Chaotic Thoughts', 'Overloaded Moment'],
      'panic': ['Panic Attack', 'Racing Heart', 'Intense Fear', 'Overwhelming Panic'],
      'sad': ['Sad Feelings', 'Heavy Heart', 'Sorrowful Mind', 'Down Moment'],
      'angry': ['Angry Feelings', 'Frustrated Mind', 'Mad Moment', 'Irritated State'],
      'embarrassed': ['Embarrassed Feelings', 'Shame Moment', 'Self-Conscious Mind', 'Awkward Feeling'],
      'guilt': ['Guilty Feelings', 'Remorseful Mind', 'Self-Blame Moment', 'Regret Session'],
      'health': ['Health Worries', 'Body Concerns', 'Medical Anxiety', 'Health Fear'],
      'work': ['Work Stress', 'Job Anxiety', 'Career Worries', 'Professional Pressure'],
      'parenting': ['Parenting Concerns', 'Mom Guilt', 'Dad Worries', 'Child Anxiety'],
      'relationship': ['Relationship Stress', 'Love Worries', 'Partner Concerns', 'Connection Issues']
    };

    const baseEmotion = emotion.toLowerCase();
    let sessionNames = emotionMap[baseEmotion];
    
    // Check for problem-specific names
    if (problem) {
      const problemLower = problem.toLowerCase();
      if (problemLower.includes('health') || problemLower.includes('body') || problemLower.includes('sick')) {
        sessionNames = emotionMap['health'];
      } else if (problemLower.includes('work') || problemLower.includes('job') || problemLower.includes('boss')) {
        sessionNames = emotionMap['work'];
      } else if (problemLower.includes('child') || problemLower.includes('parent') || problemLower.includes('mum') || problemLower.includes('mom')) {
        sessionNames = emotionMap['parenting'];
      } else if (problemLower.includes('relationship') || problemLower.includes('partner') || problemLower.includes('love')) {
        sessionNames = emotionMap['relationship'];
      }
    }

    // Fallback to generic anxiety names if no match
    if (!sessionNames) {
      sessionNames = emotionMap['anxiety'];
    }

    const randomName = sessionNames[Math.floor(Math.random() * sessionNames.length)];
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${randomName} - ${date}`;
  }

  // Progress tracking
  async getProgress(userId: string): Promise<{
    tapping_sessions: Array<{
      date: string;
      initial_intensity: number;
      final_intensity: number;
      improvement: number;
    }>;
    assessment_history: Array<{
      date: string;
      total_score: number;
      severity_level: string;
    }>;
    total_sessions: number;
    average_improvement: number;
    last_session_date: string | null;
    error: any;
  }> {
    const { data: sessions, error: sessionsError } = await supabase
      .from('tapping_sessions')
      .select('created_at, initial_intensity, final_intensity, improvement')
      .eq('user_id', userId)
      .not('final_intensity', 'is', null)
      .order('created_at', { ascending: false });

    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select('created_at, total_score, severity_level')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const error = sessionsError || assessmentsError;

    const tapping_sessions = (sessions || []).map(session => ({
      date: session.created_at,
      initial_intensity: session.initial_intensity,
      final_intensity: session.final_intensity || 0,
      improvement: session.improvement || 0
    }));

    const assessment_history = (assessments || []).map(assessment => ({
      date: assessment.created_at,
      total_score: assessment.total_score,
      severity_level: assessment.severity_level
    }));

    const total_sessions = tapping_sessions.length;
    const average_improvement = total_sessions > 0 
      ? tapping_sessions.reduce((sum, session) => sum + session.improvement, 0) / total_sessions 
      : 0;
    const last_session_date = tapping_sessions.length > 0 ? tapping_sessions[0].date : null;

    return {
      tapping_sessions,
      assessment_history,
      total_sessions,
      average_improvement,
      last_session_date,
      error
    };
  }
}

export const supabaseService = new SupabaseService();