// Rosary Yoga — app entry
//
// Loads the practice data, builds the swipe sequence for tonight's mysteries,
// and renders one card at a time. Vanilla ES module. No framework.

const SWIPE_THRESHOLD = 50;          // px — minimum horizontal distance
const SWIPE_RATIO = 1.4;              // horizontal must exceed vertical by this factor
const SWIPE_TIME_THRESHOLD = 600;     // ms — max gesture duration
const TRANSITION_HALF = 200;          // ms — half of CSS card transition
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour
const STATE_KEY = "rosary-yoga.state.v1";

// ---------- data loading -----------------------------------------------

async function loadData() {
  const res = await fetch("data/practice.json");
  if (!res.ok) throw new Error("failed to load practice data");
  return res.json();
}

// ---------- sequence construction --------------------------------------

function mysterySetForToday(data, override) {
  if (override && data.mysteries[override]) return override;
  const dow = String(new Date().getDay());
  return data.day_to_mystery_set[dow] || "joyful";
}

// Bead types used by the rosary visualization.
// Each station carries a beadType + beadGroup so the strip knows how to render it.
const BEAD = {
  CROSS: "cross",
  OF: "of",         // Our Father bead
  HM: "hm",         // Hail Mary bead
  GB: "gb",         // Glory Be (small marker, between)
  MEDALLION: "medallion",
  MYSTERY: "mystery",
  CLOSING: "closing",
};

function buildSequence(data, mysterySetKey) {
  const mysteries = data.mysteries[mysterySetKey].items;
  const setName = data.mysteries[mysterySetKey].name;
  const seq = [];

  // --- opening pendant ---
  seq.push({
    kind: "prayer",
    poseId: "seated_forward_fold",
    prayerKey: "creed",
    posePhase: "start",
    label: "Opening · The Cross",
    section: "opening",
    bead: { type: BEAD.CROSS, group: "pendant" },
  });
  seq.push({
    kind: "prayer",
    poseId: "child_pose",
    prayerKey: "our_father",
    posePhase: "start",
    label: "Opening · Our Father",
    section: "opening",
    bead: { type: BEAD.OF, group: "pendant" },
  });
  for (let i = 1; i <= 3; i++) {
    seq.push({
      kind: "prayer",
      poseId: "supported_butterfly",
      prayerKey: "hail_mary",
      posePhase: i === 1 ? "start" : "continue",
      label: `Opening · Hail Mary ${i} of 3`,
      section: "opening",
      bead: { type: BEAD.HM, group: "pendant" },
    });
  }
  seq.push({
    kind: "prayer",
    poseId: "banana",
    prayerKey: "glory_be",
    posePhase: "start",
    label: "Opening · Glory Be · both sides",
    section: "opening",
    note: "Hold the first side for one minute. Switch sides for the second.",
    bead: { type: BEAD.OF, group: "pendant" },
  });
  seq.push({
    kind: "interlude",
    poseId: "savasana",
    label: "Opening · Threshold",
    section: "opening",
    title: "Threshold",
    body: "The pause before the mysteries begin.\nBody held by the ground.\nMind held by the breath.",
    bead: { type: BEAD.MEDALLION, group: "medallion" },
  });

  // --- five decades ---
  for (let d = 0; d < 5; d++) {
    const decadeNum = d + 1;
    const mystery = mysteries[d];
    const deepHoldId = data.deep_holds[d];
    const isLastDecade = d === 4;

    // mystery announcement
    seq.push({
      kind: "mystery",
      mysterySetName: setName,
      mysteryName: mystery.name,
      mysteryReflection: mystery.reflection,
      decadeNum,
      label: ordinal(decadeNum) + " Decade",
      section: "decade",
      bead: { type: BEAD.MYSTERY, group: `decade-${decadeNum}` },
    });

    // anchor — Our Father with Knees-to-Chest
    seq.push({
      kind: "prayer",
      poseId: "knees_to_chest",
      prayerKey: "our_father",
      posePhase: "start",
      label: `Decade ${decadeNum} · Our Father`,
      section: "decade",
      bead: { type: BEAD.OF, group: `decade-${decadeNum}` },
    });

    // 10 Hail Marys in the deep hold
    for (let h = 1; h <= 10; h++) {
      const isFigureFour = deepHoldId === "figure_four";
      const sideNote =
        isFigureFour && h === 6
          ? "Switch sides — left ankle over right thigh."
          : null;

      seq.push({
        kind: "prayer",
        poseId: deepHoldId,
        prayerKey: "hail_mary",
        posePhase: h === 1 ? "start" : "continue",
        label: `Decade ${decadeNum} · Hail Mary ${h} of 10`,
        section: "decade",
        note: sideNote,
        bead: { type: BEAD.HM, group: `decade-${decadeNum}` },
      });
    }

    // Glory Be — for decades 1–4, neutral on back; for decade 5, stay in Legs Up the Wall
    seq.push({
      kind: "prayer",
      poseId: isLastDecade ? "legs_up_wall" : "neutral_back",
      prayerKey: "glory_be",
      posePhase: isLastDecade ? "continue" : "start",
      label: `Decade ${decadeNum} · Glory Be`,
      section: "decade",
      bead: { type: BEAD.GB, group: `decade-${decadeNum}` },
    });
  }

  // --- closing ---
  seq.push({
    kind: "prayer",
    poseId: "legs_up_wall",
    prayerKey: "hail_holy_queen",
    posePhase: "continue",
    label: "Closing · Hail Holy Queen",
    section: "closing",
    bead: { type: BEAD.CLOSING, group: "closing" },
  });

  seq.push({
    kind: "interlude",
    poseId: "legs_up_wall",
    label: "Closing · Practice Complete",
    section: "closing",
    title: "Practice Complete",
    body: "Rest here as long as you wish.\nWhen you are ready, roll to one side and rise slowly.",
    bead: { type: BEAD.CLOSING, group: "closing" },
  });

  return seq;
}

