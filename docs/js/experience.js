/**
 * Stanza. — Experience Mode Engine
 * 1) Collection Shelf (Apple Top 100 Albums / Vinyl Folio Showcase — Owner-gated archiving)
 * 2) Single-Column Focus-Stanza Reading Stage + Archival Pencil Underline Interactivity
 */
(function () {
  const OWNER_KEY = 'stanza_owner_mode_v1';
  const MARGIN_KEY = 'stanza_margin_lines_v1';
  const MAX_UNDERLINES = 4;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

  // DOM Elements
  const overlay = document.getElementById('intro-overlay');
  const introContent = document.getElementById('intro-content');
  const introText = document.getElementById('intro-text');
  const introSubtext = document.getElementById('intro-subtext');
  const scrollProgressLine = document.getElementById('scroll-progress-line');
  const shelfStage = document.getElementById('vinyl-shelf-stage');
  const shelfCountNote = document.getElementById('shelf-count-note');
  const navBackShelf = document.getElementById('nav-back-shelf');
  const navGalleryLink = document.getElementById('nav-gallery-link');
  const navAddVolume = document.getElementById('nav-add-volume');
  const brandLink = document.getElementById('brand-link');

  const poemStage = document.getElementById('poem-stage');
  const chapterRail = document.getElementById('chapter-rail');
  const placard = document.getElementById('artwork-placard');
  const placardIndex = document.getElementById('placard-index');
  const placardTitle = document.getElementById('placard-title');
  const placardSubtitle = document.getElementById('placard-subtitle');
  const revealBarFill = document.getElementById('reveal-bar-fill');
  const revealPct = document.getElementById('reveal-pct');
  const canvasControls = document.getElementById('canvas-controls');
  const btnReadingMode = document.getElementById('btn-reading-mode');
  const btnSharePoem = document.getElementById('btn-share-poem');
  const btnPrevChapter = document.getElementById('btn-prev-chapter');
  const btnNextChapter = document.getElementById('btn-next-chapter');
  const hintEl = document.getElementById('hint');
  const tickerWrap = document.getElementById('ticker-wrap');
  const colophonEyebrow = document.getElementById('contact-eyebrow');
  const colophonGalleryLink = document.getElementById('colophon-gallery-link');
  const colophonShelfBtn = document.getElementById('colophon-shelf-btn');
  const colophonAddBtn = document.getElementById('colophon-add-btn');
  const backToTopBtn = document.getElementById('back-to-top');
  const toastEl = document.getElementById('stanza-toast');

  const archiveModalBackdrop = document.getElementById('archive-modal-backdrop');
  const archiveModalClose = document.getElementById('archive-modal-close');
  const archiveForm = document.getElementById('archive-volume-form');

  const cursorApi = window.StanzaCursor ? window.StanzaCursor.initCursor() : null;

  // State
  let isOwner = false;
  let collections = [];
  let activeCollection = null;
  let readerScenes = [];
  let chapterStops = [];
  let isReaderMode = false;
  let isFullPoemMode = false;
  let rafId = null;

  let viewW = window.innerWidth;
  let viewH = window.innerHeight;
  let maxScroll = 1;
  let targetScroll = 0;
  let smoothScroll = 0;
  let scrollVelocity = 0;
  let activeSceneIndex = 0;
  let displayedPlacardIdx = -1;
  let inColophonMode = false;
  let tickerOffset = 0;
  let tickerHalfWidth = 1000;
  let lastRailIdx = -1;
  let lastStanzaTag = '';
  let lastHintText = '';
  let lastScrollScale = -1;

  const pointer = {
    normX: 0,
    normY: 0,
    smoothNormX: 0,
    smoothNormY: 0
  };

  // ============================================
  // OWNER DETECTION (?owner=1, localhost, or Shift+Alt+O)
  // ============================================
  function detectOwnerMode() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('owner') === '1') {
      try { localStorage.setItem(OWNER_KEY, '1'); } catch {}
    } else if (params.get('owner') === '0') {
      try { localStorage.removeItem(OWNER_KEY); } catch {}
    }
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    let stored = false;
    try { stored = localStorage.getItem(OWNER_KEY) === '1'; } catch {}
    isOwner = isLocal || stored;
    document.body.classList.toggle('is-owner', isOwner);
  }

  // ============================================
  // UTILITIES & MARGIN BOOKMARK PERSISTENCE
  // ============================================
  let toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2400);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadMarginMap() {
    try {
      return JSON.parse(localStorage.getItem(MARGIN_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveMarginMap(map) {
    try {
      localStorage.setItem(MARGIN_KEY, JSON.stringify(map));
    } catch {}
  }

  // ============================================
  // BULLETPROOF SPLIT-CURTAIN TRANSITIONS
  // ============================================
  let curtainOpened = false;
  let hideCurtainTimer = null;

  function openCurtain() {
    curtainOpened = true;
    clearTimeout(hideCurtainTimer);
    introContent.style.opacity = '';
    overlay.classList.remove('curtain-closing');
    overlay.classList.add('curtain-open');
    document.body.classList.add('app-ready');
    hideCurtainTimer = setTimeout(() => {
      if (overlay.classList.contains('curtain-open')) {
        overlay.classList.add('curtain-hidden');
      }
    }, 680);
  }

  function showCurtainForTransition(title, subtitle) {
    clearTimeout(hideCurtainTimer);
    if (title) introText.textContent = title;
    if (subtitle) introSubtext.textContent = subtitle;
    introContent.style.opacity = title || subtitle ? '' : '0';
    overlay.classList.remove('curtain-hidden', 'curtain-open');
    void overlay.offsetWidth; // Force reflow before closing animation
    overlay.classList.add('curtain-closing');
  }

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      openCurtain();
    }
  });

  function transitionWithCurtain(title, subtitle, onMidpoint) {
    showCurtainForTransition(title, subtitle);
    setTimeout(async () => {
      await onMidpoint();
      setTimeout(() => {
        openCurtain();
      }, 180);
    }, 620);
  }

  function bindTransitionLinks(root = document) {
    root.querySelectorAll('.transition-link').forEach((link) => {
      if (link.dataset.transitionBound) return;
      link.dataset.transitionBound = '1';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.href;
        showCurtainForTransition('', '');
        setTimeout(() => {
          window.location.href = target;
        }, 560);
      });
    });
  }

  // ============================================
  // VIEW 1: APPLE-STYLE VINYL / FOLIO COLLECTION SHELF
  // ============================================
  async function loadShelfCollections() {
    collections = await window.StanzaStore.getCollections();
    renderShelf();
  }

  function renderShelf() {
    shelfStage.innerHTML = '';
    const countText =
      collections.length === 1
        ? '1 Collected Volume · Select the sleeve to enter its reading room'
        : `${collections.length} Collected Volumes · Select a sleeve to enter its reading room`;
    shelfCountNote.textContent = countText;

    collections.forEach((col) => {
      const card = document.createElement('article');
      card.className = 'album-card';

      card.innerHTML = `
        <div class="folio-stage" data-slug="${col.slug}" role="button" tabindex="0" aria-label="Enter ${escapeHtml(col.title)}">
          <div class="folio-shadow" aria-hidden="true"></div>
          <div class="folio-book">
            <div class="folio-back" aria-hidden="true"></div>
            <div class="folio-spine" aria-hidden="true">
              <span class="folio-spine-text">${escapeHtml(col.volume)} · ${escapeHtml(col.title)}</span>
            </div>
            <div class="folio-pages" aria-hidden="true"></div>
            <div class="folio-front">
              <div class="folio-plate">
                <div class="folio-top-meta">
                  <span>${escapeHtml(col.volume)}</span>
                  <span>${escapeHtml(col.year)}</span>
                </div>
                <div>
                  <div class="folio-cut-mark" aria-hidden="true"></div>
                  <h3 class="folio-cover-title">${escapeHtml(col.title)}</h3>
                  <div class="folio-cover-rule" aria-hidden="true"></div>
                  ${col.epigraph ? `<p class="folio-cover-epigraph">“${escapeHtml(col.epigraph)}”</p>` : ''}
                </div>
                <div class="folio-bottom-meta">${col.poemCount} ${col.poemCount === 1 ? 'Poem' : 'Poems'} · Stanza.</div>
              </div>
            </div>
          </div>
        </div>
        <div class="album-details">
          <div class="album-meta-row">
            <span>${escapeHtml(col.volume)}</span>
            <span class="album-meta-dot"></span>
            <span>${col.poemCount} ${col.poemCount === 1 ? 'Poem' : 'Poems'}</span>
            <span class="album-meta-dot"></span>
            <span>${escapeHtml(col.year)}</span>
          </div>
          <h3 class="album-title">${escapeHtml(col.title)}</h3>
          ${col.subtitle ? `<p class="album-subtitle">${escapeHtml(col.subtitle)}</p>` : ''}
          ${col.epigraph ? `<blockquote class="album-epigraph">“${escapeHtml(col.epigraph)}”</blockquote>` : ''}
          <div class="album-actions">
            <button type="button" class="btn-enter-exp hover-target" data-enter="${col.slug}">Enter Experience →</button>
            <a href="gallery.html?collection=${encodeURIComponent(col.slug)}" class="btn-open-gallery transition-link hover-target">Gallery Mode</a>
            <button type="button" class="btn-open-gallery hover-target" data-share-fb="${col.slug}" title="Share etched card on Facebook">Share on FB ↗</button>
          </div>
        </div>
      `;

      // Interactive 3D angle response around the resting angled hero pose
      const folioStage = card.querySelector('.folio-stage');
      const folioBook = card.querySelector('.folio-book');
      let rect = null;

      folioStage.addEventListener('mouseenter', () => {
        rect = folioStage.getBoundingClientRect();
        if (cursorApi) cursorApi.setInspect('OPEN');
      });

      folioStage.addEventListener('mousemove', (e) => {
        if (!rect) rect = folioStage.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        const ry = -16 + nx * 12;
        const rx = 5 - ny * 8;
        folioBook.style.transform = `rotateY(${ry.toFixed(1)}deg) rotateX(${rx.toFixed(1)}deg) translateY(-8px) translateZ(16px)`;
      });

      folioStage.addEventListener('mouseleave', () => {
        rect = null;
        folioBook.style.transform = '';
        if (cursorApi) cursorApi.setInspect('');
      });

      const triggerEnter = () => enterCollectionExperience(col.slug);
      folioStage.addEventListener('click', triggerEnter);
      folioStage.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerEnter();
        }
      });
      card.querySelector('[data-enter]').addEventListener('click', triggerEnter);

      card.querySelector('[data-share-fb]').addEventListener('click', () => {
        const shareUrl = window.location.origin + window.location.pathname;
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(fbUrl, '_blank', 'noopener,noreferrer,width=640,height=520');
      });

      shelfStage.appendChild(card);
    });

    // Owner-only "Archive Next Volume" ghost sleeve
    if (isOwner) {
      const addCard = document.createElement('div');
      addCard.className = 'add-volume-card owner-only';
      addCard.innerHTML = `
        <button type="button" class="add-sleeve-box hover-target" id="shelf-add-sleeve">
          <span class="add-plus">+</span>
          <span class="add-sleeve-label">Archive<br>Next Volume</span>
        </button>
        <p class="add-sleeve-note">Owner Mode · Press a new volume onto the shelf</p>
      `;
      addCard.querySelector('#shelf-add-sleeve').addEventListener('click', openArchiveModal);
      shelfStage.appendChild(addCard);
    }

    if (cursorApi) cursorApi.bindHoverTargets(shelfStage);
    bindTransitionLinks(shelfStage);
  }

  // ============================================
  // VIEW 2: SINGLE-COLUMN FOCUS-STANZA EXPERIENCE
  // ============================================
  async function enterCollectionExperience(slug, skipCurtain = false) {
    if (cursorApi) cursorApi.setInspect('');
    window.StanzaAudio?.playPaperRustle(0.055);

    const loadAndMount = async () => {
      activeCollection = await window.StanzaStore.getCollection(slug);
      if (!activeCollection) {
        showToast('Could not load collection');
        return;
      }
      mountReaderMode(activeCollection);

      const url = new URL(window.location.href);
      url.searchParams.set('collection', slug);
      url.searchParams.set('mode', 'read');
      history.replaceState(null, '', url.toString());
    };

    if (skipCurtain) {
      await loadAndMount();
    } else {
      const colMeta = collections.find((c) => c.slug === slug);
      transitionWithCurtain(
        colMeta?.volume || 'VOL. 01',
        colMeta?.title || 'Entering Experience',
        loadAndMount
      );
    }
  }

  function exitToShelf() {
    window.StanzaAudio?.playPaperRustle(0.05);
    transitionWithCurtain('Stanza.', 'Collection Shelf', async () => {
      isReaderMode = false;
      isFullPoemMode = false;
      document.body.classList.remove('mode-reader', 'reading-full');
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      window.scrollTo(0, 0);
      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      url.searchParams.delete('collection');
      history.replaceState(null, '', url.toString());
    });
  }

  function mountReaderMode(collection) {
    isReaderMode = true;
    isFullPoemMode = false;
    document.body.classList.add('mode-reader');
    document.body.classList.remove('reading-full');
    btnReadingMode.textContent = 'Full Poem';
    window.scrollTo(0, 0);

    targetScroll = 0;
    smoothScroll = 0;
    activeSceneIndex = 0;
    displayedPlacardIdx = -1;
    inColophonMode = false;
    lastRailIdx = -1;
    lastStanzaTag = '';
    lastHintText = '';
    lastScrollScale = -1;

    const galleryHref = `gallery.html?collection=${encodeURIComponent(collection.slug)}`;
    navGalleryLink.href = galleryHref;
    colophonGalleryLink.href = galleryHref;

    // Generous scroll runway so every stanza breathes cleanly
    const totalPoems = collection.poems.length;
    const scrollContainer = document.getElementById('scroll-container');
    scrollContainer.style.height = `${Math.max(1200, (totalPoems + 1.4) * 340)}vh`;

    // Kinetic Marquee Ticker
    const tickerChunk = `${collection.title.toUpperCase()} • ${collection.poems.map((p) => p.title.toUpperCase()).join(' • ')} • `;
    tickerWrap.innerHTML = Array(4)
      .fill(`<span class="ticker-item">${tickerChunk}</span>`)
      .join('');

    poemStage.innerHTML = '';
    chapterRail.innerHTML = '';
    const marginMap = loadMarginMap();
    readerScenes = [];
    chapterStops = [];

    const poemBandSpan = 0.88 / Math.max(1, totalPoems);

    collection.poems.forEach((poem, idx) => {
      const startP = idx * poemBandSpan;
      const endP = (idx + 1) * poemBandSpan;
      chapterStops.push(idx === 0 ? 0 : clamp(startP + poemBandSpan * 0.08, 0, 0.87));

      // Chapter rail dot
      const railBtn = document.createElement('button');
      railBtn.className = `chapter-dot-btn hover-target${idx === 0 ? ' active' : ''}`;
      railBtn.dataset.stop = String(chapterStops[idx]);
      railBtn.innerHTML = `
        <span class="chapter-indicator"></span>
        <span class="chapter-label">${poem.watermark} ${poem.title}</span>
      `;
      railBtn.addEventListener('click', () => smoothScrollTo(parseFloat(railBtn.dataset.stop)));
      chapterRail.appendChild(railBtn);

      // Single-column chapbook scene
      const sceneEl = document.createElement('article');
      sceneEl.className = 'poem-scene';
      sceneEl.dataset.index = String(idx);

      const poemKey = `${collection.slug}:${poem.slug}`;
      const underlinedSet = new Set(marginMap[poemKey] || []);
      let lineCounter = 0;

      const stanzasHtml = poem.stanzas
        .map((stanza, sIdx) => {
          const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][sIdx] || String(sIdx + 1);
          const linesHtml = stanza
            .map((lineText) => {
              const lIdx = lineCounter++;
              const isMarked = underlinedSet.has(lIdx);
              return `<div class="verse-line${isMarked ? ' is-underlined' : ''}" data-line-idx="${lIdx}">${escapeHtml(lineText)}</div>`;
            })
            .join('');
          return `
            <div class="stanza-block${sIdx === 0 ? ' is-focused' : ''}" data-stanza-idx="${sIdx}">
              <span class="stanza-num-tag">STANZA ${roman}</span>
              ${linesHtml}
            </div>
          `;
        })
        .join('');

      sceneEl.innerHTML = `
        <header class="poem-scene-header">
          <div class="poem-scene-num">${poem.indexLabel} · ${collection.volume}</div>
          <h2 class="poem-scene-title">${escapeHtml(poem.title)}</h2>
        </header>
        <div class="stanza-viewport">
          <div class="stanza-track">${stanzasHtml}</div>
        </div>
      `;

      poemStage.appendChild(sceneEl);

      const viewportEl = sceneEl.querySelector('.stanza-viewport');
      const trackEl = sceneEl.querySelector('.stanza-track');
      const stanzaEls = Array.from(sceneEl.querySelectorAll('.stanza-block'));

      const sceneObj = {
        poem,
        poemKey,
        el: sceneEl,
        viewportEl,
        trackEl,
        stanzaEls,
        underlinedSet,
        focusedStanzaIdx: 0,
        startP,
        endP,
        idx
      };

      // Clicking a non-focused stanza scrolls smoothly to focus it
      stanzaEls.forEach((stanzaEl, sIdx) => {
        stanzaEl.addEventListener('click', (e) => {
          if (e.target.closest('.verse-line') && (stanzaEl.classList.contains('is-focused') || isFullPoemMode)) {
            return;
          }
          if (!isFullPoemMode) {
            const count = stanzaEls.length;
            const frac = count > 1 ? sIdx / (count - 1) : 0;
            const targetP = startP + poemBandSpan * (0.08 + frac * 0.78);
            smoothScrollTo(targetP);
          }
        });
      });

      // Clicking a line underlines & bookmarks it in the margin (up to 4 lines per poem)
      sceneEl.querySelectorAll('.verse-line').forEach((lineEl) => {
        lineEl.addEventListener('click', (e) => {
          const parentStanza = lineEl.closest('.stanza-block');
          if (!isFullPoemMode && parentStanza && !parentStanza.classList.contains('is-focused')) {
            return;
          }
          e.stopPropagation();
          const lIdx = parseInt(lineEl.dataset.lineIdx, 10);
          if (sceneObj.underlinedSet.has(lIdx)) {
            sceneObj.underlinedSet.delete(lIdx);
            lineEl.classList.remove('is-underlined');
          } else {
            if (sceneObj.underlinedSet.size >= MAX_UNDERLINES) {
              showToast('Up to 4 lines can be underlined per poem');
              return;
            }
            sceneObj.underlinedSet.add(lIdx);
            lineEl.classList.add('is-underlined');
            window.StanzaAudio?.playPaperRustle(0.032);
            showToast(`Underlined (${sceneObj.underlinedSet.size}/4) · Ready to Share`);
          }
          const m = loadMarginMap();
          m[poemKey] = Array.from(sceneObj.underlinedSet).sort((a, b) => a - b);
          saveMarginMap(m);
          updateShareButtonLink(sceneObj);
        });
      });

      readerScenes.push(sceneObj);
    });

    // Final Colophon rail stop
    chapterStops.push(1);
    const colophonRailBtn = document.createElement('button');
    colophonRailBtn.className = 'chapter-dot-btn hover-target';
    colophonRailBtn.dataset.stop = '1';
    colophonRailBtn.innerHTML = `
      <span class="chapter-indicator"></span>
      <span class="chapter-label">${String(totalPoems + 1).padStart(2, '0')} Colophon</span>
    `;
    colophonRailBtn.addEventListener('click', () => smoothScrollTo(1));
    chapterRail.appendChild(colophonRailBtn);

    if (cursorApi) cursorApi.bindHoverTargets(chapterRail);

    resizeReader();
    if (readerScenes[0]) {
      updatePlacard(0, true);
      centerFocusedStanza(readerScenes[0], 0);
    }

    if (!rafId) {
      rafId = requestAnimationFrame(animateReader);
    }
  }

  function updateShareButtonLink(sc) {
    if (!sc || !activeCollection) return;
    const count = sc.underlinedSet.size;
    btnSharePoem.textContent = count > 0 ? `Share Lines (${count}/4)` : 'Share Lines';
    const url = new URL('gallery.html', window.location.href);
    url.searchParams.set('collection', activeCollection.slug);
    url.searchParams.set('poem', sc.poem.slug);
    if (count > 0) {
      url.searchParams.set('pick', Array.from(sc.underlinedSet).sort((a, b) => a - b).join(','));
    }
    btnSharePoem.href = url.toString();
  }

  function centerFocusedStanza(sc, stanzaIdx) {
    if (!sc || isFullPoemMode) return;
    const clampedIdx = clamp(stanzaIdx, 0, sc.stanzaEls.length - 1);
    sc.focusedStanzaIdx = clampedIdx;
    sc.stanzaEls.forEach((el, i) => {
      el.classList.toggle('is-focused', i === clampedIdx);
    });

    const activeEl = sc.stanzaEls[clampedIdx];
    if (!activeEl) return;
    const viewportH = sc.viewportEl.clientHeight || viewH * 0.56;
    const targetOffset = activeEl.offsetTop - (viewportH / 2 - activeEl.offsetHeight / 2);
    sc.trackEl.style.transform = `translate3d(0, ${-Math.max(0, targetOffset)}px, 0)`;
  }

  function smoothScrollTo(fraction) {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: max * fraction, behavior: 'smooth' });
  }

  function resizeReader() {
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    maxScroll = Math.max(1, document.documentElement.scrollHeight - viewH);
    tickerHalfWidth = tickerWrap.scrollWidth / 2 || 1000;
    if (readerScenes[activeSceneIndex]) {
      centerFocusedStanza(readerScenes[activeSceneIndex], readerScenes[activeSceneIndex].focusedStanzaIdx);
    }
  }

  // Toggle Focus Stanza vs Full Poem chapbook view
  btnReadingMode.addEventListener('click', () => {
    isFullPoemMode = !isFullPoemMode;
    document.body.classList.toggle('reading-full', isFullPoemMode);
    btnReadingMode.textContent = isFullPoemMode ? 'Focus Stanza' : 'Full Poem';
    window.StanzaAudio?.playPaperRustle(0.045);
    if (!isFullPoemMode && readerScenes[activeSceneIndex]) {
      centerFocusedStanza(readerScenes[activeSceneIndex], readerScenes[activeSceneIndex].focusedStanzaIdx);
    }
  });

  btnPrevChapter.addEventListener('click', () => {
    const cur = inColophonMode ? readerScenes.length : activeSceneIndex;
    smoothScrollTo(chapterStops[Math.max(0, cur - 1)]);
  });

  btnNextChapter.addEventListener('click', () => {
    const cur = inColophonMode ? readerScenes.length : activeSceneIndex;
    smoothScrollTo(chapterStops[Math.min(chapterStops.length - 1, cur + 1)]);
  });

  backToTopBtn.addEventListener('click', () => smoothScrollTo(0));
  navBackShelf.addEventListener('click', exitToShelf);
  colophonShelfBtn.addEventListener('click', exitToShelf);
  brandLink.addEventListener('click', (e) => {
    if (isReaderMode) {
      e.preventDefault();
      exitToShelf();
    }
  });

  // ============================================
  // CHOREOGRAPHED SCROLL ANIMATION LOOP
  // ============================================
  function updatePlacard(sceneIdx, immediate = false) {
    const sc = readerScenes[sceneIdx];
    if (!sc) return;
    displayedPlacardIdx = sceneIdx;

    const apply = () => {
      placardIndex.textContent = sc.poem.indexLabel;
      placardTitle.textContent = sc.poem.title;
      placardSubtitle.textContent = sc.poem.subtitle || '';
      placardSubtitle.style.display = sc.poem.subtitle ? '' : 'none';
      updateShareButtonLink(sc);
      placardTitle.classList.remove('switching');
      placardSubtitle.classList.remove('switching');
    };

    if (immediate) {
      apply();
    } else {
      placardTitle.classList.add('switching');
      placardSubtitle.classList.add('switching');
      setTimeout(apply, 200);
    }
  }

  function updateReaderUI(p) {
    const total = readerScenes.length;
    if (total === 0) return;

    const poemBandSpan = 0.88 / total;
    const newIdx = Math.min(total - 1, Math.floor(p / poemBandSpan));
    const nowColophon = p > 0.90;

    if (newIdx !== activeSceneIndex) {
      activeSceneIndex = newIdx;
      window.StanzaAudio?.playPaperRustle(0.048);
    }

    if (displayedPlacardIdx !== activeSceneIndex) {
      updatePlacard(activeSceneIndex, false);
    }

    // Compute active stanza within current poem from local scroll progress
    const sc = readerScenes[activeSceneIndex];
    const localP = clamp((p - sc.startP) / poemBandSpan, 0, 0.999);
    const stanzaCount = sc.stanzaEls.length;
    const targetStanzaIdx = clamp(Math.floor(localP * stanzaCount), 0, stanzaCount - 1);

    if (targetStanzaIdx !== sc.focusedStanzaIdx) {
      centerFocusedStanza(sc, targetStanzaIdx);
    }

    const stanzaTag = `Stanza ${sc.focusedStanzaIdx + 1} / ${stanzaCount}`;
    if (stanzaTag !== lastStanzaTag) {
      lastStanzaTag = stanzaTag;
      revealPct.textContent = stanzaTag;
      const fillPct = Math.round(((sc.focusedStanzaIdx + 1) / stanzaCount) * 100);
      revealBarFill.style.width = `${fillPct}%`;
    }

    const activeRailIdx = nowColophon ? total : activeSceneIndex;
    if (activeRailIdx !== lastRailIdx) {
      lastRailIdx = activeRailIdx;
      chapterRail.querySelectorAll('.chapter-dot-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === activeRailIdx);
      });
    }

    if (nowColophon !== inColophonMode) {
      inColophonMode = nowColophon;
      placard.classList.toggle('placard-hidden', inColophonMode);
      canvasControls.classList.toggle('controls-hidden', inColophonMode);
      document.querySelectorAll('#colophon-section .contact-card').forEach((c) => c.classList.toggle('is-visible', inColophonMode));
      backToTopBtn.classList.toggle('is-visible', inColophonMode);
      colophonEyebrow.style.opacity = inColophonMode ? '1' : '0';
      colophonEyebrow.style.transform = inColophonMode ? 'translateX(0)' : 'translateX(48px)';
    }

    const nextHint = inColophonMode
      ? `${activeCollection.title} · Complete`
      : 'Scroll to Read Stanza by Stanza · Click Any Line to Underline';
    if (nextHint !== lastHintText) {
      lastHintText = nextHint;
      hintEl.textContent = nextHint;
    }
  }

  function animateReader() {
    if (!isReaderMode || document.hidden) {
      rafId = null;
      return;
    }

    const prevScroll = smoothScroll;
    smoothScroll = lerp(smoothScroll, targetScroll, 0.085);
    if (Math.abs(targetScroll - smoothScroll) < 0.00005) smoothScroll = targetScroll;
    scrollVelocity = (smoothScroll - prevScroll) * 180;

    pointer.smoothNormX = lerp(pointer.smoothNormX, pointer.normX, 0.07);
    pointer.smoothNormY = lerp(pointer.smoothNormY, pointer.normY, 0.07);

    const roundedScroll = Math.round(smoothScroll * 1000) / 1000;
    if (roundedScroll !== lastScrollScale) {
      lastScrollScale = roundedScroll;
      scrollProgressLine.style.transform = `scaleX(${roundedScroll})`;
    }

    tickerOffset -= 0.65 + scrollVelocity * 2.3;
    if (tickerOffset <= -tickerHalfWidth) tickerOffset += tickerHalfWidth;
    if (tickerOffset > 0) tickerOffset -= tickerHalfWidth;
    tickerWrap.style.transform = `translate3d(${tickerOffset}px, 0, 0)`;

    updateReaderUI(smoothScroll);

    const total = readerScenes.length;
    const band = 0.88 / Math.max(1, total);

    readerScenes.forEach((sc, i) => {
      let opacity = 0;
      let scale = 1;
      let tx = 0;
      let ty = 0;

      const sStart = i * band;
      const sEnd = (i + 1) * band;
      const fadeInSpan = band * 0.16;
      const fadeOutSpan = band * 0.16;

      if (i === 0) {
        const outT = clamp((smoothScroll - (sEnd - fadeOutSpan)) / fadeOutSpan, 0, 1);
        const eOut = easeInOutCubic(outT);
        opacity = 1 - eOut;
        scale = 1 - eOut * 0.06;
        ty = -eOut * 36;
      } else if (i === total - 1) {
        const inT = clamp((smoothScroll - (sStart - fadeInSpan * 0.4)) / fadeInSpan, 0, 1);
        const eIn = easeOutQuart(inT);
        opacity = easeOutCubic(inT);
        scale = lerp(1.05, 1.0, eIn);
        ty = (1 - eIn) * 28;

        if (smoothScroll > 0.88) {
          const slideT = easeInOutCubic(clamp((smoothScroll - 0.88) / 0.11, 0, 1));
          tx = viewW < 960 ? 0 : -slideT * viewW * 0.22;
          scale *= 1 - slideT * 0.14;
          opacity *= viewW < 960 ? 1 - slideT * 0.88 : 1 - slideT * 0.35;
        }
      } else {
        const inT = clamp((smoothScroll - (sStart - fadeInSpan * 0.4)) / fadeInSpan, 0, 1);
        const outT = clamp((smoothScroll - (sEnd - fadeOutSpan)) / fadeOutSpan, 0, 1);
        const eIn = easeOutQuart(inT);
        const eOut = easeInOutCubic(outT);
        opacity = easeOutCubic(inT) * (1 - eOut);
        scale = lerp(0.96, 1.0, eIn) * (1 - eOut * 0.05);
        ty = (1 - eIn) * 24 - eOut * 32;
      }

      const pStrength = 7 * opacity;
      tx += pointer.smoothNormX * pStrength;
      ty += pointer.smoothNormY * (pStrength * 0.5);

      if (opacity > 0.01) {
        sc.el.style.opacity = opacity.toFixed(3);
        sc.el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
        sc.el.classList.toggle('is-active', opacity > 0.55 && !inColophonMode);
      } else {
        sc.el.style.opacity = '0';
        sc.el.classList.remove('is-active');
      }
    });

    rafId = requestAnimationFrame(animateReader);
  }

  // ============================================
  // OWNER-ONLY ARCHIVE NEW VOLUME MODAL
  // ============================================
  function openArchiveModal() {
    if (!isOwner) return;
    document.body.classList.add('modal-open');
    archiveModalBackdrop.classList.add('is-open');
    window.StanzaAudio?.playPaperRustle(0.045);
  }

  function closeArchiveModal() {
    archiveModalBackdrop.classList.remove('is-open');
    document.body.classList.remove('modal-open');
  }

  navAddVolume.addEventListener('click', openArchiveModal);
  colophonAddBtn.addEventListener('click', openArchiveModal);
  archiveModalClose.addEventListener('click', closeArchiveModal);
  archiveModalBackdrop.addEventListener('click', (e) => {
    if (e.target === archiveModalBackdrop) closeArchiveModal();
  });

  archiveForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isOwner) return;
    const title = document.getElementById('col-title').value.trim();
    const subtitle = document.getElementById('col-subtitle').value.trim();
    const epigraph = document.getElementById('col-epigraph').value.trim();
    const poemTitle = document.getElementById('first-poem-title').value.trim();
    const poemBody = document.getElementById('first-poem-body').value.trim();

    if (!title || !poemTitle || !poemBody) return;

    try {
      await window.StanzaStore.createCollection({
        title,
        subtitle,
        epigraph,
        poems: [{ title: poemTitle, body: poemBody }]
      });
      archiveForm.reset();
      closeArchiveModal();
      await loadShelfCollections();
      showToast('Volume Pressed to Collection Shelf');
    } catch {
      showToast('Could not save volume');
    }
  });

  // ============================================
  // GLOBAL LISTENERS & BOOTSTRAP
  // ============================================
  window.addEventListener(
    'scroll',
    () => {
      if (!isReaderMode) return;
      targetScroll = clamp(window.scrollY / maxScroll, 0, 1);
    },
    { passive: true }
  );

  window.addEventListener(
    'mousemove',
    (e) => {
      pointer.normX = (e.clientX / viewW - 0.5) * 2;
      pointer.normY = (e.clientY / viewH - 0.5) * 2;
    },
    { passive: true }
  );

  window.addEventListener('keydown', (e) => {
    // Secret Owner Mode toggle: Shift + Alt + O
    if (e.shiftKey && e.altKey && (e.key === 'O' || e.key === 'o')) {
      isOwner = !isOwner;
      try {
        if (isOwner) localStorage.setItem(OWNER_KEY, '1');
        else localStorage.removeItem(OWNER_KEY);
      } catch {}
      document.body.classList.toggle('is-owner', isOwner);
      renderShelf();
      showToast(isOwner ? 'Owner Mode Enabled' : 'Owner Mode Disabled');
      return;
    }

    if (archiveModalBackdrop.classList.contains('is-open')) {
      if (e.key === 'Escape') closeArchiveModal();
      return;
    }
    if (!isReaderMode) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      const cur = inColophonMode ? readerScenes.length : activeSceneIndex;
      smoothScrollTo(chapterStops[Math.min(chapterStops.length - 1, cur + 1)]);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      const cur = inColophonMode ? readerScenes.length : activeSceneIndex;
      smoothScrollTo(chapterStops[Math.max(0, cur - 1)]);
    }
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (isReaderMode) resizeReader();
    }, 90);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!document.hidden && isReaderMode && !rafId) {
      rafId = requestAnimationFrame(animateReader);
    }
  });

  bindTransitionLinks();

  // Initialize app
  (async function init() {
    detectOwnerMode();
    setTimeout(() => {
      if (!curtainOpened) openCurtain();
    }, 600);

    await loadShelfCollections();

    const params = new URLSearchParams(window.location.search);
    const colParam = params.get('collection');
    const modeParam = params.get('mode');

    if (colParam && modeParam === 'read') {
      await enterCollectionExperience(colParam, true);
    }

    setTimeout(() => {
      if (!curtainOpened) openCurtain();
    }, 240);
  })();
})();
