

## Bugs Found in the Transcript

### Bug 1: AI re-asked for intensity during `conversation` state
**What happened:** After the user said "because i have not had anything to eat", the AI responded with "How intense does that feel for you right now?" — but this is the `conversation` state, not `gathering-intensity`.

**Root cause:** The conversation prompt (edge function line ~896-903) explicitly instructs the AI to ask "How intense is that right now on a 0-10?" as a natural transition line once all three data points are gathered. This is by design — it's the AI's conversational way to transition to `gathering-intensity`. However, the **auto-advance** code (line 615) should have intercepted this call entirely when all three fields were present, skipping the conversation prompt and generating setup statements directly.

The likely failure: on the call where the user said "because i have not had anything to eat", the extraction picked up `problem` but maybe `bodyLocation` wasn't yet in `sessionContext` from a prior extraction. The user said "sad in my stomach" in message 3, but by message 5 the extraction may have overwritten or missed `bodyLocation`. So auto-advance didn't trigger, the conversation prompt ran, and the AI asked for intensity.

### Bug 2: User typing "0/10" during conversation was treated as a SUDS rating
**What happened:** The user typed "0/10" as a conversational answer to "How intense does that feel?". The classification (line 293-329) extracted `intensity: 0` from "0/10" even though the state was `conversation`. Then line 603-604 set `sessionContext.currentIntensity = 0`. Now auto-advance triggered (line 615 — all data present), generated setup statements, and returned `next_state: 'setup'`.

But the frontend then received `extractedContext.currentIntensity = 0` (line 717), and when setup/tapping completed (or was skipped), the system saw SUDS=0 and auto-completed to advice.

**Root cause:** The classification prompt extracts intensity from ANY state, including `conversation`. Line 603-604 applies it unconditionally. During `conversation`, numeric inputs should not update `currentIntensity` — that's reserved for `gathering-intensity` and `post-tapping`.

### Bug 3: `initialIntensity` corrupted from 6 to 10
**What happened:** The advice message says "Initial was 10/10" but the user clearly said 6/10. 

**Root cause:** The auto-advance code on line 622 uses `sessionContext.currentIntensity || sessionContext.initialIntensity || 5` for the `intensity` variable passed to `extractedContext`. Since `currentIntensity` was set to 0 by the classification (Bug 2), and 0 is falsy in JS, it falls through to `sessionContext.initialIntensity || 5`. But `initialIntensity` is 6, so it should have returned 6. The "10" likely came from the auto-advance's `visible_response` or from the AI generating the advice text — the AI hallucinated "10" because it saw the setup was triggered immediately and assumed high intensity. The advice prompt received `initialIntensity` from the frontend's `sessionContext`, which may have been overwritten somewhere in the flow.

Actually — looking at `handleEndSession` in AIAnxietyBot.tsx line 147: it sends `sessionContext.initialIntensity` which reads from React state. If `sessionContext` was corrupted by a stale closure or race condition between the auto-advance response processing and the advice call, it could have picked up a wrong value. The "10/10" is likely the AI hallucinating in the advice response since the actual `initialIntensity` passed may have been undefined (falsy 0 chain).

---

## Fix Plan

### 1. Prevent intensity extraction during `conversation` state
**File:** `supabase/functions/eft-chat/index.ts` (lines 593-606)

After classification extraction is applied, add a guard: if `chatState === 'conversation'` or `chatState === 'conversation-deepening'`, do NOT apply `classification.extracted.intensity` to `sessionContext.currentIntensity`. Intensity should only be applied in `gathering-intensity`, `post-tapping`, and `tapping-breathing` states.

### 2. Prevent auto-advance from using extracted intensity as currentIntensity
**File:** `supabase/functions/eft-chat/index.ts` (line 622)

Change the intensity variable in auto-advance to use only `sessionContext.initialIntensity` (which was set during the greeting phase), not `sessionContext.currentIntensity`. During auto-advance from conversation, the user hasn't given a formal SUDS rating yet — so `currentIntensity` should remain equal to `initialIntensity`.

### 3. Guard the conversation prompt against asking for intensity
**File:** `supabase/functions/eft-chat/index.ts` (lines 900-910)

The conversation prompt transition text says "How intense is that right now on a 0-10?" — this is fine as a transition cue, BUT add a stricter instruction: "Do NOT ask for intensity if you do not yet have all three pieces (problem, emotion, body location). If you have all three, the system will handle the transition automatically — your response should simply acknowledge and reflect."

This prevents the AI from asking for intensity when auto-advance should be handling the transition.

### 4. Ensure `initialIntensity` is never overwritten after greeting
**File:** `src/hooks/useAIChat.ts`

Add a guard in `sendMessage` where `extractedContext` is applied (lines 586-598): never overwrite `initialIntensity` from edge function responses. `initialIntensity` is set once in `handleGreetingIntensity` and should be immutable for the rest of the session.

### Files to update
- `supabase/functions/eft-chat/index.ts` — fixes 1, 2, 3
- `src/hooks/useAIChat.ts` — fix 4

### No database changes required.

