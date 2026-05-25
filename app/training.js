// Rosary Yoga — training module
//
// The daytime arm. Reads the training block of practice.json, computes
// today's bead from year_start_date, picks a modality from day-of-week,
// applies the bead phase's load multiplier to the prescription, assembles
// a Parliament transmission, and renders one card.
//
// One daily action — Mark as done — logs to localStorage. Everything
// else (Sanctum, Codex, Thought Cabinet) is opened on demand.

const LOG_KEY = "rosary-yoga.training.log.v1";
const START_OVERRIDE_KEY = "rosary-yoga.training.start.v1";

// ---------- bead computation -----------------------------------------

// Days between two ISO date strings (or Date objects), ignoring time-of-day.
function dayDiff(fromISO, toISO) {
  const a = new Date(fromISO);
  const b = new Date(toISO);
  const aMid = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bMid = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.floor((bMid - aMid) / 86400000);
}

function isoDateLocal(date) {
  const d = date || new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// One bead per ISO week, anchored to the year_start_date. The week the
// operator started is week 1 (bead 1). Bead increments on the same
// weekday as the start; e.g., starting on a Sunday means each new bead
// begins on Sunday.
function weeksSinceStart(startISO, todayISO) {
  return Math.floor(dayDiff(startISO, todayISO) / 7);
}

// Given a training object and a date, return the year-position:
//   { week, bead, decade, phase, mystery_set, mystery_focus, in_pendant,
//     in_closing, decade_obj, boss_id, year_complete }
function locateOnYear(training, todayISO) {
  const startISO = loadStartOverride() || training.year_start_date;
  const week = weeksSinceStart(startISO, todayISO) + 1; // 1-indexed
  const total = training.structure.total_weeks;
  const pendantW = training.structure.pendant_weeks;
  const decadeW = training.structure.decade_weeks;

  if (week < 1) {
    return { week, bead: 1, decade: null, phase: "pendant", mystery_set: null,
             mystery_focus: training.pendant.description, in_pendant: true,
             in_closing: false, decade_obj: null, boss_id: training.pendant.boss,
             year_complete: false, not_started: true };
  }

  if (week > total) {
    return { week, bead: total, decade: 5, phase: "closing",
             mystery_set: "joyful", mystery_focus: "Year complete.",
             in_pendant: false, in_closing: true, decade_obj: null,
             boss_id: training.closing.boss, year_complete: true };
  }

  if (week <= pendantW) {
    const isTrial = week === pendantW;
    return {
      week,
      bead: week,
      decade: null,
      phase: isTrial ? "trial" : "pendant",
      mystery_set: null,
      mystery_focus: training.pendant.description,
      in_pendant: true,
      in_closing: false,
      decade_obj: null,
      boss_id: isTrial ? training.pendant.boss : null,
      year_complete: false
    };
  }

  if (week === total && training.closing) {
    return {
      week,
      bead: 1,
      decade: 5,
      phase: "closing",
      mystery_set: "joyful",
      mystery_focus: training.closing.description,
      in_pendant: false,
      in_closing: true,
      decade_obj: null,
      boss_id: training.closing.boss,
      year_complete: false
    };
  }

  const decadeBlockStart = pendantW + 1;
  const offsetIntoDecades = week - decadeBlockStart; // 0-indexed
  const decadeIndex = Math.floor(offsetIntoDecades / decadeW);
  const beadInDecade = (offsetIntoDecades % decadeW) + 1; // 1..10

  const decadeObj = training.decades[decadeIndex];
  const isBoss = beadInDecade === decadeW;
  const phase = isBoss ? "boss" : training.bead_phase_table[beadInDecade - 1];

  return {
    week,
    bead: beadInDecade,
    decade: decadeIndex + 1,
    phase,
    mystery_set: decadeObj.mystery_set,
    mystery_focus: decadeObj.mystery_focus,
    in_pendant: false,
    in_closing: false,
    decade_obj: decadeObj,
    boss_id: isBoss ? decadeObj.boss : null,
    year_complete: false
  };
}

// ---------- modality + prescription ----------------------------------

function modalityForToday(training, todayISO) {
  const d = new Date(todayISO);
  const dow = String(d.getDay());
  return training.day_to_modality[dow] || "joyful";
}

function prescriptionFor(training, modalityKey, phase) {
  const m = training.modalities[modalityKey];
  if (!m || m.no_workout) return null;
  // Boss / trial / closing phases don't have a normal prescription —
  // the boss's protocol applies instead.
  if (phase === "boss" || phase === "trial" || phase === "closing") return null;
  return m.prescriptions[phase] || m.prescriptions.build || null;
}

// ---------- transmission assembly ------------------------------------

function decadeLabel(training, ctx) {
  if (ctx.in_pendant) return "Pendant";
  if (ctx.in_closing) return "The Closing";
  if (!ctx.decade_obj) return "—";
  return ctx.decade_obj.name;
}

function bossShortName(training, bossId) {
  if (!bossId) return "";
  const b = training.bosses[bossId];
  return b ? b.short_name : "";
}

// A deterministic morning time string for the transmission's {time} slot.
// Operator can override later; for now we default to 0500 unless it's a
// Sanctum (Sunday), in which case 0700.
function transmissionTime(modalityKey) {
  return modalityKey === "sanctum" ? "0700" : "0500";
}

function fill(template, vars) {
  if (!template) return null;
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`));
}

function pickRelayLine(training, ctx, modalityKey) {
  const lines = training.transmission_lines.RELAY;
  let key;
  if (ctx.phase === "trial") key = "trial";
  else if (ctx.phase === "closing") key = "closing";
  else if (ctx.in_pendant) key = "pendant";
  else if (ctx.phase === "boss") key = "boss";
  else if (ctx.phase === "taper") key = "taper";
  else if (ctx.phase === "peak") key = "peak";
  else if (ctx.phase === "deload") key = "deload";
  else if (ctx.phase === "build") key = "build";
  else key = "intro";
  return lines[key] || lines.intro;
}

function pickModalityVoice(training, modalityKey, ctx, voiceName) {
  const corpus = training.transmission_lines[voiceName];
  if (!corpus) return null;
  // Priority: phase-specific (deload, boss) wins; then modality; then default.
  if (corpus[ctx.phase]) return corpus[ctx.phase];
  if (corpus[modalityKey]) return corpus[modalityKey];
  if (corpus.morning) return corpus.morning;
  if (corpus.default) return corpus.default;
  return null;
}

// The Raven only speaks under specific conditions — and never every day.
// For v1: speak on Saturday-recovery, on a missed-workout day, and on boss
// week. Otherwise silent.
function pickRavenLine(training, ctx, modalityKey, missedYesterday) {
  const corpus = training.transmission_lines["THE RAVEN"];
  if (!corpus) return null;
  if (missedYesterday) return corpus.missed;
  if (modalityKey === "joyful" && ctx.phase !== "peak") return corpus.recovery;
  if (ctx.phase === "boss") return null; // RELAY carries the boss morning alone
  return null;
}

function buildTransmission(training, ctx, modalityKey, missedYesterday) {
  const time = transmissionTime(modalityKey);
  const decade_name = decadeLabel(training, ctx);
  const phase = (training.phase_names[ctx.phase] || ctx.phase);
  const modality_name = (training.modalities[modalityKey] || {}).name || modalityKey;
  const prescription = prescriptionFor(training, modalityKey, ctx.phase);
  const prescription_short = prescription ? prescription.summary : "";
  const boss_short = bossShortName(training, ctx.boss_id || (ctx.decade_obj && ctx.decade_obj.boss));

  const vars = { time, decade_name, bead: ctx.bead, phase, modality: modality_name,
                 prescription_short, boss_short };

  const transmission = [];
  transmission.push({ voice: "RELAY", text: fill(pickRelayLine(training, ctx, modalityKey), vars) });

  const modality = training.modalities[modalityKey] || {};
  const voices = modality.primary_voices || ["RELAY"];
  for (const v of voices) {
    if (v === "RELAY") continue;
    const line = pickModalityVoice(training, modalityKey, ctx, v);
    if (line) transmission.push({ voice: v, text: fill(line, vars) });
  }

  const raven = pickRavenLine(training, ctx, modalityKey, missedYesterday);
  if (raven) transmission.push({ voice: "THE RAVEN", text: raven });

  return transmission;
}

// ---------- training log (localStorage) ------------------------------

function loadLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (e) { return {}; }
}

function saveLog(log) {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch (e) {}
}

function loadStartOverride() {
  try { return localStorage.getItem(START_OVERRIDE_KEY) || null; } catch (e) { return null; }
}

export function setYearStartDate(iso) {
  try {
    if (iso) localStorage.setItem(START_OVERRIDE_KEY, iso);
    else localStorage.removeItem(START_OVERRIDE_KEY);
  } catch (e) {}
}

export function getTodayStatus(todayISO) {
  const log = loadLog();
  const iso = todayISO || isoDateLocal();
  const entry = log[iso];
  return entry ? entry.status : null;
}

export function markToday(status, ctx, modalityKey, todayISO) {
  const iso = todayISO || isoDateLocal();
  const log = loadLog();
  log[iso] = {
    date: iso,
    week: ctx.week,
    decade: ctx.decade,
    bead: ctx.bead,
    phase: ctx.phase,
    modality: modalityKey,
    status,
    closed_at: new Date().toISOString()
  };
  saveLog(log);
}

function wasYesterdayMissed() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  // Sunday isn't a "miss" — it's Sanctum.
  if (yesterday.getDay() === 0) return false;
  const iso = isoDateLocal(yesterday);
  const log = loadLog();
  const entry = log[iso];
  return !entry || entry.status === "skipped";
}

// ---------- public entry: compute today's context --------------------

export function computeTodayContext(data, now) {
  const training = data.training;
  if (!training) return null;
  const todayISO = isoDateLocal(now);
  const ctx = locateOnYear(training, todayISO);
  const modalityKey = modalityForToday(training, todayISO);
  const modality = training.modalities[modalityKey];
  const prescription = prescriptionFor(training, modalityKey, ctx.phase);
  const boss = (ctx.boss_id && training.bosses[ctx.boss_id]) || null;
  const transmission = buildTransmission(training, ctx, modalityKey,
                                          wasYesterdayMissed());
  const status = getTodayStatus(todayISO);

  return {
    todayISO,
    ctx,
    modalityKey,
    modality,
    prescription,
    boss,
    transmission,
    status,
    training
  };
}

// ---------- rendering ------------------------------------------------

function el(tag, opts, children) {
  const e = document.createElement(tag);
  if (opts) {
    if (opts.class) e.className = opts.class;
    if (opts.text) e.textContent = opts.text;
    if (opts.html) e.innerHTML = opts.html;
    if (opts.attrs) for (const k in opts.attrs) e.setAttribute(k, opts.attrs[k]);
    if (opts.on) for (const k in opts.on) e.addEventListener(k, opts.on[k]);
  }
  if (children) for (const c of children) if (c) e.appendChild(c);
  return e;
}

function voiceClass(voiceName) {
  const slug = voiceName.toLowerCase().replace(/\s+/g, "-");
  return `voice-line voice-${slug}`;
}

export function renderToday(state, onMark, onOpenPractice) {
  const root = document.getElementById("todayPanel");
  if (!root) return;
  root.innerHTML = "";

  const c = state.ctx;
  const m = state.modality;

  // Header — bead identifier line
  const phaseLabel = state.training.phase_names[c.phase] || c.phase;
  const decadeLabel = c.in_pendant ? "PENDANT"
                    : c.in_closing ? "THE CLOSING"
                    : c.decade_obj ? `DECADE ${c.decade}` : "";
  const headerLine = [
    `YEAR ${state.training.year}`,
    decadeLabel,
    `BEAD ${c.bead}`,
    phaseLabel.toUpperCase()
  ].filter(Boolean).join(" · ");

  const mysteryLine = c.in_pendant ? "PENDANT"
                    : c.in_closing ? "HAIL HOLY QUEEN"
                    : (c.mystery_focus || "").toUpperCase();

  const header = el("div", { class: "today-header" }, [
    el("div", { class: "today-bead-line", text: headerLine }),
    el("div", { class: "today-mystery-line", text: mysteryLine })
  ]);
  root.appendChild(header);

  // Transmission block — Parliament voices
  const transmission = el("div", { class: "today-transmission" });
  for (const line of state.transmission) {
    const block = el("div", { class: "voice-block" }, [
      el("div", { class: `voice-name ${voiceClass(line.voice)}`, text: line.voice }),
      el("div", { class: "voice-text", text: line.text })
    ]);
    transmission.appendChild(block);
  }
  root.appendChild(transmission);

  // The work
  const work = el("div", { class: "today-work" });
  work.appendChild(el("div", { class: "today-section-label", text: "TODAY" }));

  if (state.boss && (c.phase === "boss" || c.phase === "trial" || c.phase === "closing")) {
    // Boss morning — show the boss card
    work.appendChild(el("div", { class: "today-boss-name", text: state.boss.short_name }));
    work.appendChild(el("div", { class: "today-boss-protocol", text: "PROTOCOL" }));
    const ul = el("ul", { class: "today-protocol-list" });
    for (const p of state.boss.protocol) {
      ul.appendChild(el("li", { text: p }));
    }
    work.appendChild(ul);
    work.appendChild(el("div", { class: "today-boss-scoring", text: state.boss.scoring }));
  } else if (state.prescription) {
    work.appendChild(el("div", { class: "today-work-summary", text: state.prescription.summary }));
    work.appendChild(el("div", { class: "today-work-meta",
      text: `${state.prescription.duration_min} min · ${m.register}` }));
    const ul = el("ul", { class: "today-exercise-list" });
    for (const ex of state.prescription.exercises) {
      ul.appendChild(el("li", { text: ex }));
    }
    work.appendChild(ul);
  } else if (m.no_workout) {
    work.appendChild(el("div", { class: "today-work-summary", text: m.summary }));
    work.appendChild(el("div", { class: "today-work-meta", text: m.register }));
  } else {
    work.appendChild(el("div", { class: "today-work-summary", text: "No prescription." }));
  }
  root.appendChild(work);

  // Status / actions
  const actions = el("div", { class: "today-actions" });

  const isSanctum = !!m.no_workout;

  if (state.status === "done") {
    actions.appendChild(el("div", { class: "today-status today-status-done", text: "✓  Marked done" }));
  } else if (state.status === "skipped") {
    actions.appendChild(el("div", { class: "today-status today-status-skipped", text: "—  Marked skipped" }));
  } else if (!isSanctum) {
    actions.appendChild(el("button", {
      class: "today-primary",
      text: "Mark as done",
      attrs: { type: "button" },
      on: { click: () => onMark("done") }
    }));
    actions.appendChild(el("button", {
      class: "today-secondary",
      text: "Mark as skipped",
      attrs: { type: "button" },
      on: { click: () => onMark("skipped") }
    }));
  } else {
    // Sanctum: a "Close the bead" primary
    actions.appendChild(el("button", {
      class: "today-primary",
      text: "Close the bead",
      attrs: { type: "button" },
      on: { click: () => onMark("done") }
    }));
  }

  actions.appendChild(el("button", {
    class: "today-tertiary",
    text: "Open the nightly practice",
    attrs: { type: "button" },
    on: { click: onOpenPractice }
  }));

  root.appendChild(actions);

  // Quote line for boss days
  const thoughtId = c.decade_obj && c.decade_obj.thought;
  if (thoughtId && state.training.thoughts[thoughtId] && c.phase === "boss") {
    const t = state.training.thoughts[thoughtId];
    root.appendChild(el("div", { class: "today-thought" }, [
      el("div", { class: "today-thought-label", text: "ON OFFER" }),
      el("div", { class: "today-thought-text", text: t.text })
    ]));
  }
}

// ---------- when to auto-open ----------------------------------------

// True if the Today view should auto-open instead of going straight to
// the body check / nightly practice. Default policy:
//   - Before 18:00 local time, and
//   - Today's training status isn't already recorded.
// The user can always reach the nightly practice from the Today view.
export function shouldAutoOpenToday(now) {
  const d = now || new Date();
  const hr = d.getHours();
  if (hr >= 18) return false; // evening — default to the nightly practice
  const status = getTodayStatus(isoDateLocal(d));
  return !status;
}

// ---------- exports --------------------------------------------------

export { isoDateLocal };
