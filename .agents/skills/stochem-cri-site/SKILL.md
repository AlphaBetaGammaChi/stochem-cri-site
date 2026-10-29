---
name: stochem-cri-site
description: Maintain and extend the private GitHub Pages educational site explaining how the STOCHEM-CRI Lagrangian chemistry-transport model works — adding pages, interactive canvas/SVG visualisations, cited references, and GIF assets generated from the stochem_anims / reaction_anims pipelines. Use when editing stochem-cri-site, adding a section or figure, updating citations, or troubleshooting the Pages deploy.
---

# stochem-cri-site — maintenance runbook

Educational static site for STOCHEM-CRI (global 3-D Lagrangian tropospheric
CTM: ~50,048 constant-mass air parcels, 72×36×9 Eulerian analysis grid, CRI
v2-R5 mechanism ~241 species / ~700 reactions, driven by archived met).

## Golden rules

- **Dependency-free forever.** Pure HTML/CSS/JS. No npm, CDN, fonts, or build.
- **Schematic honesty.** Interactive figures are labelled schematics. Only GIF
  renders from `stochem_anims` / `reaction_anims` (real code/output files) may
  be called real model results.
- **Every claim is cited.** Numbered `<sup class="cite">` links to
  `references.html` anchors (`#collins1997`, `#jenkin2008`, `#khan2020`, …).
  Verify DOIs before adding; never invent page numbers/author lists — DOI-only
  is acceptable.

## Common tasks

### Add a new page
1. Copy the `<header class="site"><nav …>` block from `index.html`; set the new
   page's link `active`.
2. Add the same `<a class="navlink">` to **every** page's nav, in matching
   position.
3. Use existing CSS classes: `.hero`, `.panel`, `.cards`/`.card`, `.viz`,
   `.two-col`, `.schematic` (schematic disclaimer), `.tip`, `table.ref`,
   `ol.refs`, `.flow`/`.step`.

### Add an interactive figure
1. New file in `assets/js/`; pure canvas or SVG, vanilla JS in an IIFE
   (`(function(){…})()`), all elements looked up by `getElementById` with a
   guard `if (!el) return;` so the script is safe on other pages.
2. Include a `<script src=…>` at the end of the page's `<body>`.
3. Add `.controls` buttons/sliders above the `<figure class="viz">`.
4. Palette for concentration fields: `#0000ff #0097ff #00d4ff #00ffdc #0cff00
   #99d400 #ffd300 #ffb500 #ff0000` (manuscript rainbow, see `grid.js`).
5. Label the figure schematic in the `figcaption` unless it renders real data.

### Add a reference
1. Append `<li id="shortkeyyear">` inside the right `ol.refs` in
   `references.html` — **do not renumber**; pick the next free `[n]`.
2. Verify the DOI resolves (search or fetch it). If a bibliographic field is
   uncertain, omit it rather than guess.
3. Cite it in text as
   `<sup class="cite"><a href="references.html#shortkeyyear">[n]</a></sup>`.

### Add/replace a GIF asset
1. Render in the source pipelines (`Trading/reaction_anims` for reaction GIFs;
   `Trading/stochem_anims` for model-output GIFs).
2. Copy to `assets/img/`; if > ~5 MB use the `_montage.png` instead.
3. `<img … loading="lazy">` inside `<figure class="viz">` with a factual caption.

### Update model facts
Parcel count, grid, species/reaction counts and file formats describe the
current build in `~/Documents/GitHub/STOCHEM.jl` (`Base.for`,
`INOPERVM10.SOA2`, `STOCHEM_README.md`). If they change, grep the site for the
old numbers and update all pages together.

## Deploy

Push to `main`; `.github/workflows/pages.yml` (actions/configure-pages +
upload-pages-artifact + deploy-pages) redeploys. Repo is **private** — Pages
needs GitHub Pro/Team. Check status:

```bash
gh api repos/<owner>/stochem-cri-site/pages
gh run list --workflow=pages.yml
```

## Verify locally

```bash
cd stochem-cri-site && python3 -m http.server 8000
```

Click every page; confirm nav `active` states, no JS console errors on
visualisations.html, all images resolve, and every new claim has a citation.
