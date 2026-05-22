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
const HANDS_FREE_KEY = "rosary-yoga.hands-free";
const TTS_RATE_KEY = "rosary-yoga.tts.rate";
const TTS_VOICE_KEY = "rosary-yoga.tts.voice";
const TTS_RATE_DEFAULT = 1.15;
const TTS_RATE_MIN = 0.7;
const TTS_RATE_MAX = 1.6;

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
//
// bodyState: one of "easy", "tender", "hurt" — alters deep-hold durations
//   and substitutes risky poses for safer ones.
function buildSequence(data, mysterySetKey, bodyState) {
  const mysteries = data.mysteries[mysterySetKey].items;
  const setName = data.mysteries[mysterySetKey].name;
  const mysterySet = data.mysteries[mysterySetKey];
  const mods = (data.body_states[bodyState] || data.body_states.easy).modifications || {};
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

  // --- threshold — pranayama before the mysteries ---
  seq.push({
    kind: "interlude", poseId: "savasana",
    label: "Opening · Threshold · Nadi Shodhana",
    title: "Threshold",
    body: "Four cycles of alternate-nostril breath.\n\nClose the right nostril with the thumb. Inhale through the left.\nClose the left nostril with the ring finger. Exhale through the right.\nInhale through the right. Close it.\nExhale through the left.\n\nOne cycle. Repeat three more times.\nThen rest. The body settles. The mind comes into balance.",
    duration: 120,
    beadStart: i, beadEnd: i,
  }); i += 1;

  // --- five decades ---
  for (let d = 0; d < 5; d++) {
    const decadeNum = d + 1;
    const mystery = mysteries[d];
    const isLastDecade = d === 4;

    // determine deep hold pose + duration (allowing body-state substitutions)
    let deepHoldId = data.deep_holds[d];
    let deepDuration = 300;
    if (d === 2) { // happy baby
      deepDuration = mods.happy_baby_duration || 180;
      if (mods.decade_3_pose) {
        deepHoldId = mods.decade_3_pose;
        deepDuration = mods.decade_3_duration || deepDuration;
      }
    } else if (d === 3) { // supported fish
      deepDuration = mods.supported_fish_duration || 210;
      if (mods.decade_4_pose) {
        deepHoldId = mods.decade_4_pose;
        deepDuration = mods.decade_4_duration || deepDuration;
      }
    }

    seq.push({
      kind: "mystery",
      mysterySetName: setName,
      mysteryName: mystery.name,
      mysteryReflection: mystery.reflection,
      breath: mysterySet.breath,
      decadeNum,
      label: ordinal(decadeNum) + " Decade",
      duration: 20,
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
      duration: deepDuration,
      note: deepHoldId === "figure_four"
        ? "Switch sides halfway — five Hail Marys per side."
        : null,
      beadStart: i, beadEnd: i + 9,
    }); i += 10;

    // Glory Be after each decade. The 4th decade's neutral hold is slightly
    // longer to fully release the spine after Supported Fish before Legs Up
    // the Wall.
    const gbDuration = d === 3 ? 90 : 60;
    seq.push({
      kind: "prayer",
      poseId: isLastDecade ? "legs_up_wall" : "neutral_back",
      prayerKey: "glory_be",
      label: `Decade ${decadeNum} · Glory Be`,
      duration: gbDuration,
      beadStart: i, beadEnd: i,
    }); i += 1;
  }

  // --- closing ---
  seq.push({
    kind: "prayer", poseId: "legs_up_wall", prayerKey: "hail_holy_queen",
    label: "Closing · Hail Holy Queen", duration: 90,
    beadStart: i, beadEnd: i,
  }); i += 1;

  // Intention — Krishnamacharya's samkalpa, the Jesuit dedication.
  seq.push({
    kind: "interlude", poseId: "legs_up_wall",
    label: "Closing · Intention",
    title: "Intention",
    body: "For whom is tonight's practice offered?\n\nHold them in mind.\nLet the breath carry the offering.",
    duration: 60,
    beadStart: i, beadEnd: i,
  }); i += 1;

  seq.push({
    kind: "interlude", poseId: "legs_up_wall",
    label: "Closing · Practice Complete",
    title: "Practice Complete",
    body: "Rest here as long as you wish.\nWhen you are ready, roll to one side and rise slowly.",
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

// ---------- voice (TTS cues + SR command/amen listening) ---------------
//
// Hands-free mode speaks a short cue at each station ("Child's pose. Our
// Father.") and listens for the prayer-ending "amen" to advance prayer
// cards. For multi-count prayer cards it counts amens up to station.count.
// Mystery/interlude cards have no prayer, so they keep timer auto-advance
// and respond to the "next" voice command.

const VOICE_CMD = {
  NEXT: /\b(next|advance|forward|move on)\b/,
  BACK: /\b(back|previous|prev|undo)\b/,
  PAUSE: /\b(pause|stop|hold on|wait)\b/,
  RESUME: /\b(resume|continue|go on|keep going)\b/,
  REPEAT: /\b(repeat|again|say (it )?again|what was that)\b/,
  HELP: /\b(help|cues|setup|how (do i|to))\b/,
  AMEN: /\bam[ei]n\b/g,
};

const NUM_WORD = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

function numberWord(n) { return NUM_WORD[n] || String(n); }

function cueForStation(station, data) {
  if (station.kind === "mystery") {
    return `${ordinal(station.decadeNum)} decade. ${station.mysteryName}.`;
  }
  const pose = data.poses[station.poseId];
  const poseName = pose ? pose.name : "";
  if (station.kind === "interlude") {
    return `${poseName}. ${station.title || ""}.`.replace(/\s+\./g, ".").trim();
  }
  const prayer = data.prayers[station.prayerKey];
  const prayerName = prayer ? prayer.short : "";
  if (station.count && station.count > 1) {
    const plural = prayerName.endsWith("y") && !/[aeiou]y$/i.test(prayerName)
      ? prayerName.replace(/y$/, "ys")
      : prayerName + "s";
    return `${poseName}. ${capitalize(numberWord(station.count))} ${plural}.`;
  }
  return `${poseName}. ${prayerName}.`;
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

function helpTextForStation(station, data) {
  if (station.kind === "mystery") return station.mysteryReflection || "";
  const pose = data.poses[station.poseId];
  if (!pose) return "";
  return `${pose.setup} ${pose.hold}`;
}

let synth = window.speechSynthesis || null;
let preferredVoice = null;

function voiceQualityScore(v) {
  const n = v.name.toLowerCase();
  if (n.includes("siri")) return 5;
  if (n.includes("premium")) return 4;
  if (n.includes("enhanced")) return 3;
  if (n.includes("samantha") || n.includes("ava") || n.includes("allison")) return 2;
  return 1;
}

function voiceQualityLabel(v) {
  const n = v.name.toLowerCase();
  if (n.includes("siri")) return "Siri";
  if (n.includes("premium")) return "Premium";
  if (n.includes("enhanced")) return "Enhanced";
  return "Standard";
}

function getEnglishVoices() {
  if (!synth) return [];
  return synth.getVoices()
    .filter((v) => /^en[-_]/i.test(v.lang))
    .sort((a, b) => voiceQualityScore(b) - voiceQualityScore(a) || a.name.localeCompare(b.name));
}

function findVoiceByURI(uri) {
  if (!synth || !uri) return null;
  return synth.getVoices().find((v) => v.voiceURI === uri) || null;
}

function pickVoice() {
  if (!synth) return null;
  // Honor user-saved choice first.
  const saved = findVoiceByURI(state.ttsVoiceURI);
  if (saved) return saved;
  const en = getEnglishVoices();
  return en[0] || synth.getVoices()[0] || null;
}

if (synth) {
  // Voices load asynchronously on first call; refresh selection when ready.
  // (We can't call pickVoice() at module load because `state` is declared
  // further down the file and would be in the TDZ.)
  synth.onvoiceschanged = () => { preferredVoice = pickVoice(); };
}

function speakCue(text) {
  if (!synth || !text) return;
  if (!preferredVoice) preferredVoice = pickVoice();
  state.lastCueText = text;
  try { synth.cancel(); } catch (e) {}
  const u = new SpeechSynthesisUtterance(text);
  if (preferredVoice) u.voice = preferredVoice;
  u.rate = state.ttsRate || TTS_RATE_DEFAULT;
  u.pitch = 1.0;
  u.volume = 1.0;
  u.onstart = () => { state.ttsSpeaking = true; setMicIndicator("speaking"); };
  u.onend = () => { state.ttsSpeaking = false; setMicIndicator(state.handsFree ? "listening" : "off"); };
  u.onerror = () => { state.ttsSpeaking = false; setMicIndicator(state.handsFree ? "listening" : "off"); };
  synth.speak(u);
}

let recognition = null;
let recognitionWanted = false;
// Tracks which recognition result-slot indices we've already counted amens
// for. This lets us act on interim transcripts (avoiding iOS Safari's
// ~1.5s endpoint-detection delay) without double-firing when the same
// slot later transitions to isFinal. Cleared on each station change.
const handledAmenSlots = new Set();

function ensureRecognition() {
  if (recognition) return recognition;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    if (state.ttsSpeaking) return; // ignore our own voice
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0].transcript.toLowerCase();
      // Amen: fire on interim transcripts the moment we see the word.
      // iOS Safari's endpoint detection adds ~1.5s before isFinal flips,
      // and that lag is what feels sluggish during the practice.
      if (!handledAmenSlots.has(i)) {
        const station = state.sequence[state.currentIndex];
        if (station && station.kind === "prayer" && VOICE_CMD.AMEN.test(text)) {
          handledAmenSlots.add(i);
          countAmenAndMaybeAdvance(text);
        }
      }
      // Commands: only on final transcripts, since they're rarer words and
      // partial matches ("the next mystery") could false-trigger.
      if (result.isFinal) handleCommandTranscript(text);
    }
  };

  recognition.onerror = (e) => {
    // "no-speech" and "aborted" are routine; "not-allowed" means user denied mic.
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      recognitionWanted = false;
      setMicIndicator("off");
    }
  };

  recognition.onend = () => {
    if (recognitionWanted) {
      // iOS Safari auto-stops; restart to keep listening.
      try { recognition.start(); } catch (e) {}
    } else {
      setMicIndicator("off");
    }
  };

  return recognition;
}

