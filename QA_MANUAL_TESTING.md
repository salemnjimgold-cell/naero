# Naero V2 — Manual QA Testing Checklist

**App:** Naero (Expo React Native)  
**Target:** Android & iOS  
**Tester:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
**Date:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
**Device/OS:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  

---

## 1. Splash Screen
- [ ] App launches without crash
- [ ] Naero logo animates in (scale 0.6→1, fade in)
- [ ] "Not a stranger anymore" tagline fades in
- [ ] "Your guide to a new home" subtitle appears
- [ ] Cyan glow pulse animation is visible behind logo
- [ ] After ~2.8s, transitions to Onboarding (not Auth directly)
- [ ] Dark background (`#070B14`) shows immediately — no white flash

## 2. Onboarding Screen
- [ ] 3 slides are swipeable left/right
- [ ] Slide 1: "Discover Your New Home" with compass icon
- [ ] Slide 2: "Join a Community" with people icon
- [ ] Slide 3: "AI-Powered Guidance" with Naero robot mascot
- [ ] "Skip" button in top-right works → goes to Auth
- [ ] Dots indicator animates width/opacity with scroll
- [ ] Bottom-right arrow button works → advances slides
- [ ] On last slide, arrow becomes checkmark
- [ ] Checkmark tap → navigates to Auth screen
- [ ] Back gesture/swipe works

## 3. Auth Screen
- [ ] Screen loads with dark gradient background
- [ ] Back arrow works → returns to Onboarding
- [ ] "Sign In" / "Sign Up" pill toggle works (cyan active)
- [ ] **Sign In mode:**
  - [ ] Email field accepts input
  - [ ] Password field accepts input
  - [ ] Eye toggle shows/hides password
  - [ ] "Forgot password?" link visible (not active)
- [ ] **Sign Up mode:**
  - [ ] Full Name field appears
  - [ ] Email field accepts input
  - [ ] Password field with eye toggle
- [ ] "Sign In" / "Create Account" gradient button is tappable
- [ ] Tap submit → navigates to Main (tabs)
- [ ] Google/Apple/Facebook social buttons visible and tappable
- [ ] Terms text at bottom displayed correctly
- [ ] Keyboard pushes content up (iOS) or overlays properly (Android)
- [ ] No cut-off on small screens (e.g. iPhone SE)

## 4. Tab Navigation
- [ ] 5 tabs visible at bottom: Home, Explore, Services, Community, Profile
- [ ] Tab icons are cyan when active, grey when inactive
- [ ] Tab bar has dark background (`#0F172A`) with top border
- [ ] Tapping each tab loads correct screen
- [ ] Tab labels use translated strings (en by default)
- [ ] Smooth transition between tabs

## 5. Home Screen
- [ ] Hero section: emoji wave, "Welcome" title, "Your guide..." subtitle
- [ ] Naero robot mascot visible (right side of hero)
- [ ] 3 quick action cards row:
  - [ ] "AI Assistant" — cyan-green gradient, tappable → opens AI screen
  - [ ] "Safety Tips" — glass card, tappable → opens Safety screen
  - [ ] "Jobs" — glass card, tappable → opens Jobs screen
- [ ] "Explore Categories" section header with grid of 10 category icons
- [ ] Each category icon matches its color (restaurant=orange, healthcare=green, etc.)
- [ ] Tapping a category → navigates to Explore tab
- [ ] "Featured Places" section header with horizontal carousel
- [ ] Place cards show: placeholder image, name, rating, tags
- [ ] Heart icon on each place card works (toggles favorite)
- [ ] "Latest from Community" section with 3 post cards
- [ ] Post cards show: avatar, author, content (3 lines max), likes/comments
- [ ] Tapping a post → navigates to CommunityDetail
- [ ] **AI Floating Button** — bottom-right, cyan-green gradient, sparkles icon
- [ ] Tapping AI button → opens AI screen
- [ ] Scroll fades header (emojis/title) — sticky header appears on scroll
- [ ] Scroll down reveals tab bar correctly (no overlap)

## 6. Explore Screen
- [ ] Search bar at top with search icon
- [ ] Typing filters places by name/tags/description
- [ ] "X" clear button appears when text entered
- [ ] Horizontal category chip row below search
- [ ] Tapping a chip filters grid by that category; active chip is cyan
- [ ] Tapping active chip again clears filter
- [ ] Places displayed in 2-column grid
- [ ] Each place card shows: image placeholder, name, rating, tags
- [ ] Heart favorite toggle works on each card
- [ ] Tapping a card → navigates to PlaceDetail
- [ ] "No places found" empty state when filter yields no results
- [ ] FlatList scrolls smoothly (no jank)

