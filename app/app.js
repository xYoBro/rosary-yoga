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

const PRAYER_LENGTH_LONG = 320;
const PRAYER_LENGTH_VERY_LONG = 600;

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
  });
  seq.push({
    kind: "prayer",
    poseId: "child_pose",
    prayerKey: "our_father",
    posePhase: "start",
    label: "Opening · Our Father",
    section: "opening",
  });
  for (let i = 1; i <= 3; i++) {
    seq.push({
      kind: "prayer",
      poseId: "supported_butterfly",
      prayerKey: "hail_mary",
      posePhase: i === 1 ? "start" : "continue",
      label: `Opening · Hail Mary ${i} of 3`,
      section: "opening",
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
  });
  seq.push({
    kind: "interlude",
    poseId: "savasana",
    label: "Opening · Threshold",
    section: "opening",
    title: "Threshold",
    body: "The pause before the mysteries begin.\nBody held by the ground.\nMind held by the breath.",
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
    });

    // anchor — Our Father with Knees-to-Chest
    seq.push({
      kind: "prayer",
      poseId: "knees_to_chest",
      prayerKey: "our_father",
      posePhase: "start",
      label: `Decade ${decadeNum} · Our Father`,
      section: "decade",
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
  });

  seq.push({
    kind: "interlude",
    poseId: "legs_up_wall",
    label: "Closing · Practice Complete",
    section: "closing",
    title: "Practice Complete",
    body: "Rest here as long as you wish.\nWhen you are ready, roll to one side and rise slowly.",
    ornament: true,
  });

  return seq;
}

function ordinal(n) {
  return ["First", "Second", "Third", "Fourth", "Fifth"][n - 1] || String(n);
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
  const cueArea = document.getElementById("cueArea");
  const cueToggle = document.getElementById("cueToggle");
  const setupCue = document.getElementById("setupCue");
  const holdCue = document.getElementById("holdCue");

  positionLabel.textContent = station.label || "";
  card.classList.remove("is-mystery");

  if (station.kind === "mystery") {
    card.classList.add("is-mystery");
    // wipe the standard layout, render mystery block
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

  // pose figure — fetched lazily and inlined for clean SVG color inheritance
  loadPoseSvg(pose.image, poseFigure);
  if (station.posePhase === "continue") {
    poseFigure.classList.add("is-small");
  } else {
    poseFigure.classList.remove("is-small");
  }

  poseName.textContent = pose.name;
  poseLatin.textContent = pose.latin;

  if (station.kind === "interlude") {
    prayerLabel.textContent = station.title.toUpperCase();
    prayerText.textContent = station.body;
    prayerText.className = "prayer-text is-long";
    cueToggle.hidden = true;
    cueArea.hidden = true;
    return;
  }

  // prayer card
  cueToggle.hidden = false;

  const prayer = data.prayers[station.prayerKey];
  prayerLabel.textContent = prayer.short;

  let body = prayer.text;
  if (station.note) {
    body += `\n\n— ${station.note}`;
  }

  prayerText.textContent = body;
  prayerText.className = "prayer-text";
  if (body.length > PRAYER_LENGTH_VERY_LONG) {
    prayerText.classList.add("is-very-long");
  } else if (body.length > PRAYER_LENGTH_LONG) {
    prayerText.classList.add("is-long");
  }

  // setup/hold cues only shown on pose-start cards by default
  if (station.posePhase === "start") {
    setupCue.textContent = pose.setup;
    holdCue.textContent = pose.hold;
  } else {
    setupCue.textContent = pose.setup;
    holdCue.textContent = pose.hold;
  }
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

function updateProgress() {
  const fill = document.getElementById("progressFill");
  const pct = ((state.currentIndex + 1) / state.sequence.length) * 100;
  fill.style.width = `${pct}%`;
  document.getElementById("prevButton").disabled = state.currentIndex === 0;
  document.getElementById("nextButton").disabled =
    state.currentIndex === state.sequence.length - 1;
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
    updateProgress();

    card.classList.remove("is-leaving-left", "is-leaving-right");
    card.classList.add(direction > 0 ? "is-entering-right" : "is-entering-left");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.classList.remove("is-entering-right", "is-entering-left");
        card.classList.add("is-here");
        // collapse cues on every card transition
        document.getElementById("cueArea").hidden = true;
        document.getElementById("cueToggle").textContent = "Show pose cues";
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

function attachGestures() {
  const stage = document.getElementById("cardStage");
  let start = null;

  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    start = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId };
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

    if (horizontal && long && fast) {
      if (dx < 0) next();
      else prev();
    }
  });

  stage.addEventListener("pointercancel", () => {
    start = null;
  });
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
  document.getElementById("nextButton").addEventListener("click", next);
  document.getElementById("prevButton").addEventListener("click", prev);

  document.getElementById("cueToggle").addEventListener("click", () => {
    const cueArea = document.getElementById("cueArea");
    const cueToggle = document.getElementById("cueToggle");
    const isHidden = cueArea.hidden;
    cueArea.hidden = !isHidden;
    cueToggle.textContent = isHidden ? "Hide pose cues" : "Show pose cues";
  });

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
        updateProgress();
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
      updateProgress();
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
  updateProgress();

  attachGestures();
  attachKeyboard();
  attachButtons();
  registerServiceWorker();
}

boot();
