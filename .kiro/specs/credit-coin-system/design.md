# Design Document: Credit Coin System

## Overview

The Credit Coin System adds a gamification and referral layer to the Trip Planner app. Credits are stored on the user document, transactions are tracked in a separate collection, and the frontend displays the balance in the Navbar with a dedicated wallet/referral section in the Account page.

## Architecture

### Backend

```
backend/
  models/
    creditTransaction-model.js   ← new: transaction ledger
  routes/
    creditRouter.js              ← new: /credits/* endpoints
  middlewares/
    checkCredits.js              ← new: deduct-before-AI guard
  (user-model.js updated)        ← add credits, referralCode, referredBy fields
  (authRouter.js updated)        ← handle referralCode on register
  (airoutes.js updated)          ← wrap AI generation with credit deduction/refund
```

### Frontend

```
frontend/src/
  context/
    authContext.jsx              ← expose credits in user state, add refreshCredits()
  components/
    CreditBadge.jsx              ← new: coin icon + balance shown in Navbar
  pages/
    AccountPage.jsx              ← add Wallet tab: balance, history, referral code + copy
  pages/
    Signup.jsx                   ← add optional referral code input field
```

## Data Models

### User Model (updated fields)

```js
credits:      { type: Number, default: 5, min: 0 }
referralCode: { type: String, unique: true, sparse: true }
referredBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null }
```

### CreditTransaction Model (new)

```js
{
  userId:          ObjectId  // owner of this transaction
  type:            String    // 'signup_bonus' | 'itinerary_generation' | 'referral_reward' | 'refund'
  amount:          Number    // positive = earned, negative = spent
  balanceAfter:    Number    // snapshot of balance after this tx
  relatedUserId:   ObjectId  // optional: the referred user or referrer
  createdAt:       Date
}
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /credits/balance | ✅ | Get current credit balance |
| GET | /credits/transactions | ✅ | Get transaction history (desc) |
| GET | /credits/referral-code | ✅ | Get own referral code |
| POST | /auth/register | ❌ | Register; accepts optional `referralCode` body field |

Credit deduction for AI generation is handled inside `airoutes.js` directly (not a separate endpoint) using a `deductCredit` / `refundCredit` helper.

## Credit Flow

### Signup (no referral)
1. `User.create(...)` with `credits: 5`, generate unique `referralCode`
2. Insert CreditTransaction `{ type: 'signup_bonus', amount: 5 }`

### Signup (with referral code)
1. Validate referral code → find referrer
2. `User.create(...)` with `credits: 5`, `referredBy: referrer._id`
3. Insert CreditTransaction for new user `{ type: 'signup_bonus', amount: 5 }`
4. Atomically `$inc` referrer credits by 25
5. Insert CreditTransaction for referrer `{ type: 'referral_reward', amount: 25 }`

### AI Itinerary Generation
1. `isLoggedIn` middleware runs
2. Check `user.credits >= 1` → if not, return 402 with `{ error: 'insufficient_credits' }`
3. Atomically `$inc` credits by -1, insert CreditTransaction `{ type: 'itinerary_generation', amount: -1 }`
4. Call `generateAIItinerary(...)`
5. If generation throws → atomically `$inc` credits by +1, insert CreditTransaction `{ type: 'refund', amount: 1 }`

### Atomic Credit Operations

Use MongoDB `findOneAndUpdate` with `$inc` to avoid race conditions:

```js
const updated = await User.findOneAndUpdate(
  { _id: userId, credits: { $gte: 1 } },   // guard in query
  { $inc: { credits: -1 } },
  { new: true }
);
if (!updated) throw new Error('insufficient_credits');
```

## Referral Code Generation

```js
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excludes 0,O,I,1
function generateCode() {
  return Array.from({ length: 8 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}
// retry up to 5 times for uniqueness
```

## Frontend Design

### CreditBadge (Navbar)

- Positioned left of the avatar in the authenticated nav
- Shows a gold coin emoji 🪙 + number
- Subtle pill shape: `bg-amber-50 border border-amber-200 text-amber-700`
- Animates count change with a brief scale pulse (framer-motion)
- Fetches balance on mount; `authContext` exposes `refreshCredits()`

### Account Page — Wallet Tab

Three sections:
1. **Balance card** — large coin icon, current balance, "1 credit = 1 AI trip"
2. **Referral card** — your code in a monospace box, copy-to-clipboard button with toast feedback
3. **Transaction history** — scrollable list, each row shows icon + label + ±amount + date

Transaction type icons:
- `signup_bonus` → 🎁
- `referral_reward` → 👥
- `itinerary_generation` → ✈️
- `refund` → ↩️

### Signup Page

- Optional "Referral Code" input below the existing fields
- Placeholder: `e.g. AB3X7YZ2`
- No validation on the frontend (server validates)

## Error Handling

| Scenario | HTTP | Frontend behaviour |
|----------|------|--------------------|
| Insufficient credits | 402 | Toast: "Not enough credits. Earn more by referring friends!" |
| Invalid referral code | 400 | Inline field error on signup |
| Self-referral | 400 | Inline field error on signup |
| Code generation failure | 500 | Generic server error |
