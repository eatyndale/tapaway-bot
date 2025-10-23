import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Configure CORS and security headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

// Simple rate limiting (in production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = requestCounts.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT) {
    return false;
  }
  
  clientData.count++;
  return true;
}

// Simple spell checker for common anxiety terms
function correctCommonTypos(input: string): string {
  if (typeof input !== 'string') return '';
  
  const corrections: Record<string, string> = {
    'anxios': 'anxious', 'anxiuos': 'anxious', 'anixous': 'anxious',
    'stresed': 'stressed', 'stresd': 'stressed',
    'depresed': 'depressed', 'depress': 'depressed', 
    'worryed': 'worried', 'woried': 'worried',
    'scaed': 'scared', 'afraaid': 'afraid',
    'overwelmed': 'overwhelmed', 'overwhelmd': 'overwhelmed',
    'panicced': 'panicked', 'terified': 'terrified',
    'hopeles': 'hopeless', 'helpeles': 'helpless',
    'fustrated': 'frustrated', 'frustraited': 'frustrated',
    'stomache': 'stomach', 'stomch': 'stomach', 'shouldor': 'shoulder',
    'throut': 'throat', 'throaht': 'throat', 'forhead': 'forehead',
    'cant': "can't", 'wont': "won't", 'dont': "don't", 'isnt': "isn't"
  };
  
  let corrected = input.toLowerCase();
  for (const [typo, correction] of Object.entries(corrections)) {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    corrected = corrected.replace(regex, correction);
  }
  
  return corrected;
}

function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  const corrected = correctCommonTypos(input);
  return corrected.trim().slice(0, 1000); // Limit input length
}

