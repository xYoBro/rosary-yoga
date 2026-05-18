// Rosary Yoga — app entry
//
// Loads the practice data, builds the swipe sequence for tonight's mysteries,
// and renders one card at a time. Vanilla ES module. No framework.

const SWIPE_THRESHOLD = 50;
const SWIPE_RATIO = 1.4;
const SWIPE_TIME_THRESHOLD = 600;
const TRANSITION_HALF = 200;
const SESSION_TTL_MS = 60 * 60 * 1000;
const STATE_KEY = "rosary-yoga.state.v2";

// ---------- data loading -----------------------------------------------

async function loadData() {
  const res = await fetch("data/practice.json");
  if (!res.ok) throw new Error("failed to load practice data");
  return res.json();
}

// ---------- bead structure & sequence ----------------------------------

const BEAD = {
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
function buildBeads() {
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

function mysterySetForToday(data, override) {
  if (override && data.mysteries[override]) return override;
  const dow = String(new Date().getDay());
  return data.day_to_mystery_set[dow] || "joyful";
}

// One card per logical practice step. Each card references a range of beads
// it represents (start to end inclusive); the rosary strip highlights that
// range as "current". `duration` is the auto-advance time in seconds; omit
// it to require manual advance.
function buildSequence(data, mysterySetKey) {
  const mysteries = data.mysteries[mysterySetKey].items;
  const setName = data.mysteries[mysterySetKey].name;
  const seq = [];
  let i = 0;

  // --- opening pendant ---
  seq.push({
    kind: "prayer", poseId: "seated_forward_fold", prayerKey: "creed",
    label: "Opening · The Cross", duration: 240,
    beadStart: i, beadEnd: i,
  }); i += 1;

  seq.push({
    kind: "prayer", poseId: "child_pose", prayerKey: "our_father",
    label: "Opening · Our Father", duration: 180,
    beadStart: i, beadEnd: i,
  }); i += 1;

  seq.push({
    kind: "prayer", poseId: "supported_butterfly", prayerKey: "hail_mary",
    label: "Opening · Three Hail Marys", duration: 300, count: 3,
    beadStart: i, beadEnd: i + 2,
  }); i += 3;

  seq.push({
    kind: "prayer", poseId: "banana", prayerKey: "glory_be",
    label: "Opening · Glory Be · both sides",
    note: "Hold the first side for one minute. Switch sides for the second.",
    duration: 240,
    beadStart: i, beadEnd: i,
  }); i += 1;

  seq.push({
    kind: "interlude", poseId: "savasana",
    label: "Opening · Threshold",
    title: "Threshold",
    body: "The pause before the mysteries begin.\nBody held by the ground.\nMind held by the breath.",
    duration: 90,
    beadStart: i, beadEnd: i,
  }); i += 1;

  // --- five decades ---
  for (let d = 0; d < 5; d++) {
    const decadeNum = d + 1;
    const mystery = mysteries[d];
    const deepHoldId = data.deep_holds[d];
    const isLastDecade = d === 4;

    seq.push({
      kind: "mystery",
      mysterySetName: setName,
      mysteryName: mystery.name,
      mysteryReflection: mystery.reflection,
      decadeNum,
      label: ordinal(decadeNum) + " Decade",
      duration: 15,
      beadStart: i, beadEnd: i,
    }); i += 1;

    seq.push({
      kind: "prayer", poseId: "knees_to_chest", prayerKey: "our_father",
      label: `Decade ${decadeNum} · Our Father`, duration: 90,
      beadStart: i, beadEnd: i,
    }); i += 1;

    seq.push({
      kind: "prayer", poseId: deepHoldId, prayerKey: "hail_mary",
      label: `Decade ${decadeNum} · Ten Hail Marys`,
      count: 10,
      duration: 300,
      note: deepHoldId === "figure_four"
        ? "Switch sides halfway — five Hail Marys per side."
        : null,
      beadStart: i, beadEnd: i + 9,
    }); i += 10;

    seq.push({
      kind: "prayer",
      poseId: isLastDecade ? "legs_up_wall" : "neutral_back",
      prayerKey: "glory_be",
      label: `Decade ${decadeNum} · Glory Be`, duration: 60,
      beadStart: i, beadEnd: i,
    }); i += 1;
  }

  // --- closing ---
  seq.push({
    kind: "prayer", poseId: "legs_up_wall", prayerKey: "hail_holy_queen",
    label: "Closing · Hail Holy Queen", duration: 90,
    beadStart: i, beadEnd: i,
  }); i += 1;

  seq.push({
    kind: "interlude", poseId: "legs_up_wall",
    label: "Closing · Practice Complete",
    title: "Practice Complete",
    body: "Rest here as long as you wish.\nWhen you are ready, roll to one side and rise slowly.",
    // no duration — user finishes manually
    beadStart: i, beadEnd: i,
  });

  return seq;
}

function ordinal(n) {
  return ["First", "Second", "Third", "Fourth", "Fifth"][n - 1] || String(n);
}

// ---------- rosary visualization ---------------------------------------

const ROSARY = {
  bead_r: { cross: 4, of: 3.5, hm: 2.2, gb: 2, medallion: 5, mystery: 3, closing: 3 },
  bead_gap: 5,
  group_gap: 14,
  cross_arm: 5,
  height: 36,
};

function renderRosaryStrip(beads, station) {
  let x = 8;
  const ys = ROSARY.height / 2;
  const positions = [];

  let prevGroup = null;
  beads.forEach((b, i) => {
    if (prevGroup && b.group !== prevGroup) x += ROSARY.group_gap;
    const r = ROSARY.bead_r[b.type] || 2.5;
    positions.push({ x, y: ys, r, type: b.type, index: i });
    x += r * 2 + ROSARY.bead_gap;
    prevGroup = b.group;
  });

  const totalWidth = x + 8;
  const start = station.beadStart;
  const end = station.beadEnd;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${ROSARY.height}" preserveAspectRatio="xMidYMid meet" class="rosary-svg">`;
  svg += `<line x1="${positions[0].x}" y1="${ys}" x2="${positions[positions.length - 1].x}" y2="${ys}" class="rosary-chain"/>`;

  positions.forEach((p) => {
    let state;
    if (p.index < start) state = "done";
    else if (p.index >= start && p.index <= end) state = "current";
    else state = "todo";

    if (p.type === BEAD.CROSS) {
      const a = ROSARY.cross_arm;
      svg += `<g class="rosary-bead rosary-cross is-${state}" data-bead="${p.index}">`;
      svg += `<rect x="${p.x - 1.4}" y="${p.y - a}" width="2.8" height="${a * 2}" rx="0.6"/>`;
      svg += `<rect x="${p.x - a + 0.6}" y="${p.y - 1.4}" width="${a * 2 - 1.2}" height="2.8" rx="0.6"/>`;
      svg += `</g>`;
    } else if (p.type === BEAD.MYSTERY) {
      const r = p.r;
      svg += `<g class="rosary-bead rosary-mystery is-${state}" data-bead="${p.index}">`;
      svg += `<path d="M ${p.x} ${p.y - r} L ${p.x + r * 0.4} ${p.y - r * 0.4} L ${p.x + r} ${p.y} L ${p.x + r * 0.4} ${p.y + r * 0.4} L ${p.x} ${p.y + r} L ${p.x - r * 0.4} ${p.y + r * 0.4} L ${p.x - r} ${p.y} L ${p.x - r * 0.4} ${p.y - r * 0.4} Z"/>`;
      svg += `</g>`;
    } else if (p.type === BEAD.MEDALLION) {
      svg += `<g class="rosary-bead rosary-medallion is-${state}" data-bead="${p.index}">`;
      svg += `<circle cx="${p.x}" cy="${p.y}" r="${p.r}"/>`;
      svg += `<circle cx="${p.x}" cy="${p.y}" r="${p.r - 1.8}" class="rosary-inner"/>`;
      svg += `</g>`;
    } else {
      const cls = `rosary-bead rosary-${p.type} is-${state}`;
      svg += `<circle class="${cls}" data-bead="${p.index}" cx="${p.x}" cy="${p.y}" r="${p.r}"/>`;
    }
  });

  svg += `</svg>`;
  return svg;
}

// ---------- audio (soft chime on auto-advance) -------------------------

let audioCtx = null;

function ensureAudio() {
  if (audioCtx) {
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  try {
    audioCtx = new Ctor();
    return audioCtx;
  } catch (e) {
    return null;
  }
}

// A soft "bowl" — two stacked sine tones, gentle attack, long decay.
function playChime(variant) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Different variants for different transition types
  const tones = variant === "deep"
    ? [196.0, 392.0]   // G3 + G4 — deeper, for decade transitions
    : variant === "open"
    ? [392.0, 587.33]  // G4 + D5 — brighter, for practice start/end
    : [329.63, 493.88]; // E4 + B4 — default mid-tone

  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.0, now);
  masterGain.gain.linearRampToValueAtTime(0.18, now + 0.05);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

  tones.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(masterGain);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(idx === 0 ? 0.65 : 0.35, now);
    osc.start(now);
    osc.stop(now + 2.5);
  });
}

