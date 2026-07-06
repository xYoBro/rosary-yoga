// Rosary Yoga — app entry
//
// Loads the practice data, builds the card sequence for today's mysteries
// (see sequence.js — the practice itself is defined in data/practice.json),
// and renders one card at a time. Advance is voice ("amen") or touch; there
// are no timers. Vanilla ES module. No framework.

import { BEAD, buildBeads, buildSequence, ordinal } from "./sequence.js";

const SWIPE_THRESHOLD = 50;
const SWIPE_RATIO = 1.4;
const SWIPE_TIME_THRESHOLD = 600;
const TRANSITION_HALF = 200;
const SESSION_TTL_MS = 60 * 60 * 1000;
const STATE_KEY = "rosary-yoga.state.v2";
const HANDS_FREE_KEY = "rosary-yoga.hands-free";
const PRACTICE_KEY = "rosary-yoga.practice";
const CUES_KEY = "rosary-yoga.cues-open";
const COMPLETIONS_KEY = "rosary-yoga.completions";
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

// ---------- mystery set & practice selection ---------------------------

function mysterySetForToday(data, override) {
  if (override && data.mysteries[override]) return override;
  const dow = String(new Date().getDay());
  return data.day_to_mystery_set[dow] || "joyful";
}

function loadPractice() {
  try {
    const v = localStorage.getItem(PRACTICE_KEY);
    return v === "restorative" || v === "salutation" ? v : "salutation";
  } catch (e) {
    return "salutation";
  }
}

function savePractice(key) {
  try { localStorage.setItem(PRACTICE_KEY, key); } catch (e) {}
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
// The "tick" variant is a single short high tone for repeated-prayer
// advances (e.g. between Hail Marys) so 10 chimes per decade don't fatigue.
function playChime(variant) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;

  if (variant === "tick") {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, now); // E5
    g.gain.setValueAtTime(0.0, now);
    g.gain.linearRampToValueAtTime(0.08, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.4);
    return;
  }

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
  let cue;
  if (station.count && station.count > 1) {
    const plural = prayerName.endsWith("y") && !/[aeiou]y$/i.test(prayerName)
      ? prayerName.replace(/y$/, "ys")
      : prayerName + "s";
    cue = `${poseName}. ${capitalize(numberWord(station.count))} ${plural}.`;
  } else {
    cue = `${poseName}. ${prayerName}.`;
  }
  // Station notes (e.g. "Switch sides" on Hail Mary 6 of figure-four)
  // prepend to the cue so the user hears the instruction first AND so the
  // cue text differs from the surrounding repeats — meaning it won't be
  // suppressed by the same-cue check in goTo.
  if (station.note) cue = `${station.note} ${cue}`;
  return cue;
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

// iOS often hides the quality marker in voiceURI rather than name —
// e.g. "Zoe" has name "Zoe" but URI "com.apple.voice.premium.en-GB.Zoe".
// We check both so Premium voices don't get mis-scored as Standard.
function voiceQualityScore(v) {
  const tag = `${v.name} ${v.voiceURI || ""}`.toLowerCase();
  if (tag.includes("siri")) return 5;
  if (tag.includes("premium")) return 4;
  if (tag.includes("enhanced")) return 3;
  const n = v.name.toLowerCase();
  if (n.includes("samantha") || n.includes("ava") || n.includes("allison")) return 2;
  return 1;
}

function voiceQualityLabel(v) {
  const tag = `${v.name} ${v.voiceURI || ""}`.toLowerCase();
  if (tag.includes("siri")) return "Siri";
  if (tag.includes("premium")) return "Premium";
  if (tag.includes("enhanced")) return "Enhanced";
  return "Standard";
}

function isEnglishVoice(v) {
  if (/^en($|[-_])/i.test(v.lang || "")) return true;
  // Safety net for voices whose `lang` is mislabeled but whose URI clearly
  // identifies an English variant.
  if (/[._-]en[-_]/i.test(v.voiceURI || "")) return true;
  return false;
}

