# Learn Hebrew — Web App Analysis & Mobile Implementation Document

Analysis of the **"Learn Hebrew"** feature in the TorahSings web app (Next.js App Router),
prepared as a handoff spec for replicating it in a React Native mobile app.
Written 2026-07-16 against the web sources in this repo.

**This package contains everything the mobile team needs — no access to the web repo required:**

| File | Contents |
|---|---|
| `LEARN_HEBREW_IMPLEMENTATION.md` | this document |
| `data/lessons.json` | full curriculum — 3 lesson albums, 18 lessons, 54 exercises (extracted verbatim from `src/content/lessons/index.ts`) |
| `data/aleph-bet.json` | the 22-letter table — letter, name, pictographic sense, value (from `src/lib/derivation.ts`) |
| `data/types.ts` | portable TypeScript types matching both JSON files |
| `data/access.ts` | gating + publication rules, ported verbatim (this is the business logic — do not rewrite it) |

---

## 1. Entry point

The web app exposes Learn Hebrew as the third link in the primary navigation
(`SiteHeader`, row 2 — a horizontally scrolling, non-wrapping nav that visually reads
as a chip row):

```
Torah Sings · Hebraic Christianity · [ Learn Hebrew ] · Membership
```

- Tapping it performs **client-side route navigation** to `/learn-hebrew`.
  No modal, no in-place content swap.
- Active state: link is highlighted when `pathname.startsWith('/learn-hebrew')`
  (so the level detail pages keep the chip active too).

**Mobile:** the "LEARN HEBREW" chip in the app header should navigate (push or switch)
to the Learn Hebrew hub screen and render in its active style while the user is anywhere
inside the feature.

## 2. Navigation flow

```
Header chip "LEARN HEBREW"
   │
   ▼
[A] Learn Hebrew hub            (web: /learn-hebrew)
   │   tap any of the 3 level rows (locked rows navigate too — see §10)
   ▼
[B] Level detail                (web: /learn-hebrew/{slug})
   │   ├─ "← All levels" back link → [A]
   │   ├─ per-lesson "Practice · N questions" accordion (in-page)
   │   └─ MembershipGate CTA (only when level locked) → subscription flow
   ▼
  back → [A] → back → previous screen
```

- **Hierarchy:** two screens. Everything else (accordion, exercise answers) is in-page state.
- **Back behavior:** standard stack pop. Web additionally renders an explicit
  "← All levels" text link at the top of [B]; mobile should use its standard back
  affordance (header back button), optionally labeled "All levels".
- **Deep links (web):** `/learn-hebrew` and `/learn-hebrew/{slug}` are plain,
  statically generated URLs. Slugs: `the-aleph-bet-alive`, `first-words-and-roots`,
  `reading-the-paleo-layer`. Unknown or not-yet-released slug → 404.
  Mobile: register `learn-hebrew` and `learn-hebrew/:slug` if the app supports
  path-style deep links.

## 3. Screen A — Learn Hebrew hub

### UI hierarchy

```
Screen A
├─ App header (shared; LEARN HEBREW chip active)
├─ PageHero
│   ├─ Eyebrow "PRONG III · THE EMPOWERMENT"        (gold dot + mono caps — §14)
│   ├─ Title   "Learn Hebrew"                        (h1)
│   └─ Lede    "You do not need fluency. You need enough to open the text yourself
│               and see what is standing in it — the picture inside the letter, the
│               root under the word. Start where everyone starts. It is genuinely fun,
│               and it goes further than you expect."
├─ Section: Aleph-Bet teaser
│   ├─ Eyebrow "TWENTY-TWO LETTERS"
│   ├─ Tile row: 6 equal square tiles — א ב ג ד ה +17
│   │     (first 5 entries of aleph-bet.json; last tile is "+{22−5}")
│   │     web: each letter tile has tooltip "{name} — {sense}"; mobile may show
│   │     the sense on tap (small toast/caption) or omit — decorative, no navigation
│   └─ Caption "Each one was a picture before it was a sound. An ox. A house. A door.
│               Learn what they meant and the text starts speaking twice."
└─ Section: Three levels
    ├─ Eyebrow "THREE LEVELS"
    └─ LevelRow × 3 (one per published album, sorted by level):
        ├─ GlyphTile 62pt         glyph, tinted by album hue (§14)
        ├─ Kicker  "LEVEL {level} · {SUBTITLE}"       (mono caps)
        ├─ Title   {title}
        ├─ Meta    "{presenters joined with ' & '} · {lessons.length} lessons"
        │          + " · Members" when locked for the viewer
        └─ PlayDisc 40pt          unlocked: solid gold disc + play triangle
                                  locked:   hairline ring + small dot (keyhole)
```

