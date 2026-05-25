# Rosary Yoga — The Paper Kit

*Three books. The first you read. The second you write. The third you inscribe. The app, when it exists, only reads and prints them.*

> *Operator. The codex is in your hands. Make the connection.*
> — RELAY, on Mary's first transmission

---

## Why paper is primary

The training runs at work, on planes, in places where phones are not welcome. Paper does not require permission, a battery, or a signal. Paper survives operating-system migrations, vendor collapses, and the thirty-year horizon the practice is calibrated for. A binder from 1995 is still legible. No app from 1995 still runs.

The codex inheritance arc only makes literal sense as a physical object. Mary's hand cannot be inherited as a JSON blob. RELAY writes by ink. The operator's codex will pass to whoever walks the Rosary next, in the same form.

The app, when it is built, is a recorder and a printer. It is not the source of truth. The protocol must work without electronics from day one and remain workable without them in year thirty.

---

## Three books, three timescales

| Book | Role | Lives | Timescale |
|------|------|-------|-----------|
| **The Manual** | Everything you LOOK UP. Rules, modality tables, dice tables, exercise menus per modality, boss protocols, load tables. Tabbed. Printed. Never changes mid-year. | Bag / jacket pocket | Eternal (per protocol version) |
| **The Logbook** | Everything you WRITE. One spread per bead, pre-printed with mystery, phase, load targets, and RELAY's morning headers. You fill in dice, work, scores, notes. | Desk at home | The present year |
| **The Codex** | Everything that LASTS. Boss spreads only — RELAY's first contact, fight protocol, fight log across years. Hand-bound or print-on-demand. | Shelf | Ancestral — decades, handed forward |

The whole kit can be described in one sentence: *you carry the Manual, you write in the Logbook, you inscribe the Codex.*

All three books share a single trim — **5.5 × 8.5"** (US Digest / Half-Letter). They coordinate on the shelf as a set. Binding differs by role: the Manual and Codex are sewn (closed, canonical), the Logbook is wire-bound (lay-flat, made for writing).

No loose cards. No binders to lose. No accessories to forget. Three objects. Each one obvious.

---

## The Manual

The reference book. Read in the first weeks until the protocol lives in the body; carried thereafter only when something needs looking up. It is also the book the operator hands to anyone who asks what the practice is.

### Contents

1. **Protocol at a glance** — one spread. The 62-bead rosary, the weekly modality, the year cycle.
2. **The week** — modality by day, one page each.
3. **The decade** — bead-position phase table, load multipliers.
4. **The pendant** — the seven onboarding weeks, week by week.
5. **The five mysteries (Year One)** — names and boss names. One page per mystery.
6. **The dice** — how, when, what overrides what. Dice tables per modality. (Absorbs what was previously loose Dice Cards.)
7. **The bosses** — fight protocol and scoring grid for each of the seven Year-One encounters. (Absorbs what was previously loose Boss Cards.)
8. **The AF PT scoring table** — for the operator's current age/gender bracket. Reprinted every five years as the bracket changes.
9. **The Sunday Sanctum** — the weekly close-out ritual.
10. **The Vigil** — the morning warmup. *(Pending research.)*

### Print spec

- **Trim.** 5.5 × 8.5" (US Digest / Half-Letter). Standard KDP, IngramSpark, Lulu, and B&N Press hardcover trim.
- **Pages.** 100–140, depending on appendix size. Within the 75–550-page hardcover window for all major US POD services.
- **Binding.** Smyth-sewn case-laminate hardcover. Cloth spine if the printer offers it (Lulu does; KDP does not).
- **Paper.** 80 lb cream text stock (≈118 gsm), low-glare, low show-through.
- **Ink.** Black throughout. One accent color (deep red, dedicated plate or single-pass) for chapter heads and tab markers if the service permits at this trim.
- **Tabs.** Printed tab markers along the foredge for: Week · Decade · Mysteries · Dice · Bosses · Scoring · Sanctum. (True die-cut tabs are not POD-standard; printed tabs read identically once thumb-stained.)
- **Cover.** *ROSARY · MANUAL · v1* foil-stamped or printed. The version number lives on the cover so an outdated Manual is visibly outdated.

