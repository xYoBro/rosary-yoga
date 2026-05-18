# Pose Images — How to Generate or Replace

The app shows one image per pose. Wikipedia/Wikimedia Commons only has photos for 6 of the 12 figures in this practice, and the available photos are mixed in style (different photographers, different studios, different eras). For visual consistency the best path is to generate all 12 in a single matched style — either with an AI image model or by commissioning hand-drawn illustrations.

This document gives a precise prompt you can paste into Gemini, ChatGPT image generation, Midjourney, or any other image model, plus the file names the app expects.

---

## The brief

Paste the **style block** at the top of every generation, then append the **pose-specific line** for the one you're generating. Generate one image per pose, keeping the style constant.

### Style block (use verbatim every time)

```
Minimalist line-art illustration of a single human figure in a yoga pose.
Style: hand-painted line drawing reminiscent of an antique prayer book or
yoga manual illustration. Use deep oxblood / burgundy lines (#8A2A2A) on a
near-black background (#0E0A0A). The figure is a clean, stylized silhouette
with no facial features, no clothing details, and no text. Soft golden accent
(#C8A45A) is permitted only for props (a yoga block, folded blanket, mat
line, wall). Centered composition. Aspect ratio 5:3 horizontal. No watermarks,
no signatures, no other figures, no decorative borders.
```

### Pose-specific lines

Append one of these to the style block above:

1. **Seated Forward Fold** — Side view. The figure sits on the floor with legs extended forward, body folded down over the legs, head and shoulders hanging heavy. A faint floor line runs beneath.

2. **Child's Pose** — Side view. The figure kneels with hips resting on heels, body folded forward, arms extended along the floor in front of the head. Forehead resting on the floor.

3. **Supported Butterfly** — Three-quarter view from above. The figure lies on its back. Soles of the feet touch with knees fallen open to either side, forming a diamond shape with the legs. Small rectangular blocks (in soft gold) support each knee from below.

4. **Reclined Side Stretch (Bananasana)** — Top-down view. The figure lies on its back, body bent into a long crescent / banana curve. Arms extended overhead, both ankles crossed at the far side. Both shoulders and both hips stay flat on the floor.

5. **Savasana** — Top-down view. The figure lies completely flat on its back. Arms slightly out from the sides with palms up. Legs slightly apart with feet falling open. Symmetric, restful.

6. **Knees-to-Chest (Apanasana)** — Side view. The figure lies on its back, both knees drawn toward the chest, hands resting on the shins.

7. **Reclined Figure-Four** — Three-quarter view. The figure lies on its back. The right ankle is crossed over the left thigh just above the knee. The left thigh is drawn toward the chest, hands threading behind the left hamstring to hold it.

8. **Supported Bridge** — Side view. The figure lies on its back with knees bent and feet flat on the floor. The hips are lifted onto a rectangular yoga block (in soft gold) placed under the sacrum. The chest opens passively. Arms rest at the sides.

9. **Happy Baby** — Front view (looking down at the figure). The figure lies on its back with knees pulled wide to either side of the chest, ankles stacked over the knees, hands grabbing the outside edges of both feet. The knees draw toward the armpits.

10. **Supported Fish** — Side view. The figure lies back over a rectangular yoga block (in soft gold) that runs lengthwise along the spine. The chest opens passively, the upper back gently arches. The head rests on the floor behind. Legs extended long.

11. **Legs Up the Wall** — Side view. The figure lies on its back with the back flat on the floor. Legs extend vertically up against a wall, forming an L shape. The wall is shown as a faint vertical line on one edge. The floor line runs beneath horizontally.

(Optional 12th: **Neutral on Back** — Same as Savasana but with hands resting on the belly. The app uses the Savasana image as fallback if this one isn't generated.)

---

## File names the app expects

Save each generated image as JPG (~800×480px is plenty) at:

```
app/assets/poses/photos/seated_forward_fold.jpg
app/assets/poses/photos/child_pose.jpg
app/assets/poses/photos/supported_butterfly.jpg
app/assets/poses/photos/banana.jpg
app/assets/poses/photos/savasana.jpg
app/assets/poses/photos/knees_to_chest.jpg
app/assets/poses/photos/figure_four.jpg
app/assets/poses/photos/supported_bridge.jpg
app/assets/poses/photos/happy_baby.jpg
app/assets/poses/photos/supported_fish.jpg
app/assets/poses/photos/legs_up_wall.jpg
app/assets/poses/photos/neutral_back.jpg   (optional)
```

The app already references these paths — drop the files in and they appear next refresh. Any pose without a photo automatically falls back to its SVG.

---

## After adding new images

Bump `CACHE_NAME` in `app/sw.js` (e.g., `rosary-yoga-v3` → `rosary-yoga-v4`) so the service worker re-caches the new files on next load. Otherwise installed PWA users will still see the old images.

---

## Notes on prompt quality

- Gemini and ChatGPT tend to produce more consistent style if you generate all images in one session, in order, with the style block as a system-level pattern.
- If a generation looks off (too realistic, wrong color, adds elements you didn't ask for), regenerate that one specifically — don't try to fix mid-batch.
- The "near-black background" is the most important constraint. Without it, you'll get photos with white/studio backgrounds that look wrong on the dark app theme.
- "No watermarks, no signatures" is worth including — some models add them by default.