function startListening() {
  const r = ensureRecognition();
  if (!r) return false;
  recognitionWanted = true;
  try { r.start(); } catch (e) { /* already started */ }
  setMicIndicator("listening");
  return true;
}

function stopListening() {
  recognitionWanted = false;
  if (recognition) {
    try { recognition.stop(); } catch (e) {}
  }
  setMicIndicator("off");
}

function handleCommandTranscript(text) {
  if (VOICE_CMD.NEXT.test(text)) { voiceAdvance(); return; }
  if (VOICE_CMD.BACK.test(text)) { prev(); return; }
  if (VOICE_CMD.PAUSE.test(text)) { pauseHandsFree(); return; }
  if (VOICE_CMD.RESUME.test(text)) { resumeHandsFree(); return; }
  if (VOICE_CMD.REPEAT.test(text)) { speakCue(state.lastCueText); return; }
  if (VOICE_CMD.HELP.test(text)) {
    const station = state.sequence[state.currentIndex];
    const help = helpTextForStation(station, state.data);
    if (help) speakCue(help);
  }
}

function countAmenAndMaybeAdvance(text) {
  const station = state.sequence[state.currentIndex];
  if (!station || station.kind !== "prayer") return;
  const matches = text.match(VOICE_CMD.AMEN);
  if (!matches) return;

  if (state.amenStation !== state.currentIndex) {
    state.amenCount = 0;
    state.amenStation = state.currentIndex;
  }
  // Each slot contributes ONE amen — its match-count from the interim
  // transcript doesn't matter, since the recognizer revises the same
  // utterance as it tightens its hypothesis. We've already dedupped on
  // result-slot index in onresult.
  state.amenCount += 1;
  const needed = station.count || 1;
  updateAmenIndicator(state.amenCount, needed);

  if (state.amenCount >= needed) {
    state.amenCount = 0;
    state.amenStation = -1;
    voiceAdvance();
  }
}