Web layout is a 2-column grid (teaser left 0.9fr, levels right 1.1fr) that stacks
to one column under 980px — **mobile uses the stacked order: hero → teaser → levels.**

### Row content with today's data (guest viewer)

| Tile | Kicker | Title | Meta |
|---|---|---|---|
| א (hue 44) | LEVEL 1 · 22 LETTERS | The Aleph-Bet, Alive | Zev Inspire · 6 lessons |
| ב (hue 208) | LEVEL 2 · YOUR FIRST 40 WORDS | First Words & Roots | Zariah Inspire · 6 lessons · Members |
| ש (hue 276) | LEVEL 3 · SYMBOLS BEHIND THE SOUNDS | Reading the Paleo Layer | Zev Inspire & Zariah Inspire · 6 lessons · Members |

For a member, the "· Members" suffix disappears and all PlayDiscs render unlocked.

## 4. Screen B — Level detail

### UI hierarchy

```
Screen B (param: slug)
├─ Back affordance ("← All levels")
├─ Hero row
│   ├─ GlyphTile 128pt (web) → ~96pt mobile, hue-tinted
│   ├─ Eyebrow "LEVEL {level} · {SUBTITLE}"
│   ├─ Title {album.title} (h1)
│   └─ "Taught by {presenters joined with ' & '}"     (mono caps, faint)
├─ Intro paragraph {album.intro}
├─ LessonCard × 6 — for each lesson, with access = canOpenLesson(album, lesson.n, ent):
│   ├─ Head row:  "{n padded to 2}"  ·  {title}  ·  "{durationMinutes} min"
│   ├─ Summary paragraph {summary}
│   ├─ if LOCKED:
│   │    └─ note "UNLOCKS WITH MEMBERSHIP"            (mono caps, faint)
│   └─ if UNLOCKED:
│        ├─ if mediaUrl == null (all today):
│        │    └─ dashed-border note "LESSON FILM PENDING · EXERCISES BELOW ARE LIVE"
│        └─ if exercises.length > 0:
│             └─ Practice accordion (§5)
└─ MembershipGate (§6) — ONLY when canOpenLessonAlbum(album, ent).allowed == false
```

Unknown slug → "not found" fallback (web 404s).

## 5. Expandable section — the Practice accordion

The feature's only expandable pattern. One per unlocked lesson.

| Property | Behavior |
|---|---|
| Header | `▸ PRACTICE · {N} QUESTION(S)` — mono caps; singular "QUESTION" when N = 1 |
| Default | **collapsed** |
| Expand | web `<details>`: content appears instantly; the `▸` caret rotates 90° over 250ms (`cubic-bezier(0.22, 0.61, 0.36, 1)`). Mobile: animate the height (e.g. `LayoutAnimation.easeInEaseOut` / Reanimated, ~250ms) and rotate/swap the caret |
| Collapse | reverse of expand |
| Content | ExerciseCard × N (N = 3 everywhere today), separated by faint hairlines |
| Nesting | none |
| Independence | each lesson's accordion is independent — several may be open at once |
| Header hover/press | text brightens to gold (web hover) → mobile pressed-state feedback |

## 6. Components

### 6.1 Eyebrow
Mono-caps label: 11pt, letter-spacing ≈ 0.3em (mobile: 1.5–1.8), uppercase,
soft gold `#ffd877` at 85% opacity, optionally prefixed by a 6pt gold dot with a
soft glow (`#feca57`, shadow `rgba(201,168,74,0.75)`).

### 6.2 GlyphTile
Square, radius 12, hairline border, near-black base `#05070f` with a radial tint from
the album hue. Mobile approximation: `backgroundColor: hsla({hue}, 60%, 60%, 0.18)`
over `#05070f`, border `rgba(244,216,168,0.12)`. Glyph in ink `#f0ebe3`, sized ~55%
of the tile. Sizes: 62pt in list rows (50pt small screens), 128pt in the detail hero
(92pt small screens).

### 6.3 PlayDisc
- Unlocked: solid gold disc (gradient `#ffd877 → #feca57`), dark play triangle,
  40pt in lists.
- Locked: transparent disc, 1pt hairline ring, small centered dot.
- Inside a row it is **presentational** — the whole row is the touch target.