// Show every voice Safari/Chrome actually exposes via getVoices(). If a
// downloaded voice (e.g. Premium Zoe) is missing here, it means iOS isn't
// exposing it to web JS — a platform limitation, not something we can
// filter our way around. Sorting puts Siri/Premium/Enhanced first so
// high-quality voices float to the top regardless of language.
function getDisplayVoices() {
  if (!synth) return [];
  const all = synth.getVoices();
  return all.slice().sort((a, b) => {
    // Prefer English voices among same-quality voices.
    const enA = isEnglishVoice(a) ? 1 : 0;
    const enB = isEnglishVoice(b) ? 1 : 0;
    return voiceQualityScore(b) - voiceQualityScore(a)
      || enB - enA
      || a.name.localeCompare(b.name);
  });
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
  const all = getDisplayVoices();
  // First English voice (which is also the highest-quality English voice
  // thanks to the sort in getDisplayVoices), else just the top of the list.
  return all.find(isEnglishVoice) || all[0] || null;
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
  const cur = state.sequence[state.currentIndex];
  const nxt = state.sequence[state.currentIndex + 1];
  // A short "tick" between repeated prayers (Hail Mary → Hail Mary), even
  // when the pose changes bead to bead as it does in the salutations —
  // ten full chimes per decade would fatigue. The regular chime marks the
  // crossing into a different prayer.
  let variant;
  if (cur && nxt && cur.prayerKey && cur.prayerKey === nxt.prayerKey) {
    variant = "tick";
  } else {
    variant = chimeVariantForStation(cur);
  }
  playChime(variant);
  next();
}

function pauseHandsFree() {
  stopListening();
}

function resumeHandsFree() {
  if (!state.handsFree) return;
  startListening();
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

// Inline pose line art, keyed by pose id. Inlining (rather than <img src>)
// lets the SVGs inherit the app palette through currentColor and CSS vars.
// Photos win when a pose has one (the floor practice); a failed fetch just
// leaves the figure area empty rather than blocking boot.
const poseArt = {};

async function preloadPoseArt(data) {
  const entries = Object.values(data.poses).filter((p) => !p.photo && p.image);
  await Promise.all(
    entries.map(async (p) => {
      try {
        const res = await fetch(p.image);
        if (res.ok) poseArt[p.id] = await res.text();
      } catch (e) {}
    })
  );
}

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
    prayerLabel.textContent = "";
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
    updateCues(station, data);
    return;
  }

  const existingMystery = card.querySelector(".mystery-block");
  if (existingMystery) existingMystery.remove();
  const existingCount = card.querySelector(".practice-count");
  if (existingCount) existingCount.remove();

  const pose = data.poses[station.poseId];

  if (pose.photo) {
    poseFigure.classList.add("is-photo");
    poseFigure.classList.remove("is-art");
    poseFigure.innerHTML = `<img src="${escapeHtml(pose.photo)}" alt="${escapeHtml(pose.name)}" loading="lazy"/>`;
  } else if (poseArt[pose.id]) {
    poseFigure.classList.add("is-art");
    poseFigure.classList.remove("is-photo");
    poseFigure.innerHTML = poseArt[pose.id];
  } else {
    poseFigure.classList.remove("is-photo", "is-art");
    poseFigure.innerHTML = "";
  }

  poseName.textContent = pose.name;
  poseLatin.textContent = pose.latin;
  updateCues(station, data);

  if (station.kind === "interlude") {
    prayerLabel.textContent = (station.title || "").toUpperCase();
    renderPrayerText(prayerText, station.body);
    // The count lives outside prayerText so the scroll fade mask never dims it.
    if (station.isFinal) renderPracticeCount(prayerText.parentElement);
    return;
  }

  // prayer card
  const prayer = data.prayers[station.prayerKey];
  if (station.count && station.count > 1) {
    prayerLabel.textContent = `${prayer.short} · ×${station.count}`;
  } else {
    prayerLabel.textContent = prayer.short;
  }

  // Transition notes ("Step back.", "Switch sides.") lead the prayer text —
  // the instruction has to land before the eyes settle into the words.
  let body = prayer.text;
  if (station.note) body = `— ${station.note}\n\n${body}`;
  renderPrayerText(prayerText, body);
}