function voiceAdvance() {
  const station = state.sequence[state.currentIndex];
  playChime(chimeVariantForStation(station));
  next();
}

function pauseHandsFree() {
  stopListening();
  clearAutoAdvance();
}

function resumeHandsFree() {
  if (!state.handsFree) return;
  startListening();
  scheduleAutoAdvance(state.sequence[state.currentIndex]);
}

// ---------- wake lock --------------------------------------------------

async function acquireWakeLock() {
  if (!("wakeLock" in navigator)) return;
  try {
    state.wakeLock = await navigator.wakeLock.request("screen");
    state.wakeLock.addEventListener("release", () => { state.wakeLock = null; });
  } catch (e) { /* user may have backgrounded the tab */ }
}

function releaseWakeLock() {
  if (state.wakeLock) {
    try { state.wakeLock.release(); } catch (e) {}
    state.wakeLock = null;
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.handsFree && !state.wakeLock) {
    acquireWakeLock();
  }
});

// ---------- mic indicator ----------------------------------------------

function setMicIndicator(mode) {
  const el = document.getElementById("micIndicator");
  if (!el) return;
  el.classList.remove("is-listening", "is-speaking");
  if (mode === "listening") { el.hidden = false; el.classList.add("is-listening"); }
  else if (mode === "speaking") { el.hidden = false; el.classList.add("is-speaking"); }
  else { el.hidden = true; }
}

