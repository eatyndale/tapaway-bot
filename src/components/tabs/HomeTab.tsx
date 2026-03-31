import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TrendingDown, Calendar, Activity, Filter } from "lucide-react";

type TimeFilter = "24h" | "7d" | "30d" | "6m";

interface HomeTabProps {
  onStartTapping: () => void;
}

const HomeTab = ({ onStartTapping }: HomeTabProps) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("7d");
  const [avgSuds, setAvgSuds] = useState<number | null>(null);
  const [daysSinceLastSession, setDaysSinceLastSession] = useState<number | null>(null);
  const [totalSessions, setTotalSessions] = useState(0);
  const [avgImprovement, setAvgImprovement] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [timeFilter]);

  const getFilterDate = (filter: TimeFilter): string => {
    const now = new Date();
    switch (filter) {
      case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case "6m": return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const filterDate = getFilterDate(timeFilter);

      // Get sessions in time range
      const { data: sessions } = await supabase
        .from("tapping_sessions")
        .select("initial_intensity, final_intensity, improvement, created_at, completed_at")
        .eq("user_id", user.id)
        .gte("created_at", filterDate)
        .order("created_at", { ascending: false });

      // Get most recent session (any time)
      const { data: lastSession } = await supabase
        .from("tapping_sessions")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (lastSession) {
        const lastDate = new Date(lastSession.created_at);
        const diffMs = Date.now() - lastDate.getTime();
        setDaysSinceLastSession(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      } else {
        setDaysSinceLastSession(null);
      }

      if (sessions && sessions.length > 0) {
        setTotalSessions(sessions.length);

        // Average initial SUDS (what they came in with)
        const sudsValues = sessions
          .map(s => s.initial_intensity)
          .filter((v): v is number => v !== null);
        if (sudsValues.length > 0) {
          setAvgSuds(Math.round((sudsValues.reduce((a, b) => a + b, 0) / sudsValues.length) * 10) / 10);
        } else {
          setAvgSuds(null);
        }

        // Average improvement
        const improvements = sessions
          .map(s => s.improvement)
          .filter((v): v is number => v !== null);
        if (improvements.length > 0) {
          setAvgImprovement(Math.round((improvements.reduce((a, b) => a + b, 0) / improvements.length) * 10) / 10);
        } else {
          setAvgImprovement(null);
        }
      } else {
        setTotalSessions(0);
        setAvgSuds(null);
        setAvgImprovement(null);
      }
    } catch (err) {
      console.error("Error loading stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const filters: { value: TimeFilter; label: string }[] = [
    { value: "24h", label: "24h" },
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "6m", label: "6 months" },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Days since last session */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Days since last session</p>
              <p className="text-4xl font-bold text-foreground mt-1">
                {daysSinceLastSession !== null ? daysSinceLastSession : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {daysSinceLastSession === 0
                  ? "Great — you tapped today!"
                  : daysSinceLastSession !== null && daysSinceLastSession <= 3
                  ? "Nice consistency! 💪"
                  : daysSinceLastSession !== null
                  ? "Time for a session?"
                  : "No sessions yet"}
              </p>
            </div>
            <Calendar className="w-10 h-10 text-primary/30" />
          </div>
        </CardContent>
      </Card>

      {/* Time filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1.5">
          {filters.map(f => (
            <Button
              key={f.value}
              variant={timeFilter === f.value ? "default" : "outline"}
              size="sm"
              className="text-xs h-8 px-3"
              onClick={() => setTimeFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <TrendingDown className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">
              {loading ? "…" : avgSuds !== null ? avgSuds : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg SUDS</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Activity className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">
              {loading ? "…" : totalSessions}
            </p>
            <p className="text-[10px] text-muted-foreground">Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <TrendingDown className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">
              {loading ? "…" : avgImprovement !== null ? `${avgImprovement}` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Drop</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick start */}
      <Button onClick={onStartTapping} className="w-full h-14 text-lg rounded-2xl shadow-warm">
        Start Tapping Session
      </Button>
    </div>
  );
};

export default HomeTab;