### 6.4 LevelRow
Card row (radius 12, card bg, hairline border, padding ≈ 22×24 → mobile 14–16) laid out
`[GlyphTile] [kicker/title/meta] [PlayDisc]`. Web hover lifts −3px with shadow and
turns the title gold; mobile uses pressed opacity/scale feedback. Entire row navigates.

### 6.5 LessonCard
Card (radius 12, card bg, hairline border, `overflow: hidden` so the accordion's top
hairline runs edge-to-edge). Head row baseline-aligned: number (mono, gold, 0.75
opacity), title (flex 1), duration (mono, faint). When the lesson is locked the whole
card renders at **62% opacity** with the "UNLOCKS WITH MEMBERSHIP" note in place of
media note + accordion.

### 6.6 ExerciseCard — the interactive core

State machine (identical to web; state is **local per card**):

```
state: chosen = null | index
answered = chosen !== null

render:
  prompt (body text, ink)
  for each choice i:
    marker = circle 22pt:
      unanswered            → letter A/B/C/D, hairline ring, faint
      answered && i==answer → gold-filled circle with ✓ (dark check)
      answered && i==chosen (wrong) → red ring, red letter
      answered && other     → unchanged ring, dimmed
    row styling:
      unanswered            → hairline border, transparent bg
      answered && i==answer → gold border, gold tint bg rgba(201,168,74,0.08), ink text
      answered && i==chosen (wrong) → red border rgba(200,90,90,0.4), muted text
      answered && other     → 45% opacity
  choices disabled once answered
  if answered:
    note paragraph — 2pt gold left border, padding-left 16, muted ink
    "TRY AGAIN" text button (mono caps, faint → gold on press) → chosen = null
```

Reference RN sketch:

```tsx
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const answered = chosen !== null;
  return (
    <View style={s.exercise}>
      <Text style={s.prompt}>{exercise.prompt}</Text>
      {exercise.choices.map((choice, i) => {
        const isAnswer = i === exercise.answerIndex;
        const isChosen = i === chosen;
        const tone = !answered ? null : isAnswer ? s.correct : isChosen ? s.wrong : s.dim;
        return (
          <Pressable key={i} disabled={answered} onPress={() => setChosen(i)}
                     style={[s.choice, tone]}>
            <View style={[s.marker, answered && isAnswer && s.markerCorrect,
                          answered && isChosen && !isAnswer && s.markerWrong]}>
              <Text style={s.markerText}>{answered && isAnswer ? '✓' : LETTERS[i]}</Text>
            </View>
            <Text style={s.choiceText}>{choice}</Text>
          </Pressable>
        );
      })}
      {answered && (
        <>
          <Text style={s.note}>{exercise.note}</Text>
          <Pressable onPress={() => setChosen(null)}>
            <Text style={s.again}>TRY AGAIN</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
```

### 6.7 MembershipGate
Rendered at the bottom of Screen B only when the **whole album** is locked for the viewer.

```
Eyebrow  "THE REST IS IN THE TREASURY"
Title    {access.reason}            → "This level unlocks with membership."
Body     "Membership opens the whole library — every album, every article read aloud,
          the full Learn Hebrew curriculum, the book, and the resources kit.
          As more is uncovered, it comes to you."
CTA      gold pill "Become a partner — $87.95/yr"  → web: Jubilee checkout redirect
Secondary (signed-out only) "Already a member? Sign in" → web: SSO sign-in
```

**Mobile note:** wire the CTA to whatever subscription/upgrade flow your app uses.
If the app has a no-in-app-purchase policy (app-store compliance), keep the copy and
drop the checkout button — the gating below is unaffected.

## 7. Data model & content

Types in `data/types.ts`; content in `data/lessons.json` (3 albums × 6 lessons ×
3 exercises) and `data/aleph-bet.json` (22 letters). Key facts:

- Album fields used by UI: `slug, title, subtitle, level, presenters[], glyph, hue,
  intro, lessons[], freeTier, releasedAt`.
- `freeTier`: **true only for Level 1** (`the-aleph-bet-alive`).
- `releasedAt`: `2026-01-15` / `2026-03-05` / `2026-05-07` — all published as of today,
  but the filter must stay (see §10) so future content drops work without an app update.
- Every `lesson.mediaUrl` is `null` today → the "film pending" note always shows on
  unlocked lessons. When a URL lands, that note is replaced by the lesson's play surface.
- Exercise `answerIndex` is 0-based. All current exercises have 4 choices; markers
  support up to 5 (A–E).

## 8. API documentation

