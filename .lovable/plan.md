

## Plan: Continuous Audio from Setup through Tapping

### Problem
SetupPhase and TappingGuide each have their own `<audio>` element. When SetupPhase unmounts (completing setup), its audio stops and its element is destroyed. TappingGuide then mounts with a new `<audio>` element and tries to play via `useEffect`/`autoPlay`, but browsers block this because it's not a direct user gesture.

### Solution: Lift audio to parent component

Move the `<audio>` element to `AIAnxietyBot.tsx` so it persists across both phases. Pass `audioRef` down to both SetupPhase and TappingGuide. Since the user already clicked "Start Setup" to unlock audio, it keeps playing seamlessly when TappingGuide renders.

### Changes

**1. `src/components/AIAnxietyBot.tsx`**
- Add an `audioRef = useRef<HTMLAudioElement>(null)` at component level
- Render `<audio ref={audioRef} src="/audio/ambient-tapping.mp3" loop preload="auto" />` in the main JSX (outside any conditional phase rendering)
- Pass `audioRef` to both `<SetupPhase>` and `<TappingGuide>` as a prop

**2. `src/components/anxiety-bot/SetupPhase.tsx`**
- Add `audioRef` to props interface: `audioRef: React.RefObject<HTMLAudioElement>`
- Remove the internal `<audio>` element and internal `audioRef` ref
- Use the passed-in `audioRef` for all play/pause/mute operations
- Remove the cleanup `useEffect` that resets audio on unmount (parent owns the element now, audio should keep playing)

**3. `src/components/anxiety-bot/TappingGuide.tsx`**
- Add `audioRef` to props interface: `audioRef: React.RefObject<HTMLAudioElement>`
- Remove the internal `<audio>` element, internal `audioRef` ref, and `autoPlay`
- Remove the mount `useEffect` that tries to play audio (it's already playing from setup)
- Keep the `isPlaying` auto-start `useEffect` for the timer only (just `setIsPlaying(true)`)
- Use the passed-in `audioRef` for pause/mute/reset operations
- Keep cleanup `useEffect` but only pause on unmount (parent owns element)

### Result
Audio starts when user clicks "Start Setup", plays continuously through all setup statements, and carries over seamlessly into tapping point 1/8 without any interruption or browser autoplay issues.