// ---------- rendering ---------------------------------------------------

function render(station, data) {
  const card = document.getElementById("card");
  const positionLabel = document.getElementById("positionLabel");
  const poseFigure = document.getElementById("poseFigure");
  const poseName = document.getElementById("poseName");
  const poseLatin = document.getElementById("poseLatin");
  const prayerLabel = document.getElementById("prayerLabel");
  const prayerText = document.getElementById("prayerText");

  positionLabel.textContent = station.label || "";
  card.classList.remove("is-mystery");

  if (station.kind === "mystery") {
    card.classList.add("is-mystery");
    const existing = card.querySelector(".mystery-block");
    if (existing) existing.remove();
    const block = document.createElement("div");
    block.className = "mystery-block";
    block.innerHTML = `
      <div class="set-name">${escapeHtml(station.mysterySetName)}</div>
      <div class="ornament">✦</div>
      <div class="mystery-name">${escapeHtml(station.mysteryName)}</div>
      <div class="mystery-reflection">${escapeHtml(station.mysteryReflection)}</div>
    `;
    card.appendChild(block);
    return;
  }

  const existingMystery = card.querySelector(".mystery-block");
  if (existingMystery) existingMystery.remove();

  const pose = data.poses[station.poseId];

  if (pose.photo) {
    poseFigure.classList.add("is-photo");
    poseFigure.innerHTML = `<img src="${escapeHtml(pose.photo)}" alt="${escapeHtml(pose.name)}" loading="lazy"/>`;
  } else {
    poseFigure.classList.remove("is-photo");
    poseFigure.innerHTML = "";
  }
  poseFigure.classList.remove("is-small");

  poseName.textContent = pose.name;
  poseLatin.textContent = pose.latin;

  if (station.kind === "interlude") {
    prayerLabel.textContent = (station.title || "").toUpperCase();
    renderPrayerText(prayerText, station.body);
    return;
  }

  // prayer card
  const prayer = data.prayers[station.prayerKey];
  if (station.count && station.count > 1) {
    prayerLabel.textContent = `${prayer.short} · ×${station.count}`;
  } else {
    prayerLabel.textContent = prayer.short;
  }

  let body = prayer.text;
  if (station.note) body += `\n\n— ${station.note}`;
  renderPrayerText(prayerText, body);
}

