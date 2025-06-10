# Stripe Integration Plan for Sports Genius

## Current Token System (Already Built)
- ✅ `user_tokens` table with balance tracking
- ✅ `token_transactions` table for usage logging
- ✅ `model_token_settings` table for AI model costs
- ✅ Edge functions that deduct tokens when using AI models

## Missing Stripe Components

### 1. Database Tables Needed
```sql
-- Stripe customer mapping
CREATE TABLE stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subscription tracking
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  status text NOT NULL, -- active, canceled, past_due, etc.
  plan text NOT NULL, -- rookie, pro_edge, mvp_elite
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Token packages for one-time purchases
CREATE TABLE token_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tokens integer NOT NULL,
  price_cents integer NOT NULL,
  stripe_price_id text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

### 2. Stripe Products to Create
**Subscription Plans:**
- Rookie: Free (20 tokens/month)
- PRO Edge: $39/month (2000 tokens/month)
- MVP Elite: $99/month (5000 tokens/month)

**Token Packages (one-time purchases):**
- 100 tokens: $9.99
- 500 tokens: $39.99
- 1000 tokens: $69.99
- 2500 tokens: $149.99

### 3. Edge Functions Needed
- `create-checkout-session` - For subscription signup
- `create-token-checkout` - For token purchases
- `stripe-webhook` - Handle payment events
- `manage-subscription` - Cancel/update subscriptions

### 4. Frontend Components Needed
- Stripe checkout integration in pricing page
- Subscription management in user dashboard
- Token purchase modal/page
- Payment history page
- Billing settings page

### 5. Token Allocation Logic
**Monthly Token Allocation:**
```typescript
// When subscription renews, add monthly tokens
const monthlyTokens = {
  rookie: 20,
  pro_edge: 2000,
  mvp_elite: 5000
};

// On successful subscription payment
await supabase.from('user_tokens').upsert({
  user_id,
  balance: currentBalance + monthlyTokens[plan]
});
```

**One-time Token Purchases:**
```typescript
// When token package is purchased
await supabase.from('user_tokens').update({
  balance: currentBalance + purchasedTokens
}).eq('user_id', user_id);

// Log the transaction
await supabase.from('token_transactions').insert({
  user_id,
  tokens_deducted: -purchasedTokens, // Negative = addition
  type: 'purchase'
});
```

## Implementation Priority
1. **Database schema** for Stripe integration
2. **Stripe webhook** for payment processing
3. **Subscription checkout** flow
4. **Token purchase** flow
5. **Subscription management** UI
6. **Admin dashboard** for payment monitoring

## Current Pricing Structure
- Rookie: Free (20 tokens)
- PRO Edge: $39/month (2000 tokens) 
- MVP Elite: $99/month (5000 tokens)

The token system backend is ready - just needs Stripe payment processing connected to it.