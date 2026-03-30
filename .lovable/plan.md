

## Update README.md — Keep It Current

### Changes Needed

The README is mostly accurate but has several gaps and a stale project structure listing. Here is what will be updated:

---

### 1. Technology Stack Table
**Add Capacitor** as a row for mobile/native packaging:
| **Mobile** | Capacitor (Android) |

---

### 2. Project Structure Tree
The current tree is missing many components that now exist. Updates:

- **anxiety-bot/** — Add the 12+ missing subcomponents: `AdviceDisplay`, `ChatHeader`, `ChatHistory`, `ChatInput`, `ChatMessage`, `FatigueCheck`, `GreetingIntensity`, `LoadingIndicator`, `LocalChatHistory`, `PostTappingChoice`, `Questionnaire`, `QuestionnaireView`, `QuietIntegration`, `SessionActions`, `SessionComplete`, `SetupStatements`, `types.ts`
- **landing/** — Add new section: `BenefitsSection.tsx`, `ScienceSection.tsx`, `TestimonialsSection.tsx`, `WhatIsTapaway.tsx`
- **src/assets/** — Add `setup-meditation.gif`, `setup-meditation.png`
- **Root** — Add `capacitor.config.ts`
- **Remove** `METHODOLOGY_*.md` reference (no such files exist in the repo)

---

### 3. Edge Function Request/Response
Update the request body to match the actual `eft-chat` function signature, which uses `chatState`, `userName`, `currentTappingPoint`, `intensityHistory`, `lastAssistantMessage` — not `conversationHistory` and `sessionContext` as currently documented.

---

### 4. Published URL
Add the live URL (`https://tapaway.lovable.app`) near the top of the README.

---

### 5. Database Schema
Add the `evaluation_results` and `human_evaluations` tables that exist in the types file but are missing from the README.

---

### Technical Detail
Only `README.md` is modified. No code or configuration changes.

