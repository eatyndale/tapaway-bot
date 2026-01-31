

# HeyGen Streaming Avatar Integration with Toggle Control

## Overview

This plan integrates the HeyGen Streaming Avatar SDK across the Tapaway EFT tapping experience with a user-controlled toggle to switch between avatar mode (photorealistic speaking avatar) and text-only mode (current behavior) at any time.

---

## Prerequisites (Before Development Begins)

### API Credentials Required

| Item | Source | Setup Method |
|------|--------|--------------|
| HeyGen API Key | [HeyGen Dashboard](https://app.heygen.com/settings?nav=API) | Add as Supabase secret: `HEYGEN_API_KEY` |
| Avatar ID | [HeyGen Avatar Library](https://app.heygen.com/avatars) | Hardcode in edge function or make configurable |

The `HEYGEN_API_KEY` must be added to the Supabase project secrets before the integration will function.

---

## Architecture Diagram

```text
                    +--------------------------------+
                    |        Supabase Edge           |
                    |   heygen-session/index.ts      |
                    |   - Create session tokens      |
                    |   - Close sessions             |
                    |   Uses: HEYGEN_API_KEY         |
                    +---------------+----------------+
                                    |
                                    | Session Token + WebRTC URL
                                    v
+------------------------------------------------------------------+
|                          AvatarContext                           |
|   Manages: connection state, speech queue, user preference       |
|   Persists: avatarEnabled to localStorage                        |
+-------------------+---------------------------+------------------+
                    |                           |
        +-----------v-----------+   +-----------v-----------+
        |   useHeyGenAvatar     |   |    StreamingAvatar    |
        |   Hook                |   |    Component          |
        |   - WebRTC via SDK    |   |   - Video display     |
        |   - speak() queue     |   |   - Status indicators |
        |   - reconnection      |   |   - Mute control      |
        +-----------+-----------+   +-----------+-----------+
                    |                           |
                    +-------------+-------------+
                                  |
                                  v
    +----------------------------------------------------------+
    |                     AIAnxietyBot.tsx                      |
    |  Layout: Avatar OFF = full-width | Avatar ON = split     |
    +----------------------------------------------------------+
    |                           |                              |
    v                           v                              v
ChatInterface            SetupPhase.tsx              TappingGuide.tsx
(speaks bot msgs)        (speaks statements)         (speaks reminders)
```

---

## Implementation Phases

### Phase 1: Edge Function and Secrets

**New File: `supabase/functions/heygen-session/index.ts`**

Creates and manages HeyGen streaming sessions securely. The edge function acts as a token broker - the frontend never sees the API key.

**Endpoints:**
- `POST { action: "create" }` - Returns `{ sessionId, accessToken, url }` for WebRTC connection
- `POST { action: "close", sessionId }` - Cleans up session to stop billing

**Config Update: `supabase/config.toml`**
```toml
[functions.heygen-session]
verify_jwt = false
```

---

### Phase 2: React Infrastructure

**New Dependencies:**
```json
{
  "@heygen/streaming-avatar": "^2.0.0",
  "livekit-client": "^2.0.0"
}
```

**New File: `src/contexts/AvatarContext.tsx`**

Provides global avatar state to all components:

```typescript
interface AvatarContextValue {
  // User preference (persisted to localStorage)
  avatarEnabled: boolean;
  setAvatarEnabled: (enabled: boolean) => void;
  
  // Connection state
  status: 'idle' | 'connecting' | 'connected' | 'error';
  isSpeaking: boolean;
  error: Error | null;
  
  // Methods
  speak: (text: string) => Promise<void>;
  interrupt: () => void;
  
  // Video element ref for WebRTC stream
  videoRef: React.RefObject<HTMLVideoElement>;
}
```

Auto-behavior:
- Connects when `avatarEnabled` becomes `true`
- Disconnects when `avatarEnabled` becomes `false`
- Saves preference to `localStorage` key: `tapaway-avatar-enabled`

**New File: `src/hooks/useHeyGenAvatar.ts`**

Manages the HeyGen SDK lifecycle:
- Initialize `StreamingAvatar` from `@heygen/streaming-avatar`
- Manage WebRTC connection via LiveKit
- Speech queue for sequential `speak()` calls
- Retry logic on connection drop
- Cleanup on unmount or toggle-off

**New File: `src/components/anxiety-bot/StreamingAvatar.tsx`**

Visual component for avatar display:

```typescript
interface StreamingAvatarProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}
```

Features:
- Video element bound to WebRTC stream
- Loading skeleton during connection
- Pulsing border when speaking
- Error state with retry button
- Mute/unmute toggle

**New File: `src/components/anxiety-bot/AvatarToggle.tsx`**

Toggle switch for the header:
- Uses existing `Switch` UI component
- Shows connection status dot (green/yellow/red)
- Tooltip explaining the feature
- Disabled during connection transitions

---

### Phase 3: Main Layout Integration

**Modified File: `src/components/AIAnxietyBot.tsx`**

Changes:
1. Wrap component tree with `AvatarProvider`
2. Add responsive layout logic:
   - **Avatar OFF**: Current full-width chat (no changes)
   - **Avatar ON**: Split layout with avatar panel on right
3. Connect bot message flow to `speak()` via context

Layout when avatar enabled:
```text
+-------------------+------------+
|                   |            |
|    Chat Area      |  Avatar    |
|    (messages)     |  Panel     |
|                   |            |
+-------------------+------------+
|      Input Area / Controls     |
+--------------------------------+
```

**Modified File: `src/components/anxiety-bot/ChatHeader.tsx`**

Add `AvatarToggle` component next to "New Session" button:

```text
[Sparkles] AI Anxiety Support     [🎭 Avatar: ON] [New Session]
           Minimal • Score: 5/27
```

---

### Phase 4: Chat Message Speech Integration

**Modified File: `src/hooks/useAIChat.ts`**

Add callback for avatar speech:
- New prop: `onBotMessage?: (text: string) => void`
- Clean message text before speaking (strip markdown, emojis)
- Trigger callback when bot message is added

The `AIAnxietyBot` component will pass a callback that calls `speak()` from context.

---

### Phase 5: Setup Phase Integration

**Modified File: `src/components/anxiety-bot/SetupPhase.tsx`**

Conditional behavior based on `avatarEnabled` from context:

| Avatar Mode | Behavior |
|-------------|----------|
| **OFF** | Current behavior: static GIF + text + timer |
| **ON** | Avatar speaks statement, smaller karate chop reference image, auto-advance on speech end |

When avatar ON:
- Avatar speaks each of the 3 setup statements
- Karate chop GIF shown as small reference (not full-screen)
- Timer waits for speech OR user skip
- Text always visible as subtitles

---

### Phase 6: Tapping Guide Integration

**Modified File: `src/components/anxiety-bot/TappingGuide.tsx`**

Conditional layout based on `avatarEnabled`:

| Avatar Mode | Layout |
|-------------|--------|
| **OFF** | Current: full-size tapping point GIF + text |
| **ON** | Split: Avatar panel (speaking) + tapping GIF side-by-side |

When avatar ON:
```text
+-------------------+-------------------+
|   Avatar Panel    |   Tapping GIF     |
|   (speaking the   |   (eyebrow,       |
|   reminder phrase)|   collarbone...)  |
+-------------------+-------------------+
|        "This anxiety in my chest..."  |
+---------------------------------------+
```

- Avatar speaks the reminder phrase for current point
- Coordinate: point advances when BOTH speech ends AND minimum time (10s) elapsed
- Text subtitle always visible

---

### Phase 7: Other Components

**Modified File: `src/components/anxiety-bot/AdviceDisplay.tsx`**
- Avatar speaks personalized advice when enabled
- Text remains visible for reading

**Modified File: `src/components/anxiety-bot/QuestionnaireView.tsx`**
- Optional: Avatar reads questions aloud
- Speaks encouragement between questions

**Modified File: `src/components/anxiety-bot/SessionComplete.tsx`**
- Avatar speaks completion message

---

## Speech Queue System

To prevent overlapping speech and ensure smooth delivery:

```text
+------------------------------------------+
|           Speech Queue Manager           |
|                                          |
|  1. Bot message arrives → add to queue   |
|  2. If not speaking → dequeue and speak  |
|  3. On speech end → dequeue next         |
|  4. User interrupts → clear queue        |
|  5. Avatar disabled → skip all speech    |
+------------------------------------------+
```

The queue lives in `useHeyGenAvatar` hook and is exposed through context.

---

## Toggle Behavior Matrix

| Scenario | Behavior |
|----------|----------|
| First visit | Toggle OFF by default (cost optimization) |
| Turn ON | Show "Connecting...", establish WebRTC, start speaking |
| Turn OFF | Gracefully disconnect, continue text-only |
| Toggle during speech | Interrupt immediately, disconnect |
| Toggle during tapping | Next phrase uses new mode |
| Page reload with ON | Restore preference, auto-connect |
| Connection fails | Error toast, offer retry, auto-fallback to text |
| Idle 2+ minutes | Auto-disconnect to save costs |

---

## Fallback Behavior

If HeyGen connection fails or is unavailable:
1. Log error to console
2. Show toast: "Voice unavailable - continuing with text"
3. Set `avatarEnabled = false`
4. Continue with text-only mode (no blocking)

---

## New Files Summary

| File | Purpose |
|------|---------|
| `supabase/functions/heygen-session/index.ts` | Token broker for HeyGen API |
| `src/contexts/AvatarContext.tsx` | Global avatar state provider |
| `src/hooks/useHeyGenAvatar.ts` | HeyGen SDK lifecycle management |
| `src/components/anxiety-bot/StreamingAvatar.tsx` | Avatar video display component |
| `src/components/anxiety-bot/AvatarToggle.tsx` | Toggle switch for header |

## Modified Files Summary

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add heygen-session function config |
| `src/components/AIAnxietyBot.tsx` | Wrap with AvatarProvider, add split layout, connect speech |
| `src/components/anxiety-bot/ChatHeader.tsx` | Add AvatarToggle component |
| `src/hooks/useAIChat.ts` | Add onBotMessage callback |
| `src/components/anxiety-bot/SetupPhase.tsx` | Conditional avatar speech + layout |
| `src/components/anxiety-bot/TappingGuide.tsx` | Conditional avatar speech + split layout |
| `src/components/anxiety-bot/AdviceDisplay.tsx` | Optional avatar speech |
| `src/components/anxiety-bot/SessionComplete.tsx` | Optional avatar speech |

---

## Cost Optimization Strategies

| Strategy | Estimated Savings |
|----------|-------------------|
| Toggle OFF by default | 100% (user opt-in) |
| Auto-disconnect after 2min idle | ~20% |
| Shorter speech scripts | ~15% |
| Skip speech on fast navigation | ~10% |

**Estimated cost per session:**
- Avatar ON: $1.50 - $2.50 (10-15 minute session)
- Avatar OFF: $0.00

---

## Accessibility Considerations

| Feature | Implementation |
|---------|---------------|
| Text always visible | All spoken content shown as messages/subtitles |
| Avatar toggle | Clear on/off switch with label |
| Mute audio | Separate control for audio only |
| Connection status | Green/yellow/red indicator |
| Keyboard navigation | All controls accessible via Tab |
| Screen reader | ARIA labels on avatar container |
| Reduced motion | Respect `prefers-reduced-motion` for animations |

---

## Technical Notes

**Browser Requirements:**
- HTTPS required for WebRTC (Lovable provides this)
- Modern browser with WebRTC support

**Package Compatibility:**
- `@heygen/streaming-avatar` uses WebRTC via LiveKit
- Compatible with React 18 and Vite
- Works with existing Supabase edge function pattern

**Edge Function Security:**
- API key stored as Supabase secret (never exposed)
- Session tokens are short-lived (~30 min)
- No JWT verification needed (public endpoint for token generation)

---

## Testing Checklist

**Toggle and Connection:**
- Toggle shows OFF by default on first visit
- Turning ON triggers connection with loading state
- Connection status indicator updates correctly
- Turning OFF disconnects session
- Preference persists across page reloads
- Error state shows retry option

**Avatar ON Behavior:**
- Avatar speaks greeting message
- Avatar speaks each bot response
- Speech does not overlap
- Mute toggle works
- Setup statements spoken correctly
- Tapping phrases spoken with GIF visible
- Advice content spoken
- Session complete message spoken

**Avatar OFF Behavior (no regression):**
- Chat works normally without avatar
- Full-width layout displays
- Setup phase shows full GIF
- Tapping guide shows full GIF
- All existing functionality unchanged

**Mobile:**
- Toggle accessible on mobile
- Layout adapts appropriately
- Avatar panel does not overflow

