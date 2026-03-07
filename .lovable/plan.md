

## Rework System Logic: Revised Therapeutic Protocol

### Summary of Changes

The PDF introduces three major new concepts that don't exist in the current system:

1. **SUDS-First Greeting** -- The system asks for intensity rating IMMEDIATELY after greeting, BEFORE any conversation. Currently, the system has a conversation first, then gathers intensity.

2. **Three Pathways Based on Initial SUDS** -- Currently there's one linear path. The new logic branches:
   - **SUDS 0**: Quiet Integration (45-second calming pause)
   - **SUDS 1-7**: Traditional EFT (current conversational flow)
   - **SUDS 8-10**: Tearless Trauma Therapy (NO probing, generic statements, safety-first)

3. **Quiet Integration State** -- A new 45-second guided pause with calming animation and music. Triggered when SUDS drops to 0-2, after 3 rounds without reduction, after 3 rounds still at 8-10, or when initial SUDS is 0.

4. **Tearless Trauma Therapy (TTT)** -- For high-distress users (8-10). Skips ALL conversation, uses generic/vague setup statements, never asks what happened.

5. **Revised Post-Tapping Decision Tree** -- Different from current logic:
   - SUDS 0: Auto-complete, move to advice
   - SUDS 1-2: Offer Continue, Chat, Quiet Integration, or End Session
   - SUDS 3-7: Offer Continue or Chat. "End Session" only after 3 rounds without reduction
   - SUDS 8-10: Grounding → repeat tapping. After 3 rounds at 8-10, offer End + Contact Support

6. **Contact Support Modal** -- Enhanced crisis support with database tracking of `supportContacted`.

7. **Session Type Tracking** -- Database must track: session type (Tearless/Traditional/Mixed), peak SUDS, whether support was contacted, whether Quiet Integration was used.

---

### Architecture: New State Machine (12 States)

```text
questionnaire → greeting-intensity → [PATH BRANCH]
                                      │
                    ┌─────────────────┼──────────────────┐
                    ▼                 ▼                  ▼
              Path A (1-7)     Path B (8-10)      Path C (0)
              conversation     tearless-setup      quiet-integration
                    │                │                   │
                    ▼                ▼                   ▼
           gathering-intensity   setup              post-integration
                    │                │              (check-in)
                    ▼                ▼
                 setup          tapping-point
                    │                │
                    ▼                ▼
             tapping-point     tapping-breathing
                    │                │
                    ▼                ▼
           tapping-breathing   post-tapping-ttt
                    │           (branch by SUDS)
                    ▼
              post-tapping
           (branch by SUDS)
                    │
                    ▼
               advice → complete
```

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/anxiety-bot/QuietIntegration.tsx` | 45-second calming pause component with timer, animation, music |
| `src/components/anxiety-bot/GreetingIntensity.tsx` | Initial SUDS rating screen shown right after greeting |

### Files to Modify (Major)

| File | Changes |
|------|---------|
| `src/components/anxiety-bot/types.ts` | Add new states: `greeting-intensity`, `quiet-integration`, `tearless-setup`. Add `isTearlessTrauma`, `peakSuds`, `supportContacted`, `quietIntegrationUsed`, `sessionType` to ChatSession |
| `src/hooks/useAIChat.ts` | Rewrite greeting flow (ask SUDS first), add 3-path branching, add TTT logic (generic statements, no probing), rewrite `handlePostTappingIntensity` with new decision tree, add Quiet Integration triggers, track peak SUDS and session type |
| `src/components/AIAnxietyBot.tsx` | Add rendering for new states (`greeting-intensity`, `quiet-integration`, `tearless-setup`), update `renderInput()` for new states, wire up Quiet Integration triggers, update post-tapping choice buttons (4 options for SUDS 1-2) |
| `supabase/functions/eft-chat/index.ts` | Add TTT system prompt (generic statements, no probing), add `greeting-intensity` state handling, update `conversation-deepening` to respect TTT flag, add grounding responses for SUDS 8-10, update advice generation to reference session type |
| `src/components/anxiety-bot/PostTappingChoice.tsx` | Rewrite to show different button sets: 4 options for SUDS 0-2 (Continue, Chat, Quiet Integration, End), 2-3 options for SUDS 3-7, grounding + repeat for SUDS 8-10, Contact Support after 3 rounds at 8-10 |
| `src/components/anxiety-bot/CrisisSupport.tsx` | Add `supportContacted` callback to track in database |
| `src/services/supabaseService.ts` | Update `createTappingSession` and `updateTappingSession` to handle new fields |

### Database Migration

Add new columns to `tapping_sessions`:
```sql
ALTER TABLE tapping_sessions
  ADD COLUMN session_type text DEFAULT 'traditional',
  ADD COLUMN peak_suds integer,
  ADD COLUMN support_contacted boolean DEFAULT false,
  ADD COLUMN quiet_integration_used boolean DEFAULT false,
  ADD COLUMN is_tearless_trauma boolean DEFAULT false;
