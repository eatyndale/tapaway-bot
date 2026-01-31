import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HEYGEN_API_BASE = "https://api.heygen.com/v1";

// Default avatar ID - calm, professional avatar suitable for therapy sessions
const DEFAULT_AVATAR_ID = "Anna_public_3_20240108";
const DEFAULT_VOICE_ID = "1bd001e7e50f421d891986aad5158bc8"; // Soft, calm voice

interface CreateSessionRequest {
  action: "create" | "close";
  sessionId?: string;
  avatarId?: string;
  voiceId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const HEYGEN_API_KEY = Deno.env.get("HEYGEN_API_KEY");
  if (!HEYGEN_API_KEY) {
    console.error("[heygen-session] HEYGEN_API_KEY not configured");
    return new Response(
      JSON.stringify({ error: "HeyGen API key not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: CreateSessionRequest = await req.json();
    const { action, sessionId, avatarId, voiceId } = body;

    if (action === "create") {
      // Create a new streaming avatar session
      console.log("[heygen-session] Creating new session");
      
      const response = await fetch(`${HEYGEN_API_BASE}/streaming.new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": HEYGEN_API_KEY,
        },
        body: JSON.stringify({
          avatar_id: avatarId || DEFAULT_AVATAR_ID,
          voice: {
            voice_id: voiceId || DEFAULT_VOICE_ID,
          },
          quality: "medium", // Balance quality and latency
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[heygen-session] HeyGen API error:", response.status, errorText);
        
        // Check for specific errors
        if (response.status === 401) {
          return new Response(
            JSON.stringify({ error: "Invalid HeyGen API key" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: "Failed to create HeyGen session", details: errorText }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      console.log("[heygen-session] Session created successfully:", data.data?.session_id);
      
      // Return session details needed for WebRTC connection
      return new Response(
        JSON.stringify({
          sessionId: data.data?.session_id,
          accessToken: data.data?.access_token,
          url: data.data?.url,
          iceServers: data.data?.ice_servers || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      
    } else if (action === "close" && sessionId) {
      // Close an existing session to stop billing
      console.log("[heygen-session] Closing session:", sessionId);
      
      const response = await fetch(`${HEYGEN_API_BASE}/streaming.stop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": HEYGEN_API_KEY,
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[heygen-session] Failed to close session:", response.status, errorText);
        // Still return success - session may have already expired
      }

      console.log("[heygen-session] Session closed successfully");
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'create' or 'close'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
  } catch (error) {
    console.error("[heygen-session] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
