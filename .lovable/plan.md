

# Plan: Stagnation Redesign, Advice Overhaul, and Fatigue Check

## Summary

Three interconnected changes to the post-tapping decision logic:

1. **Change 1** — Redesign stagnation handling (3 rounds no reduction) with SUDS-dependent branches
2. **Change 2** — Decouple advice reflection tone from action recommendations
3. **Change 3** — Add a fatigue check every 6 consecutive rounds

---

## Change 1: SUDS-Dependent Stagnation Handling

**Current behavior:** After 3 rounds without reduction at SUDS 3-7, the system shows End Session button. For SUDS 8-10, after 3 `highSudsRounds`, it shows End + Contact Support.

**New behavior:**

### SUDS 3-7 + 3 rounds no reduction
Instead of showing an End button, **auto-transition to `conversation` state** with a specificity-focused prompt. The bot should ask targeted questions like "Can you tell me more specifically about this anxiety over your exams?" using the word "specifically" to help the user tune in.

**Files:** `useAIChat.ts` lines 1001-1025 — replace the current 3-strike logic for SUDS 3-7 with a re-entry to conversation state, similar to `handleTalkToTapaway` but with a specificity-focused message referencing the user's problem/feeling.

### SUDS 8-10 + 3 rounds no reduction (ZERO change)
Replace the current high-SUDS stagnation UI with a new 3-option card:

- **Option A: Continue Tapping** — switches to body-based tapping with "protective cognition" setup statements (e.g., "Even though this feels really intense, I'm safe right now."). If SUDS is STILL 8-10 after this body-based round, stop looping and offer: Quiet Integration, Contact Support, or End Session.
- **Option B: Quiet Integration** — enters the existing quiet integration phase with updated subtext ("You can pause and take slow breaths or look around your space").
- **Option C: End Session** — shows empathetic messaging ("You've done enough for this moment") and transitions to advice.

**Files:**
- `PostTappingChoice.tsx` — Redesign the `highSudsRounds >= 3` block to show the 3-option card with grounding advice text. Add a new prop/case for the "post-body-based" stagnation (SUDS still 8-10 after protective cognition round).
- `useAIChat.ts` — In `handlePostTappingIntensity` SUDS 8-10 block, track whether the user already did a "body-based" round via a new `bodyBasedRoundDone` flag in `SessionContext`. If `highSudsRounds >= 3` and `bodyBasedRoundDone` is true, show the final exit options (Quiet Integration / Contact Support / End).
- `useAIChat.ts` — In `startNewTappingRound`, when `bodyBasedRoundDone` is being set, use protective cognition statements instead of generic tearless statements.
- `SessionContext` interface — add `bodyBasedRoundDone?: boolean`.
- `types.ts` `ChatSession` — add `bodyBasedRoundDone?: boolean`.
- `AIAnxietyBot.tsx` — wire the new handler for Option A (body-based continue) and update `PostTappingChoice` rendering to pass the new props.

### Body-based protective cognition statements
```text
Setup:
"Even though this feels really intense, I'm safe right now."
"Even though this is a lot, I don't have to deal with it all at once."
"Even though my body is holding so much, I choose to stay present."

Reminders (body-focused):
"This intensity in my body..."
"I notice where I feel it..."
"I'm safe in this moment..."
"Letting my body soften..."
(8 phrases for 8 tapping points)
```

---

## Change 2: Advice State — Decouple Tone from Recommendations

**Current behavior:** Both reflection tone AND action bullets are driven by improvement percentage. The prompt mentions the percentage in the output.

**New behavior:**
- **Reflection tone** = driven by improvement percentage (unchanged logic, but do NOT mention the percentage number in text)
- **Action recommendations** = driven by final SUDS:
  - SUDS ≤ 3: Positive reinforcement, optional reframing, gentle close
  - SUDS 4-6: Suggest rest and integration, encourage returning later
  - SUDS ≥ 7: Grounding, breathing, contacting a trusted person, helpline links (988, 741741)

**Files:**
- `supabase/functions/eft-chat/index.ts` lines 1098-1180 — Rewrite the advice prompt to:
  - Remove `Improvement: ${improvementPct}%` from the session summary shown to the AI
  - Add instruction: "Do NOT mention any percentage in your response"
  - Keep the SPECIAL CONTEXT blocks for reflection tone (excellent/good/some progress)
  - Add a NEW section for action recommendations based on `finalIntensity` ranges
- `AdviceDisplay.tsx` `generateLocalAdvice` — Apply the same decoupling: keep improvement percentage for paragraph tone selection, but switch bullet generation to be SUDS-based. Remove percentage mentions from paragraph text. Add crisis resources for SUDS ≥ 7.

---

## Change 3: Fatigue Check Every 6 Consecutive Rounds

**New behavior:** After each tapping round, before proceeding to setup, check if `loopRounds >= 6`. If so, show a 3-option prompt:
1. Continue tapping → reset `loopRounds` to 0, proceed normally
2. Pause → reset `loopRounds` to 0, go to Quiet Integration
3. End session → reset `loopRounds` to 0, go to Advice

**Caveat:** If Change 1 stagnation logic triggers at the same round, Change 1 overrides the fatigue check (but `loopRounds` still resets).

**Files:**
- `SessionContext` interface — add `loopRounds?: number`.
- `types.ts` `ChatSession` — add `loopRounds?: number`.
- `useAIChat.ts` `handlePostTappingIntensity` — increment `loopRounds` each round. Before running the existing SUDS-based decision tree, check `loopRounds >= 6`. If Change 1 stagnation also triggers, skip the fatigue check (Change 1 takes priority). Otherwise, emit a `fatigue-check` system message.
- `useAIChat.ts` — reset `loopRounds` to 0 when any fatigue/stagnation option is chosen (continue, pause, end, or any Change 1 branch).
- `PostTappingChoice.tsx` or new component `FatigueCheck.tsx` — render the 3-option fatigue card.
- `AIAnxietyBot.tsx` — handle the `fatigue-check` system message type, wire the 3 buttons.

---

## Technical Details

### New `SessionContext` fields
```typescript
bodyBasedRoundDone?: boolean;  // Tracks if protective cognition round was done
loopRounds?: number;           // Consecutive rounds without pause (resets at 6)
```

### Decision priority at post-tapping
```text
1. SUDS === 0 → auto-complete (unchanged)
2. SUDS 8-10 → Change 1 high-SUDS stagnation logic (overrides fatigue)
3. SUDS 3-7 + 3 rounds no reduction → Change 1 specificity re-entry (overrides fatigue)
4. loopRounds >= 6 → Change 3 fatigue check
5. Normal flow (unchanged)
```

### Files modified
- `src/hooks/useAIChat.ts` — stagnation logic, fatigue counter, body-based round flag, protective cognition statements
- `src/components/anxiety-bot/PostTappingChoice.tsx` — redesign high-SUDS stagnation UI, add fatigue check UI
- `src/components/anxiety-bot/types.ts` — add new session fields
- `src/components/AIAnxietyBot.tsx` — wire new handlers
- `src/components/anxiety-bot/AdviceDisplay.tsx` — decouple tone from recommendations
- `supabase/functions/eft-chat/index.ts` — rewrite advice prompt

