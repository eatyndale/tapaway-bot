
Goal: fix three related problems in the EFT chat flow without changing the database schema:
1) transcripts not reliably saving,
2) TTT/traditional round counts being inconsistent,
3) sessions that escalate into high distress not switching back to vague tearless language.

What I found

1. Where transcripts are saved now
- Chat transcripts are stored in `public.chat_sessions.messages` as JSON.
- The main persistence happens in `src/hooks/useAIChat.ts` inside `sendMessage()` via `supabaseService.updateChatSession(...)`.
- But many messages never go through `sendMessage()`. They are appended only to React state in:
  - `createInitialGreeting`
  - `handleGreetingIntensity`
  - `handleQuietIntegrationComplete`
  - `startNewTappingRound`
  - `handlePostTappingIntensity`
  - `handleTalkToTapaway`
- That is why many session rows end up with `messages = []` or only partial transcripts.
- I also confirmed in Supabase that most recent `chat_sessions` rows have `message_count = 0`, so this is not just theoretical.

2. Why round counts are wrong
- Round state is inconsistent today:
  - TTT path sets `round: 1` immediately in `handleGreetingIntensity`
  - Traditional path starts at `round: 0`
  - `startNewTappingRound()` increments with `(sessionContext.round || 1) + 1`, which is fragile
- The app currently treats “starting another round” and “finishing a round” differently, so TTT and traditional can drift.
- Since you want the count based on setup statement generation, the clean source of truth should be:
  - every time a fresh setup statement set is created for a new tapping round, increment/persist the round count.

3. Why vague phrasing does not reliably return
- `startNewTappingRound()` currently decides between specific vs vague language mostly from `sessionContext.isTearlessTrauma`.
- If someone started in the safe zone and later rises into high distress, they can still get specific statements/reminders unless the session originally started as TTT.
- That is the core safety gap.

Implementation plan

1. Centralize transcript persistence in `src/hooks/useAIChat.ts`
- Add a small helper that persists the full message array to `chat_sessions.messages`.
- Use that helper every time the hook appends or replaces messages, not just in `sendMessage()`.
- Apply it to all non-`sendMessage` branches:
  - initial greeting
  - greeting intensity branch messages
  - quiet integration responses
  - post-tapping choice system messages
  - “another round” prompts
  - TTT-to-conversation transition
  - error fallback message
- Keep `sendMessage()` using the same helper so persistence logic lives in one place.

Expected result:
- every visible chat/system message shown in the session is saved,
- history sidebar reflects the real transcript,
- new sessions no longer remain empty just because the user stayed in guided tapping flows.

2. Make “setup statements generated” the round-count rule
- Create one helper inside `useAIChat` for “begin new tapping round”.
- That helper should:
  - accept the new setup statements/reminder phrases,
  - compute the next round number,
  - update `sessionContext.round`,
  - persist `rounds_completed` in `tapping_sessions` using that same number.
- Use this helper in all round-start entry points:
  - TTT first round in `handleGreetingIntensity`
  - traditional first round when AI returns setup statements in `sendMessage`
  - fallback setup extraction path in `sendMessage`
  - every subsequent round in `startNewTappingRound`
- Remove the current split logic where some paths set round locally and others persist later.

Important tradeoff
- This will make `rounds_completed` effectively mean “rounds started / setup sets generated,” because that is the rule you requested.
- That is acceptable if your product definition is “count rounds by generated setup cycles.”
- If you later want analytics for both attempted and completed rounds, that would be a separate enhancement.

3. Add high-SUDS safety fallback for phrase generation
- Introduce one derived rule:
  - use vague tearless setup/reminder language whenever `currentIntensity >= 8`
  - or the session is already in tearless mode.
- Apply that rule in `startNewTappingRound()` so a traditional session that escalates to 8+ automatically switches to vague language.
- Also update session context when this happens so the flow is internally consistent:
  - mark `sessionType` as `mixed` if the session began traditional,
  - preserve `peakSuds`,
  - keep the session in a high-distress-safe mode until intensity drops again.
- Ensure both setup statements and reminder phrases switch together.

4. Keep the transition back down sensible
- If intensity later drops below 8, the system can return to specific language only when enough problem/feeling/body-location context still exists.
- If that context was intentionally cleared during a high-distress transition, continue with vague phrases until specific context is safely re-established.
- This avoids abrupt switching back into overly specific content.

Files to update
- `src/hooks/useAIChat.ts` — primary fix for all 3 issues
- `src/services/supabaseService.ts` — likely small cleanup only if needed for persistence typing; no schema change required

Technical notes
- No database migration is required for this fix.
- `chat_sessions.messages` already supports the needed JSON transcript storage.
- `tapping_sessions.rounds_completed` can be reused for your requested counting rule.
- There is a separate bug worth cleaning up while implementing this: `updateChatSession()` accepts `session_name`, but `chat_sessions` does not have that column in the actual schema. That update payload should be aligned with the real table to avoid silent update failures or partial persistence issues.

Validation checklist after implementation
1. Start a new session and stop after the greeting-intensity step: transcript should still be saved.
2. Run a TTT session: first setup generation should count as round 1.
3. Run a traditional session: first AI-generated setup set should count as round 1.
4. Continue tapping multiple times: each new setup set should increment the count by 1.
5. Start traditional below 8, then rise to 8+: next round should use vague tearless setup/reminder phrases.
6. Open chat history and verify transcripts contain system choice messages and transition messages, not just AI replies.

<lov-actions>
<lov-suggestion message="Test the EFT flow end-to-end for transcript saving, round counting, and high-SUDS phrase switching on both TTT and traditional paths.">Verify that it works</lov-suggestion>
<lov-suggestion message="Implement the transcript persistence fix so every visible chat/system message is saved to chat_sessions.messages, not just messages sent through sendMessage().">Fix Transcript Saving</lov-suggestion>
<lov-suggestion message="Refactor round counting so every time setup statements are generated, the app increments and persists the tapping round consistently for TTT and traditional EFT.">Fix Round Counting</lov-suggestion>
<lov-suggestion message="Add a high-distress safety fallback so sessions that rise to SUDS 8+ automatically switch setup statements and reminder phrases back to vague tearless language.">Add High-SUDS Safety Switch</lov-suggestion>
</lov-actions>
