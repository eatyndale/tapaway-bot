

## Plan: Remove "Talk to Tapaway" and merge its behavior into "Continue Tapping"

### What changes

**New behavior for "Continue Tapping" button:**
- **SUDS 1–7**: Instead of going straight to setup statements, "Continue Tapping" triggers the conversation flow (what `handleTalkToTapaway` does now) — the bot chats with the user to deepen/refine the problem before the next tapping round.
- **SUDS 8–10**: "Continue Tapping" goes straight to setup statements (existing behavior, unchanged).

### Files to change

**1. `src/components/anxiety-bot/PostTappingChoice.tsx`**
- Remove `onTalkToTapaway` from props interface and destructuring.
- Remove the `MessageCircle` import.
- SUDS 3–7 block: Remove the "Talk to Tapaway" button entirely. "Continue Tapping" remains as-is (parent handler will route correctly).
- SUDS 1–2 block: Remove the "Talk to Tapaway" button entirely.

**2. `src/components/AIAnxietyBot.tsx`**
- Change `onContinueTapping` handler for SUDS 1–7: instead of calling `handleContinueTapping(parsed.intensity, parsed.phraseType)`, call `handleTalkToTapaway()` when `parsed.intensity >= 1 && parsed.intensity <= 7`.
- For SUDS 8–10, keep calling `handleContinueTapping(parsed.intensity, parsed.phraseType)`.
- Remove the `onTalkToTapaway` prop from `<PostTappingChoice>`.

**3. `src/hooks/useAIChat.ts`**
- Keep `handleTalkToTapaway` function (it's still used, just triggered differently). No changes needed here.

### Summary
The "Talk to Tapaway" button disappears. "Continue Tapping" becomes intensity-aware: SUDS 1–7 → chat first (deepen), SUDS 8+ → straight to setup/tapping.

