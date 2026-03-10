

## Implementation Plan: Skip Duplicate Intensity + Mobile Responsiveness

### Part 1: Remove Duplicate Intensity Collection (Path A, SUDS 1-7)

**Current flow:** Greeting → GreetingIntensity (SUDS) → Conversation → `gathering-intensity` (SUDS again) → Setup → Tapping

**New flow:** Greeting → GreetingIntensity (SUDS) → Conversation → Setup → Tapping (uses initial intensity)

#### 1.1 Edge Function: Auto-advance to `setup` instead of `gathering-intensity`

**File:** `supabase/functions/eft-chat/index.ts` (lines 615-710)

When all conversation data is collected (problem + feeling + body location), instead of emitting `next_state: "gathering-intensity"`, generate setup statements inline using tool calling and emit `next_state: "setup"`.

- Replace the auto-advance block: instead of generating an intensity-asking message and `<<DIRECTIVE {"next_state":"gathering-intensity"}>>`...
- Call the same `generate_tapping_directive` tool (already defined at line 1139) to generate setup statements
- Return a warm acknowledgment + `<<DIRECTIVE {"next_state":"setup", "setup_statements": [...], "reminder_phrases": [...], ...}>>`

Also update the conversation system prompt (line 864, 878-881): change the directive hint from `gathering-intensity` to `setup` when all data is gathered. The AI prompt currently tells the model to emit `gathering-intensity` — this needs to say `setup` instead.

Update CORS headers (line 9) to include required Supabase client headers.

#### 1.2 Frontend: Create tapping session on `setup` transition for Path A

**File:** `src/hooks/useAIChat.ts` (lines 456-477, 548-574)

- The existing tapping session creation at lines 456-477 runs when `chatState === 'gathering-intensity'`. Add an equivalent block that also triggers when `chatState === 'conversation'` and the directive transitions to `setup` — create the tapping session using `sessionContext.initialIntensity` (already stored from greeting).
- Move this into the directive handling block (around line 551-566) so when `next_state === 'setup'` and we have all the data, create the tapping session if one doesn't exist yet, set `round: 1`.

#### 1.3 Edge function conversation prompt update

**File:** `supabase/functions/eft-chat/index.ts` (lines 855-882)

- Change the "TRANSITION TO INTENSITY" instructions to say "Let's begin tapping" instead of asking for intensity
- Change the directive from `gathering-intensity` to `setup`
- The tool call block at line 1174 (`if sanitizedChatState === 'gathering-intensity'`) remains for subsequent rounds that still use `gathering-intensity`

---

### Part 2: Mobile Responsiveness

#### 2.1 Fix `App.css` root constraints

**File:** `src/App.css` (line 1-6)

```css
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1rem;
  text-align: center;
}

@media (min-width: 768px) {
  #root { padding: 2rem; }
}
```

#### 2.2 Main layout (`AIAnxietyBot.tsx`)

**File:** `src/components/AIAnxietyBot.tsx` (lines 332-482)

- `max-w-4xl` → `w-full max-w-4xl px-2 sm:px-0`
- `grid lg:grid-cols-4` → hide sidebar on mobile: `grid lg:grid-cols-4`; sidebar div gets `hidden lg:block`
- `h-[500px]` → `h-[calc(100dvh-280px)] sm:h-[500px]` for dynamic mobile height
- Chat card padding adjustments for mobile

#### 2.3 Dashboard mobile spacing

**File:** `src/components/Dashboard.tsx` (lines 190-215)

- Header: `px-4` → `px-3 sm:px-4`, text sizing adjustments
- Main: `px-4 py-8` → `px-3 py-4 sm:px-4 sm:py-8`

#### 2.4 Sub-component mobile fixes

- **SetupPhase.tsx**: Image `w-48 h-48` → `w-32 h-32 sm:w-48 sm:h-48`, smaller text on mobile
- **TappingGuide.tsx**: GIF images responsive sizing, button layout `flex-wrap` on mobile
- **CrisisSupport.tsx**: Already has `p-4` wrapper and `max-w-2xl` — looks fine
- **ChatHeader.tsx**: Already responsive with `sm:flex-row` — fine
- **PostTappingChoice.tsx**: Already uses flex-wrap — fine
- **ChatInput.tsx**: Textarea min-height adjustment for mobile

### Implementation Order

1. Fix `App.css` root padding
2. Update `AIAnxietyBot.tsx` layout for mobile
3. Update `Dashboard.tsx` mobile spacing
4. Update edge function auto-advance to skip `gathering-intensity`
5. Update edge function conversation prompt directive
6. Update `useAIChat.ts` tapping session creation for `setup` transition
7. Fix sub-component mobile sizing (SetupPhase, TappingGuide)