A new edition each protocol revision.

---

## The Logbook

The book you write in every day. One spread per bead, pre-printed. Sixty-two spreads for Year One (six pendant + fifty-five loop + one closing). A single bound book — not a binder, not loose pages.

### Layout (one spread)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ ▣[QR]  YEAR 1 · DECADE 3 · BEAD 8 · MYSTERY: NATIVITY · PHASE: PEAK        │
│        WEEK OF ____ / ____ / ____                                          │
├───────────────────────────────────────────────────────────────────────────┤
│ LOAD TARGETS (peak phase, ×130%):                                          │
│   PU 5×25  ·  SU 5×__  ·  Plank 5×45"  ·  Run 8×400m @ threshold           │
├───────────────────────────────────────────────────────────────────────────┤
│ MON · JOYFUL · MOBILITY                                                    │
│   RELAY: 0500. Vigil + extended flow. Hips and shoulders open today.       │
│   Dice [_]  Mod [_]   Work: _________________________________________     │
│   Notes: ____________________________________________________________     │
│                                                                             │
│ TUE · SORROWFUL · ENDURANCE                                                │
│   RELAY: 0500. Decade 3, bead 8. Peak. Long day. Stay on the protocol.     │
│   Dice [_]  Mod [_]   Work: _________________________________________     │
│   Scores: PU [_][_][_]  SU [_][_][_]  Plank [_]:[_][_]                    │
│   Notes: ____________________________________________________________     │
│                                                                             │
│   [WED · GLORIOUS · STRENGTH — same block]                                 │
│   [THU · LUMINOUS · SKILL — same block]                                    │
│   [FRI · SORROWFUL · ENDURANCE — same block]                               │
│   [SAT · JOYFUL · RECOVERY — same block]                                   │
├───────────────────────────────────────────────────────────────────────────┤
│ SUN · SANCTUM                                                              │
│   Bead closed [_]   Weight ____kg   Sleep avg ____h                        │
│   RELAY post-bead: ____________________________________________________   │
│   Operator note:   ____________________________________________________   │
└───────────────────────────────────────────────────────────────────────────┘
```

Each spread is one bead. Two facing pages. Pre-printed static content includes the QR identifier (top-left), the mystery and phase, the load targets (computed from the bead's phase), and RELAY's morning header for each day. The operator fills in everything else by hand.

### Field schema

| Field | Type | Source | Required |
|-------|------|--------|----------|
| QR identifier | Encoded | Pre-printed | Yes |
| Mystery, decade, bead, phase | Text | Pre-printed | Yes |
| Week-of date | Date | Operator | Yes |
| Load targets | Table | Pre-printed (computed from phase) | Yes |
| RELAY morning header | Text | Pre-printed per day | Yes |
| Dice roll | Numeric box | Operator | Yes |
| Modifier flag | Tick box | Operator | If triggered |
| Work performed | Free text | Operator | Yes |
| Scores | Numeric boxes | Operator | When applicable |
| Notes | Free text | Operator | Optional |
| Sanctum fields | Mixed | Operator + RELAY hand | Yes |

### Print spec

- **Trim.** 5.5 × 8.5" (US Digest / Half-Letter). Matches the Manual and Codex.
- **Pages.** ~150 (62 spreads × 2 pages, plus ~10 pages front matter — protocol summary, modality-at-a-glance, year ledger header — and ~16 pages back matter — annual ledger, weight chart, year-end Sanctum).
- **Binding.** Wire-O (twin-loop wire) hardcover. Lays perfectly flat, both pages writable, durable for daily handling. Available from Lulu, Mixam, and most regional book printers. (Smyth-sewn is the second choice if Wire-O isn't available at the user's print service — lays nearly flat after break-in.)
- **Paper.** 100 lb text cream (≈148 gsm), heavier than the Manual to handle daily writing in pen without ghosting.
- **Ink.** Black for pre-printed content. Operator writes in pencil (corrigible, ages well) or fountain pen (permanent, archival ink). Operator's call.
- **Ribbon bookmark.** One, sewn or tipped into the spine, marking the current bead.
- **Die pocket.** A slim cloth pocket affixed inside the front cover at bindery. Holds the operator's d6 (or d10).
- **Cover.** *ROSARY · LOGBOOK · Year One* foil-stamped. The year number is on the cover so Logbooks shelved together read as a sequence.

A new Logbook every year. Old Logbooks shelve in chronological order. The shelf is the long arc.

---

## The Codex

The permanent record. Boss spreads only — one per Year-One encounter. RELAY's first contact transmission transcribed across the top, the fight protocol restated, the fight log filled in across years.

The Codex is the book the operator may hand down. It is the only artifact in the kit that is meant to outlive the operator.

### Layout (one spread, per boss)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ ╔═══════════════╗                                                          │
│ ║  THE ANVIL    ║   DECADE 3 — THE NATIVITY                                │
│ ╚═══════════════╝   FIRST ENCOUNTER UNLOCKED: ________                     │
│                                                                             │
│ RELAY FIRST CONTACT:                                                       │
│ _________________________________________________________________________ │
│ _________________________________________________________________________ │
│                                                                             │
│ FIGHT PROTOCOL:                                                            │
│ • No run today.                                                            │
│ • Pushups to fatigue.                                                      │
│ • Pullup progressions to fatigue.                                          │
│ • Situps to fatigue.                                                       │
│ • Plank to fatigue.                                                        │
│ • Score = (PU + SU) + (Pullup-equiv × 2) + plank seconds.                  │
│                                                                             │
│ FIGHT LOG:                                                                 │
│ ┌─────────┬────┬────┬─────────┬──────┬────────┬─────────────────────────┐  │
│ │ DATE    │ PU │ SU │ PULLUPS │ PLNK │ SCORE  │ NOTES                   │  │
│ ├─────────┼────┼────┼─────────┼──────┼────────┼─────────────────────────┤  │
│ │         │    │    │         │      │        │                         │  │
│ │  (room for ~10 fights per boss)                                        │  │
│ └─────────┴────┴────┴─────────┴──────┴────────┴─────────────────────────┘  │
│                                                                             │
│ RELAY POST-ENGAGEMENT TRANSMISSIONS:                                       │
│ _________________________________________________________________________ │
└───────────────────────────────────────────────────────────────────────────┘
```

