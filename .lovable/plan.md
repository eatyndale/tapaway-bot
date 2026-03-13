

## Plan: Auto-start Tapping + Setup Audio Fix + Auto TTT→Traditional Transition

### Change 1: Auto-start tapping timer when TappingGuide mounts

**File: `src/components/anxiety-bot/TappingGuide.tsx`**

The TappingGuide currently shows a "Start Tapping" button before the timer begins. After setup completes, tapping should begin immediately.

- Add a `useEffect` on mount that sets `isPlaying = true` and triggers `audioRef.current.play()` — this is safe because the user already interacted (clicked buttons during setup phase), so autoplay policy is satisfied.
- Remove the "Start Tapping" button. The controls will show Pause/Resume instead.

Lines 224-228: Remove the `!isPlaying` branch that renders "Start Tapping" — always show Pause when playing, Resume when paused.

Lines 99-103: Add mount effect:
```ts
useEffect(() => {
  setIsPlaying(true);
  if (audioRef.current) audioRef.current.play().catch(() => {});
}, []);
```

### Change 2: Play audio on "Skip to Next" in SetupPhase

**File: `src/components/anxiety-bot/SetupPhase.tsx`** (line 41-49)

`handleNext()` currently doesn't start audio or set `hasStarted`/`isPlaying` when skipping. Update it to also ensure audio plays and state is set:

```ts
const handleNext = () => {
  if (currentStatement < setupStatements.length - 1) {
    setCurrentStatement(prev => prev + 1);
    setTimeRemaining(SECONDS_PER_STATEMENT);
    if (!hasStarted) setHasStarted(true);
    setIsPlaying(true);
    if (audioRef.current) audioRef.current.play().catch(() => {});
  } else {
    // complete — existing logic
  }
};
```

### Change 3: Auto-transition TTT→Traditional when SUDS drops below 8

**File: `src/hooks/useAIChat.ts`** (lines 866-891)

Currently when TTT and SUDS is 3-7, it shows a `post-tapping-choice` UI. Instead, automatically transition to conversation:

- Replace the choice message block with inline logic that mirrors `handleTalkToTapaway`:
  - Update `sessionContext`: set `isTearlessTrauma: false`, `sessionType: 'mixed'`, `returningFromTapping: true`, and **clear `problem`, `feeling`, `bodyLocation`** so conversation re-gathers them fresh
  - Post a bot message: "Your intensity has come down nicely. Let's explore what's going on so we can work through it more specifically."
  - Call `onStateChange('conversation')`

### Change 4: Clear session data in `handleTalkToTapaway` too

**File: `src/hooks/useAIChat.ts`** (lines 987-998)

Also clear `problem`, `feeling`, `bodyLocation` in `handleTalkToTapaway` to prevent the edge function from seeing all data already present and skipping conversation:

```ts
const updatedContext: SessionContext = {
  ...sessionContext,
  returningFromTapping: true,
  deepeningLevel: (sessionContext.deepeningLevel || 0) + 1,
  sessionType: sessionContext.isTearlessTrauma ? 'mixed' : sessionContext.sessionType,
  isTearlessTrauma: false,
  problem: undefined,
  feeling: undefined,
  bodyLocation: undefined,
};
```

### Files changed
1. `src/components/anxiety-bot/TappingGuide.tsx` — auto-start on mount, remove "Start Tapping" button
2. `src/components/anxiety-bot/SetupPhase.tsx` — play audio + start timer on "Skip to Next"
3. `src/hooks/useAIChat.ts` — auto-transition TTT→conversation at SUDS < 8, clear session data