function renderPrayerText(container, text) {
  container.innerHTML = "";
  const stanzas = text.split(/\n\n+/);
  stanzas.forEach((stanza) => {
    if (!stanza.trim()) return;
    const p = document.createElement("p");
    const lines = stanza.split("\n");
    lines.forEach((line, idx) => {
      if (idx > 0) p.appendChild(document.createElement("br"));
      p.appendChild(document.createTextNode(line));
    });
    container.appendChild(p);
  });
  container.scrollTop = 0;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

// ---------- navigation --------------------------------------------------

let state = {
  data: null,
  beads: [],
  sequence: [],
  currentIndex: 0,
  mysterySetOverride: null,
  transitionLock: false,
};

let autoAdvanceTimer = null;
let countdownInterval = null;

function clearAutoAdvance() {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  hideCountdown();
}

function showCountdown(seconds) {
  const el = document.getElementById("countdown");
  if (!el) return;
  el.hidden = false;
  let remaining = seconds;
  const update = () => {
    if (remaining <= 0) {
      hideCountdown();
      return;
    }
    const mm = Math.floor(remaining / 60);
    const ss = String(remaining % 60).padStart(2, "0");
    el.textContent = `${mm}:${ss}`;
    remaining -= 1;
  };
  update();
  countdownInterval = setInterval(update, 1000);
}

function hideCountdown() {
  const el = document.getElementById("countdown");
  if (el) el.hidden = true;
}

function scheduleAutoAdvance(station) {
  clearAutoAdvance();
  if (!station.duration) return;
  showCountdown(station.duration);
  autoAdvanceTimer = setTimeout(() => {
    const variant = chimeVariantForStation(station);
    playChime(variant);
    next();
  }, station.duration * 1000);
}

function chimeVariantForStation(station) {
  if (station.kind === "mystery") return "open";
  if (station.prayerKey === "glory_be") return "deep";
  if (station.prayerKey === "hail_holy_queen") return "open";
  return "default";
}

function updateRosary() {
  const container = document.getElementById("rosaryStrip");
  const station = state.sequence[state.currentIndex];
  container.innerHTML = renderRosaryStrip(state.beads, station);

  container.querySelectorAll("[data-bead]").forEach((el) => {
    el.addEventListener("click", () => {
      const beadIdx = parseInt(el.getAttribute("data-bead"), 10);
      if (isNaN(beadIdx)) return;
      // find the station whose bead range contains this bead
      const target = state.sequence.findIndex(
        (s) => beadIdx >= s.beadStart && beadIdx <= s.beadEnd
      );
      if (target >= 0 && target !== state.currentIndex) {
        goTo(target, target > state.currentIndex ? 1 : -1);
      }
    });
  });

  // Auto-scroll so the current range is centered
  requestAnimationFrame(() => {
    const currentBeads = container.querySelectorAll(".rosary-bead.is-current");
    if (!currentBeads.length) return;
    const first = currentBeads[0].getBoundingClientRect();
    const last = currentBeads[currentBeads.length - 1].getBoundingClientRect();
    const targetCenter = (first.left + last.right) / 2;
    const cbox = container.getBoundingClientRect();
    const containerCenter = cbox.left + cbox.width / 2;
    container.scrollBy({ left: targetCenter - containerCenter, behavior: "smooth" });
  });
}

function goTo(index, direction) {
  if (state.transitionLock) return;
  if (index < 0 || index >= state.sequence.length) return;
  if (index === state.currentIndex) return;

  clearAutoAdvance();
  state.transitionLock = true;
  const card = document.getElementById("card");

  card.classList.remove("is-here");
  card.classList.add(direction > 0 ? "is-leaving-left" : "is-leaving-right");

  setTimeout(() => {
    state.currentIndex = index;
    const station = state.sequence[state.currentIndex];
    render(station, state.data);
    saveState();
    updateRosary();

    card.classList.remove("is-leaving-left", "is-leaving-right");
    card.classList.add(direction > 0 ? "is-entering-right" : "is-entering-left");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.classList.remove("is-entering-right", "is-entering-left");
        card.classList.add("is-here");
        scheduleAutoAdvance(station);
      });
    });

    setTimeout(() => {
      state.transitionLock = false;
    }, TRANSITION_HALF);
  }, TRANSITION_HALF);
}

