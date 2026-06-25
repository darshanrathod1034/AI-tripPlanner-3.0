# Personalized Recommendation System — Research & Implementation Guide

## Overview

This guide covers everything needed to build a personalized travel recommendation system for AI Trip Planner. The system collects lightweight user preferences at signup (optional), stores them, and uses them to tailor AI-generated itineraries and destination recommendations.

---

## 1. What Data to Collect from Users

Based on travel recommendation research and current industry practice, these are the highest-signal preference dimensions for travel personalization:

### Core Preference Dimensions

| Signal | Why It Matters | Options |
|--------|---------------|---------|
| **Age Group** | Travel style and activity tolerance vary significantly by age | 18–24, 25–34, 35–44, 45–59, 60+ |
| **Travel Style** | Most impactful single signal — shapes everything | Adventure, Relaxation, Culture, Party/Nightlife, Family, Luxury, Backpacker |
| **Interests** | Directly maps to destination types | Nature, History, Nightlife, Shopping, Food & Cuisine, Art & Museums, Sports, Wellness/Spa |
| **Budget Range** | Filters recommendations by price tier | Budget (<$1000), Moderate ($1000–$3000), Luxury ($3000+) |
| **Group Type** | Affects accommodation and activity selection | Solo, Couple, Friends, Family with Kids |
| **Trip Pace** | Relaxed vs packed itineraries | Slow (2–3 places/day), Medium (4–5), Fast (6+ places/day) |

### What NOT to Collect at Signup
- Specific destinations (too early, changes every trip)
- Exact dates (irrelevant at signup)
- Personal details beyond the above (privacy concern)

---

## 2. How the Onboarding Popup Should Work

### UX Best Practices (from Mixpanel, Braze, Amplitude research)

**Trigger:** Show popup on first dashboard visit after signup — NOT during signup itself. Let the user land, breathe, then ask.

**Format:** Multi-step card (not a form). Each step = 1 question with visual chips.

**Rules:**
- Max 4 steps, max 60 seconds to complete
- Always visible "Skip" button on every step
- Progress indicator (Step 1 of 4)
- Never block the UI — it's a dialog, not a gate
- Save partial answers (if user skips step 3, save steps 1 and 2)

### Popup Flow (4 Steps)

```
Step 1: "What kind of traveler are you?"
→ [Adventure 🧗] [Relaxation 🏖️] [Culture 🏛️] [Nightlife 🎉] [Family 👨‍👩‍👧] [Luxury ✨]

Step 2: "What do you love most?"  (multi-select)
→ [Nature 🌿] [History 🏺] [Food 🍜] [Shopping 🛍️] [Nightlife 🍸] [Art 🎨] [Wellness 🧘] [Sports ⚽]

Step 3: "How old are you?"  (optional, helps a lot)
→ [18–24] [25–34] [35–44] [45–59] [60+]  + [Prefer not to say]

Step 4: "Who do you usually travel with?"
→ [Solo 🧳] [Couple ❤️] [Friends 👥] [Family 👨‍👩‍👧‍👦]
```

---

## 3. Backend: Where to Store It

### User Model Changes (already have `preferences: [String]`)

Extend the existing `preferences` field or add a dedicated `travelProfile` object:

```js
travelProfile: {
  travelStyle:  String,           // 'adventure' | 'relaxation' | 'culture' | ...
  interests:    [String],          // ['nature', 'history', 'nightlife', ...]
  ageGroup:     String,            // '18-24' | '25-34' | ...
  groupType:    String,            // 'solo' | 'couple' | 'friends' | 'family'
  budget:       String,            // 'budget' | 'moderate' | 'luxury'
  tripPace:     String,            // 'slow' | 'medium' | 'fast'
  completedAt:  Date,              // when they filled it out
}
```

### API Endpoints Needed

```
POST /users/preferences          → save/update travel profile (authenticated)
GET  /users/preferences          → get current travel profile (authenticated)
```

---

## 4. How to Use the Profile in Recommendations

### A. Inject into AI Itinerary Prompt (Easiest Win)

The biggest immediate impact is passing the user profile to the AI generation service (`generateAIItinerary.js`). Instead of generic prompts, build a personalized system prompt:

