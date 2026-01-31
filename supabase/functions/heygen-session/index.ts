import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HEYGEN_API_BASE = "https://api.heygen.com/v1";

interface SessionRequest {
  action: "create_token" | "close";
  sessionId?: string;
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
    const body: SessionRequest = await req.json();
    const { action, sessionId } = body;

    if (action === "create_token" || action === "create") {
      // Generate an access token for the SDK to use
      // The SDK will handle session creation internally
      console.log("[heygen-session] Generating access token for SDK");
      
      const response = await fetch(`${HEYGEN_API_BASE}/streaming.create_token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": HEYGEN_API_KEY,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[heygen-session] HeyGen API error:", response.status, errorText);
        
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
          JSON.stringify({ error: "Failed to create HeyGen token", details: errorText }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      console.log("[heygen-session] Token created successfully");
      
      // Return the token for the SDK to use
      return new Response(
        JSON.stringify({
          token: data.data?.token,
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
        JSON.stringify({ error: "Invalid action. Use 'create_token' or 'close'" }),
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