function next() {
  goTo(state.currentIndex + 1, 1);
}

function prev() {
  goTo(state.currentIndex - 1, -1);
}

// ---------- gestures ----------------------------------------------------

let suppressNextClick = false;

function attachGestures() {
  const stage = document.getElementById("cardStage");
  let start = null;

  stage.addEventListener("pointerdown", (e) => {
    start = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId };
    suppressNextClick = false;
    ensureAudio();
  });

  stage.addEventListener("pointerup", (e) => {
    if (!start || start.id !== e.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dt = Date.now() - start.t;
    start = null;

    const horizontal = Math.abs(dx) > Math.abs(dy) * SWIPE_RATIO;
    const fast = dt < SWIPE_TIME_THRESHOLD;
    const long = Math.abs(dx) > SWIPE_THRESHOLD;
    const moved = Math.abs(dx) > 8 || Math.abs(dy) > 8;

    if (moved) suppressNextClick = true;

    if (horizontal && long && fast) {
      if (dx < 0) next();
      else prev();
    }
  });

  stage.addEventListener("pointercancel", () => {
    start = null;
  });
}

function tapZoneClick(handler) {
  return () => {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    handler();
  };
}

function attachKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "Escape") {
      closeMenu();
      closeMysteryPicker();
    }
  });
}

