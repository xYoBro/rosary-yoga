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
| **The Manual** | Everything you LOOK UP. Rules, modality tables, dice tables, exercise menus per modality, boss protocols, load tables. Tabbed. Printed. Never changes mid-year. | Pocket / work bag | Eternal (per protocol version) |
| **The Logbook** | Everything you WRITE. One spread per bead, pre-printed with mystery, phase, load targets, and RELAY's morning headers. You fill in dice, work, scores, notes. | Desk / binder slot at home | The present year |
| **The Codex** | Everything that LASTS. Boss spreads only — RELAY's first contact, fight protocol, fight log across years. Hand-bound. | Shelf | Ancestral — decades, handed forward |

The whole kit can be described in one sentence: *you carry the Manual, you write in the Logbook, you inscribe the Codex.*

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

- **Size.** B6 (125 × 176mm). Pocket-fittable, but with enough page width for tables.
- **Pages.** 80–120, depending on appendix size.
- **Binding.** Smyth-sewn hardcover with cloth spine. Built to be carried for a year and survive it.
- **Paper.** 80gsm cream text stock, low-glare.
- **Ink.** Black, with one accent color (deep red, single-pass) for headers and tab markers.
- **Tabs.** Cut-tab dividers for: Week · Decade · Mysteries · Dice · Bosses · Scoring · Sanctum.
- **Cover.** *ROSARY · MANUAL · v1* embossed.

A new edition each protocol revision. The version number is part of the cover so an outdated Manual is visibly outdated.

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

- **Size.** A5 (148 × 210mm). Big enough to write comfortably; small enough to carry.
- **Pages.** ~128 (62 spreads × 2 pages + front matter + endpapers).
- **Binding.** Smyth-sewn hardcover, lay-flat. Cloth spine.
- **Paper.** 100gsm cream, pencil-and-ink friendly, low ghosting.
- **Ink.** Black for prints. Operator writes in pencil (Logbook entries are correctable) or pen (their choice).
- **Ribbon bookmark.** One, sewn into the spine.
- **Die pocket.** A slim sewn-in pocket inside the front cover. Holds the operator's d6 (or d10) so it never leaves the kit.
- **Cover.** *ROSARY · LOGBOOK · Year One* embossed. The year number is on the cover so Logbooks shelved together read as a sequence.

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

- **Size.** A5 (148 × 210mm). Matches the Logbook so they shelve together.
- **Pages.** ~32 (7 spreads + front matter + ample notes pages at back for re-fight overflow).
- **Binding.** Hand-sewn (Smyth or coptic) hardcover. Heavy cloth-bound boards. Endpapers in a single deep color.
- **Paper.** 120gsm cream archival stock. Acid-free. Made to last fifty years minimum.
- **Ink.** Operator writes in fountain pen or archival ink. No pencil — the Codex is permanent.
- **Cover.** *CODEX* embossed. The operator's name and the year of inception inside the front cover, in their own hand.

A single Codex is sufficient for Year One. Subsequent Mysteries — Sorrowful, Glorious, Luminous — may each get their own Codex, or all four may share one expanded volume. To be decided at the close of Year One.

---

## The QR encoding scheme

Every Logbook spread carries a QR code in the top-left corner. Codex spreads do too. The Manual carries none — it has no per-instance data.

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

| Book | Size | Paper | Binding | Cover |
|---|---|---|---|---|
| Manual | B6 (125×176mm) | 80gsm cream | Smyth-sewn hardcover | Embossed, cloth spine, tabbed |
| Logbook | A5 (148×210mm) | 100gsm cream | Smyth-sewn hardcover, lay-flat | Embossed, cloth spine, ribbon, die pocket |
| Codex | A5 (148×210mm) | 120gsm archival cream | Hand-sewn hardcover (coptic optional) | Embossed, cloth-bound boards |

All three books share A5/B6 dimensions and cream stock — the kit reads as a coordinated set on the shelf.

### Printers

Short run is fine for the Manual and Logbook (small online binderies). The Codex is hand-bound — a one-off per year, made by a local bookbinder or by the operator themselves. The Codex is the only book where craft matters as much as content.

---

## Constraints

- **Paper-sufficient.** The protocol runs with the three books, a pencil, and one die. The app is never required.
- **No state lives only in the app.** Any state the app holds must be reconstructable by re-scanning the Logbook.
- **No state lives only in the books.** Once a spread is scanned, the app holds enough to re-print it if the book is lost.
- **Migration-safe.** If the source format changes (LaTeX → something else), existing printed books remain valid forever.
- **Three objects.** Never grow the kit past three books. If the system needs a fourth artifact, redesign one of the three to absorb it.

---

## Open questions

- **Printer access.** Whether the operator owns or has reliable access to a printer/bindery. Determines who prints the books vs. ordering from an online service.
- **The Codex binding.** Smyth-sewn hardcover (durable, $$) vs. coptic-stitched (lay-flat, mid) vs. hand-bound by the operator (cheap, slow, ritual). Decide once.
- **The die.** A6 wooden d6 vs. a standard plastic d6 vs. a d10 for finer rolls. Lives in the Logbook's front pocket.
- **The Vigil.** Specification pending research. Once specified, lives in the Manual's appendix.
- **The shelf.** Year-One Logbook + Codex shelve as a pair. After Year Four, the shelf has four Logbooks and one or four Codices. The shelf itself becomes a record.

---

*"The body learns the cue. The mind follows the bead."* — `practice.md`
