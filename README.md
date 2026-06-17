# Justlife DS Builder (live components) — Netlify

A new site that builds screens from LIVE Justlife DS components (real content, not images),
pulling photos/icons from your `justlife-assets` GitHub repo via jsDelivr.

## Deploy (same as before)
1. Put this folder in a GitHub repo (e.g. `justlife-builder`).
2. Netlify → Add new site → Import from Git → pick the repo (reads netlify.toml: publish=public, functions=netlify/functions).
3. Site configuration → Environment variables → add `ANTHROPIC_API_KEY = sk-ant-...` → redeploy.

## Assets
The app loads `manifest.json` from:
  https://cdn.jsdelivr.net/gh/georgewassfy-del/justlife-assets@main/
- Create that public repo (the `justlife-assets` scaffold) and upload your photos/icons.
- The generator will then use your asset ids for images; until then, components show clean placeholders.
- If your GitHub username/repo differs, set it before the app loads by adding to index.html <head>:
    <script>window.JUSTLIFE_ASSET_BASE="https://cdn.jsdelivr.net/gh/USER/REPO@main/";</script>

## Note
jsDelivr caches by default. After uploading new assets, they appear within a few minutes
(or purge via https://purge.jsdelivr.net/gh/USER/justlife-assets@main/manifest.json).
