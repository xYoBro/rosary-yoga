// Rosary Yoga — bead structure and sequence interpreter.
//
// The practice itself lives in data/practice.json under `sequences`. This
// module turns a sequence definition + mystery set + body state into the
// flat list of card "stations" the app renders. The physical rosary (74
// beads) is fixed and independent of which practice runs on it.

export const BEAD = {
  CROSS: "cross",
  OF: "of",
  HM: "hm",
  GB: "gb",
  MEDALLION: "medallion",
  MYSTERY: "mystery",
  CLOSING: "closing",
};

// The fixed visual structure of the rosary — 74 beads. This represents the
// physical rosary the user holds, independent of how the practice is grouped
// into cards.
export function buildBeads() {
  const beads = [];
  const push = (type, group) => beads.push({ type, group });

  // Opening pendant
  push(BEAD.CROSS, "pendant");
  push(BEAD.OF, "pendant");
  push(BEAD.HM, "pendant");
  push(BEAD.HM, "pendant");
  push(BEAD.HM, "pendant");
  push(BEAD.OF, "pendant");
  push(BEAD.MEDALLION, "medallion");

  for (let d = 1; d <= 5; d++) {
    const g = `decade-${d}`;
    push(BEAD.MYSTERY, g);
    push(BEAD.OF, g);
    for (let h = 0; h < 10; h++) push(BEAD.HM, g);
    push(BEAD.GB, g);
  }

  push(BEAD.CLOSING, "closing");
  push(BEAD.CLOSING, "closing");
  return beads;
}

export function ordinal(n) {
  return ["First", "Second", "Third", "Fourth", "Fifth"][n - 1] || String(n);
}

// A hail_marys entry is either "pose_id" or { pose, note }. A decade's
// hail_marys may also be a single pose id string meaning "all ten beads",
// with optional per-bead notes in hail_mary_notes keyed "1"–"10".
function normalizeHailMarys(decadeDef) {
  const hm = decadeDef.hail_marys;
  const notes = decadeDef.hail_mary_notes || {};
  const entries = [];
  for (let h = 0; h < 10; h++) {
    let entry = Array.isArray(hm) ? hm[h] : hm;
    if (typeof entry === "string") entry = { pose: entry, note: null };
    const note = entry.note || notes[String(h + 1)] || null;
    entries.push({ pose: entry.pose, note });
  }
  return entries;
}

// Resolve a decades list (template names or inline objects) against the
// sequence's decade_templates.
function resolveDecades(seqDef, decadesList) {
  const templates = seqDef.decade_templates || {};
  return decadesList.map((d) => {
    const def = typeof d === "string" ? templates[d] : d;
    if (!def) throw new Error(`unknown decade template: ${d}`);
    return def;
  });
}

// Resolve which sequence definition applies for a body state. "hurt" on the
// salutation practice hands the whole day to the restorative practice (and
// then applies the restorative practice's own "hurt" softening, if any).
function resolveSequenceDef(data, practiceKey, bodyState) {
  let key = data.sequences[practiceKey] ? practiceKey : data.default_sequence;
  let seqDef = data.sequences[key];
  let bs = (seqDef.body_states || {})[bodyState] || null;
  if (bs && bs.switch_to && data.sequences[bs.switch_to]) {
    key = bs.switch_to;
    seqDef = data.sequences[key];
    bs = (seqDef.body_states || {})[bodyState] || null;
    if (bs && bs.switch_to) bs = null; // one hop only — no chains
  }
  return { key, seqDef, bodyOverride: bs };
}

// One card per logical practice step. Each card references a range of beads
// it represents (start to end inclusive); the rosary strip highlights that
// range as "current".
export function buildSequence(data, mysterySetKey, bodyState, practiceKey) {
  const { seqDef, bodyOverride } = resolveSequenceDef(data, practiceKey, bodyState);
  const mysterySet = data.mysteries[mysterySetKey];
  const mysteries = mysterySet.items;
  const totalBeads = 74;
  const seq = [];
  let i = 0;

  const pushStation = (def) => {
    const count = def.count || 1;
    const beadStart = Math.min(i, totalBeads - 1);
    const beadEnd = Math.min(i + count - 1, totalBeads - 1);
    const station = {
      kind: def.kind,
      poseId: def.pose,
      label: def.label,
      note: def.note || null,
      beadStart,
      beadEnd,
    };
    if (def.kind === "prayer") {
      station.prayerKey = def.prayer;
      if (count > 1) station.count = count;
    } else if (def.kind === "interlude") {
      station.title = def.title;
      station.body = def.body;
      if (def.final) station.isFinal = true;
    }
    seq.push(station);
    i += count;
  };

  for (const def of seqDef.opening) pushStation(def);

  const decades = resolveDecades(
    seqDef,
    (bodyOverride && bodyOverride.decades) || seqDef.decades
  );

  decades.forEach((decade, d) => {
    const decadeNum = d + 1;
    const mystery = mysteries[d];

    seq.push({
      kind: "mystery",
      mysterySetName: mysterySet.name,
      mysteryName: mystery.name,
      mysteryReflection: mystery.reflection,
      breath: mysterySet.breath,
      decadeNum,
      label: ordinal(decadeNum) + " Decade",
      beadStart: i,
      beadEnd: i,
    });
    i += 1;

    pushStation({
      kind: "prayer",
      pose: decade.our_father,
      prayer: "our_father",
      label: `Decade ${decadeNum} · Our Father`,
    });

    normalizeHailMarys(decade).forEach((hm, h) => {
      pushStation({
        kind: "prayer",
        pose: hm.pose,
        prayer: "hail_mary",
        note: hm.note,
        label: `Decade ${decadeNum} · Hail Mary ${h + 1} of 10`,
      });
    });

    pushStation({
      kind: "prayer",
      pose: decade.glory_be,
      prayer: "glory_be",
      label: `Decade ${decadeNum} · Glory Be`,
    });
  });

  for (const def of seqDef.closing) pushStation(def);

  return seq;
}