```

---

### Key Logic Changes in Detail

#### 1. Greeting Flow (useAIChat.ts)
- `createInitialGreeting()` changes: greeting now includes "How are you feeling right now on a scale of 0-10?"
- Initial state becomes `greeting-intensity` instead of `conversation`
- On receiving the initial SUDS, branch to Path A/B/C

#### 2. Tearless Trauma Therapy Path (SUDS 8-10)
- Skip conversation entirely
- Generate generic setup statements locally (no AI needed):
  - "Even though I have this intensity in my system, I'm open to calming now."
  - "This wave of feeling, I'm allowing myself to settle."
  - "This activation in my body, I choose to be present."
- Go directly to setup → tapping → breathing → post-tapping
- Post-tapping TTT logic:
  - 0-2: Offer choices (Continue, Chat, Quiet Integration, End)
  - 3-7: Ask "Are you comfortable talking about what's going on?" → If yes, transition to Traditional EFT; if no, offer gentle TTT round or end
  - 8-10: Grounding response, repeat TTT. After 3 rounds still 8-10, offer End + Contact Support

#### 3. Quiet Integration Component
- 45-second countdown timer
- Calming animation (reuse existing setup-meditation.gif or ambient)
- Soft background music (reuse ambient-tapping.mp3)
- Minimal bot message: "For the next moment, there's nothing you need to do. Just sit and allow things to settle."
- After 45s, check-in: "Do you feel settled?"
- Three responses: "Yes, still settled" → offer another or end; "A little has come back" → return to tapping flow; "I'm not sure" → another Quiet Integration round

#### 4. Post-Tapping Decision Rewrite
Current logic is intensity-based with auto-deepening. New logic:
- SUDS 0: Auto-complete → advice
- SUDS 1-2: 4 buttons (Continue Tapping, Chat with Tapaway, Quiet Integration, End Session)
- SUDS 3-7: 2 buttons (Continue Tapping, Chat with Tapaway). Add "End Session" only after 3 rounds without reduction
- SUDS 8-10: Grounding message → auto-repeat tapping. After 3 rounds at 8-10, show End Session + Contact Support

#### 5. General Rules (Edge Function)
- Positive affirmations when SUDS ≤ 3 ("I'm letting this go" instead of "I accept this anxiety")
- Always vary self-acceptance phrases
- Always instruct deep breath after each round
- Grounding when intensity ≥ 8
- Never explore trauma details
- Never assume why someone feels something

#### 6. Session End (Advice)
- Generate 4-6 personalized tips based on SUDS drop
- Show progress summary
- Save session type, peak SUDS, support contacted, Quiet Integration used

---

### Implementation Order

1. Database migration (add new columns)
2. Update `types.ts` with new states and session fields
3. Create `QuietIntegration.tsx` component
4. Create `GreetingIntensity.tsx` component
5. Rewrite `useAIChat.ts` (greeting flow, 3-path branching, TTT logic, new post-tapping decision tree, Quiet Integration triggers)
6. Rewrite `PostTappingChoice.tsx` (new button layouts per SUDS range)
7. Update `AIAnxietyBot.tsx` (render new states, wire new components)
8. Update `supabase/functions/eft-chat/index.ts` (TTT prompts, greeting-intensity state, grounding responses, positive affirmations for low SUDS)
9. Update `supabaseService.ts` (new fields)
10. Update `CrisisSupport.tsx` (track supportContacted)

