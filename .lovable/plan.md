

## Make the Android App Load Local Assets (Production Mode)

### Problem
The `capacitor.config.ts` has a `server.url` that points to the remote Lovable preview, so the app always loads from the internet like a browser. This is development mode.

### Plan

**Step 1: Update `capacitor.config.ts`**
- Remove (or comment out) the `server` block so Capacitor loads from the local `dist/` assets bundled into the APK.

**Step 2: User runs locally**
After the change, the user needs to:
```bash
git pull
npm install
npm run build
npx cap copy android
npx cap sync android
```
Then click **Run ▶** in Android Studio.

### Result
The app will load from bundled local files — works offline, loads faster, and behaves like a true native app. The remote `server` config can be re-added anytime for development/hot-reload.

### Technical Detail
The only file changed is `capacitor.config.ts` — the `server` property is removed. Everything else stays the same.