### Print spec

The Codex has two viable paths. Both are specified — the operator picks one at the start of Year One.

**Path A — Print-on-demand (the practical start).**

- **Trim.** 5.5 × 8.5" (matches the Manual and Logbook).
- **Pages.** 80–96. The seven Year-One boss spreads (4 pages each = 28 pages) plus reserved spreads for Years 2–4 bosses (32 pages) plus front matter (dedication, inheritance page) and end matter (lifetime ledger, blank notes pages). Padding to ≥75 pages is what makes it POD-eligible at KDP/IngramSpark/Lulu.
- **Binding.** Smyth-sewn case-laminate hardcover. The most archival POD option available.
- **Paper.** 80 lb cream text (≈118 gsm). Acid-free where the service offers it (Lulu's premium paper is acid-free; KDP's is not specified).
- **Cover.** *CODEX* foil-stamped or printed. Operator's name and year of inception inscribed by hand inside the front cover.

**Path B — Hand-bound (the heirloom upgrade).**

Commission from a US bookbinder at the close of Year One, once the boss spreads are filled in. The hand-bound version becomes the permanent record; the POD version may serve as Year-One working copy and then be retired.

- **Trim.** 5.5 × 8.5".
- **Pages.** As needed.
- **Binding.** Hand-sewn (Smyth or coptic) hardcover. Cloth- or leather-bound boards. Endpapers in a single deep color.
- **Paper.** 120 gsm cream archival, acid-free, expected fifty-year minimum lifespan.
- **Ink.** Operator writes in fountain pen or archival ink. No pencil — the Codex is permanent.
- **Vendors.** Gibbs Bookbinding (Los Angeles), The Creaky Spine Bindery, or any local conservator. Base prices begin around $90 and rise with materials and craft.

