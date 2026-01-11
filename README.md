# Tapaway

**AI-Powered EFT Tapping for Anxiety Relief**

A React-based web application that guides users through Emotional Freedom Techniques (EFT) tapping sessions using an AI conversational agent, designed to reduce anxiety through structured, evidence-based interventions.

---

## Overview

Tapaway is a digital mental health tool developed as part of a Design Science Research (DSR) project investigating the efficacy of AI-delivered EFT interventions. The application combines conversational AI with the clinical EFT protocol to provide accessible, personalized anxiety relief.

### Key Outcomes
- **Mean SUDS Reduction**: 4.28 points (from 7.22 to 2.94)
- **Effect Size**: Cohen's d = 2.16 [95% CI: 1.61, 2.71]
- **Completion Rate**: 68 completed sessions

---

## Features

- **PHQ-9 Style Assessment** - Initial anxiety screening with severity classification
- **AI-Guided EFT Sessions** - Conversational agent guides users through the clinical EFT protocol
- **Interactive Tapping Guide** - Visual demonstrations with GIF animations for each tapping point
- **SUDS Tracking** - Pre/post session intensity ratings (0-10 scale)
- **Crisis Detection** - Automatic detection of crisis language with professional referral
- **Session History** - Persistent storage of all tapping sessions with improvement metrics
- **Secure Authentication** - Supabase Auth with email/password and magic link support
- **Responsive Design** - Mobile-first design optimized for accessibility

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, Radix UI, Shadcn/ui |
| **Backend** | Supabase (Auth, PostgreSQL, Edge Functions) |
| **AI** | OpenAI GPT-4o-mini with Bounded Generative Framework |
| **State Management** | TanStack React Query |
| **Routing** | React Router v6 |

---

## Project Structure

```
├── public/
│   ├── audio/                    # Ambient tapping audio
│   └── lovable-uploads/          # Uploaded assets
├── src/
│   ├── assets/tapping/           # Tapping point GIFs and images
│   ├── components/
│   │   ├── anxiety-bot/          # AI chatbot components
│   │   │   ├── ChatInterface.tsx # Main chat UI
│   │   │   ├── TappingGuide.tsx  # Visual tapping instructions
│   │   │   ├── SetupPhase.tsx    # EFT setup statements
│   │   │   ├── IntensitySlider.tsx # SUDS rating input
│   │   │   └── CrisisSupport.tsx # Crisis intervention display
│   │   ├── ui/                   # Shadcn/ui components
│   │   ├── AIAnxietyBot.tsx      # Main bot orchestrator
│   │   ├── AuthForm.tsx          # Authentication UI
│   │   ├── Dashboard.tsx         # User dashboard
│   │   ├── Questionnaire.tsx     # PHQ-9 assessment
│   │   └── TappingSequence.tsx   # Tapping flow manager
│   ├── hooks/
│   │   ├── useAIChat.ts          # AI conversation hook
│   │   └── use-mobile.tsx        # Mobile detection
│   ├── pages/
│   │   ├── Index.tsx             # Landing/auth page
│   │   └── AuthCallback.tsx      # OAuth callback handler
│   ├── services/
│   │   └── supabaseService.ts    # Database operations
│   └── utils/
│       ├── inputValidation.ts    # Input sanitization
│       ├── secureStorage.ts      # Secure local storage
│       └── spellChecker.ts       # Text correction
├── supabase/
│   ├── functions/
│   │   └── eft-chat/             # AI conversation edge function
│   └── migrations/               # Database schema migrations
└── METHODOLOGY_*.md              # Research documentation
```

---

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Supabase account and project
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd tapaway

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Configure the following secret in Supabase Edge Functions:

- `OPENAI_API_KEY` - OpenAI API key for GPT-4o-mini

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data (name, email, age_group, industry) |
| `assessments` | PHQ-9 assessment results with severity classification |
| `chat_sessions` | AI conversation history with crisis detection flags |
| `tapping_sessions` | EFT session data with intensity ratings and improvement metrics |

### Key Fields in `tapping_sessions`

```sql
- problem: text           -- User's stated concern
- feeling: text           -- Emotional label
- body_location: text     -- Somatic sensation location
- initial_intensity: int  -- Pre-session SUDS (0-10)
- final_intensity: int    -- Post-session SUDS (0-10)
- improvement: int        -- Calculated reduction
- rounds_completed: int   -- Number of tapping rounds
- setup_statements: text[] -- Personalized affirmations
- reminder_phrases: text[] -- Tapping point phrases
```

---

## Edge Functions

### `eft-chat`

The core AI conversation handler implementing the Bounded Generative Framework.

**Endpoint**: `POST /functions/v1/eft-chat`