// The lifetime practice count on the final card. A total, never a streak —
// it only ever goes up, and a missed day subtracts nothing.
function renderPracticeCount(container) {
  const n = getCompletionCount();
  if (n <= 0) return;
  const div = document.createElement("div");
  div.className = "practice-count";
  div.textContent = `✦ The ${ordinalNumber(n)} practice ✦`;
  container.appendChild(div);
}

function ordinalNumber(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ---------- pose cues panel ---------------------------------------------
//
// The teaching surface: every pose card can unfold its setup and hold
// instructions. The open/closed choice persists across cards and sessions —
// leave it open while learning, close it once the sequence lives in the
// body.

function updateCues(station, data) {
  const toggle = document.getElementById("cueToggle");
  const panel = document.getElementById("cuePanel");
  const card = document.getElementById("card");
  if (!toggle || !panel) return;

  const pose = station.poseId ? data.poses[station.poseId] : null;
  if (station.kind === "mystery" || !pose || !(pose.setup || pose.hold)) {
    toggle.hidden = true;
    panel.hidden = true;
    card.classList.remove("cues-open");
    return;
  }

  toggle.hidden = false;
  toggle.textContent = state.cuesOpen ? "Hide pose cues" : "Show pose cues";
  panel.hidden = !state.cuesOpen;
  card.classList.toggle("cues-open", state.cuesOpen);

  let html = "";
  if (pose.setup) {
    html += `<div class="cue-section"><div class="cue-heading">Setup</div><p>${escapeHtml(pose.setup)}</p></div>`;
  }
  if (pose.hold) {
    html += `<div class="cue-section"><div class="cue-heading">Hold</div><p>${escapeHtml(pose.hold)}</p></div>`;
  }
  if (pose.target) {
    html += `<div class="cue-target">${escapeHtml(pose.target)}</div>`;
  }
  panel.innerHTML = html;
}

function toggleCues() {
  state.cuesOpen = !state.cuesOpen;
  saveCuesOpen(state.cuesOpen);
  const station = state.sequence[state.currentIndex];
  if (station) updateCues(station, state.data);
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
  practice: "salutation",
  cuesOpen: false,
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

function loadCuesOpen() {
  try { return localStorage.getItem(CUES_KEY) === "1"; } catch (e) { return false; }
}

function saveCuesOpen(on) {
  try { localStorage.setItem(CUES_KEY, on ? "1" : "0"); } catch (e) {}
}

// Lifetime completion count. Deliberately not a streak: {count, lastDate}
// where lastDate only guards against double-counting the same day.
function loadCompletions() {
  try {
    const raw = localStorage.getItem(COMPLETIONS_KEY);
    if (!raw) return { count: 0, lastDate: null };
    const parsed = JSON.parse(raw);
    return {
      count: Number.isFinite(parsed.count) ? parsed.count : 0,
      lastDate: parsed.lastDate || null,
    };
  } catch (e) {
    return { count: 0, lastDate: null };
  }
}

function maybeCountCompletion() {
  const today = new Date().toISOString().slice(0, 10);
  const c = loadCompletions();
  if (c.lastDate === today) return;
  c.count += 1;
  c.lastDate = today;
  try { localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(c)); } catch (e) {}
}

function getCompletionCount() {
  return loadCompletions().count;
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

  // Capture the previous station's intended cue so we can compare it to
  // the new station's cue and skip speech when they're identical (the
  // common case for the 10 Hail Marys of a decade).
  const prevStation = state.sequence[state.currentIndex];
  const prevCue = state.handsFree && prevStation
    ? cueForStation(prevStation, state.data) : null;

  state.transitionLock = true;
  const card = document.getElementById("card");

  card.classList.remove("is-here");
  card.classList.add(direction > 0 ? "is-leaving-left" : "is-leaving-right");

  setTimeout(() => {
    state.currentIndex = index;
    const station = state.sequence[state.currentIndex];
    if (station.isFinal) maybeCountCompletion();
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
        if (state.handsFree) {
          const newCue = cueForStation(station, state.data);
          if (newCue && newCue !== prevCue) speakCue(newCue);
        }
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
  document.getElementById("cueToggle").addEventListener("click", tapZoneClick(toggleCues));

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
        state.currentIndex = 0;
        render(state.sequence[0], state.data);
        updateRosary();
      } else if (action === "mysteries") {
        closeMenu();
        openMysteryPicker();
      } else if (action === "practice") {
        closeMenu();
        setPractice(state.practice === "salutation" ? "restorative" : "salutation");
      } else if (action === "body") {
        closeMenu();
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
  updatePracticeMenuLabel();
  overlay.hidden = false;
}

function updatePracticeMenuLabel() {
  const btn = document.querySelector('[data-action="practice"]');
  if (!btn || !state.data) return;
  const seq = state.data.sequences[state.practice];
  btn.textContent = `Practice · ${seq ? seq.name : state.practice}`;
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
    btn.textContent = key === todayKey ? `${label} · today` : label;
    btn.addEventListener("click", () => {
      state.mysterySetOverride = key === todayKey ? null : key;
      state.sequence = buildSequence(
        state.data,
        mysterySetForToday(state.data, state.mysterySetOverride),
        state.bodyState,
        state.practice
      );
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

function openHelp() {
  document.getElementById("helpOverlay").hidden = false;
}

function closeHelp() {
  document.getElementById("helpOverlay").hidden = true;
}

const VOICE_SAMPLE_TEXT = "Mountain, hands at heart. Our Father.";

function openVoiceSettings() {
  ensureAudio();
  document.getElementById("voiceOverlay").hidden = false;
  // Nudge iOS to refresh its voice inventory — newly-downloaded voices
  // sometimes need a `cancel()` poke before they appear in getVoices().
  if (synth) { try { synth.cancel(); } catch (e) {} }
  renderVoiceList();
  if (synth) {
    synth.onvoiceschanged = () => {
      preferredVoice = pickVoice();
      renderVoiceList();
    };
  }
  // Re-render shortly after open: some iOS versions populate the voice
  // list asynchronously after the panel mounts.
  setTimeout(renderVoiceList, 300);
  setTimeout(renderVoiceList, 1200);
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

  const voices = getDisplayVoices();
  if (!voices.length) {
    container.innerHTML = `<p class="voice-empty">No voices available yet.</p>`;
    return;
  }

  // Diagnostic line. If a downloaded voice is missing from the picker,
  // it likely isn't being exposed to web JS by iOS Safari.
  const diag = document.createElement("p");
  diag.className = "voice-diag";
  diag.textContent = `${voices.length} voice${voices.length === 1 ? "" : "s"} available`;
  container.appendChild(diag);

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
    state.bodyState,
    state.practice
  );

  const saved = loadState();
  state.currentIndex = saved ? Math.min(saved.currentIndex || 0, state.sequence.length - 1) : 0;

  const station = state.sequence[state.currentIndex];
  if (station.isFinal) maybeCountCompletion();
  render(station, state.data);
  document.getElementById("card").classList.add("is-here");
  updateRosary();
  if (state.handsFree) {
    enableHandsFree(true);
    // Speak the opening cue once everything is on screen.
    setTimeout(() => speakCue(cueForStation(station, state.data)), 250);
  }
}

// Switch between the salutation and restorative practices. Changing the
// practice restarts it from the first card — the two sequences don't share
// station indices.
function setPractice(key) {
  state.practice = key;
  savePractice(key);
  clearState();
  state.sequence = buildSequence(
    state.data,
    mysterySetForToday(state.data, state.mysterySetOverride),
    state.bodyState,
    state.practice
  );
  state.currentIndex = 0;
  render(state.sequence[0], state.data);
  saveState();
  updateRosary();
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
}

function disableHandsFree() {
  state.handsFree = false;
  saveHandsFree(false);
  updateHandsFreeMenuLabel();
  stopListening();
  releaseWakeLock();
  if (synth) { try { synth.cancel(); } catch (e) {} }
  hideAmenIndicator();
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

  state.practice = loadPractice();
  state.cuesOpen = loadCuesOpen();
  state.handsFree = loadHandsFree();
  loadTtsSettings();

  await preloadPoseArt(state.data);

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
