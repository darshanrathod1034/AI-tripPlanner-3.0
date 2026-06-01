# Implementation Plan

## Overview

End-to-end implementation of the Credit Coin System for the Trip Planner app. Backend tasks create the data model, service helpers, API routes, and AI route integration. Frontend tasks wire up the auth context, Navbar badge, Signup referral input, Account wallet tab, and CreateTrip error handling.

## Task Dependency Graph

```
1 ──┐
    ├──► 3
2 ──┤
    ├──► 4 ──► 6 ──► 7
    │              └──► 9
    └──► 5
              3 ──► 8
              4, 6 ──► 9
              5, 6 ──► 10
```

## Tasks

- [ ] 1. Backend — CreditTransaction model and credit helper utilities
  - Create `backend/models/creditTransaction-model.js` with fields: userId, type, amount, balanceAfter, relatedUserId, createdAt
  - Create `backend/services/creditService.js` with helpers: `generateReferralCode()`, `awardCredits(userId, amount, type, relatedUserId)`, `deductCredit(userId)`, `refundCredit(userId)`
  - `deductCredit` must use atomic `findOneAndUpdate` with `{ credits: { $gte: 1 } }` guard
  - _Requirements: 1, 2, 3, 9, 10_

- [ ] 2. Backend — Update User model with credit fields
  - Add `credits` (Number, default 5, min 0), `referralCode` (String, unique, sparse), `referredBy` (ObjectId ref users) to `backend/models/user-model.js`
  - _Requirements: 1, 3_

- [ ] 3. Backend — Update register route to award signup bonus and handle referral code
  - Depends on: 1, 2
  - In `backend/routes/authRouter.js` `/register` endpoint, after `User.create(...)`:
    - Call `generateReferralCode()` and save it on the user
    - Call `awardCredits(newUser._id, 5, 'signup_bonus')`
    - If `referralCode` body field provided: validate it exists, is not self-referral, find referrer, set `referredBy`, call `awardCredits(referrer._id, 25, 'referral_reward', newUser._id)`
    - Return 400 with appropriate message for invalid or self-referral codes
  - _Requirements: 1, 3, 4, 5_

- [ ] 4. Backend — Credit router (balance, transactions, referral code endpoints)
  - Depends on: 1, 2
  - Create `backend/routes/creditRouter.js` with:
    - `GET /credits/balance` → return `{ credits, referralCode }`
    - `GET /credits/transactions` → return transactions sorted by createdAt desc
    - `GET /credits/referral-code` → return `{ referralCode }`
  - Mount router in `backend/app.js` as `/credits`
  - _Requirements: 6, 7, 8_

- [ ] 5. Backend — Wrap AI itinerary route with credit deduction and refund
  - Depends on: 1, 2
  - In `backend/routes/airoutes.js` `/recommend` endpoint:
    - Before calling `generateAIItinerary`, call `deductCredit(userId._id)` — if it throws `insufficient_credits`, return 402
    - Wrap `generateAIItinerary` in try/catch; on failure call `refundCredit(userId._id)`
  - _Requirements: 2_

- [ ] 6. Frontend — Add credits to authContext and expose refreshCredits
  - Depends on: 4
  - In `frontend/src/context/authContext.jsx`:
    - Add `credits` state (number)
    - After `verifyToken` succeeds, also fetch `/credits/balance` and set credits
    - Add `refreshCredits()` function that re-fetches `/credits/balance` and updates state
    - Expose `credits` and `refreshCredits` from context
  - _Requirements: 6_

- [ ] 7. Frontend — CreditBadge component and Navbar integration
  - Depends on: 6
  - Create `frontend/src/components/CreditBadge.jsx` — amber pill with coin icon + credit count, framer-motion scale pulse on count change
  - Add `CreditBadge` to `frontend/src/components/Navbar.jsx` left of the avatar (authenticated state only)
  - _Requirements: 6_

- [ ] 8. Frontend — Add referral code input to Signup page
  - Depends on: 3
  - In `frontend/src/pages/Signup.jsx`:
    - Add optional "Referral Code" text input field
    - Include `referralCode` in the POST body to `/auth/register`
    - Show inline error if server returns invalid or self-referral error
  - _Requirements: 4_

- [ ] 9. Frontend — Wallet tab in AccountPage
  - Depends on: 4, 6
  - In `frontend/src/pages/AccountPage.jsx`:
    - Add a "Wallet" tab alongside existing tabs
    - Balance card: large coin icon, current balance, subtitle "1 credit = 1 AI trip"
    - Referral card: monospace code display, copy-to-clipboard button with "Copied!" toast
    - Transaction history list: icon per type, label, amount in green/red, relative date
    - Fetch transactions from `GET /credits/transactions` on tab open
    - Call `refreshCredits()` when tab opens to sync balance
  - _Requirements: 6, 7, 8_

- [ ] 10. Frontend — Show insufficient credits error on CreateTrip page
  - Depends on: 5, 6
  - In `frontend/src/pages/CreateTrip.jsx`:
    - After AI generation API call, if response status is 402, show a toast/banner: "Not enough credits. Earn more by referring friends!"
    - Call `refreshCredits()` after a successful generation to update the badge
  - _Requirements: 2, 6_

## Notes

- All credit balance mutations use MongoDB atomic `findOneAndUpdate` to prevent race conditions
- The `creditService.js` is the single source of truth for all credit operations
- Referral codes use 8 chars from `[A-Z2-9]` excluding ambiguous chars (0, O, I, 1)
- Frontend credits state lives in authContext so any component can read it