## 7. Services Screen
- [ ] "Services" title + subtitle at top
- [ ] Horizontal category chip row: All, Legal, Translation, Housing, etc.
- [ ] "All" chip is active by default (cyan)
- [ ] Tapping a chip filters list
- [ ] Service cards show: category icon, name, provider, price
- [ ] Tapping a card → navigates to ServiceDetail
- [ ] Empty state shows when no results

## 8. Community Screen
- [ ] "Community" title + subtitle with robot mascot
- [ ] "Create Post" bar with avatar + "Write a post..." placeholder
- [ ] Add-circle button visible
- [ ] Community post list with 6 posts
- [ ] Each post has: colored avatar, author name, timestamp, type badge (Post/Review/Tip/Alert)
- [ ] Post content truncated to 3 lines
- [ ] Like count, comment count visible per post
- [ ] Tapping a post → navigates to CommunityDetail
- [ ] Empty state shown if no posts

## 9. Jobs Screen
- [ ] "Jobs & Opportunities" title + subtitle
- [ ] Filter funnel icon in header (tappable — no action yet, visual only)
- [ ] Horizontal type chip row: Full-Time, Part-Time, Freelance, etc.
- [ ] Tapping a chip filters jobs by type; active chip is cyan
- [ ] Job cards show: icon, title, company, bookmark toggle
- [ ] Job meta: type, location, salary
- [ ] Tags visible on each card (up to 3)
- [ ] Bookmark toggle saves/unsaves job
- [ ] Tapping a card → navigates to JobDetail
- [ ] "No jobs found" empty state

## 10. Safety Screen
- [ ] Back arrow returns to previous screen
- [ ] "Safety & Local Tips" title + subtitle
- [ ] Emergency contacts grid:
  - [ ] General Emergency (full-width, cyan-green gradient) — tappable, dials 112
  - [ ] Ambulance — tappable, dials 104
  - [ ] Police — tappable, dials 107
  - [ ] Fire — tappable, dials 105
  - [ ] Tourist Police — tappable
- [ ] Safety Tips section with collapsible cards
- [ ] Tapping a tip card expands content
- [ ] Tapping again collapses
- [ ] Severity icons/colors: critical=red, important=amber, info=blue
- [ ] Scroll works through all content

## 11. AI Chat Screen
- [ ] Opens from Home AI card or AI floating button
- [ ] Back arrow returns to previous screen
- [ ] Header: robot mascot, "Naero AI" title, "Ask me anything..." subtitle
- [ ] Trash icon clears chat
- [ ] Welcome greeting message visible
- [ ] Text input at bottom with placeholder
- [ ] Send button (cyan-green gradient circle) — disabled when input empty
- [ ] Type a question, tap send → user message appears
- [ ] "Thinking..." indicator shows while processing
- [ ] Predefined responses based on keywords:
  - [ ] "how"/"residency"/"apply" → residency info
  - [ ] "find"/"housing"/"apartment" → housing info
  - [ ] "translate" → translation help
  - [ ] "document"/"work"/"visa" → document info
  - [ ] Other → generic help prompt
- [ ] AI response appears with sparkle avatar
- [ ] Messages scroll to bottom automatically
- [ ] KeyboardAvoidingView works (iOS padding, Android height)
- [ ] Trash icon clears all messages, keeps welcome greeting

## 12. Community Detail Screen
- [ ] Opens from Community post tap
- [ ] Header shows "Post" title with back arrow
- [ ] Full post card: avatar, author, timestamp, type badge
- [ ] Full post content displayed
- [ ] Like/heart button — toggles liked state, count updates
- [ ] Comment count shows (initial + added)
- [ ] Share button visible
- [ ] Comments section shows added comments
- [ ] "Write a comment..." input at bottom with send icon
- [ ] Adding a comment appends it to list
- [ ] Empty state when no comments yet

