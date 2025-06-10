# Sports Genius AI Platform

## Project Overview

Sports Genius is an AI-powered sports betting analysis platform that helps users make data-driven wagering decisions. The platform uses advanced AI models to analyze betting slips, provide insights on player props, predict game outcomes, and evaluate parlay bets.

## Core Features

### AI-Powered Analysis
- **Image Processing**: Upload betting slips for instant AI analysis
- **Player Props Insights**: Get detailed player performance predictions
- **Line Movement Tracking**: Track betting line movements in real-time
- **Parlay Evaluation**: Analyze risk and potential return of parlay bets
- **DFS Optimization**: AI-generated recommendations for fantasy lineups

### Token Economy
- **Token-Based Access**: Users spend tokens to access AI models
- **Subscription Tiers**: Different plans provide monthly token allocations
- **One-Time Purchases**: Buy additional tokens as needed
- **Usage Tracking**: Detailed history of token transactions

### Gamification
- **Achievements System**: Unlock badges and earn XP for platform activities
- **Leaderboards**: Compete with other users based on prediction accuracy
- **Contests**: Enter prediction contests using tokens with prize pools
- **Social Voting**: Vote on community predictions and see consensus

### Monetization
- **Subscription Model**: Tiered pricing with different token allocations
- **Token Packages**: One-time purchases for additional tokens
- **Affiliate Marketing**: Targeted ad placements for sportsbooks and betting services

## Technical Architecture

### Database Schema

#### User Management
- `profiles`: Core user profile data
- `user_tokens`: Token balances for each user
- `user_xp`: Experience points and level tracking
- `user_badges`: Badges earned by users
- `user_achievements`: Progress toward achievements
- `user_streaks`: Activity streak tracking

#### AI System
- `ai_models`: Model configurations for different sports and bet types
- `model_versions`: Version history for AI models
- `model_token_settings`: Token costs for using each model
- `analyzer_requests`: User requests for analysis
- `analyzer_responses`: AI-generated analysis results

#### Contest System
- `contests`: Prediction contests with token costs and prize pools
- `prediction_cards`: Individual prediction questions
- `contest_entries`: User entries in contests
- `social_votes`: Community voting on predictions

#### Monetization
- `ads`: Affiliate ad campaigns
- `ad_placements`: Locations where ads can appear
- `ad_placement_assignments`: Which ads show in which placements
- `ad_impressions`: Tracking ad views
- `ad_clicks`: Tracking ad clicks

#### Admin System
- `admin_roles`: Role definitions with permissions
- `admin_role_assignments`: User role assignments
- `admin_activity_logs`: Audit trail of admin actions

### Edge Functions

#### Token Management
- `deduct-tokens`: Handle token deductions for model usage
- `enter-contest`: Process contest entries and token spending

#### AI Processing
- `run-analyzer`: Execute AI analysis on user inputs
- `analyzer-with-tokens`: Combined token check and analysis

#### Engagement
- `update-user-streak`: Update user activity streaks
- `check-achievements`: Check and award achievements
- `social-vote`: Process community votes

#### Monetization
- `track-ad-impression`: Log ad impressions
- `track-ad-click`: Track ad clicks

### Frontend Components

#### Admin Dashboard
- Model management
- User management
- Contest administration
- Ad campaign management
- Analytics and reporting

#### User Interface
- Landing page with marketing content
- User dashboard
- Analyzer interface with image upload
- Results display with insights
- Profile and achievements page

## Implementation Status

### Completed
- Database schema design and implementation
- Core backend logic for token system
- Admin dashboard UI components
- User authentication flow
- Basic analyzer interface
- Achievements and gamification system
- Ad management system

### In Progress
- Stripe integration for payments
- Real AI model execution
- Contest resolution system
- Mobile optimization

### Planned
- Admin page builder
- Enhanced analytics dashboard
- API documentation
- Performance optimization

## Development Roadmap

### Phase 1 – Core Token + Model Infrastructure
- Complete Stripe integration
- Implement real AI model execution with LLM providers
- Finalize token transaction system

### Phase 2 – Analyzer and Page Builder
- Enhance analyzer UI and results display
- Implement image processing for betting slips
- Create admin page builder interface

### Phase 3 – Gamification & Leaderboards
- Complete contest resolution system
- Enhance achievement tracking
- Implement leaderboard functionality

### Phase 4 – Campaign Ads + Revenue Systems
- Optimize ad targeting
- Implement A/B testing for ad placements
- Add conversion tracking

### Phase 5 – User Dashboard Polishing + UX Flow
- Mobile responsiveness improvements
- Add micro-interactions and animations
- Optimize performance

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI**: OpenAI API, Claude API (configurable)
- **Payments**: Stripe
- **Deployment**: Netlify/Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payment processing)

### Installation
1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Supabase credentials
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start the development server

### Configuration
1. Set up Supabase project with the provided migrations
2. Configure Stripe products and prices according to STRIPE_INTEGRATION_PLAN.md
3. Set up LLM provider API keys in the admin dashboard

## Contributing

Please read our contribution guidelines before submitting pull requests.

## License

This project is proprietary and confidential. All rights reserved.