A single Codex is sufficient for Year One. Subsequent Mysteries — Sorrowful, Glorious, Luminous — may each get their own Codex, or all four may share one expanded volume. To be decided at the close of Year One.

---

## The QR encoding scheme

Every Logbook spread carries a QR code in the top-left corner, approximately 1 × 1" — large enough for any phone camera to scan from a foot away. Codex spreads carry one too. The Manual carries none — it has no per-instance data.

The QR payload is a single line of human-readable structured text:

```
RY|v1|Y{year}|D{decade}|B{bead}|P{phase}|M{mystery}|T{type}
```

| Payload | Decoded |
|---|---|
| `RY|v1|Y1|D3|B8|PPeak|MNativity|TLog` | Year 1, Decade 3, Bead 8 (peak), Nativity, Logbook spread |
| `RY|v1|Y1|D3|B11|PBoss|MNativity|TCodex|NAnvil` | Year 1, Decade 3, Boss bead (Anvil), Codex spread |
| `RY|v1|Y1|Dpendant|B5|PCenterpiece|MMary|TLog` | Year 1, Pendant, Centerpiece, Logbook spread |

If the QR fails to scan, the operator can type it in. The format is short enough to read with the naked eye.

---

## The data schema (the app contract)

What the app, whenever it exists, must read and write. Defined here so the paper and future app stay aligned.

```jsonc
{
  "spread_id": "RY|v1|Y1|D3|B8|PPeak|MNativity|TLog",
  "week_start": "2026-08-17",
  "days": [
    {
      "day": "Mon",
      "modality": "Joyful",
      "dice": 4,
      "modifier": null,
      "work": "Vigil + 20min flow",
      "scores": {},
      "notes": ""
    }
    // ... six more day records
  ],
  "sanctum": {
    "bead_closed": true,
    "next_bead_id": "RY|v1|Y1|D3|B9|PTaper|MNativity|TLog",
    "weight_kg": 78.2,
    "sleep_avg_h": 7.5,
    "relay_post_bead": "Bead 8 closed. Anvil in T-minus 2 beads. Body holding.",
    "operator_note": "Right shoulder fatigued. Plan: extra Joyful mobility on Mon."
  }
}
```

A Codex spread serializes similarly, with a `fights[]` array growing over years.

The app must implement two operations:

1. **Scan** — read a photographed Logbook spread. Decode the QR, optically recognize numeric box fields, photograph free-text zones as image archives. Output: JSON record matching the schema.
2. **Print** — given a `spread_id`, render a PDF pre-headed with all static content (mystery name, phase, load table, RELAY morning headers). Output: PDF for duplex printing.

Both operations are stateless from the app's perspective. The source of truth lives in the books.

---

## The Sunday Sanctum loop

The weekly close-out that holds books and app together.

1. **Mon–Sat.** Operator fills in the Logbook spread by hand. Six days of work.
2. **Sun (Sanctum, paper phase).** Operator closes the bottom band of the spread. Reviews the week. RELAY's post-bead transmission is written in.
3. **Sun (Sanctum, app phase — optional).** Operator scans the spread. The app updates the digital codex.
4. **Bead boundary.** Operator turns the page. The next spread is already pre-printed and headed. Work resumes.

If the app is not used, the loop runs identically minus step 3. The digital codex falls behind but the Logbook is intact and self-sufficient. Backfilling the digital codex from the Logbook can happen any future Sanctum, or never.

---

## Tools and format

### Source format: LaTeX