function attachButtons() {
  document.getElementById("tapZoneNext").addEventListener("click", tapZoneClick(next));
  document.getElementById("tapZonePrev").addEventListener("click", tapZoneClick(prev));

  document.getElementById("menuButton").addEventListener("click", openMenu);

  document.querySelectorAll(".menu-action").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      if (action === "close") closeMenu();
      else if (action === "close-mystery") closeMysteryPicker();
      else if (action === "restart") {
        closeMenu();
        clearState();
        clearAutoAdvance();
        state.currentIndex = 0;
        render(state.sequence[0], state.data);
        updateRosary();
        scheduleAutoAdvance(state.sequence[0]);
      } else if (action === "mysteries") {
        closeMenu();
        openMysteryPicker();
      }
    });
  });
}

// ---------- menu --------------------------------------------------------

function openMenu() {
  const overlay = document.getElementById("menuOverlay");
  const subtitle = document.getElementById("menuSubtitle");
  const setKey = mysterySetForToday(state.data, state.mysterySetOverride);
  subtitle.textContent = state.data.mysteries[setKey].name;
  overlay.hidden = false;
}

function closeMenu() {
  document.getElementById("menuOverlay").hidden = true;
}

function openMysteryPicker() {
  const overlay = document.getElementById("mysteryOverlay");
  const options = document.getElementById("mysteryOptions");
  options.innerHTML = "";
  const todayKey = mysterySetForToday(state.data, null);
  const currentKey = mysterySetForToday(state.data, state.mysterySetOverride);

  for (const key of ["joyful", "sorrowful", "glorious", "luminous"]) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu-action";
    if (key === currentKey) btn.classList.add("is-current");
    const label = state.data.mysteries[key].name;
    btn.textContent = key === todayKey ? `${label} · tonight` : label;
    btn.addEventListener("click", () => {
      state.mysterySetOverride = key === todayKey ? null : key;
      state.sequence = buildSequence(state.data, mysterySetForToday(state.data, state.mysterySetOverride));
      clearAutoAdvance();
      state.currentIndex = 0;
      render(state.sequence[0], state.data);
      saveState();
      updateRosary();
      scheduleAutoAdvance(state.sequence[0]);
      closeMysteryPicker();
    });
    options.appendChild(btn);
  }

  overlay.hidden = false;
}

function closeMysteryPicker() {
  document.getElementById("mysteryOverlay").hidden = true;
}

// ---------- persistence -------------------------------------------------

function saveState() {
  try {
    localStorage.setItem(
      STATE_KEY,
      JSON.stringify({
        currentIndex: state.currentIndex,
        mysterySetOverride: state.mysterySetOverride,
        savedAt: Date.now(),
      })
    );
  } catch (e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > SESSION_TTL_MS) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function clearState() {
  try { localStorage.removeItem(STATE_KEY); } catch (e) {}
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

// ---------- boot --------------------------------------------------------

async function boot() {
  try {
    state.data = await loadData();
  } catch (e) {
    document.body.innerHTML =
      '<p style="padding:2rem;color:#e7d7b7;font-family:Georgia,serif">Could not load practice data.</p>';
    return;
  }

  state.beads = buildBeads();

  const saved = loadState();
  if (saved) state.mysterySetOverride = saved.mysterySetOverride || null;

  state.sequence = buildSequence(
    state.data,
    mysterySetForToday(state.data, state.mysterySetOverride)
  );
  state.currentIndex = saved ? Math.min(saved.currentIndex || 0, state.sequence.length - 1) : 0;

  const station = state.sequence[state.currentIndex];
  render(station, state.data);
  document.getElementById("card").classList.add("is-here");
  updateRosary();
  scheduleAutoAdvance(station);

  attachGestures();
  attachKeyboard();
  attachButtons();
  registerServiceWorker();
}

boot();