## 13. Place Detail Screen
- [ ] Opens from Explore place card or Home featured place
- [ ] Image placeholder at top
- [ ] Back arrow and heart toggle in overlay
- [ ] Price badge top-right (e.g. "$", "$$")
- [ ] Dark gradient overlay at bottom of image
- [ ] Name, star rating, review count
- [ ] Address with location pin icon
- [ ] Tags row
- [ ] Description section
- [ ] Hours section (if available)
- [ ] Contact/phone section (if available)
- [ ] Bottom action bar:
  - [ ] "Call" button (cyan-green gradient) → opens phone dialer
  - [ ] "Directions" button (outline) → opens Google Maps
- [ ] Content scrolls behind action bar properly

## 14. Service Detail Screen
- [ ] Opens from Services screen tap
- [ ] Back arrow in header
- [ ] Category icon in large circle
- [ ] Service name centered
- [ ] Provider name
- [ ] Price badge
- [ ] Description section
- [ ] Location section with map link
- [ ] Hours section (if available)
- [ ] Contact section
- [ ] Bottom action bar: Call (gradient) + Directions (outline)

## 15. Job Detail Screen
- [ ] Opens from Jobs screen tap
- [ ] Header with back arrow + bookmark toggle
- [ ] Type badge (Full-Time/Part-Time/etc.) with matching color
- [ ] Job title
- [ ] Company name
- [ ] Location + salary meta row
- [ ] Description section
- [ ] Requirements section (numbered list with checkmarks)
- [ ] Tags section
- [ ] Bottom "Apply Now" button (cyan-green gradient) → opens email client

## 16. Profile Screen
- [ ] User avatar circle with edit pencil badge
- [ ] "Guest User" name, "guest@naero.app" email
- [ ] Stats row: Saved Items count, Saved Jobs count
- [ ] Menu list in glass card:
  - [ ] Settings → navigates to Settings screen
  - [ ] Saved (heart icon) — visual only
  - [ ] Saved Jobs — visual only
  - [ ] Language → opens Language Modal
  - [ ] About → navigates to About screen
  - [ ] Share App → opens native share sheet
  - [ ] Rate App → opens app store URL
- [ ] "Log Out" button (red outline) — tappable
- [ ] Version text at bottom ("Version 1.0.0")

## 17. Settings Screen
- [ ] Back arrow returns to Profile
- [ ] "Settings" title centered
- [ ] Language row → opens Language Modal
- [ ] Notifications row — tappable
- [ ] Privacy Policy row — tappable
- [ ] Terms of Service row — tappable

## 18. About Screen
- [ ] Back arrow returns to Profile
- [ ] NaeroLogo displayed large
- [ ] "Not a stranger anymore" tagline in cyan
- [ ] "Our Mission" card with description text
- [ ] "Who We Serve" card with tag chips (Foreigners, Travelers, etc.)
- [ ] "Connect" card with links:
  - [ ] Website → opens naero.me
  - [ ] Instagram → opens Instagram
  - [ ] Twitter/X → opens Twitter
  - [ ] Contact Us → opens mailto
- [ ] "Naero v1.0.0" version text

## 19. Language Switching
- [ ] Open Language Modal from Profile → Language
- [ ] 4 languages visible: English, العربية, Français, Magyar
- [ ] Active language shows checkmark
- [ ] Tap Arabic → UI switches to RTL Arabic
- [ ] Tap English → UI switches back to LTR English
- [ ] Tap French → French translations appear
- [ ] Tap Hungarian → Hungarian translations appear
- [ ] Language persists after app restart (AsyncStorage)

## 20. Cross-Platform Visual Test

### Android
- [ ] Status bar icons are light (white) on dark background
- [ ] Tab bar height is correct (65px)
- [ ] No notch/clip issues on various screen sizes
- [ ] Back button hardware works
- [ ] Keyboard does not overlap input fields
- [ ] Navigation animations smooth

### iPhone
- [ ] Status bar is light (white) on dark bg
- [ ] Safe area insets respected (notch, home indicator)
- [ ] Tab bar height is correct (85px with home indicator)
- [ ] Bottom sheets/margins respect home indicator
- [ ] KeyboardAvoidingView works correctly
- [ ] Gesture navigation works (swipe back)
- [ ] No layout shift on screen rotation (portrait-locked)

---

## Notes / Bugs Found

| # | Screen | Issue | Status |
|---|--------|-------|--------|
|   |        |       |        |
|   |        |       |        |
|   |        |       |        |

---

*Generated by Naero V2 QA — Review all items before sign-off.*
