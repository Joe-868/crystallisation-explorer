# Crystallisation Explorer — update notes (June 2026 review)

## What changed

### Bug fixes
1. **Removed broken drag-and-drop remnants.** `Clickgable`, `onClickStart`, `onClickOver` and `onDrop` are not valid React props (they look like a find-and-replace of the old drag props). React was passing them to the DOM as junk attributes, the drop handlers never fired, and `addCurrentTool()` / the `ClickItem` state were dead code. Interaction is now a single clean `onClick` per tool, with `disabled` on locked tools (better for keyboard users too).
2. **Completion messages were invisible.** The flash popup only rendered in the bench (non-video) branch, but after each process the video overlay stays on screen — so "Heating complete…" etc. never appeared. The popup now renders over the video as well.
3. **Asset paths** now use `import.meta.env.BASE_URL` instead of hard-coded `/crystallisation-explorer/`, so `npm run dev` works locally and the base only lives in `vite.config.ts`.
4. **Root `index.html` was the built file**, which breaks `npm run build`. The repo now keeps the *source* index.html; the built site is in `dist/`.
5. **Stale `package-lock.json`** pointed at an internal registry mirror; regenerated against registry.npmjs.org.

### New features for the 12–15 audience
- **Live temperature readout** (≈25 → 115 °C etc.) during heating/cooling/reheating, linked to the countdown — connects the videos to a real Linkam-style temperature ramp and to ROY's ~110 °C melting point.
- **3-question mini quiz** after the experiment (polymorphism, nucleation, why colours differ), with instant feedback and a score.
- **Video controls** so pupils can pause/replay/scrub the microscopy footage.
- Header subtitle: "ROY = Red, Orange & Yellow — one molecule, many crystal colours".
- Copy polished throughout ("Click the ROY powder **to** the balance" → natural English); cursor-click icon instead of the drag icon; `aria-live` on the feedback bar.

## How to publish
GitHub Pages serves the *built* files. After any source change:
```bash
npm run build
cp -r dist/index.html dist/assets ./   # copy built output over repo root
git add -A && git commit -m "update" && git push
```
(Cleaner long-term: set Pages to deploy from a `gh-pages` branch or GitHub Action so root keeps only source.)

## v2 — video-driven timing (onEnded)
- Step completion is now triggered by the video's own `onEnded` event, so the videos and the experiment state can never drift apart, and pausing/scrubbing with the controls behaves correctly.
- The countdown and the temperature readout are read live from the video (`onTimeUpdate`), so the temperature tracks the actual frame on screen — even when a pupil drags the progress bar.
- `onError` fallback: if a video fails to load (e.g. school wifi), a notice appears and the stage completes on a fixed timer (the old 14/5/34 s values) instead of stalling the experiment.

## v3 — slow video loading at outreach events
**Root cause:** the original videos were enormous — heating.mp4 was 35 MB for 19 s (~15 Mbps) and reheating.mp4 was 63 MB (and actually 76 s long, not 34 s). 106 MB total over GitHub Pages + venue wifi = stalls.

1. **Videos re-encoded** (H.264, CRF 26–28, 960 px wide, `+faststart`, audio stripped): 106 MB → **23 MB** (heating 7.6 MB, cooling 1.7 MB, reheating 14 MB). `+faststart` moves the index to the front of the file so playback can begin before the download finishes. Replace the files in `videos/` AND `public/videos/` with the ones in this zip.
2. **Background preloading:** on page load the app fetches all three videos into memory (blob URLs) while pupils do the weighing/sandwich/loading steps. By the time anyone presses "Heat sample", playback is instant. A pulsing "Loading videos… n/3" badge shows until all are cached — at an event, wait for it to disappear before starting. If a preload fails, that video simply streams from the network as before, and the existing onError timer fallback still protects against total failure.
3. Cache-buster bumped to `?v=20260611` so devices that cached the old 100 MB files fetch the new ones.

**Belt-and-braces for events:** run it locally so wifi doesn't matter at all —
`npm run build && npx serve dist` (or `npm run preview`), then open http://localhost on the demo laptop.

## v4 — quiz removed
Mini quiz removed at Joe's request: guide is back to 6 steps, the final feedback line now reads "Reheating complete. You have seen the full ROY polymorphism cycle!", and all quiz code/CSS is stripped.

## v5 — durations corrected to real video lengths
`PROCESS_DURATIONS` updated to the measured lengths (heating 19 s, cooling 5 s, reheating 76 s). Although onEnded drives step completion, the constant still fed: the countdown's starting value (the badge briefly flashed "34s" before the video corrected it), the "Next: reheat (34 s)" hints, the "Reheating for 34 seconds…" feedback, and the timer fallback when a video fails to load. All UI strings now derive from the constant, so future edits only need one change. A comment in the code explains exactly what the constant is used for.

## v6 — real temperature programme
Temperature readout updated to the actual Linkam programme: heating 30→130 °C, cooling 130→45 °C, reheating 30→130 °C, all at 30 °C/min. Because the videos are edited/condensed, the readout is linearly interpolated across playback: the start and end temperatures are exact, the middle is approximate. The "≈" prefix stays, and each video now shows a small italic note, e.g. "30 → 130 °C at 30 °C/min — footage condensed, temperature approximate", which is also honest science communication for the pupils.

## v7 — live temperature readout removed
The interpolated "≈ XX °C" badge has been removed (the edited footage made the live number too far from reality). The accurate programme information stays as a static note under each video title: e.g. "30 → 130 °C at 30 °C/min — footage condensed". The Thermometer icons on the Heat/Reheat buttons are unchanged.

## v8 — copy fix + quick-play Videos menu
- "ROY melts at about 110 °C…" → "ROY melts at its melting point into a red liquid." The matching flash message ("…at about 110 °C") was updated the same way for consistency.
- New "Videos" button next to Reset: opens a small menu (Heating / Cooling / Reheating) that jumps straight to any video without doing the prep steps — designed for presenting at events. The experiment state moves to the matching stage, so after a quick-played video finishes, the normal flow simply continues from there.

## v9 — Videos dropdown fix
- The dropdown was being painted underneath the Guide/sim panels: every panel (and the header) uses backdrop-filter, which creates its own stacking context, and the header had no z-index, so later siblings covered the menu. Fixed with `.sim-header { position: relative; z-index: 200; }` — the menu now floats above all page content.
- Durations removed from the menu labels: now just "Heating · melt", "Cooling · crystals", "Reheating · transformations".