**Request Body**:
```json
{
  "message": "string",
  "conversationHistory": [],
  "sessionContext": {
    "problem": "string",
    "feeling": "string",
    "bodyLocation": "string",
    "intensity": 0,
    "currentRound": 1,
    "conversationState": "conversation"
  }
}
```

**Response**:
```json
{
  "response": "string",
  "directive": {
    "type": "continue_conversation | gather_intensity | start_tapping | ...",
    "data": {}
  },
  "intent": "string",
  "updatedContext": {},
  "isCrisis": false
}
```

**Conversation States**:
1. `conversation` - Initial problem gathering
2. `gathering-intensity` - SUDS rating collection
3. `setup` - Setup statement presentation
4. `tapping-point` - Active tapping guidance
5. `tapping-breathing` - Breathing exercises
6. `post-tapping` - Post-round assessment
7. `advice` - Session conclusion

---

## EFT Tapping Process Flow

```
┌─────────────────┐
│  Start Session  │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Identify Problem│◄──── AI guides discovery
└────────┬────────┘
         ▼
┌─────────────────┐
│ Rate Intensity  │◄──── SUDS 0-10
└────────┬────────┘
         ▼
┌─────────────────┐
│  Setup Phase    │◄──── "Even though I feel [X]..."
└────────┬────────┘
         ▼
┌─────────────────┐
│ Tapping Points  │◄──── 9 points with visual guides
│  (8 per round)  │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Deep Breathing  │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Re-rate SUDS   │
└────────┬────────┘
         ▼
    ┌────┴────┐
    │ SUDS≤2? │
    └────┬────┘
    No   │   Yes
    │    │    │
    ▼    │    ▼
┌───────┐│┌─────────┐
│Another││ │Complete │
│ Round │││ Session │
└───┬───┘│└─────────┘
    │    │
    └────┘
```

---

## Key Design Principles

### 1. Bounded Generativity
The AI operates within strict therapeutic boundaries defined by the Clinical EFT protocol. Responses are constrained to the current conversation state to ensure protocol fidelity.

### 2. Somatic Recognition
The system explicitly acknowledges physical manifestations of anxiety, asking users to identify where they feel sensations in their body (e.g., "tight chest", "knot in stomach").

### 3. Linguistic Attunement
Setup statements and reminder phrases use the user's own words verbatim, maintaining authenticity and personal relevance:
> "Even though I feel [user's feeling] about [user's problem], I deeply and completely accept myself."

### 4. Crisis Detection Architecture
Real-time monitoring for crisis indicators (suicidal ideation, self-harm) with immediate escalation to professional resources. The AI provides crisis hotlines and encourages professional help.

### 5. Context Persistence
Session context flows through the entire conversation, maintaining coherence across multiple tapping rounds and enabling personalized guidance.

---

## Research Context

This application was developed as part of a Design Science Research project investigating:

- **RQ1**: Can AI-delivered EFT achieve therapeutic outcomes comparable to human-delivered formats?
- **RQ2**: What design principles enable effective AI-mediated somatic interventions?

### Key Findings

| Metric | Value |
|--------|-------|
| Sample Size | n = 68 completed sessions |
| Mean Initial SUDS | 7.22 (SD = 1.64) |
| Mean Final SUDS | 2.94 (SD = 2.36) |
| Mean Improvement | 4.28 points |
| Cohen's d | 2.16 [95% CI: 1.61, 2.71] |

The effect size falls within the range of human-delivered EFT meta-analyses (Clond, 2016: d = 1.23 [0.82, 1.64]), suggesting AI-delivered EFT produces effects at least comparable to traditional formats.

---

## Tapping Points

The application guides users through 9 tapping points:

1. **Karate Chop** - Side of hand (setup point)
2. **Eyebrow** - Inner edge of eyebrow
3. **Side of Eye** - Outer corner of eye
4. **Under Eye** - On cheekbone under eye
5. **Under Nose** - Between nose and upper lip
6. **Chin** - Between lower lip and chin
7. **Collarbone** - Just below collarbone
8. **Under Arm** - About 4 inches below armpit
9. **Top of Head** - Crown of head

Each point includes animated GIF demonstrations for proper technique.

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- TypeScript strict mode
- ESLint configuration provided
- Tailwind CSS for styling (use semantic tokens)
- Component-based architecture with custom hooks

---

## License

This project is part of academic research. Please contact the author for licensing information.

---

## Acknowledgments

- **EFT Protocol**: Based on Clinical EFT as described by Church (2013)
- **Meta-Analysis Reference**: Clond, M. (2016). Emotional Freedom Techniques for Anxiety
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)
- **Backend**: [Supabase](https://supabase.com/)

---

## Support

For issues or questions, please open a GitHub issue or contact the research team.
