# ChartControl — marketing home, redesign handoff

**File:** `landing.html` — one self-contained page. No build step, no external assets except
Google Fonts (Fraunces / Inter / IBM Plex Mono). Open it directly in a browser.

## Where the design values come from
Every colour and typeface in this page is taken from the **live marketing site**, not invented:

| Token | Value | Source |
|---|---|---|
| `--paper` | `#F4F1EA` | `chartcontrol-landing/index.html` |
| `--paper-2` / `--paper-3` | `#EDE9DF` / `#E4DFCF` | same |
| `--card` / `--card-2` | `#FBF9F4` / `#F8F5EC` | same |
| `--ink` / `--ink-2` | `#171412` / `#2A2622` | same |
| `--muted` / `--faint` | `#6B6459` / `#948B7C` | same |
| `--rust` / `--rust-dark` / `--rust-tint` | `#A64B2A` / `#8A3B1F` / `#F0DBCC` | same |
| `--ok` / `--azure` / `--amber` | `#2E7D4F` / `#2E7BB0` / `#B8711A` | same |
| `--term` / `--term-2` | `#0E1219` / `#080C13` | terminal mock on the same page |
| `--gain` / `--loss` / `--amber-live` | `#43D98A` / `#F08A8A` / `#F5B84D` | same |
| Typefaces | Fraunces (display), Inter (UI), IBM Plex Mono (data) | same |

All copy is the shipped English i18n strings (171 keys, `landing-i18n.js`) used verbatim.

## Structure
`stripe → sticky nav (12-locale menu) → hero → 01 product → 02 how → 03 safety →
04 exchanges → 05 pricing → 06 faq → CTA band → footer`

Section numbering appears only where the content is a real sequence (Step 01–03).
Topic sections use a named hairline rule instead of a decorative `01 ·`–`06 ·` counter.

## Signature device
The hero's dark terminal card carries two price levels — Entry and Invalidation. On viewports
≥1180px those two rules **leave the card and continue onto the cream page** as `.bleedline`
elements. It encodes the product promise ("the AI marks the answer on screen") literally:
the analysis does not stay inside a chat window.

## Two things the product team must decide before shipping
1. **"660+ USDT perpetual pairs"** (hero trust line, `#exchanges` KuCoin row) is the shipped
   marketing claim. The application itself reports `2 of 21 pairs live`. One of the two is wrong.
   This page reproduces the marketing string verbatim — it does not resolve the conflict.
2. **"24-column workspace"** (feature card 06, FAQ 05) vs the application's `96-col Layout`
   grid. Same situation: reproduced verbatim, needs a decision.

## Verification performed
- `node --check` on the inline script — clean.
- Duplicate element IDs: 0. Console / page errors: 0.
- Horizontal overflow at 1600 / 834 / 390 px: 0 elements.
- WCAG AA contrast on 38 measured text/background pairs — every small-text pair ≥ 4.39:1
  (after promoting `--faint` small text to `--muted` and the neutral chip to `--ink-2`).
- Scroll-reveal verified on both a slow sweep and a hard anchor jump (`#pricing`).
- Interaction: locale menu open/select/Escape, FAQ `<details>` toggle.

## Not built here
No partners page, no login page, no legal pages — those exist in the real repo
(`partners/`, `login/`, `terms/`, `privacy/`, `refund/`, `risk/`, `legal/`). The nav and footer
point at them by route (`#/partners`, `#/login`, …).

## Responsive verification (measured, not assumed)
Horizontal overflow (`documentElement.scrollWidth` vs `innerWidth`) and scroll-reveal state,
measured in Chromium at every breakpoint:

| Viewport | Overflowing elements | Reveal fired | Page errors |
|---|---|---|---|
| 320 px | 0 | 27 / 27 | 0 |
| 360 px | 0 | 27 / 27 | 0 |
| 390 px | 0 | 27 / 27 | 0 |
| 414 px | 0 | 27 / 27 | 0 |
| 834 px | 0 | 27 / 27 | 0 |
| 1600 px | 0 | 27 / 27 | 0 |

Two overflow defects were found and fixed during this pass:
1. Below 640 px the nav cluster (locale button + Sign in + CTA) pushed the document 53 px
   wide. Fixed by hiding `Sign in`, dropping the `v1.0` badge, tightening the nav gap,
   reducing `--pad` to 20 px and stacking the hero/CTA buttons full width.
2. At 320 px the FAQ's two-column grid used `minmax(320px, 1fr)`, forcing a 320 px track
   inside a 280 px box. Fixed with `minmax(min(320px, 100%), 1fr)`.

## The bleed device — how it is wired
`.bleed` is absolutely positioned at `left:100%` **inside `.term__chart`**, so the two rules
start exactly at the chart's right edge and fade into the page. Their vertical positions are the
chart SVG's own level coordinates (Entry `96/208` = 46.15 %, Invalidation `146/208` = 70.19 %),
which is what keeps them continuous with the dashed lines inside the chart.
`.term` therefore no longer uses `overflow:hidden`; the last row (`.term__reads`) carries
`border-radius:0 0 6px 6px` so the card corners stay rounded.
The device is only shown at `min-width:1400px`, where the page gutter is wide enough to hold it
(88 px) without clipping.