function ordinal(n) {
  return ["First", "Second", "Third", "Fourth", "Fifth"][n - 1] || String(n);
}

// ---------- rosary visualization ---------------------------------------

// Visual constants for the rosary strip.
const ROSARY = {
  bead_r: { cross: 4, of: 3.5, hm: 2.2, gb: 2, medallion: 5, mystery: 3, closing: 3 },
  bead_gap: 5,
  group_gap: 14,
  cross_arm: 5,
  height: 36,
};

// Build an SVG showing every station in sequence as a bead.
// The current and completed states are applied as classes, not redrawn.
function renderRosaryStrip(seq, currentIndex) {
  let x = 8;
  const ys = ROSARY.height / 2;
  const positions = [];

  // Walk sequence and lay out positions left → right
  let prevGroup = null;
  seq.forEach((st, i) => {
    if (prevGroup && st.bead.group !== prevGroup) {
      x += ROSARY.group_gap;
    }
    const type = st.bead.type;
    const r = ROSARY.bead_r[type] || 2.5;
    positions.push({ x, y: ys, r, type, index: i });
    x += r * 2 + ROSARY.bead_gap;
    prevGroup = st.bead.group;
  });

  const totalWidth = x + 8;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${ROSARY.height}" preserveAspectRatio="xMidYMid meet" class="rosary-svg">`;

  // Chain — a faint horizontal line connecting beads, drawn first so beads sit on top
  svg += `<line x1="${positions[0].x}" y1="${ys}" x2="${positions[positions.length - 1].x}" y2="${ys}" class="rosary-chain"/>`;

  // Beads
  positions.forEach((p) => {
    const state =
      p.index < currentIndex ? "done" : p.index === currentIndex ? "current" : "todo";
    if (p.type === BEAD.CROSS) {
      const a = ROSARY.cross_arm;
      svg += `<g class="rosary-bead rosary-cross is-${state}" data-index="${p.index}">`;
      svg += `<rect x="${p.x - 1.4}" y="${p.y - a}" width="2.8" height="${a * 2}" rx="0.6"/>`;
      svg += `<rect x="${p.x - a + 0.6}" y="${p.y - 1.4}" width="${a * 2 - 1.2}" height="2.8" rx="0.6"/>`;
      svg += `</g>`;
    } else if (p.type === BEAD.MYSTERY) {
      // A small 4-point star
      const r = p.r;
      svg += `<g class="rosary-bead rosary-mystery is-${state}" data-index="${p.index}">`;
      svg += `<path d="M ${p.x} ${p.y - r} L ${p.x + r * 0.4} ${p.y - r * 0.4} L ${p.x + r} ${p.y} L ${p.x + r * 0.4} ${p.y + r * 0.4} L ${p.x} ${p.y + r} L ${p.x - r * 0.4} ${p.y + r * 0.4} L ${p.x - r} ${p.y} L ${p.x - r * 0.4} ${p.y - r * 0.4} Z"/>`;
      svg += `</g>`;
    } else if (p.type === BEAD.MEDALLION) {
      svg += `<g class="rosary-bead rosary-medallion is-${state}" data-index="${p.index}">`;
      svg += `<circle cx="${p.x}" cy="${p.y}" r="${p.r}"/>`;
      svg += `<circle cx="${p.x}" cy="${p.y}" r="${p.r - 1.8}" class="rosary-inner"/>`;
      svg += `</g>`;
    } else {
      const cls = `rosary-bead rosary-${p.type} is-${state}`;
      svg += `<circle class="${cls}" data-index="${p.index}" cx="${p.x}" cy="${p.y}" r="${p.r}"/>`;
    }
  });

  svg += `</svg>`;
  return svg;
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

  // remove any leftover mystery block
  const existingMystery = card.querySelector(".mystery-block");
  if (existingMystery) existingMystery.remove();

  const pose = data.poses[station.poseId];

  // Photo first, SVG fallback
  if (pose.photo) {
    poseFigure.classList.add("is-photo");
    poseFigure.innerHTML = `<img src="${escapeHtml(pose.photo)}" alt="${escapeHtml(pose.name)}" loading="lazy"/>`;
  } else {
    poseFigure.classList.remove("is-photo");
    loadPoseSvg(pose.image, poseFigure);
  }

  if (station.posePhase === "continue") {
    poseFigure.classList.add("is-small");
  } else {
    poseFigure.classList.remove("is-small");
  }

  poseName.textContent = pose.name;
  poseLatin.textContent = pose.latin;

  if (station.kind === "interlude") {
    prayerLabel.textContent = station.title.toUpperCase();
    renderPrayerText(prayerText, station.body);
    return;
  }

  // prayer card
  const prayer = data.prayers[station.prayerKey];
  prayerLabel.textContent = prayer.short;

  let body = prayer.text;
  if (station.note) {
    body += `\n\n— ${station.note}`;
  }
  renderPrayerText(prayerText, body);
}

