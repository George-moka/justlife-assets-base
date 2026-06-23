# Justlife DS Builder — Latest (build v9.8)

Two GitHub repos. Put each file where shown, commit, and Netlify auto-deploys.

## A) SITE repo  (the one Netlify deploys → justlife-builder.netlify.app)
Unzip **justlife-site-clean.zip** into the repo ROOT. Final structure:

    /netlify.toml                     ← publish=public, functions dir, /api/* redirect
    /public/index.html                ← the landing page WITH the live builder embedded (v9.8)
    /netlify/functions/generate.js    ← serverless proxy to Claude (reads ANTHROPIC_API_KEY)

Netlify build settings (Site configuration → Build & deploy):
- Base directory:      (empty)
- Publish directory:   public
- Functions directory: netlify/functions

Netlify env var (Site configuration → Environment variables) — REQUIRED for Generate to work:
- ANTHROPIC_API_KEY = sk-ant-…   then Deploys → Clear cache and deploy site

## B) ASSETS repo  (George-moka/justlife-assets-base → served via jsDelivr)
These live at the repo ROOT (the app fetches them from the CDN, not from the site):

    /ds-components.json   ← DS catalog (93 components, 24 live) — LATEST
    /manifest.json        ← asset index (photos / icons / 3D icons)
    /Photos (export PNG)/…            (already in repo)
    /2D Icons (export PNG)/…          (already in repo)
    /3D Icons (export PNG)/…          (upload justlife-3d-icons-normalized.zip contents here)

After updating the assets repo, purge the CDN cache:
  https://purge.jsdelivr.net/gh/George-moka/justlife-assets-base@main/ds-components.json
  https://purge.jsdelivr.net/gh/George-moka/justlife-assets-base@main/manifest.json

## Extra (not deployed — keep for reference)
- justlife-builder.html  → standalone single-file tool (same builder, no landing)
- justlife-builder.jsx   → React source of truth for the builder

## What changed in v9.8
- App Header: white surface + curved bottom edge + soft shadow
- Navbar/App: floating white card (radius 16) + Next button text #7A4A00
- Navigation Bar: floating bar + active highlight radius 12 (not full pill)
- Button: variants primary/secondary/tertiary/danger/pill + sizes + NEW Outline state
- Catalog: 93 components (Thank You Card→Booking Status, +Summary Item Card)
