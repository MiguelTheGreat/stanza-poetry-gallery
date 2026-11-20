# Stanza. — Digital Poetry House

An interactive digital poetry house and exhibition gallery inspired by the design language of `lumina-art-gallery`, built to house ***Cut on the Life of a Weeping Man*** and future poetry collections.

**Live Site (GitHub Pages):** https://miguelthegreat.github.io/stanza-poetry-gallery/

## Features

- **Experience Mode**
  - **Vinyl / Folio Collection Shelf** inspired by Apple's Top 100 Albums, featuring custom fine-art cover sleeves with 3D hover tilt, peeking vinyl disc, ambient lighting shifts, and support for adding new volumes.
  - **Lived-In Scroll-Driven Reader** with inertial scroll choreography, left-edge chapter rail, synthesized Web Audio paper rustles, dual-ring magnetic cursor, and kinetic marquee ticker.
  - **Interactive Ink Reveal**: Glide your brush across faint graphite drafts to illuminate verses into sharp charcoal ink with translucent watercolor washes and floating ink dust particles — plus **Bloom Reveal** and **Reset Ink** controls.
- **Gallery Mode**
  - **Accordion Exhibition Strips** with radial hover reveals, 3D parallax verse previews, and smooth fullscreen poem lightbox.
  - **4-Line Verse Picker**: Click up to **4 lines** from any poem to highlight for sharing.
  - **5 Share Card Styles**: `Museum`, `Noir`, `Broadsheet`, `Atmosphere`, and `Keepsake` rendered to high-resolution PNGs.
  - **Optional Soundtrack**: Attach any **Spotify** or **YouTube / YouTube Music** track link to play as an ambient soundtrack when friends open your shared card link.

## Running the Full-Stack Server Locally

```bash
npm install
npm start
```

The Express + SQLite (`node:sqlite`) server serves `docs/` along with REST endpoints for collections, poems, and persisted share cards at `http://localhost:3000`. On GitHub Pages, `docs/` runs seamlessly as a self-contained static site with URL-encoded share cards and `localStorage` persistence.
