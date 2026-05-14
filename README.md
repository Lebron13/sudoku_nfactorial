# ZenSudoku ✦

> **The sudoku experience, reimagined.**
> Built for nFactorial Incubator Selection 2026.

**Live:** [leronti.site](https://leronti.site) · **Backup:** [sudoku-pro-one.vercel.app](https://sudoku-pro-one.vercel.app)

---

## What is ZenSudoku?

ZenSudoku is a premium web Sudoku platform that combines beautiful design, AI-powered coaching, and competitive social features into a product people actually want to return to daily.

Most sudoku apps are functional but forgettable — same boring grids, same tired UX, no reason to come back tomorrow. ZenSudoku differentiates through three pillars:

1. **AI Coach** — powered by Claude, explains *why* moves work, teaches strategy
2. **Daily Mosaic** — solving the puzzle reveals a pixel painting, creating a unique daily ritual
3. **Social Layer** — global and city leaderboards, real authentication, real player progression

---

## Who is it for?

- **Casual players** who want a clean, distraction-free experience
- **Competitive speedrunners** chasing daily leaderboard rankings
- **Seniors** who need a larger, clearer interface (Big & Clear mode with voice readout)
- **Learners** who want to actually understand sudoku, not just brute-force puzzles
- **Bilingual users** — full English and Russian translations

---

## The Logo

The ZenSudoku logo is a **pink eagle** — a nod to sudoku's American roots. While the puzzle's modern form is often associated with Japan, sudoku as we know it was actually popularized in the United States in 1979 by Howard Garns under the name "Number Place" before being rediscovered and renamed in Japan in the 1980s. The eagle honors that origin story, rendered in our signature pink to keep the brand soft, modern, and unmistakably ours.

---

## Features

### 🎮 Core Gameplay

**Four difficulty levels** with unique generated puzzles every time:
- **Easy** — avg 4 min, ~36 given cells
- **Medium** — avg 12 min, ~30 given cells  
- **Hard** — avg 24 min, ~26 given cells
- **Expert** — avg 45 min, ~22 given cells

**Smart sudoku engine** with proper backtracking algorithm that guarantees unique solutions — no hardcoded puzzles.

**Game controls:**
- 💡 **Hints** (3 per game) — reveals a correct number in a random empty cell
- ✏️ **Notes mode** — pencil candidates into cells, auto-clears when nearby numbers placed
- ↩ **Full undo history** — step back through every move without penalty
- 👁 **Show errors toggle** — turn off error highlighting for hard mode
- ⏸ **Pause** — freezes timer and blurs the grid
- 🔄 **Restart puzzle** — reset to initial state anytime
- ⌨️ **Keyboard support** — number keys to place, arrow keys to navigate, 'n' for notes, Backspace to erase
- 📱 **Mobile keypad** — native iOS/Android numeric keyboard pops up on cell tap

**Visual feedback:**
- Same-number highlighting across grid
- Row/column/box highlighting on selection
- Conflict cells flagged in red
- Star rating (1-3) based on time and mistakes
- Confetti celebration on completion

### 🌅 Daily Challenge

The signature feature. Every day a new puzzle generates **deterministically from the date** — every player worldwide gets the same puzzle.

**The twist:** the 9×9 sudoku grid is overlaid with a pixel-art mosaic. Each cell has a hidden color. As you solve the puzzle correctly, cells reveal their true color, gradually painting a complete image.

**Three rotating mosaics** (cycle daily):
- 🌄 **Sunset Mountain** — warm reds and oranges over a mountain silhouette
- 🐠 **Koi Pond** — deep blues with orange koi visible
- 🌸 **Cherry Blossom** — pink blooms over green hills

**Daily-specific UI:**
- Live preview panel (blurred until you solve, hover to peek)
- Real-time countdown to next puzzle (midnight reset)
- Progress bar: cells solved / 81
- Special completion modal with mini mosaic thumbnail and shareable result text
- "Day #N" tracking system

### 🧠 AI Coach (powered by Claude)

The differentiator. Powered by the Anthropic Claude API with streaming responses.

**What it does:**
- Explains *why* a specific number fits in a selected cell using real sudoku techniques
- Teaches advanced strategies: naked pairs, hidden singles, X-Wing, swordfish, pointing pairs
- Answers open questions ("What strategy should I use here?")
- Streams responses with typewriter animation
- Never just gives the answer — teaches the technique

**UX:**
- Floating button bottom-right with pulsing pink indicator
- Slide-up glass panel with conversation history
- Suggested question chips ("Why does 7 go here?", "Explain naked pairs", etc.)
- 5 free queries per game session (resets each new game)
- Pro tier: unlimited queries

### 🎓 Tutorial — Learn with Zen

**A Duolingo-style interactive tutorial** with our custom mascot **Zen** — a soft pink animated owl character with blinking eyes, waving wing, and four expression states (happy/thinking/celebrate/sad).

**Five lessons** from beginner to intermediate:
1. **The basics** — rows must contain 1-9, no repeats
2. **Naked single** — find cells where only one number fits
3. **Hidden single** — spot when a number can only go in one place
4. **Pencil marks** — using notes mode strategically
5. **Naked pair** — identifying paired candidates and eliminations

Each lesson:
- Mascot delivers context with animated speech bubble
- Interactive puzzle for the user to solve
- Confetti celebration on correct answer
- Encouraging "try again" if wrong
- Progress bar at top
- Big completion modal with celebration

### 🏆 Leaderboard

**Real player rankings** stored in Supabase. Not mock data.

**Three views:**
- **Today** — daily challenge leaderboard, resets every 24h
- **All time** — global rankings across all difficulty levels
- **By city** — compete with players from your hometown

**Each entry shows:**
- Rank with 🥇🥈🥉 for top 3
- Player name and city
- Completion time
- Star rating
- Difficulty badge

### 📊 Statistics (GitHub-style)

**Personal stats dashboard** for every player with persistent localStorage tracking.

**Top metrics:**
- Games played
- Win rate (%)
- Current streak (consecutive days with a win)
- Average win time

**GitHub-style activity heatmap** — 12 weeks × 7 days = 84 days of play history. Color intensity scales pink:
- Empty: dim gray (no games)
- 1 game/day: faintest pink
- 2 games: light pink
- 3-4 games: bright pink  
- 5+ games: vivid pink

**Best times by difficulty** — your personal records per level.

**Recent games table** — last 10 plays with date, difficulty, time, stars, and win/loss indicator.

### 🔐 Authentication

**Magic link email authentication** via Supabase Auth.

**Flow:**
1. Enter email
2. Receive magic link in inbox
3. Click link → authenticated
4. First-time users prompted for display name + city (used for leaderboard)
5. Profile stored in Supabase `profiles` table

Google OAuth UI is built and ready — currently marked "Soon" pending final config.

**Session management:**
- Avatar shows user initial in navbar when logged in
- Click avatar → dropdown with "My Stats" and "Sign out"
- Auth state syncs across tabs

### 🎵 Lo-fi Radio

**Built-in radio player** with three SomaFM streams (CORS-safe, 99%+ uptime):
- 🎧 **Lo-fi Beats** (Groove Salad)
- 🌊 **Chillout** (Deep Space One)
- 🌙 **Ambient** (Drone Zone)

**Features:**
- Visible pill bottom-left of every page
- Loading spinner during stream connection
- Animated music bars when playing
- Volume slider with persistence
- Station selection with persistence
- Auto-retry on stream failures (up to 2 attempts)
- 10-second timeout protection
- Graceful error messages

### 👴 Big & Clear Mode

**Accessibility mode** designed for senior players.

**When enabled:**
- Larger font sizes site-wide (game pages only)
- Bigger sudoku cells (68×68px vs default 56×56px)
- Larger number pad buttons
- Voice readout via Web Speech API — every placed number is spoken aloud
- Higher contrast UI elements
- Toggle button always visible on game pages (top-right pill)

Mobile-optimized — smaller scaling factor on phones to fit screen.

### 💎 Pro Tier ($4.99/month)

**Pre-launch subscription page** with full pricing UI and feature list:

✓ **Unlimited AI Coach queries** (vs 5 per game free)
✓ **12 custom board themes** (vs 3 free)
✓ **Detailed stats & progress graphs**
✓ **Priority leaderboard badge** (visual distinction)
✓ **No interruptions**

**Pricing:**
- $4.99/month
- $29.99/year (save 50%)
- 7-day free trial
- No credit card required to start
- Cancel anytime

Stripe-ready integration architecture — payment processing scaffold in place for activation.

### 🌐 Internationalization

**Full bilingual support** — English and Russian.

- Language toggle button in every navbar (EN / RU)
- Persistent across sessions (localStorage)
- 150+ translated strings covering every UI element
- Dynamic content (player names, dates, numbers) untouched
- Translation context provider wraps entire app

### 🎨 Light & Dark Themes

**Two carefully tuned color schemes:**

**Dark (default):**
- Background: `#080808` near-black
- Accent: `#ff6eb4` brand pink
- Premium, focused, distraction-free

**Light:**
- Background: `#f5f3ef` warm off-white (not stark white)
- Accent: `#d63384` adjusted pink for contrast
- Cards: pure white `#ffffff` for elevation
- Text: `#1a1a1c` softer than pure black

CSS variable architecture — entire site themes via `--bg`, `--text`, `--accent`, etc. Theme persists across sessions.

### 📱 Fully Responsive

Designed mobile-first with breakpoints at 768px and 380px.

**Mobile adaptations:**
- Compact navbar with key actions only
- Stacked hero layout
- 2×2 difficulty grid (vs 4-column on desktop)
- Single-column feature cards
- Full-width number pad
- Touch-optimized cell sizes
- Native numeric keyboard on cell tap
- AI Coach and Radio panels fit viewport

---

## Tech Stack

### Frontend
- **Next.js 14** App Router
- **TypeScript** strict mode
- **React 18** with Server and Client Components
- **Tailwind CSS** for utility classes
- **Inline styles + CSS variables** for theming
- **Framer Motion** patterns for animations
- **canvas-confetti** for celebrations

### Backend & Data
- **Supabase**
  - Auth (magic link email + Google OAuth ready)
  - PostgreSQL database (profiles, scores tables)
  - Row Level Security policies
  - Real-time capable
- **Anthropic Claude API** — streaming AI Coach responses

### Audio & Speech
- **HTML5 Audio API** with retry logic for radio streams
- **Web Speech API** for Big & Clear voice readout
- **SomaFM** for reliable CORS-enabled lo-fi streams

### Deployment
- **Vercel** for hosting and edge functions
- **Custom domain**: leronti.site
- **Automatic SSL** via Let's Encrypt
- **GitHub** integration for CI/CD on push

### Fonts
- **Playfair Display** — serif headings (italic emphasis)
- **DM Sans** — body text (light and regular weights)

---

## Architecture Highlights

### Sudoku Engine (`lib/sudoku-engine.ts`)
- Backtracking algorithm for puzzle generation
- Guaranteed unique solution per puzzle
- Deterministic daily puzzles (seeded from date)
- Difficulty levels controlled by # of revealed cells
- Validation logic checks rows, columns, boxes

### State Management
- React hooks (useState, useEffect, useRef)
- localStorage for client persistence (results, preferences)
- Supabase for cross-device sync (when logged in)
- Context providers for theme and language

### Performance
- Code splitting via Next.js dynamic imports
- Skill-based component loading
- Server Components where possible
- Optimized re-renders with proper memoization

---

## Business Model

### Freemium

**Free tier:**
- All difficulty levels
- 5 AI Coach queries per game
- 3 hints per game
- Basic stats (localStorage)
- Daily challenge
- 3 board themes

**Pro tier ($4.99/mo or $29.99/year):**
- Unlimited AI Coach
- 12 board themes
- Detailed stats with cross-device sync
- Priority leaderboard badge
- Ad-free forever
- 7-day free trial

### Future Revenue Streams

- **B2B white-label** — sudoku for senior care apps, education platforms
- **School licensing** — classroom puzzle programs with teacher analytics
- **Cosmetic store** — premium themes, custom mascot skins
- **Sponsored daily mosaics** — partner brands provide mosaic art for special days

---

## Local Development

```bash
git clone https://github.com/[your-username]/zensudoku
cd zensudoku
npm install
cp .env.local.example .env.local
# fill in environment variables
npm run dev
```

Open http://localhost:3000

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

### Project Structure

```
app/
  page.tsx              # Landing page (hero + below-hero sections)
  layout.tsx            # Root layout with providers
  globals.css           # Global styles + theme variables
  game/[difficulty]/    # Game page (easy/medium/hard/expert)
  daily/                # Daily Challenge with mosaic reveal
  stats/                # Personal statistics dashboard
  leaderboard/          # Global and city rankings
  tutorial/             # Interactive Zen-guided lessons
  auth/                 # Magic link sign-in
  icon.svg              # Favicon

components/
  ZenMascot.tsx         # Owl character SVG with animations
  RadioPlayer.tsx       # Lo-fi radio with controls
  SeniorMode.tsx        # Big & Clear toggle and CSS variable setter
  ThemeToggle.tsx       # Dark/light theme switcher
  LangToggle.tsx        # EN/RU language switcher
  AICoach.tsx           # Streaming AI panel

lib/
  sudoku-engine.ts      # Puzzle generation, solving, validation
  supabase.ts           # Supabase client singleton
  leaderboard.ts        # Score submission and fetching
  i18n.ts               # Translation system

supabase/
  profiles.sql          # User profile schema
  scores.sql            # Score tracking schema
```

---

## Roadmap

### Shipped (v1.0)
- ✅ Four difficulty levels with unique generation
- ✅ Daily Challenge with pixel mosaic reveal
- ✅ AI Coach with Claude streaming
- ✅ 5-lesson interactive tutorial
- ✅ Custom Zen mascot
- ✅ Real leaderboard via Supabase
- ✅ Magic link authentication
- ✅ GitHub-style stats dashboard
- ✅ Lo-fi radio with 3 stations
- ✅ Pro tier UI ($4.99/mo)
- ✅ Bilingual EN/RU
- ✅ Light and dark themes
- ✅ Big & Clear accessibility mode
- ✅ Mobile-responsive everywhere

### Coming Soon (v1.1)
- Google OAuth activation
- Stripe payment processing
- 12 unlockable board themes
- Friend invites and private leaderboards
- Weekly tournaments
- Achievement system
- Push notifications for daily puzzle

### Long-term (v2.0+)
- Multiplayer race mode
- AI-generated custom mosaics
- iOS and Android native apps
- Apple Watch complications
- Spotify integration (in addition to lofi)
- B2B dashboard for institutions

---

## Credits

**Built by Valeriya Mukhizinova** for nFactorial Incubator 2026.

Special thanks to nFactorial for the opportunity and pressure to ship.

---

## License

This project is built for demonstration purposes as part of the nFactorial Incubator selection process.