// Render prayer text with line-break support.
// "\n" → line break inside a stanza
// "\n\n" → stanza separator (creates a new <p>)
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

  // reset scroll on every render so the user starts at the top
  container.scrollTop = 0;
}

const svgCache = new Map();

async function loadPoseSvg(src, container) {
  if (!src) {
    container.innerHTML = "";
    return;
  }
  if (svgCache.has(src)) {
    container.innerHTML = svgCache.get(src);
    return;
  }
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error("svg fetch failed");
    const text = await res.text();
    svgCache.set(src, text);
    container.innerHTML = text;
  } catch (e) {
    container.innerHTML = "";
  }
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
  sequence: [],
  currentIndex: 0,
  mysterySetOverride: null,
  transitionLock: false,
};

function updateRosary() {
  const container = document.getElementById("rosaryStrip");
  container.innerHTML = renderRosaryStrip(state.sequence, state.currentIndex);

  // Wire taps on beads to jump-navigate
  container.querySelectorAll("[data-index]").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.getAttribute("data-index"), 10);
      if (!isNaN(idx) && idx !== state.currentIndex) {
        goTo(idx, idx > state.currentIndex ? 1 : -1);
      }
    });
  });

  // Auto-scroll so the current bead is centered horizontally.
  requestAnimationFrame(() => {
    const current = container.querySelector(".rosary-bead.is-current");
    if (!current) return;
    const bbox = current.getBoundingClientRect();
    const cbox = container.getBoundingClientRect();
    const targetCenter = bbox.left + bbox.width / 2;
    const containerCenter = cbox.left + cbox.width / 2;
    const delta = targetCenter - containerCenter;
    container.scrollBy({ left: delta, behavior: "smooth" });
  });

  const prev = document.getElementById("tapZonePrev");
  const next = document.getElementById("tapZoneNext");
  if (prev) prev.disabled = state.currentIndex === 0;
  if (next) next.disabled = state.currentIndex === state.sequence.length - 1;
}

function goTo(index, direction) {
  if (state.transitionLock) return;
  if (index < 0 || index >= state.sequence.length) return;
  if (index === state.currentIndex) return;

  state.transitionLock = true;
  const card = document.getElementById("card");

  card.classList.remove("is-here");
  card.classList.add(direction > 0 ? "is-leaving-left" : "is-leaving-right");

  setTimeout(() => {
    state.currentIndex = index;
    render(state.sequence[state.currentIndex], state.data);
    saveState();
    updateRosary();

    card.classList.remove("is-leaving-left", "is-leaving-right");
    card.classList.add(direction > 0 ? "is-entering-right" : "is-entering-left");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.classList.remove("is-entering-right", "is-entering-left");
        card.classList.add("is-here");
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

// ---------- gesture handling --------------------------------------------

// When a swipe is detected, suppress the click that some browsers fire
// afterward on the tap-zone underneath the gesture start.
let suppressNextClick = false;

function attachGestures() {
  const stage = document.getElementById("cardStage");
  let start = null;

  stage.addEventListener("pointerdown", (e) => {
    start = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId };
    suppressNextClick = false;
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
  return (e) => {
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
        state.currentIndex = 0;
        render(state.sequence[0], state.data);
        updateRosary();
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
      state.currentIndex = 0;
      render(state.sequence[0], state.data);
      saveState();
      updateRosary();
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
  } catch (e) { /* private mode etc — ignore */ }
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
  try {
    localStorage.removeItem(STATE_KEY);
  } catch (e) {}
}

// ---------- service worker registration --------------------------------

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
      '<p style="padding:2rem;color:#e7d7b7;font-family:Georgia,serif">Could not load practice data. Make sure data/practice.json is reachable.</p>';
    return;
  }

  const saved = loadState();
  if (saved) {
    state.mysterySetOverride = saved.mysterySetOverride || null;
  }

  state.sequence = buildSequence(
    state.data,
    mysterySetForToday(state.data, state.mysterySetOverride)
  );

  state.currentIndex = saved ? Math.min(saved.currentIndex || 0, state.sequence.length - 1) : 0;
  render(state.sequence[state.currentIndex], state.data);
  document.getElementById("card").classList.add("is-here");
  updateRosary();

  attachGestures();
  attachKeyboard();
  attachButtons();
  registerServiceWorker();
}

boot();
