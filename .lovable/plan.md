

# Plan: Set Up Capacitor for Native Mobile App

## What this does

Converts your existing web app into a native mobile app that can be published to the Apple App Store and Google Play Store using Capacitor.

## Steps

### 1. Install Capacitor dependencies
Add `@capacitor/core`, `@capacitor/cli` (dev), `@capacitor/ios`, and `@capacitor/android` to `package.json`.

### 2. Initialize Capacitor
Run `npx cap init` and create `capacitor.config.ts` with:
- **appId:** `app.lovable.06fba0130ca242c8b6694adcf9e55711`
- **appName:** `tapaway`
- **Hot-reload server** pointing to your sandbox preview URL for live development

### 3. No code changes needed
Your app is already mobile-responsive (full-bleed layout, dynamic viewport sizing). No UI modifications required.

## After setup — what you need to do locally

1. **Export to GitHub** via the "Export to GitHub" button in project settings
2. `git clone` and `cd` into the repo
3. `npm install`
4. `npx cap add ios` and/or `npx cap add android`
5. `npx cap update ios` / `npx cap update android`
6. `npm run build`
7. `npx cap sync`
8. `npx cap run ios` (requires Mac + Xcode) or `npx cap run android` (requires Android Studio)

After any future code changes, `git pull` then `npx cap sync` to update the native app.

## Requirements
- **iOS:** Mac with Xcode installed
- **Android:** Android Studio installed
- For App Store/Play Store publishing, you'll need developer accounts ($99/yr Apple, $25 one-time Google)

## Technical details
- Only `package.json` and a new `capacitor.config.ts` file are created/modified
- No database or edge function changes
- The hot-reload server config lets you develop against the live Lovable preview

### Reference
For a detailed walkthrough, see the [Lovable blog post on building native apps with Capacitor](https://docs.lovable.dev/tips-tricks/mobile-development).