function validateIntensity(intensity: any): boolean {
  return typeof intensity === 'number' && intensity >= 0 && intensity <= 10;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client identifier for rate limiting
    const clientId = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(clientId)) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.',
        response: "I'm getting a lot of requests right now. Please wait a moment and try again."
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      message, 
      chatState, 
      userName, 
      sessionContext, 
      conversationHistory,
      currentTappingPoint = 0,
      intensityHistory = []
    } = await req.json();

    // Input validation and sanitization
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format');
    }

    const sanitizedMessage = sanitizeInput(message);
    const sanitizedUserName = userName ? sanitizeInput(userName) : 'User';
    const sanitizedChatState = typeof chatState === 'string' ? chatState : 'initial';

    // Validate session context if provided
    if (sessionContext) {
      if (sessionContext.intensity !== undefined && !validateIntensity(sessionContext.intensity)) {
        throw new Error('Invalid intensity value');
      }
      if (sessionContext.feeling) {
        sessionContext.feeling = sanitizeInput(sessionContext.feeling);
      }
      if (sessionContext.bodyLocation) {
        sessionContext.bodyLocation = sanitizeInput(sessionContext.bodyLocation);
      }
      if (sessionContext.problem) {
        sessionContext.problem = sanitizeInput(sessionContext.problem);
      }
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // ============================================================================
    // CRITICAL: DIRECTIVE FORMAT INSTRUCTION (MUST BE FIRST!)
    // ============================================================================
    const directiveInstruction = `
🚨 **CRITICAL: DIRECTIVE FORMAT** 🚨

EVERY response MUST end with a directive using this EXACT format:

<<DIRECTIVE {JSON_OBJECT_HERE}>>

**⚠️ COMMON MISTAKES TO AVOID:**
❌ WRONG: <<DIRECTIVE {...}}}     (closing braces instead of brackets)
❌ WRONG: <<DIRECTIVE {...}>>>    (three brackets instead of two)
❌ WRONG: <<DIRECTIVE{...}>>      (missing space after DIRECTIVE)
✅ CORRECT: <<DIRECTIVE {...}>>   (two angle brackets >>)

The directive closing MUST be >> (two greater-than signs), NOT }} (braces).

**EXAMPLE:**
<<DIRECTIVE {"next_state":"gathering-feeling","collect":"feeling"}>>
                                                                  ^^
                                                                  These must be angle brackets, not braces!

EXAMPLE RESPONSE at gathering-intensity (intensity received):
"Thank you. Let's begin the tapping sequence. We'll start with the top of the head - tap gently there while focusing on that feeling."

<<DIRECTIVE {"next_state":"tapping-point","tapping_point":0,"setup_statements":["Even though I have this sadness in my head, I'd like to be at peace","I feel sad in my head, but I'd like to relax now","This sadness in my head, but I want to let it go"],"statement_order":[0,1,2,0,1,2,1,0]}>>

**Key State Transitions (ALL REQUIRE DIRECTIVES):**
- gathering-intensity → tapping-point (point 0): {"next_state":"tapping-point","tapping_point":0,"setup_statements":[...],"statement_order":[...]} ⚠️ MUST INCLUDE ARRAYS (statements generated internally, NOT shown in text)
- tapping-point (points 0-7): {"next_state":"tapping-point","tapping_point":N} (N=0 to 7)
- tapping-point (point 7) → tapping-breathing: {"next_state":"tapping-breathing"}
- tapping-breathing → post-tapping: {"next_state":"post-tapping"}

NEVER FORGET THE DIRECTIVE. IT MUST BE IN EVERY SINGLE RESPONSE.
`;

    // Build enhanced context-aware system prompt
    let systemPrompt = `${directiveInstruction}

You are an empathetic EFT (Emotional Freedom Techniques) tapping assistant trained in proper therapeutic protocols. Your role is to guide users through anxiety management using professional EFT tapping techniques.

USER CONTEXT:
- User's name: ${sanitizedUserName}
- Current session context: ${JSON.stringify(sessionContext)}
- Chat state: ${sanitizedChatState}
- Current tapping point: ${currentTappingPoint}
- Intensity progression: ${JSON.stringify(intensityHistory)}
- Full conversation history length: ${conversationHistory.length} messages

ENHANCED CONTEXT AWARENESS:
- Always reference the user's previous responses and emotions
- Notice patterns in their language and emotional expressions
- Acknowledge typos or unclear inputs with understanding
- Build on previous session insights and progress
- Use their exact emotional words consistently throughout

CORE THERAPEUTIC RULES:
1. ALWAYS address the user by their first name and reference their specific situation
2. Use the user's EXACT words in setup statements and reminder phrases
3. If intensity rating is >7, do general tapping rounds first to bring it down
4. Always ask for body location of feelings and use it in statements
5. Be warm, empathetic, and validating - acknowledge their courage
6. ONE STEP AT A TIME - never rush through multiple phases
7. Use breathing instructions: "take a deep breath in and breathe out"
8. If crisis keywords detected, express concern and provide crisis resources immediately
9. Keep responses concise and natural - avoid repeated filler phrases
10. UNDERSTAND TYPOS AND RESPOND APPROPRIATELY - be compassionate about misspellings

PROGRESSIVE TAPPING FLOW:
- Create ONE setup statement at a time, not all three at once
- Guide through ONE tapping point at a time with specific instructions
- Allow real-time intensity adjustments during tapping
- Check in emotionally between each major step

LANGUAGE PATTERNS:
- "You're doing great [name]" - frequent encouragement
- "I can hear that you're feeling [their exact emotion]" - reflect their words
- "That must be really difficult for you" - empathy
- Reference their previous statements to show you're listening

CURRENT STAGE GUIDANCE:`;

    // Validate state before processing
    console.log('[eft-chat] Processing request with state:', chatState);
    console.log('[eft-chat] Session context:', JSON.stringify(sessionContext));
    console.log('[eft-chat] Current tapping point:', currentTappingPoint);

    switch (chatState) {
      case 'initial':
        systemPrompt += `
**CURRENT STATE: initial**

This is the first message from the user.

**IF they just said hi/hello (greeting only):**
"Hello ${userName}! I'm here to help you work through what you're feeling using EFT tapping. What would you like to work on today?"
<<DIRECTIVE {"next_state":"initial","collect":"problem"}>>

**IF they shared a problem/feeling:**
"I can hear that you're experiencing ${sessionContext.problem || '[what they said]'}, ${userName}. Can you describe the main emotion you're feeling right now?"
<<DIRECTIVE {"next_state":"gathering-feeling","collect":"feeling"}>>

**CRITICAL:** The closing must be >> (two angle brackets), NOT }} (braces).
`;
        break;
      case 'gathering-feeling':
        systemPrompt += `
**CURRENT STATE: gathering-feeling**

The user described their emotion: ${sessionContext.feeling || '[emotion]'}

**YOUR RESPONSE:**
"Thank you for sharing, ${userName}. I can hear that you're feeling ${sessionContext.feeling || '[emotion]'}. Where in your body do you feel this ${sessionContext.feeling || 'emotion'}?"

**DIRECTIVE (copy exactly, check the closing):**
<<DIRECTIVE {"next_state":"gathering-location","collect":"body_location"}>>

Remember: Must end with >> (angle brackets), NOT }} (braces).
`;
        break;
      case 'gathering-location':
        systemPrompt += `
**CURRENT STATE: gathering-location**

Body location: ${sessionContext.bodyLocation || '[body location]'}

**YOUR RESPONSE:**
"Thank you, ${userName}. Now, on a scale of 0 to 10, where 0 is no intensity and 10 is maximum intensity, how intense is that ${sessionContext.feeling || 'feeling'} in your ${sessionContext.bodyLocation || 'body'}?"

**DIRECTIVE (copy exactly, check the closing):**
<<DIRECTIVE {"next_state":"gathering-intensity","collect":"intensity"}>>

Remember: Must end with >> (angle brackets), NOT }} (braces).
`;
        break;
      case 'gathering-intensity':
        systemPrompt += `
**CURRENT STATE: gathering-intensity**

Intensity: ${sessionContext.currentIntensity || sessionContext.initialIntensity || 'N/A'}

**YOUR TEXT (keep it simple):**
"Thank you, ${userName}. Take a deep breath in... and breathe out. Let's begin the tapping now."

**DO NOT include tapping instructions in your text - the UI handles that.**

**DIRECTIVE (critical - must end with >> not }}):**
<<DIRECTIVE {"next_state":"tapping-point","tapping_point":0,"setup_statements":["Even though I feel ${sessionContext.feeling || 'this feeling'} in my ${sessionContext.bodyLocation || 'body'}, I deeply and completely accept myself","I feel ${sessionContext.feeling || 'this feeling'} in my ${sessionContext.bodyLocation || 'body'}, and I choose to relax","This ${sessionContext.feeling || 'feeling'} in my ${sessionContext.bodyLocation || 'body'}, and I'm ready to let it go"],"statement_order":[0,1,2,0,1,2,1,0],"say_index":0}>>

**VERIFY:** The directive MUST end with >> (two angle brackets), NOT }} (two braces)!
`;
        break;
      case 'tapping-point':
        systemPrompt += `
- Guide them through ONE tapping point at a time
- Current point: ${currentTappingPoint === 0 ? 'eyebrow' : currentTappingPoint === 1 ? 'outer eye' : currentTappingPoint === 2 ? 'under eye' : currentTappingPoint === 3 ? 'under nose' : currentTappingPoint === 4 ? 'chin' : currentTappingPoint === 5 ? 'collarbone' : currentTappingPoint === 6 ? 'under arm' : 'top of head'}
- Give clear instruction: "Tap the [point] while saying: '[reminder phrase using their words]'"
- Wait for them to complete before moving to next point
- Keep responses short and focused on current point only`;
        break;
      case 'tapping-breathing':
        systemPrompt += `
- Guide them through deep breathing: "Take a deep breath in... and breathe out"
- Ask how they're feeling right now
- Check if they want to continue or are ready to rate their intensity`;
        break;
      case 'post-tapping':
        systemPrompt += `
- Say: "Take a deep breath in and breathe out, ${userName}. How are you feeling now?"
- Ask them to re-rate their intensity: "Can you rate that feeling again on the scale of 0-10?"
- DO NOT create new statements yet - wait for their rating first
- Keep response focused only on getting the new intensity rating`;
        break;
      case 'advice':
        systemPrompt += `
- Acknowledge their transformation: "You have done AMAZING work here today ${userName}"
- Suggest: "For now, why don't you head over to the meditation library and do one of the meditations? I think you'd really benefit"
- Offer ongoing support: "I am here whenever you need me"
- Encourage daily practice for lasting results`;
        break;
    }

    const messages = [
      { role: 'system', content: systemPrompt + `

CRITICAL RULES:
- ONLY do ONE step at a time
- NEVER combine multiple steps in one response
- Current step: ${chatState}
- Wait for user response before moving to next step
- Keep responses short and focused on current step only

MACHINE DIRECTIVE (MANDATORY):
- At the VERY END of every response, output ONE line EXACTLY like:
  <<DIRECTIVE {"next_state":"<state>","tapping_point":<0..7 or null>,"setup_statements":<array or null>,"statement_order":<array or null>,"say_index":<0..2 or null>,"collect":"<feeling|body_location|intensity|null>","notes":""}>>
- The JSON must be valid. No extra lines, no code fences, no explanations after it.

WHEN STARTING TAPPING (point 0):
- Provide "setup_statements": exactly 3 statements that use the user's exact words (emotion + body location + problem).
- Provide "statement_order": an array of length 8 with values from {0,1,2} indicating which setup statement to say at each point. Randomize the order to cycle through all 3 statements.
- Set "say_index" for point 0 to the first element of "statement_order".
- Set "next_state": "tapping-point" and "tapping_point": 0

FOR SUBSEQUENT TAPPING POINTS (1..7):
- Omit "setup_statements" and "statement_order" (they're already stored).
- Set "say_index" to the corresponding index from the established "statement_order".
- Set "next_state": "tapping-point" and "tapping_point" to the current point number.

AFTER POINT 7:
- Set "next_state": "tapping-breathing", "tapping_point": null, "say_index": null

WHEN NOT TAPPING:
- "tapping_point": null, "say_index": null.
- Use "collect" to tell the UI what to gather next ("feeling" | "body_location" | "intensity" | null).

DIRECTIVE EXAMPLES:
Starting tapping (after intensity received):
<<DIRECTIVE {"next_state":"tapping-point","tapping_point":0,"setup_statements":["Even though I feel this anxiety in my chest because of work stress, I'd like to be at peace","I feel anxious in my chest, work stress is overwhelming, but I'd like to relax now","This anxiety in my chest, from work stress, but I want to let it go"],"statement_order":[0,1,2,0,1,2,1,0],"say_index":0,"collect":null,"notes":"starting first round"}>>

Mid-round (moving to point 3):
<<DIRECTIVE {"next_state":"tapping-point","tapping_point":3,"say_index":0,"collect":null,"notes":""}>>

After point 7 (move to breathing):
<<DIRECTIVE {"next_state":"tapping-breathing","tapping_point":null,"say_index":null,"collect":"intensity","notes":"completed round"}>>

Gathering feeling:
<<DIRECTIVE {"next_state":"gathering-location","tapping_point":null,"say_index":null,"collect":"body_location","notes":""}>>` },
      // Enhanced conversation history with more context
      ...conversationHistory.slice(-20).map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: sanitizedMessage }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    const aiResponse = data.choices[0].message.content;
    
    console.log('[eft-chat] Generated AI response (preview):', aiResponse.substring(0, 200));
    console.log('[eft-chat] Response length:', aiResponse.length);
    
    // 🚨 VALIDATION: Check if directive is present
    if (!aiResponse.includes('<<DIRECTIVE')) {
      console.error('⚠️⚠️⚠️ AI RESPONSE MISSING DIRECTIVE ⚠️⚠️⚠️');
      console.error('[eft-chat] Current state:', sanitizedChatState);
      console.error('[eft-chat] Current tapping point:', currentTappingPoint);
      console.error('[eft-chat] Full AI response:', aiResponse);
      console.error('[eft-chat] This will cause UI issues - fallback logic will be needed');
    } else {
      console.log('[eft-chat] ✅ Directive found in AI response');
      // Extract and log the directive for debugging
      const directiveMatch = aiResponse.match(/<<DIRECTIVE\s+(\{[\s\S]*?\})>>+/);
      if (directiveMatch) {
        console.log('[eft-chat] Directive JSON:', directiveMatch[1]);
        
        // Validate directive format
        try {
          const directiveObj = JSON.parse(directiveMatch[1]);
          console.log('[eft-chat] ✅ Directive is valid JSON');
          console.log('[eft-chat] next_state:', directiveObj.next_state);
          console.log('[eft-chat] collect:', directiveObj.collect);
          
          // Check for unnecessary null fields
          const nullFields = Object.keys(directiveObj).filter(k => directiveObj[k] === null);
          if (nullFields.length > 0) {
            console.warn('[eft-chat] ⚠️ Directive contains unnecessary null fields:', nullFields);
          }
        } catch (e) {
          console.error('[eft-chat] ❌ Directive JSON is malformed:', e);
        }
        
        // Check for common directive format mistakes
        if (aiResponse.includes('>>>')) {
          console.error('[eft-chat] ❌ CRITICAL: AI used three brackets >>> instead of two >>');
        }
        
        // Check for braces instead of brackets (most common mistake)
        const bracePattern = /<<DIRECTIVE\s+\{[^}]*\}\}(?!>)/;
        if (bracePattern.test(aiResponse)) {
          console.error('[eft-chat] ❌ CRITICAL: AI used closing braces }} instead of angle brackets >>');
          console.error('[eft-chat] This will cause parsing to fail!');
        }
      }
    }

    // Enhanced crisis detection with expanded keywords and phrases
    const crisisKeywords = [
      // Immediate danger keywords
      'suicide', 'kill myself', 'end it all', 'hurt myself', 'die', 'death', 'want to die',
      'self harm', 'cutting', 'overdose', 'jump off', 'hang myself', 'pills',
      
      // Severe emotional distress
      'better off dead', 'no point living', 'can\'t go on', 'no way out', 'give up',
      'hopeless', 'worthless', 'pointless', 'no hope', 'escape this pain',
      
      // Crisis phrases
      'want to hurt myself', 'thoughts of dying', 'end the pain', 'make it stop',
      'can\'t take it anymore', 'life isn\'t worth', 'world without me',
      'planning to hurt', 'thinking about suicide'
    ];
    
    const crisisPhrases = [
      'want to hurt myself',
      'thoughts of dying', 
      'end the pain',
      'make it stop',
      'can\'t take it anymore',
      'life isn\'t worth',
      'world without me',
      'planning to hurt',
      'thinking about suicide',
      'no point in living',
      'better off dead',
      'can\'t go on',
      'no way out'
    ];

    const messageText = sanitizedMessage.toLowerCase();
    
    // Check for individual keywords
    const containsCrisisKeyword = crisisKeywords.some(keyword => 
      messageText.includes(keyword.toLowerCase())
    );
    
    // Check for crisis phrases
    const containsCrisisPhrase = crisisPhrases.some(phrase => 
      messageText.includes(phrase.toLowerCase())
    );
    
    // Context-aware detection for concerning word combinations
    const concerningCombinations = [
      ['hurt', 'myself'],
      ['end', 'life'],
      ['kill', 'me'],
      ['want', 'die'],
      ['can\'t', 'anymore'],
      ['no', 'hope'],
      ['give', 'up'],
      ['escape', 'pain']
    ];
    
    const containsConcerningCombination = concerningCombinations.some(([word1, word2]) => 
      messageText.includes(word1) && messageText.includes(word2)
    );

    const crisisDetected = containsCrisisKeyword || containsCrisisPhrase || containsConcerningCombination;
    
    // Log crisis detection for monitoring (in production, use proper logging service)
    if (crisisDetected) {
      console.log('Crisis detected in message:', {
        clientId: clientId.substring(0, 8), // Partial ID for privacy
        timestamp: new Date().toISOString(),
        triggerType: containsCrisisKeyword ? 'keyword' : containsCrisisPhrase ? 'phrase' : 'combination',
        messageLength: sanitizedMessage.length
      });
    }

    // If crisis detected, modify AI response to be supportive and redirect to resources
    let finalResponse = aiResponse;
    if (crisisDetected) {
      finalResponse = `${sanitizedUserName || 'Friend'}, I can see you're going through a really difficult time right now. Your safety and wellbeing are the most important thing. I want to connect you with people who are specially trained to help in these situations. Please know that you're not alone, and there are people who care about you and want to help. Let me show you some immediate support resources.`;
    }

    return new Response(JSON.stringify({ 
      response: finalResponse,
      crisisDetected: crisisDetected 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in EFT chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I apologize, but I'm having trouble connecting right now. Please try again in a moment."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});