LaTeX is forty-plus years old and will compile in 2055. The verbosity is a one-time cost when writing templates; the resulting documents are typographically as good as anything published. TeX Live is heavy (~2GB) but installs once.

The repo will contain a `paper/` directory:

```
paper/
├── manual/
│   ├── manual.tex
│   ├── tables/                 # generated table data
│   └── bosses.yaml             # per-boss content (protocol, scoring)
├── logbook/
│   ├── logbook.tex             # full-book template
│   └── beads.csv               # per-bead static data (mystery, phase, load, headers)
├── codex/
│   └── codex.tex               # full-book template, pulls from bosses.yaml
└── Makefile                    # `make all` produces all three book PDFs
```

Static data (boss content, bead schedule, RELAY headers) lives in CSV/YAML separate from TeX. Updating the protocol means editing data, not typesetting.

### Print specs (summary)

| Book | Trim | Pages | Paper | Binding |
|---|---|---|---|---|
| Manual | 5.5 × 8.5" | 100–140 | 80 lb cream text (~118 gsm) | Smyth-sewn case-laminate hardcover |
| Logbook | 5.5 × 8.5" | ~150 | 100 lb cream text (~148 gsm) | Wire-O hardcover, lay-flat |
| Codex | 5.5 × 8.5" | 80–96 (POD) or open (hand-bound) | 80 lb cream POD / 120 gsm archival hand-bound | Smyth-sewn case-laminate (POD) or hand-sewn (heirloom) |

All three books share the same 5.5 × 8.5" trim and cream stock. The kit reads as a coordinated set on the shelf, distinguished by cover treatment and binding character.

### Where to print

The kit is designed against the off-the-shelf capabilities of US print-on-demand services as of 2026:

- **KDP** (Amazon) — hardcover trim 5.5×8.5 supported; 75–550-page range. Cheapest, but no Wire-O and limited paper options. Workable for Manual.
- **IngramSpark** — full POD with broader binding and paper options. Good for Manual and Codex.
- **Lulu** — supports Wire-O hardcover at 5.5×8.5, acid-free premium paper, smaller minimum runs. The recommended single-vendor option that covers all three books.
- **Mixam / regional book printers** — for Wire-O hardcover specifically, often higher quality than POD at slightly higher per-unit cost.
- **Gibbs Bookbinding (LA), The Creaky Spine Bindery, local conservators** — for the heirloom Codex upgrade, single copies, acid-free archival materials, $90+.

The operator does not need to pick a vendor up front. The LaTeX sources produce PDFs that work at any service supporting 5.5×8.5" trim.

---

## Constraints

- **Paper-sufficient.** The protocol runs with the three books, a pencil, and one die. The app is never required.
- **No state lives only in the app.** Any state the app holds must be reconstructable by re-scanning the Logbook.
- **No state lives only in the books.** Once a spread is scanned, the app holds enough to re-print it if the book is lost.
- **Migration-safe.** If the source format changes (LaTeX → something else), existing printed books remain valid forever.
- **Three objects.** Never grow the kit past three books. If the system needs a fourth artifact, redesign one of the three to absorb it.

---

## Open questions

- **POD vendor selection.** Lulu is recommended for covering all three books in a single order with Wire-O support, but the operator may want to comparison-print one bead spread at KDP, Lulu, and IngramSpark before committing.
- **The Codex binding path.** Path A (POD Smyth-sewn) at the start vs. Path B (commissioned hand-bound) at the close of Year One. Path A is the practical default; Path B is the ritual upgrade.
- **The die.** Wooden d6 vs. standard plastic d6 vs. d10 for finer rolls. Lives in the Logbook's front pocket. Aesthetic call.
- **The Vigil.** Specification pending research. Once specified, lives in the Manual's appendix.
- **The shelf.** Year-One Logbook + Codex shelve as a pair. After Year Four, the shelf has four Logbooks and one or four Codices. The shelf itself becomes a record.

---

*"The body learns the cue. The mind follows the bead."* — `practice.md`
