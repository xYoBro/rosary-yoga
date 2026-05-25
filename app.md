# Rosary Yoga — The App

*The instrument. RELAY's hand, the operator's mirror, the Codex made queryable. Sufficient on its own.*

> *Operator. The codec is in your pocket. Make the connection.*
> — RELAY, first transmission

---

## What this is

The app is the canonical surface of the practice. It carries the day loop, the bead loop, the decade loop, and the year arc. It holds the operator's voice cast, the dice mechanic, the Codex, and the Thought Cabinet. Source of truth lives here.

Paper (`paper.md`) is now optional — a no-tech fallback layer for moments when the phone shouldn't be involved (vigil, mid-workout, retreat) and an heirloom Codex at year-end for those who want the inheritance object. The app does not require paper. The paper does not require the app.

Other documents in this repo:
- `practice.md` — the nightly anchor, the closing prayer, the marriage container.
- `training.md` — the operative-codec narrative. RELAY's voice in long form. The story.
- `paper.md` — the optional paper layer.
- `app.md` — this document.

---

## Influences

- **Apple design principles** — every screen does one thing; the kit is small; every object obvious. No badges. No streaks. No nagging.
- **Disco Elysium (slight)** — the internal voices that constitute the operator's parliament, dice/check mechanics, the thoughts that internalize over time, atmospheric prose. Borrowed in DNA, not in form.
- **Hobonichi Techo** — the daily-rhythm artifact, restrained typography, the year as a felt object.
- **Field manuals / operational protocols** — terse, structured, low-noise, low-color.

---

## The Parliament — the operator's internal voice cast

A small cast of voices that speak across the day, the week, and the year. Each voice has its own register, its own typography, and its own opinions about what should happen next. Over time the operator hears them without needing the attribution.

| Voice | Domain | Register | When it speaks |
|-------|--------|----------|----------------|
| **RELAY** | Dispatch, frame, narration | Mil-codec terse. *Operator. Decade 3, bead 8. Peak. Make the connection.* | Mornings, bead boundaries, Sanctum, post-fight |
| **THE QUARTERMASTER** | Load, push, the gruff one | Short imperatives, all caps. *FIVE SETS. TWENTY-FIVE REPS. HONEST.* | Sorrowful days, Glorious days, pre-boss |
| **CHAPLAIN** | Yoga, breath, equanimity | Italic, two-beat phrases. *In through the nose. The body has already started.* | Joyful days, vigil openings, recovery |
| **THE METRONOME** | Endurance, tempo, intervals | Numeric, tabular. *400m × 8 at threshold. Ninety-second rests.* | Tuesday/Friday runs, ladder workouts |
| **LONGWATCH** | Morning, vigil, transitions | Liturgical, slow, low. Small caps. *The hour holds. Step into it.* | Pre-dawn, vigil flow, Sanctum boundaries |
| **THE RAVEN** | Instinct, override, dissent | Lower-case italic single line. *right shoulder. watch it.* | Rare. When the body's signal contradicts the manifest. |

Each voice has a fixed typography in the app — a font, a weight, a color — so the operator recognizes who is speaking at a glance. RELAY is always first; INSTINCT is always last; the middle four rotate by day.

Sample morning transmission (Tuesday of Decade 3, Bead 8 peak):

> **RELAY.** *Operator. 0500. Decade 3, bead 8. Peak. Sorrowful. Long day.*
>
> **THE METRONOME.** *400m × 8 at threshold. Ninety-second rests.*
>
> **THE QUARTERMASTER.** *FIVE SETS OF TWENTY-FIVE PUSHUPS. HONEST REPS.*
>
> **THE RAVEN.** *right shoulder. watch it.*