**The feature has no content API.** All curriculum data is compiled into the web bundle
and statically rendered (ISR, revalidate 3600s). Ship `lessons.json` bundled in the app.

The only network dependency is **who the viewer is**:

| | Web | What mobile needs |
|---|---|---|
| Call | `GET /api/session` (cookie auth) via the Jubilee SSO provider | your existing session/subscription lookup |
| Success | `{ userId, displayName, email, subscription: { status: 'active'\|'none', plan, renewsAt } }` | any shape that answers "is this user a paying member?" |
| Mapping | `entitlement = subscription.status === 'active' ? 'member' : 'guest'` | `entitlement = isPaid ? 'member' : 'guest'` |
| Error / signed out / loading | treated as `guest` (fail-safe) | same — default to guest |
| Caching | fetched once on mount, no cache | fetch on auth/app start per your app's pattern |

No pagination, no polling, no other endpoints.

## 9. State management flow

```
subscription state (global, fetched on auth)
        │  map: paid → 'member', else 'guest'
        ▼
Screen A: getLessonAlbums(all) ──▶ per-row locked = !canOpenLessonAlbum(album, ent).allowed
Screen B: getLessonAlbum(all, slug)
        ├─ albumAccess = canOpenLessonAlbum(album, ent)   → gate at bottom if !allowed
        └─ per-lesson access = canOpenLesson(album, n, ent) → card locked/unlocked

local component state only:
  · Practice accordion  — open/closed per lesson (default closed)
  · ExerciseCard        — chosen index per card (default null)
```

No refresh logic, no persistence of answers (web resets on reload — mobile resets on
unmount; do not persist). Empty states are unreachable with bundled data; the only
fallback needed is unknown-slug on Screen B.

## 10. Business logic (must match exactly — see `data/access.ts`)

| Rule | Effect |
|---|---|
| `releasedAt > now` | album invisible everywhere (list + slug lookup) |
| `entitlement === 'member'` | everything open |
| `album.freeTier === true` | whole album open for guests (Level 1) |
| `lesson.n === 1` | **open for everyone, on every level** — "the doorway is never locked" |
| otherwise | lesson locked: summary still visible, exercises/media withheld |
| album locked for viewer | list row shows "· Members" + keyhole disc; detail page shows MembershipGate |
| locked rows | **still navigate** — the detail page is the sales surface |

So a guest on Level 2/3 sees: full hero + intro, lesson 1 fully interactive,
lessons 2–6 as teaser cards (title/duration/summary + "unlocks" note), then the gate.

## 11. User interactions

| Interaction | Result |
|---|---|
| Tap "LEARN HEBREW" chip | open Screen A |
| Tap a level row (locked or not) | push Screen B for that slug |
| Tap back / "All levels" | pop to Screen A |
| Tap Practice header | toggle accordion (250ms ease, caret rotates) |
| Tap a choice (unanswered) | lock choices; color correct/wrong/dim; reveal note + TRY AGAIN |
| Tap a choice (answered) | nothing (disabled) |
| Tap TRY AGAIN | reset that exercise only |
| Tap gate CTA | subscription flow (platform-appropriate) |
| Scroll | plain vertical scroll; content is small (≤ ~20 cards), no virtualization needed |

No long-press, swipe gestures, next/previous lesson navigation, or in-feature search.
"Play media / open lesson" does not exist yet (all `mediaUrl` null).

## 12. Animations

| Where | Web | Mobile target |
|---|---|---|
| Screen A → B | route navigation | native stack push/pop |
| Level row feedback | hover: lift −3px, border brighten, gold title, 250ms | pressed opacity ~0.8 / subtle scale |
| Accordion | caret rotate 90° 250ms `cubic-bezier(0.22,0.61,0.36,1)`; content instant | height ease-in-out ~250ms + caret rotate/swap |
| Choice answer | border/bg/color transition 200ms | state restyle (instant or 150–200ms) |
| Gold pill | hover lift + gold glow shadow | pressed feedback |
| Loaders/skeletons | none (static data) | none needed |
| Reduced motion | media query kills all transitions | respect the OS setting if your animation lib doesn't already |

## 13. Edge cases

- **Offline / slow / API failure:** content is bundled — the feature must work fully
  offline. Only entitlement degrades → guest view (fail-safe, never crash).
