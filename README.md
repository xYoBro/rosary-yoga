# Rosary Yoga

A nightly anchor for body, mind, and the work ahead.

Ten poses. Five mysteries. Thirty to forty minutes before sleep. The body learns the cue. The mind follows the bead.

---

## What's in this repo

The night practice:

- **[practice.md](practice.md)** — the manual. Full nightly sequence, every pose with setup/hold cues, modifications, travel substitutions, and external references. Read this first.
- **[app/](app/)** — a small Progressive Web App that walks you through the practice bead by bead. Install once, run offline forever. Now also carries the daytime training arm (the Today view).

The day practice (added in the May 2026 expansion):

- **[vigil.md](vigil.md)** — the morning Vigil. Five to ten minutes, on the floor, before coffee. Lauds to the rosary's Compline.
- **[training.md](training.md)** — the daytime training manual. A year-long bead progression (Pendant + 5 mystery decades + Closing = 58 weeks), modality by day-of-week, quarterly boss encounters scored against the AF PT bracket. Carried in-app by the Today view.
- **[app.md](app.md)** — the app's design spec. The Parliament (six internal voices, including RELAY, THE QUARTERMASTER, CHAPLAIN, THE METRONOME, LONGWATCH, THE RAVEN), the Thought Cabinet, the bead loop, the year arc.
- **[paper.md](paper.md)** — the optional paper kit. Nine printable booklets per year — a Manual, seven Logbook decade booklets, a Codex. Standard printer, fold, two staples. The hand-stapling is an effort-justification device, not friction.

Historical:

- **[docs/archive/](docs/archive/)** — the original PDFs and source text. Historical reference; the active source of truth is `practice.md`.

---

## Using the app on iPhone

The app is a Progressive Web App, not a native app. It installs to your home screen and runs fullscreen, but there is no App Store step and no developer account required.

### Install

1. Host the `app/` folder somewhere (see *Hosting* below).
2. On your iPhone, open Safari and navigate to the hosted URL.
3. Tap the **Share** button (the square with the up-arrow).
4. Scroll down and tap **Add to Home Screen**.
5. Name it "Rosary Yoga" and tap Add.

You now have an icon on your home screen. Launching it opens the practice fullscreen — no browser chrome, no distractions. After the first launch the app is cached for offline use, so it works on planes, in hotels, anywhere.

### Using it

- **Swipe left** to advance to the next prayer / next bead.
- **Swipe right** to go back.
- The current pose stays the same across the prayers of a decade (one pose, ten Hail Marys). The pose illustration shrinks on continuation cards to keep the prayer text foregrounded.
- Tap **Show pose cues** at the bottom of any card to expand setup and hold instructions.
- Tap the **⋮** in the top right for a menu — restart, or change tonight's mysteries.
- The app remembers where you were for up to an hour, in case you leave mid-practice. After that it resets to the beginning.

### What it shows you when you open it

Tonight's mysteries are picked from the day of the week — Monday and Saturday are Joyful, Tuesday and Friday are Sorrowful, Wednesday and Sunday are Glorious, Thursday is Luminous. You can override the choice from the menu if you want a different set.

The first card is the Sign of the Cross and the Apostles' Creed, paired with the Seated Forward Fold. From there it walks you straight through — opening pendant, five decades, closing prayers — pose by pose, bead by bead.

---

## Hosting

The app is static HTML, CSS, and JS. No build step. Any static host works.

### GitHub Pages (easiest)

1. Push this repo to GitHub.
2. In the repo settings, enable Pages from the `main` branch, root directory.
3. The app will be at `https://<your-username>.github.io/rosary-yoga/app/`.
4. Open that URL on your iPhone and follow the install steps above.

### Local testing

```sh
cd app
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser. The PWA install prompt only appears over HTTPS, so for actual install you need a real host — but the practice works fine locally for testing.

### Any other static host

Netlify, Vercel, Cloudflare Pages, S3, GitHub Pages — all work. Point them at the `app/` directory.

---

## Customizing the practice

The practice is data-driven. To change a prayer, pose description, or the mystery list, edit [`app/data/practice.json`](app/data/practice.json). To change the pose illustrations, edit the SVGs in `app/assets/poses/`. To bump the service worker cache so users see your changes, increment `CACHE_NAME` in `app/sw.js`.

If you change the pose set itself (which deep holds go in which decade), update both `app/data/practice.json` (the `deep_holds` array and the pose definitions) and `practice.md` so the documentation stays in sync.

---

## Why this exists

The body needs daily movement. The mind needs daily stillness. Doing them separately is two decisions; coupling them is one. The rosary provides the structure, the yoga provides the substance, and the practice happens whether you wanted to do it tonight or not — because the only question is "did I do the rosary."

The night practice is the anchor. The day practice — added in 2026 as the training arm — is the work the night practice keeps the body open for: bodyweight strength, endurance, skill, mobility, all run on a year-long bead progression that arrives at quarterly boss encounters scored against the AF PT bracket. Same rosary structure, scaled out across the year.

The goal is not perfection in any single session. The goal is to still be doing this in thirty years.

The design discipline that keeps that goal honest: every daily ask is atomic (one tap, ≤30 seconds of operator interaction), the narrative frame is elaborate by default (the Parliament speaks, the Codex grows, the Thoughts internalize), and there are no streaks, no badges, no nag notifications. The Rosary itself is the only counter.

---

## License

Personal use. No license set.