```js
// In generateAIItinerary.js
function buildPersonalizedPrompt(user, destination, startDate, endDate, budget) {
  const profile = user.travelProfile;
  
  let personalContext = '';
  
  if (profile?.travelStyle) {
    personalContext += `Travel style: ${profile.travelStyle}. `;
  }
  if (profile?.interests?.length) {
    personalContext += `Interests: ${profile.interests.join(', ')}. `;
  }
  if (profile?.ageGroup) {
    personalContext += `Age group: ${profile.ageGroup}. `;
  }
  if (profile?.groupType) {
    personalContext += `Traveling as: ${profile.groupType}. `;
  }
  if (profile?.tripPace) {
    personalContext += `Preferred trip pace: ${profile.tripPace}. `;
  }

  return `
    Generate a ${dayCount}-day itinerary for ${destination}.
    ${personalContext}
    Budget: ${budget}.
    
    Prioritize activities that match the user's interests and travel style.
    For adventure travelers: include hiking, outdoor activities, extreme sports.
    For culture travelers: prioritize museums, historical sites, local experiences.
    For relaxation: spas, beaches, scenic viewpoints, low-key cafes.
    For nightlife: rooftop bars, night markets, live music, clubs.
    For families: family-friendly attractions, parks, avoid late-night activities.
  `;
}
```

### B. Personalize Dashboard Recommendations (Medium effort)

The existing `recommendationService.js` uses Google Places API. Extend it to filter by user interests:

```js
// Map user interests → Google Places types
const INTEREST_TO_PLACE_TYPE = {
  nature:    'natural_feature|park|campground',
  history:   'museum|church|hindu_temple|cemetery',
  nightlife: 'bar|night_club|casino',
  shopping:  'shopping_mall|store|market',
  food:      'restaurant|cafe|bakery',
  art:       'art_gallery|museum',
  wellness:  'spa|gym|yoga',
  sports:    'stadium|sports_complex',
};

// Use in Google Places text search query
const query = userInterests.length > 0
  ? `${userInterests[0]} attractions in ${destination}`
  : `tourist attractions in ${destination}`;
```

### C. Hybrid Scoring (Advanced)

Once you have enough data (50+ users with profiles), add a scoring layer that combines:

1. **Profile match score** (0–1): How well does a destination match the user's interests?
2. **Collaborative score** (0–1): What do similar users (same age group + interests) like?
3. **Popularity score** (0–1): Overall rating of the place

```
Final Score = 0.5 × ProfileMatch + 0.3 × CollaborativeScore + 0.2 × Popularity
```

---

## 5. Implementation Phases

### Phase 1 — Data Collection (1–2 days)
- [ ] Add `travelProfile` to User model
- [ ] Add `POST /users/preferences` and `GET /users/preferences` endpoints
- [ ] Build the onboarding popup component (4-step modal)
- [ ] Show popup on first dashboard visit (use `localStorage` flag `hasSeenOnboarding`)
- [ ] Allow users to edit preferences in Account → Profile Settings

### Phase 2 — AI Prompt Personalization (1 day)
- [ ] Pass user's `travelProfile` to `generateAIItinerary.js`
- [ ] Build `buildPersonalizedPrompt()` helper
- [ ] Test with different profiles → verify output changes

### Phase 3 — Dashboard Recommendations (2–3 days)
- [ ] Pass user interests to `recommendationService.js`
- [ ] Filter Google Places API query by interest type
- [ ] Show "Recommended for you based on your interests" label on dashboard

### Phase 4 — Learning from Behavior (Future)
- [ ] Track which destinations user saves, trips they generate
- [ ] Infer implicit preferences from behavior
- [ ] Re-rank recommendations based on implicit + explicit signals

---

## 6. Frontend Component Architecture

```
src/
  components/
    OnboardingModal/
      OnboardingModal.jsx        ← Main wrapper, step controller
      Step1TravelStyle.jsx       ← Visual chip selector
      Step2Interests.jsx         ← Multi-select chips
      Step3AgeGroup.jsx          ← Single select
      Step4GroupType.jsx         ← Single select
      ProgressBar.jsx            ← Step 1 of 4
  hooks/
    useOnboarding.js             ← Checks if user has seen it, manages state
```