function updateAmenIndicator(count, needed) {
  const el = document.getElementById("amenCount");
  if (!el) return;
  if (needed <= 1) { el.hidden = true; return; }
  el.hidden = false;
  el.textContent = `${count} / ${needed}`;
}

function hideAmenIndicator() {
  const el = document.getElementById("amenCount");
  if (el) el.hidden = true;
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
    let breathBlock = "";
    if (station.breath) {
      breathBlock = `
        <div class="breath-quality">
          <div class="breath-label">Breath</div>
          <div class="breath-name">${escapeHtml(station.breath.name)}</div>
          <div class="breath-description">${escapeHtml(station.breath.description)}</div>
        </div>
      `;
    }
    block.innerHTML = `
      <div class="set-name">${escapeHtml(station.mysterySetName)}</div>
      <div class="ornament">✦</div>
      <div class="mystery-name">${escapeHtml(station.mysteryName)}</div>
      <div class="mystery-reflection">${escapeHtml(station.mysteryReflection)}</div>
      ${breathBlock}
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

// Breath markers at the start of each prayer line:
//   ↑  inhale
//   ↓  exhale
//   ✦  seal / Amen (no breath count)
// Lines without a marker render as plain continuation.
function renderPrayerText(container, text) {
  container.innerHTML = "";
  const stanzas = text.split(/\n\n+/);
  stanzas.forEach((stanza) => {
    if (!stanza.trim()) return;
    const p = document.createElement("p");
    const lines = stanza.split("\n");
    lines.forEach((line) => {
      const lineEl = document.createElement("span");
      lineEl.className = "prayer-line";

      const trimmed = line.trimStart();
      let marker = null;
      let body = line;
      if (trimmed.startsWith("↑ ")) { marker = "in"; body = trimmed.slice(2); }
      else if (trimmed.startsWith("↓ ")) { marker = "out"; body = trimmed.slice(2); }
      else if (trimmed.startsWith("✦ ")) { marker = "seal"; body = trimmed.slice(2); }

      if (marker) {
        const mEl = document.createElement("span");
        mEl.className = `breath-marker breath-marker-${marker}`;
        mEl.setAttribute("aria-hidden", "true");
        mEl.textContent = marker === "in" ? "in" : marker === "out" ? "out" : "·";
        lineEl.appendChild(mEl);
      }

      lineEl.appendChild(document.createTextNode(body));
      p.appendChild(lineEl);
      p.appendChild(document.createElement("br"));
    });
    // remove trailing <br>
    if (p.lastChild && p.lastChild.tagName === "BR") p.removeChild(p.lastChild);
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
  bodyState: "easy",
  transitionLock: false,
  handsFree: false,
  amenCount: 0,
  amenStation: -1,
  lastCueText: "",
  ttsSpeaking: false,
  wakeLock: null,
  ttsRate: TTS_RATE_DEFAULT,
  ttsVoiceURI: null,
};

const BODY_STATE_KEY = "rosary-yoga.body-state";

function loadBodyState() {
  try {
    const raw = localStorage.getItem(BODY_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // expire on a new calendar day
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.date !== today) return null;
    return parsed.value;
  } catch (e) {
    return null;
  }
}

function saveBodyState(value) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(BODY_STATE_KEY, JSON.stringify({ value, date: today }));
  } catch (e) {}
}

function clearBodyState() {
  try { localStorage.removeItem(BODY_STATE_KEY); } catch (e) {}
}

function loadHandsFree() {
  try { return localStorage.getItem(HANDS_FREE_KEY) === "1"; } catch (e) { return false; }
}

function saveHandsFree(on) {
  try { localStorage.setItem(HANDS_FREE_KEY, on ? "1" : "0"); } catch (e) {}
}

function loadTtsSettings() {
  try {
    const r = parseFloat(localStorage.getItem(TTS_RATE_KEY));
    if (!isNaN(r) && r >= TTS_RATE_MIN && r <= TTS_RATE_MAX) state.ttsRate = r;
    const v = localStorage.getItem(TTS_VOICE_KEY);
    if (v) state.ttsVoiceURI = v;
  } catch (e) {}
}

function saveTtsRate(rate) {
  state.ttsRate = rate;
  try { localStorage.setItem(TTS_RATE_KEY, String(rate)); } catch (e) {}
}

function saveTtsVoice(uri) {
  state.ttsVoiceURI = uri;
  try {
    if (uri) localStorage.setItem(TTS_VOICE_KEY, uri);
    else localStorage.removeItem(TTS_VOICE_KEY);
  } catch (e) {}
}

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
  // Hands-free mode is fully self-paced — voice ("amen", "next") or touch
  // drives every advance. No timer.
  if (state.handsFree) return;
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

    // Reset per-station voice state.
    state.amenCount = 0;
    state.amenStation = -1;
    handledAmenSlots.clear();
    hideAmenIndicator();

    card.classList.remove("is-leaving-left", "is-leaving-right");
    card.classList.add(direction > 0 ? "is-entering-right" : "is-entering-left");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.classList.remove("is-entering-right", "is-entering-left");
        card.classList.add("is-here");
        scheduleAutoAdvance(station);
        if (state.handsFree) speakCue(cueForStation(station, state.data));
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
      closeHelp();
      closeVoiceSettings();
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
      else if (action === "close-help") closeHelp();
      else if (action === "close-voice") closeVoiceSettings();
      else if (action === "voice-sample") sampleVoice();
      else if (action === "commands") { closeMenu(); openHelp(); }
      else if (action === "voice") { closeMenu(); openVoiceSettings(); }
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
      } else if (action === "body") {
        closeMenu();
        clearAutoAdvance();
        clearBodyState();
        showBodyCheck();
      } else if (action === "hands-free") {
        closeMenu();
        if (state.handsFree) disableHandsFree();
        else enableHandsFree(false);
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
  updateHandsFreeMenuLabel();
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
      state.sequence = buildSequence(
        state.data,
        mysterySetForToday(state.data, state.mysterySetOverride),
        state.bodyState
      );
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

function openHelp() {
  document.getElementById("helpOverlay").hidden = false;
}

function closeHelp() {
  document.getElementById("helpOverlay").hidden = true;
}

const VOICE_SAMPLE_TEXT = "Child's pose. Our Father.";

function openVoiceSettings() {
  ensureAudio();
  document.getElementById("voiceOverlay").hidden = false;
  // Voices may not be loaded yet on first open; re-render on voiceschanged.
  renderVoiceList();
  if (synth) {
    synth.onvoiceschanged = () => {
      preferredVoice = pickVoice();
      renderVoiceList();
    };
  }
  const slider = document.getElementById("voiceRate");
  const readout = document.getElementById("voiceRateReadout");
  slider.value = String(state.ttsRate);
  readout.textContent = `${state.ttsRate.toFixed(2)}×`;
}

function closeVoiceSettings() {
  document.getElementById("voiceOverlay").hidden = true;
  if (synth) { try { synth.cancel(); } catch (e) {} }
}

function renderVoiceList() {
  const container = document.getElementById("voiceList");
  if (!container) return;
  container.innerHTML = "";

  const voices = getEnglishVoices();
  if (!voices.length) {
    container.innerHTML = `<p class="voice-empty">No voices available yet.</p>`;
    return;
  }

  // "Auto" lets us fall back to the quality-scored default.
  const autoBtn = document.createElement("button");
  autoBtn.type = "button";
  autoBtn.className = "voice-option";
  if (!state.ttsVoiceURI) autoBtn.classList.add("is-current");
  autoBtn.innerHTML = `<span class="voice-option-name">Automatic</span><span class="voice-option-tag">best available</span>`;
  autoBtn.addEventListener("click", () => {
    saveTtsVoice(null);
    preferredVoice = pickVoice();
    refreshVoiceCurrent();
    sampleVoice();
  });
  container.appendChild(autoBtn);

  voices.forEach((v) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "voice-option";
    if (state.ttsVoiceURI === v.voiceURI) btn.classList.add("is-current");
    btn.dataset.uri = v.voiceURI;
    btn.innerHTML = `
      <span class="voice-option-name">${escapeHtml(v.name)}</span>
      <span class="voice-option-tag">${escapeHtml(voiceQualityLabel(v))} · ${escapeHtml(v.lang)}</span>
    `;
    btn.addEventListener("click", () => {
      saveTtsVoice(v.voiceURI);
      preferredVoice = v;
      refreshVoiceCurrent();
      sampleVoice();
    });
    container.appendChild(btn);
  });
}

function refreshVoiceCurrent() {
  document.querySelectorAll("#voiceList .voice-option").forEach((el) => {
    const uri = el.dataset.uri || null;
    el.classList.toggle("is-current", uri === state.ttsVoiceURI);
  });
}

function sampleVoice() {
  if (!synth) return;
  try { synth.cancel(); } catch (e) {}
  speakCue(VOICE_SAMPLE_TEXT);
}

function attachVoiceSettingsHandlers() {
  const slider = document.getElementById("voiceRate");
  const readout = document.getElementById("voiceRateReadout");
  if (!slider) return;
  slider.addEventListener("input", () => {
    const r = parseFloat(slider.value);
    saveTtsRate(r);
    readout.textContent = `${r.toFixed(2)}×`;
  });
  // Speak a sample when the user releases the slider, not on every tick.
  slider.addEventListener("change", () => sampleVoice());
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

// ---------- body-check overlay -----------------------------------------

function showBodyCheck() {
  const overlay = document.getElementById("bodyOverlay");
  const options = document.getElementById("bodyOptions");
  options.innerHTML = "";

  for (const key of ["easy", "tender", "hurt"]) {
    const bs = state.data.body_states[key];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "body-action";
    btn.innerHTML = `
      <span class="body-action-name">${escapeHtml(bs.name)}</span>
      <span class="body-action-desc">${escapeHtml(bs.description)}</span>
    `;
    btn.addEventListener("click", () => {
      ensureAudio();
      state.bodyState = key;
      saveBodyState(key);
      overlay.hidden = true;
      startPractice();
    });
    options.appendChild(btn);
  }
  overlay.hidden = false;
}

function startPractice() {
  state.sequence = buildSequence(
    state.data,
    mysterySetForToday(state.data, state.mysterySetOverride),
    state.bodyState
  );

  const saved = loadState();
  state.currentIndex = saved ? Math.min(saved.currentIndex || 0, state.sequence.length - 1) : 0;

  const station = state.sequence[state.currentIndex];
  render(station, state.data);
  document.getElementById("card").classList.add("is-here");
  updateRosary();
  scheduleAutoAdvance(station);
  if (state.handsFree) {
    enableHandsFree(true);
    // Speak the opening cue once everything is on screen.
    setTimeout(() => speakCue(cueForStation(station, state.data)), 250);
  }
}

async function enableHandsFree(skipSpeak) {
  state.handsFree = true;
  saveHandsFree(true);
  updateHandsFreeMenuLabel();
  ensureAudio();
  await acquireWakeLock();
  startListening();
  if (!skipSpeak) {
    const station = state.sequence[state.currentIndex];
    if (station) speakCue(cueForStation(station, state.data));
  }
  // If we just entered hands-free on a prayer card, kill the pending timer.
  const station = state.sequence[state.currentIndex];
  if (station && station.kind === "prayer") clearAutoAdvance();
}

function disableHandsFree() {
  state.handsFree = false;
  saveHandsFree(false);
  updateHandsFreeMenuLabel();
  stopListening();
  releaseWakeLock();
  if (synth) { try { synth.cancel(); } catch (e) {} }
  hideAmenIndicator();
  // If we disabled mid-prayer, restart the regular auto-advance.
  const station = state.sequence[state.currentIndex];
  if (station) scheduleAutoAdvance(station);
}

function updateHandsFreeMenuLabel() {
  const btn = document.querySelector('[data-action="hands-free"]');
  if (!btn) return;
  btn.textContent = state.handsFree ? "Hands-free mode · on" : "Hands-free mode · off";
  btn.classList.toggle("is-current", state.handsFree);
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

  state.handsFree = loadHandsFree();
  loadTtsSettings();

  // We need gestures wired up before the body-check overlay buttons can dispatch.
  attachGestures();
  attachKeyboard();
  attachButtons();
  attachVoiceSettingsHandlers();
  registerServiceWorker();

  const savedBodyState = loadBodyState();
  if (savedBodyState && state.data.body_states[savedBodyState]) {
    state.bodyState = savedBodyState;
    startPractice();
  } else {
    showBodyCheck();
  }
}

boot();
