# AGENTS.md — stochem-cri-site

Private static educational site explaining how the STOCHEM-CRI Lagrangian
chemistry–transport model works, deployed to GitHub Pages via Actions.

## Repo layout

```
index.html  model.html  chemistry.html  visualisations.html  references.html
code.html                   — annotated Base.for subroutine tour (real line refs)
slides.html                 — self-contained slide deck (keyboard nav, hash
                              routing, print-to-PDF via @media print)
assets/css/style.css        — the only stylesheet; reuse its classes
assets/js/parcels.js        — interactive parcel advection schematic (canvas)
assets/js/chemistry.js      — interactive reaction-network explorer (SVG)
assets/js/grid.js           — interactive zonal-mean schematic (canvas)
assets/js/cri.js            — CRI lumping cascade animation (canvas)
assets/js/parcel_day.js     — one-parcel diurnal chemistry chart (canvas)
assets/js/traj.js           — follow-one-parcel trajectory animation (canvas)
assets/js/convection.js     — CLMIX cloud-entrainment schematic (canvas)
assets/js/census.js         — parcel-per-cell census / Poisson demo (canvas)
assets/img/                 — GIF/PNG renders copied from Trading/stochem_anims
                              and Trading/reaction_anims
.github/workflows/pages.yml — Pages deploy (upload-pages-artifact → deploy-pages)
.agents/skills/stochem-cri-site/SKILL.md — maintenance runbook (see below)
.devin/skills/              — symlink into .agents/skills (keep in sync)
```

## Hard rules for edits

1. **No dependencies, ever.** No npm, no CDN, no frameworks, no external fonts
   or icons. Hand-written HTML/CSS/JS only — the site must work fully offline
   and inside a private Pages deploy.
2. **Schematic vs real output.** Interactive canvas/SVG figures are *teaching
   schematics* and must say so. Only assets generated from model code/output
   (the `stochem_anims`/`reaction_anims` pipelines) may be described as real.
3. **Citations.** Every factual claim needs a numbered link to
   `references.html`. Verify DOIs and bibliographic details before adding a
   reference — never invent page numbers or author lists; cite DOI-only if
   unsure. Numbering is fixed per reference id (`#collins1997` etc.) — do not
   renumber existing entries when adding new ones; new refs get new ids and
   the next unused bracket number.
4. **Nav consistency.** Any new page goes into the shared `<nav class="site">`
   block on *every* page, with `active` class set correctly.
5. **Asset size.** Keep animated GIFs < ~5 MB; for larger animations copy the
   `_montage.png` static strip instead.
6. **Model facts.** Numbers like 50,048 parcels, 72×36×9 grid, 241 species,
   591 thermal + 110 photolysis rates describe the current STOCHEM-CRI build
   (`Base.for`/`INOPERVM10.SOA2` in `~/Documents/GitHub/STOCHEM.jl`). If the
   build changes, update consistently across index/model/chemistry pages.

## Verify before pushing

```bash
python3 -m http.server 8000   # click through every page
```

- Check each page renders, nav links work, `active` tab is correct.
- Check JS demos run with no console errors (canvas/SVG demos on
  visualisations.html).
- Check any new image paths resolve and `loading="lazy"` is set on GIFs.

## Commits

- Plain commit messages only — no AI-attribution or `Co-Authored-By` trailers.

## Deploy

Push to `main` — `.github/workflows/pages.yml` redeploys automatically.
One-time setup (already done): `gh api repos/<owner>/stochem-cri-site/pages
-X POST -f build_type=workflow`. Pages requires GitHub Pro/Team for private
repos.