The transmissions are generated from a small library of templates per voice, modulated by bead phase, day modality, and recent operator state (e.g., a missed workout yesterday changes today's STRENGTH register from imperative to negotiating).

---

## The day loop

What the app does between waking and sleeping.

**Open the app in the morning.** One screen. Today's bead identifier across the top (mystery, decade, bead, phase). The Parliament's morning transmission centered. One primary action button: **Roll**.

**The Roll.** A d6 is rolled — either by the app (button press, single haptic) or by the operator's physical die (a tap-to-enter screen). The result yields today's modality variant from the dice table. Whichever way the roll happens, the result is recorded with a timestamp.

**The work card.** After the roll resolves, the app shows today's work card: modality, exercises, sets, reps, target load. STRENGTH and PACE and BREATH each speak as relevant. The card is the only screen visible during the workout if the operator wants — large type, no chrome, swipe to advance through sets.

**Live entry (optional).** The operator can log sets as they go, or batch-enter at the end. The app does not care. If the operator logs nothing, the work counts as done when the operator taps **Closed** at the bottom of the card.

**Closed.** A single line from one voice — the closing word for the day. The screen goes dark.

**Evening (optional).** The closing-prayer screen, drawn from `practice.md`. One swipe brings up bodyweight and sleep entry if the operator tracks those.

---

## The bead loop

A bead is one week of the protocol — six work days plus the Sunday Sanctum. Sixty-two beads make Year One (six pendant beads + fifty-five loop beads + one closing).

Each bead carries:
- A mystery (Nativity, Agony, etc.)
- A phase (intro / peak / taper / boss / deload)
- A load multiplier derived from phase
- Six daily modality assignments (Joyful / Sorrowful / Glorious / Luminous, by day-of-week)
- A dice menu per modality
- Six morning RELAY headers, one per work day
- A Sanctum prompt for Sunday

The app generates the bead spread from this static data plus the operator's current state. The spread is a single screen the operator can return to all week.

---

## The week loop — Sunday Sanctum

The weekly close-out. The most ritualized moment in the app outside of boss encounters.

Sunday at a chosen hour, the app opens to the Sanctum screen. The Parliament reviews:

1. **The week, in numbers.** Days completed, dice rolled, scores against target, weight, sleep.
2. **The week, in voice.** A composed RELAY post-bead transmission generated from what actually happened. If the operator missed Tuesday, RELAY acknowledges it. If the operator hit every target, RELAY says so plainly.
3. **The Sanctum note.** A single text field. The operator writes anything — a sentence, a paragraph, nothing. This is the operator's hand in the record.
4. **Close the bead.** A single primary button. Pressing it commits the bead, advances the calendar, and opens the next bead's morning screen as a preview.

The Sanctum is the only place in the app where the operator is encouraged to linger.

---

## The decade loop and the bosses

A decade is ten beads. The tenth bead of every decade is a boss bead — no run, no normal protocol, one all-out engagement.

When the operator reaches a boss bead, the app shifts visually: the palette tightens to a single accent (oxblood, by default), the voice cast goes silent except RELAY, the work card becomes a fight card.

**The fight card.** No sets-and-reps prescription. Just the protocol:
- Pushups to fatigue.
- Pullup progressions to fatigue.
- Situps to fatigue.
- Plank to fatigue.
- Score = (PU + SU) + (Pullup-equiv × 2) + plank seconds.

**The score grid.** Below the protocol, an AF PT scoring overlay for the operator's age/gender bracket — what the score would have earned them in the actual Air Force PT test. The operator's score is plotted against the bracket's pass/excellent thresholds.

**The post-fight transmission.** RELAY writes. The operator reads. The fight is logged to the Codex.

**The Thought.** A boss victory may award the operator a Thought — see below.

---

## The Year One arc

A year-long progression through five mysteries. The pendant onboards. The closing closes.

| Phase | Duration | Beads | Boss |
|---|---|---|---|
| **Pendant** | 7 weeks | 6 onboarding + 1 trial | OF₂ — The Threshold |
| **Decade 1 — The Joyful (Nativity)** | 10 weeks | 9 + boss | The Anvil |
| **Decade 2 — The Sorrowful (Agony)** | 10 weeks | 9 + boss | The Long Garden |
| **Decade 3 — The Glorious (Resurrection)** | 10 weeks | 9 + boss | The Rising |
| **Decade 4 — The Luminous (Transfiguration)** | 10 weeks | 9 + boss | The Shining |
| **Decade 5 — The Final (Coronation)** | 10 weeks | 9 + boss | The Crown |
| **Closing** | 1 week | 1 closing bead | The Return |

Total: 58 weeks. Every boss's first-contact transmission and fight protocol lives in `app/data/practice.json` (`training.bosses`); the app surfaces them on the appropriate bead.

---

## The Thought Cabinet

Borrowed in spirit from Disco Elysium. A slot system for internalizing practice virtues over time.

Each boss victory may award the operator a **Thought** — a single sentence representing a virtue the fight surfaced. The Thought enters the Thought Cabinet in the **baking** state and remains there for a defined duration (typically the next decade — ten beads). While baking, the Thought shapes the Parliament's daily transmissions: lines from the Thought thread through morning RELAY headers, STRENGTH cues, INSTINCT interruptions.

After the baking period closes, the Thought **internalizes**. It becomes a permanent line in the operator's Codex and stops actively shaping transmissions — but it is now part of the operator. The operator carries it.

The Year-One Thoughts:

- **After The Threshold (pendant trial):** *Measure honestly; the line is the practice.* — bakes for 7 weeks, internalizes at the close of the pendant.
- **After The Anvil:** *Patience under load.* — bakes for 10 weeks.
- **After The Long Garden:** *The hour will not be shortened.*
- **After The Rising:** *Lift once, correctly, before lifting again.*
- **After The Shining:** *The position is the proof.*
- **After The Crown:** *Everything I was taught, in order, on the day.*
- **After The Return (closing):** *I am the one who walked it.* — internalizes immediately; the year is the bake.

The Thought Cabinet is a single screen, always accessible:
- Top: Thoughts currently baking, with progress.
- Bottom: Thoughts internalized, in order of acquisition.

The Cabinet is the operator's psychological codex. It complements the boss-fight log (which records *what happened*) by carrying *what was learned*.

---

## Skill checks

The dice mechanic, formalized. Two kinds of checks.

**White checks — daily modality rolls.** A d6 per work day, yielding the day's exercise variant from the modality card (Sorrowful, Joyful, Glorious, Luminous). Re-rollable — you'll roll again tomorrow on a different modality. No permanent consequence. Just shapes today's work.

**Red checks — boss encounters.** One-shot. The operator can re-fight a boss in subsequent years, but each specific fight is permanent in the Codex. The fight either passes the bracket's threshold or it doesn't; either way, the record stands.

The app supports both in-app rolls (button + haptic) and physical-die rolls (tap-to-enter). The physical-die path preserves the tactile feel of the practice; the in-app path is for travel days or low-effort openings. The Parliament does not care which one the operator uses.

---

## Data model

What the app stores. Source of truth.

```jsonc
{
  "operator": {
    "name": "...",
    "year_of_inception": 2026,
    "current_year": 1,
    "bracket": { "age": 33, "sex": "M" },
    "voice_cast_unlocked": ["RELAY", "STRENGTH", "BREATH", "PACE", "VIGIL", "INSTINCT"]
  },
  "beads": [
    {
      "id": "Y1-D3-B8",
      "mystery": "Nativity",
      "phase": "Peak",
      "week_start": "2026-08-17",
      "load_multiplier": 1.30,
      "days": [
        {
          "day": "Mon",
          "modality": "Joyful",
          "dice_roll": 4,
          "modifier": null,
          "work_logged": "Vigil + 20min flow",
          "scores": {},
          "notes": "",
          "closed_at": "2026-08-17T06:14:00Z"
        }
      ],
      "sanctum": {
        "closed_at": "2026-08-23T19:00:00Z",
        "weight_kg": 78.2,
        "sleep_avg_h": 7.5,
        "relay_post_bead": "...",
        "operator_note": "..."
      }
    }
  ],
  "bosses": [
    {
      "id": "Anvil",
      "decade": 1,
      "first_encounter_date": "2026-09-21",
      "fights": [
        {
          "date": "2026-09-21",
          "pu": 60, "su": 60, "pullups_equiv": 12, "plank_sec": 120,
          "score": 252,
          "bracket_grade": "Excellent",
          "relay_post_engagement": "...",
          "operator_note": "..."
        }
      ],
      "relay_first_contact": "...",
      "thought_awarded": "patience_under_load"
    }
  ],
  "thought_cabinet": {
    "baking": [
      { "id": "patience_under_load", "started": "2026-09-21", "bakes_until": "2026-12-01" }
    ],
    "internalized": []
  },
  "transmissions_log": []
}
```

The data lives local-first on the operator's device. Optional cloud sync keeps it across devices. Export is plain JSON — the operator can take their record anywhere.

---

## Paper interop (optional)

For operators who want to use the paper layer (see `paper.md`):

- **Print.** The app renders booklet-imposed PDFs at US Letter, ready to print duplex on any home or office printer and fold-and-staple into 5.5 × 8.5" saddle-stitched booklets. The operator can print one decade booklet at a time (24 pages), the Manual (28–32 pages), the Codex (24–28 pages), or all nine Year-One booklets in one batch.
- **Scan.** The app scans a written Logbook spread — QR identifies the bead, OMR (optical mark recognition) lifts numeric box fields, free-text zones are archived as images. The parsed result merges into the app's data.
- **Codex export.** At year-end, the app can render the Codex booklet for an heirloom rebind by a hand-bookbinder, if the operator wants the inheritance object.

All paper operations are optional. The app is sufficient on its own.

---

## Aesthetic and visual direction

DE-influenced but quieter. Calmer. Less neon-noir, more chapel-at-dusk.

- **Mode.** Dark mode default; light mode available. Both feel like dusk.
- **Typography.** One serif for narrative voices (the Parliament's speech). One sans-serif for protocol and numbers (work cards, score grids). One monospace for the Codex and data displays. Generous line-height. Restrained.
- **Color.** Charcoal base. One accent color per mystery — Joyful gold, Sorrowful oxblood, Glorious bone, Luminous silver, Nativity green. The accent shifts the chrome as the operator moves through the year.
- **Voice typography.** Each voice has a fixed font/weight pairing in the app. The operator learns the voices by their look.
- **Animation.** Almost none. Cross-fades only. No springy bounces, no parallax, no confetti.
- **Notifications.** Opt-in only. Default off. If enabled: one in the morning, one before the Sanctum. Never more.

---

## Tech stack — decided

**Extend the existing Progressive Web App.** The nightly anchor PWA (`app/`) is already shipped, sophisticated, and well-designed (TTS cues, speech recognition, hands-free mode, wake locks, EB Garamond + burgundy aesthetic calibrated for night use). The Apple-design instinct is best served by *not* displacing what already works — Story Mode rides on top of the existing surface as the Today view.

The daytime training arm now lives in:

- `app/data/practice.json` — extended with a `training` block (year structure, decades, bosses, Thoughts, modalities, Parliament).
- `app/training.js` — bead computation, modality picking, transmission assembly, Today view rendering, training log.
- `app/index.html`, `app/style.css`, `app/app.js` — Today overlay markup, per-voice typography, menu wiring, morning auto-open.

The data model exports as plain JSON. If the operator ever wants a native iOS or Android app, the data goes with them; only the rendering layer needs porting.

---

## Future considerations

- **Voice input** for Sanctum notes. Useful for operators who don't want to type on Sunday.
- **Watch app** for vigil cues and post-set logging.
- **Multiple operators.** The Parliament's voice cast persists, but multiple operators (a family, a small group) share boss logs and Thoughts. Inheritance flows here.
- **The Vigil specification.** Still pending. Once specified, the Vigil gets its own card and the VIGIL voice gets its own deeper template library.
- **The closing prayer integration.** The evening screen surfaces `practice.md` content. To be designed once the daytime loop ships.

---

## Design principles — what the literature actually supports

A May 2026 review of the habit-formation, ritual, effort-justification, and digital-health-retention literatures landed on three load-bearing principles. These are now constitutional for the app:

1. **The daily ask stays atomic.** One card, one button, ≤30 seconds of operator interaction. Lally / Fogg / Wood all converge on this for forming new habits. Implemented: the Today view's "Mark as done" is the only required tap.
2. **The frame stays elaborate.** Identity, narrative, and effort-justification (Norton/Mochon/Ariely 2012) are the dominant predictors of decade-scale practice. The Parliament, the bead identifier, the mystery focus, the boss transmissions, and the Thought Cabinet are visible by default — they cost the operator nothing operationally and supply identity. Story Mode is not opt-in. It is the practice.
3. **No streaks. No badges. No nag notifications.** Loss-aversion gamification is the design pattern most likely to produce burnout and intrinsic-motivation crowding-out (Ng et al. 2012, Koivisto/Hamari). The app records what happens but never punishes a miss or rewards consistency with debt. The Rosary itself is the only counter.

A fourth principle, by way of `paper.md`: **the optional paper kit is not friction to optimize away.** The hand-stapling of booklets is an effort-justification device (IKEA effect). If the operator chooses paper, the work of producing the kit *is* the mechanism.

## Open questions

- **Cloud sync vendor.** iCloud (Apple-native, frictionless) vs. self-hosted (operator owns the data physically). Currently: local-first only.
- **AF PT scoring brackets.** The operator's age/sex bracket needs to be configurable. Stub today.
- **Dice variants per modality.** v1 has one canonical prescription per (modality, phase). Dice variants (d6 → 6 variants per modality) are specced in `paper.md` and `training.md` but not yet implemented in the app.
- **Year-end data export.** The app should produce a single JSON file the operator can archive. Format spec exists; export UI to be built.
- **The Vigil voice corpus.** `vigil.md` is now specified. The VIGIL voice's sample lines need to migrate into `training.transmission_lines.LONGWATCH` (currently LONGWATCH is doing double duty — it carries the vigil register but is also the morning-watch voice).

---

*"The body learns the cue. The mind follows the bead. The hand is yours."* — `practice.md`
