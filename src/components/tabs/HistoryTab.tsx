import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Clock, TrendingDown, ArrowDown } from "lucide-react";

interface Session {
  id: string;
  problem: string;
  feeling: string;
  initial_intensity: number;
  final_intensity: number | null;
  improvement: number | null;
  rounds_completed: number | null;
  created_at: string;
  completed_at: string | null;
}

const HistoryTab = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("tapping_sessions")
        .select("id, problem, feeling, initial_intensity, final_intensity, improvement, rounds_completed, created_at, completed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setSessions(data || []);
    } catch (err) {
      console.error("Error loading sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground animate-pulse">Loading history...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <Clock className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-lg font-medium text-foreground">No sessions yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Your tapping session history will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-20">
      <h2 className="text-lg font-semibold text-foreground">Session History</h2>
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardContent className="py-4 px-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">
                  {session.problem || "Tapping session"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(session.created_at)} · {formatTime(session.created_at)}
                </p>
                {session.feeling && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Feeling: {session.feeling}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 ml-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{session.initial_intensity}</p>
                  <p className="text-[10px] text-muted-foreground">Start</p>
                </div>
                {session.final_intensity !== null && (
                  <>
                    <ArrowDown className="w-4 h-4 text-green-500" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{session.final_intensity}</p>
                      <p className="text-[10px] text-muted-foreground">End</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            {session.improvement !== null && session.improvement > 0 && (
              <div className="mt-2 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600 font-medium">
                  {session.improvement} point{session.improvement !== 1 ? "s" : ""} improvement
                </span>
                {session.rounds_completed !== null && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {session.rounds_completed} round{session.rounds_completed !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default HistoryTab;
