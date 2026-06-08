# Crystallisation Explorer

A responsive React + TypeScript + Vite outreach simulation for teaching ROY melt crystallisation through weighing, coverslip mounting, Linkam-stage loading, and heating/cooling/reheating video observation.

## Features

- 5-step interactive outreach workflow
- Desktop, iPad/tablet, and mobile responsive layout
- QR-code friendly single public URL workflow
- Local images in `public/pics/`
- Local videos in `public/videos/`
- Accessibility improvements: keyboard activation, ARIA labels, focus states, and live status updates
- Microscope-style sandwich sample visual
- Youth science outreach / museum-booth visual style

## Required image files

Put these files in:

```text
public/pics/
```

Required names:

```text
roy-powders.png
balance-pic.png
coverslip.png
linkam-stage.png
```

## Required video files

Put these files in:

```text
public/videos/
```

Required names:

```text
heating.mp4
cooling.mp4
reheating.mp4
```

For QR-code/public access, keep videos compressed so they load quickly on phones. A practical target is roughly 5–20 MB per video.

## Run locally

```bash
npm install
npm run dev
```

## Build and preview

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

## Public deployment suggestion

For a portfolio/product-evidence link, deploy the built `dist/` folder to Netlify, Vercel, or GitHub Pages. Then generate a QR code from the public URL so visitors can open the same responsive web app on phone, tablet, or desktop.


## v21 Explore mode update

This version adds a same-page Home / Explore navigation. Explore mode contains a 2D manual laboratory bench where learners can drag or tap ROY powder, weighed sample, and coverslip sandwich through a simplified crystallisation workflow. The design is intended for Year 6–14 outreach use and uses a document-inspired high-contrast palette with high-tech cyan/yellow accents.

Explore mode is implemented in the same React single-page app and does not change the original Home workflow, video paths, or public asset paths.