- **Unknown slug:** "Level not found" fallback + back affordance.
- **Unreleased album:** hidden by `isPublished` in both list and lookup.
- **`mediaUrl` null:** dashed "film pending" note (current state of all 18 lessons).
- **1 question:** singular "QUESTION" label. **≠4 choices:** markers A–E cover up to 5.
- **Missing images:** n/a — the feature ships zero images/SVG/Lottie; every visual is
  text + borders + tints (Hebrew glyphs are plain Unicode — verify your app font renders
  them; system fonts do).
- **Large datasets:** fixed 3×6×3; plain ScrollView is fine.

## 14. Design specifications

Web design tokens (`globals.css`) with the mobile-dark mapping (black background,
Hebraic-Christianity gold palette):

| Token | Web value | Mobile (black theme) |
|---|---|---|
| Page background | `#0c1226` navy + starfield | `#000` / your app's near-black |
| Card background | `#1b2340` | `rgba(255,255,255,0.04)` |
| Nested card (lesson inside level) | — | `rgba(255,255,255,0.05–0.06)` |
| Ink (headings) | `#f0ebe3` | same |
| Ink body | `#b8bcd4` | same |
| Ink muted | `#7f86a8` | same |
| Ink faint | `#565d80` | same |
| Accent gold | `#feca57` | same |
| Accent gold soft | `#ffd877` | same |
| On-accent (text on gold) | `#0c1226` | `#1a1405` or near-black |
| Hairline | `rgba(244,216,168,0.12)` | `rgba(255,255,255,0.10–0.18)` |
| Hairline strong | `rgba(244,216,168,0.30)` | `rgba(255,255,255,0.35)` |
| Wrong-answer red | border `rgba(200,90,90,0.4)`, marker `rgba(214,128,128,0.9)` | same |
| Correct tint | `rgba(201,168,74,0.08)` fill + gold border | same |
| Radius | 12 cards · 10 tiles/choices · 8 dashed note · 999 pills | 12–14 · 8–10 · 8 · fully round |
| Easing | `cubic-bezier(0.22, 0.61, 0.36, 1)`, 200–250ms | ease-in-out 200–250ms |

Typography (web → mobile pt):

| Role | Web | Mobile |
|---|---|---|
| Page title (h1) | serif 600, clamp 2.05–3rem | 32 / w800, ink |
| Level/lesson title | serif 1.28–1.32rem | 18 / w800 (row), 15 / w800 (lesson head) |
| Eyebrow | mono 11px, 0.3em tracking, caps, gold-soft 85% | 11 / w700, letterSpacing ≈1.6, caps |
| Kicker / meta / mono notes | mono 9.5–10.5px, 0.14–0.22em, caps | 9–12 / w700, letterSpacing 1–1.4 |
| Lede / intro | 1.08rem, lh 1.72 | 14 / lh 21 |
| Summary / captions | 0.96–0.99rem, lh 1.6–1.65 | 13 / lh 19–20 |
| Prompt | 1.04rem, lh 1.6 | 15 / lh 22 |
| Choice text | 1rem, lh 1.45 | 14–15 / lh 20 |

Sizes & spacing: screen gutter 20; card padding 14–16; list gap 14–16; tile row gap 10;
choice gap 9; marker circle 22; play/lock disc 40 web → 44 mobile (≥44pt touch target);
letter tiles: square, 6-across minus gutters/gaps; glyph tile 62 list / 128 hero
(web) → 52 / 96 (mobile). Touch targets ≥ 44pt everywhere (choice rows and accordion
headers already exceed it).

## 15. Assets

**None.** No images, no SVGs, no Lottie, no icon font beyond a play triangle / chevron /
dot, all of which can be drawn or taken from any icon set. Hebrew glyphs are Unicode text.

## 16. Acceptance checklist

- [ ] Chip → hub → level → back navigation matches §2 (locked levels navigable)
- [ ] Hub shows hero, 5+1 letter tiles, 3 level rows with correct kicker/meta/lock state
- [ ] Detail shows hue-tinted glyph hero, intro, 6 lesson cards
- [ ] Guest on Level 1: everything open; Level 2/3: lesson 1 open, 2–6 teaser + gate
- [ ] Member: everything open, no "· Members", no gate
- [ ] Practice accordion collapsed by default, animates ~250ms, independent per lesson
- [ ] Exercise flow: choose → colors/disable → note → TRY AGAIN resets (per-card only)
- [ ] "Film pending" dashed note on every unlocked lesson while `mediaUrl` is null
- [ ] Entitlement failure/offline → guest view, feature fully usable offline
- [ ] Unknown slug → graceful not-found
- [ ] Colors/typography match §14 on the black theme
