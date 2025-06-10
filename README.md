🧠 Sports Genius Admin + User Dashboard Build Plan
(Gameplan for Tokenized AI Models, Page Builder, Prediction Contests, and Ad Campaigns)
🔩 CORE SYSTEMS & STRUCTURE
Tokenization System

Tracks token usage per user; each AI model or contest consumes tokens.

Users see token balance + what they’ve spent tokens on in their profile.

AI Model Builder

Build models by sport and betting type (e.g. NFL > DFS Lineup).

Includes model name, description, LLM provider, template instructions, optional API feed, and token cost.

Analyzer Builder

Connects to AI Model.

Lets user run a model and returns results in styled card format.

Optionally integrates sportsbook API data.

Dynamic Analyzer Execution

Analyzer determines which AI model to run based on config (e.g. NFL DFS vs Player Props).

Prediction Contests

Run thumbs up/down contests from analyzer results.

Each contest costs X tokens to enter.

Each entry is tracked for results (win/loss) and leaderboard scoring.

Leaderboard System

Track per-contest entries, results, and prizes.

Multiple leaderboard types supported (e.g. DFS, Prop, Parlay).

Includes "See My Picks" section for users.

🧱 PAGE BUILDER IN ADMIN
Custom Page Builder

Build user-facing UI pages using blocks and sections.

Create multiple pages off the main index (e.g. Contest Page, Leaderboard Page).

Admin sets layout, components, and styles.

Blocks You Can Use in Builder

Analyzer Cards

Prediction Contest Cards

Result Cards

Leaderboard Previews

Campaign Ads

Token Trackers

"My Picks" Feed

Custom Headers, Subtitles, Descriptions

Design Customization

Control colors, spacing, animations (e.g. confetti, token countdown).

Style each block independently (e.g. different contest color themes).

Preview each layout before publishing.

Results Page Enhancements

After user runs analyzer:

Show animated results (cards).

Allow launching follow-up contests (e.g. thumbs up/down).

Display "See how others voted" percentage stats.

Insert contextual ad campaigns.

💸 CAMPAIGN SYSTEM (Ad Integration)
Admin Campaign Management

Create campaigns with: image, title, description, CTA, URL, placement logic.

Types: card, banner, modal.

Campaigns can be targeted by sport, bet type, or user activity.

Page Builder Campaign Blocks

Insert ad campaigns directly into layouts using ad blocks.

Choose where to place: after analyzer, in results, in contest feed, sidebar, etc.

User Ad Experience

Ad cards look native to the platform.

Link out to affiliate landing pages or DFS/betting partners.

Can show special offers, referral bonuses, or contests.

Ad Targeting Rules

Target ads by:

Sport or betting type

Minimum token usage

Placement timing (e.g. post-analysis)

Optional: Track impressions, clicks, CTR

👤 USER DASHBOARD FEATURES
Token Tracker Page

View current balance

View token spend history

View token cost of actions

Contests Page

See open and past contests

Show active entries with win/loss status

Claim prizes or see reward progress

Results Experience

After analyzer scan:

Return styled result cards

Launch follow-up prediction contests

Confetti/token animations for engagement

My Picks

Show user’s submitted predictions

Filter by win/loss, contest type, date

Include stats like “Top Accuracy” or “Longest Streak”

⚙️ ADDITIONAL LOGIC & FEATURES
Token Deduction System

Each model, scan, or contest deducts tokens

Token cost defined per analyzer or contest

Leaderboard & Rewards

Tie leaderboard rank to physical/digital rewards

Each leaderboard is unique to contest type

Results updated automatically from feed (if configured)

Social Voting System

After scan or contest pick, allow user to see % of other users who agreed

Adds real-time social layer to decision making

Prize Management System

Admin sets up reward tiers per contest

Users can see current prizes + track eligibility

Mobile Responsiveness

All user dashboard layouts must work seamlessly on mobile

Card layouts must scale and stack cleanly

🎯 NEXT STEPS SUGGESTION (OPTIONAL)
If you want to organize next steps based on priority and dependencies, I can break these down into:

Phase 1 – Core Token + Model Infrastructure

Phase 2 – Analyzer and Page Builder

Phase 3 – Gamification & Leaderboards

Phase 4 – Campaign Ads + Revenue Systems

Phase 5 – User Dashboard Polishing + UX Flow

Let me know if you want this version of the roadmap.