### Trigger Logic (in Dashboard.jsx)

```js
// Show onboarding if:
// 1. User is logged in
// 2. They haven't completed/skipped it yet
// 3. They don't have a travelProfile yet

useEffect(() => {
  const hasSeenOnboarding = localStorage.getItem(`onboarding_${user._id}`);
  if (!hasSeenOnboarding && !user.travelProfile?.completedAt) {
    setShowOnboarding(true);
  }
}, [user]);

// On skip or complete:
localStorage.setItem(`onboarding_${user._id}`, 'seen');
```

---

## 7. Interest → Destination Mapping (Reference)

Use this to map user interests to destination keywords for better AI prompts and Google Places queries:

| Interest | AI Prompt Keywords | Google Places Types |
|----------|-------------------|-------------------|
| Nature | hiking, national parks, waterfalls, forests, wildlife | park, natural_feature, campground |
| History | ancient ruins, UNESCO sites, castles, museums, temples | museum, church, hindu_temple |
| Nightlife | bars, clubs, rooftop lounges, night markets, live music | night_club, bar, casino |
| Shopping | markets, malls, boutiques, souvenirs, local crafts | shopping_mall, store |
| Food | street food, fine dining, food tours, local cuisine, cafes | restaurant, cafe, bakery |
| Art | galleries, street art, opera houses, theaters, studios | art_gallery, museum |
| Wellness | spas, yoga retreats, hot springs, meditation centers | spa, gym |
| Sports | stadiums, adventure sports, climbing, surfing, cycling | stadium, sports_complex |

---

## 8. Age Group Behavior Patterns (Research-backed)

Based on travel industry research, these patterns help tune recommendations:

| Age Group | Travel Patterns | Preferred Activities |
|-----------|----------------|---------------------|
| 18–24 | Budget-conscious, social, spontaneous | Nightlife, adventure, backpacker hostels, Instagram spots |
| 25–34 | Mix of adventure and comfort, work-life balance | City breaks, culture, food, moderate luxury |
| 35–44 | Higher budget, time-efficient, often with partner | Hotels, curated experiences, fine dining, shorter but richer trips |
| 45–59 | Comfort-first, heritage travel, cruises | Culture, history, relaxation, scenic tours |
| 60+ | Guided tours, accessibility-aware, heritage | Historical sites, scenic routes, accessible activities |

Use this to adjust:
- Budget defaults in the AI prompt
- Activity intensity level
- Accommodation type suggestions
- Number of places per day (pace)

---

## 9. Privacy Considerations

- Age group and gender are **optional** — never require them
- Store only what's needed — no need for exact birthdate, just age group
- Let users delete/reset their profile at any time (Account settings)
- Never share individual profiles — only use aggregated data for collaborative filtering
- Add a note in the popup: "This helps us personalize your trips. We never share your data."

---

## 10. Quick-Win Summary

In order of impact vs effort:

| Priority | Change | Effort | Impact |
|----------|--------|--------|--------|
| 🔥 High | Inject profile into AI prompt | 1 day | Very High — immediately better itineraries |
| 🔥 High | Onboarding popup (data collection) | 2 days | Foundation for everything else |
| ⚡ Medium | Filter Google Places by interest | 1 day | Better dashboard recs |
| ⚡ Medium | Show "personalized for you" UI label | 0.5 days | User trust & engagement |
| 🌱 Low | Collaborative filtering by age group | 3–5 days | Better cold-start recs |
| 🌱 Low | Implicit preference learning from behavior | 1 week | Long-term intelligence |

---

## Sources

- Cornell Hospitality Research: AI travel planning adoption across spending segments (2026)
- Nature.com: Deep neural collaborative filtering for personalized travel recommendation (2025)
- MDPI Electronics: Collaborative filtering for touristic attractions (2023)
- IdeaUsher: AI travel recommendation engine development guide (2026)
- Mixpanel: User onboarding best practices (2026)
- Braze: Preference survey using in-app messages
