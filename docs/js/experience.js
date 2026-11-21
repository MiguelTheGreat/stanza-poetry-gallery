/**
 * Stanza. — Experience Mode Engine
 * 1) Apple-Style 3D Isometric Collection Shelf (+ Resume Reading bookmark, Owner-gated archiving)
 * 2) Single-Column Focus-Stanza & Full-Poem Reader + Archival Pencil Underlining
 * 3) Locked Mobile Viewport (swipe stanza-by-stanza in Focus, isolated stanza scroll in Full Poem)
 * 4) Night Lamp theme, Ambient Room Soundscape, Table of Contents Index Drawer & Margin Notes
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
  const navBackShelf = document.getElementById('nav-back-shelf');
  const navToc = document.getElementById('nav-toc');
  const navAmbience = document.getElementById('nav-ambience');
  const navTheme = document.getElementById('nav-theme');
  const navGalleryLink = document.getElementById('nav-gallery-link');
  const navAddVolume = document.getElementById('nav-add-volume');
  const brandLink = document.getElementById('brand-link');

  const poemStage = document.getElementById('poem-stage');
  const chapterRail = document.getElementById('chapter-rail');
  const readerHud = document.getElementById('reader-hud');
  const placard = document.getElementById('artwork-placard');
  const placardIndex = document.getElementById('placard-index');
  const placardTitle = document.getElementById('placard-title');
  const placardSubtitle = document.getElementById('placard-subtitle');
  const revealBarFill = document.getElementById('reveal-bar-fill');
  const revealPct = document.getElementById('reveal-pct');
  const mobileStanzaPct = document.getElementById('mobile-stanza-pct');
  const canvasControls = document.getElementById('canvas-controls');
  const btnReadingMode = document.getElementById('btn-reading-mode');
  const btnPoemNote = document.getElementById('btn-poem-note');
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

  // TOC Drawer
  const tocBackdrop = document.getElementById('toc-backdrop');
  const tocClose = document.getElementById('toc-close');
  const tocList = document.getElementById('toc-list');
  const tocCollectionTitle = document.getElementById('toc-collection-title');

  // Margin Note Popover
  const notePopover = document.getElementById('margin-note-popover');
  const noteClose = document.getElementById('margin-note-close');
  const noteBody = document.getElementById('margin-note-body');
  const noteInput = document.getElementById('margin-note-input');
  const noteSave = document.getElementById('margin-note-save');

  // Owner Archive Modal
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
  let mobileLocked = false;
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

  function isMobileViewport() {
    return window.innerWidth <= 960;
  }

  // ============================================
  // THEME & AMBIENCE CONTROLS
  // ============================================
  function syncThemeButton() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    navTheme.textContent = isDark ? 'Paper' : 'Night';
  }

  navTheme.addEventListener('click', () => {
    const next = window.StanzaStore.toggleTheme();
    syncThemeButton();
    window.StanzaAudio?.playPaperRustle(0.032);
    showToast(next === 'dark' ? 'Night Lamp On' : 'Archival Paper');
  });

  navAmbience.addEventListener('click', () => {
    const mode = window.StanzaAudio ? window.StanzaAudio.cycleAmbience() : 'off';
    const labels = { off: 'Room: Off', rain: 'Room: Rain', subway: 'Room: Subway' };
    navAmbience.textContent = labels[mode] || 'Room: Off';
    showToast(mode === 'off' ? 'Ambient Sound Off' : `Ambient · ${mode === 'rain' ? 'Rain on Glass' : 'Late-Night Subway'}`);
  });

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
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2300);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadMarginMap() {
    try { return JSON.parse(localStorage.getItem(MARGIN_KEY) || '{}'); } catch { return {}; }
  }

  function saveMarginMap(map) {
    try { localStorage.setItem(MARGIN_KEY, JSON.stringify(map)); } catch {}
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
    void overlay.offsetWidth;
    overlay.classList.add('curtain-closing');
  }

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) openCurtain();
  });

  function transitionWithCurtain(title, subtitle, onMidpoint) {
    showCurtainForTransition(title, subtitle);
    setTimeout(async () => {
      await onMidpoint();
      setTimeout(() => openCurtain(), 180);
    }, 580);
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
        }, 520);
      });
    });
  }

  // ============================================
  // VIEW 1: APPLE-STYLE 3D ISOMETRIC DIAGONAL SHELF
  // ============================================
  const shelfPrevBtn = document.getElementById('shelf-prev');
  const shelfNextBtn = document.getElementById('shelf-next');
  let shelfIndex = 0;
  let shelfCards = [];

  function updateShelfCarousel(playSound = false) {
    if (collections.length === 0) return;
    shelfIndex = clamp(shelfIndex, 0, collections.length - 1);
    if (playSound) window.StanzaAudio?.playPaperRustle(0.04);

    shelfCards.forEach((card, idx) => {
      const diff = idx - shelfIndex;
      card.classList.remove('is-active', 'is-prev', 'is-next', 'is-far-prev', 'is-far-next');
      if (diff === 0) card.classList.add('is-active');
      else if (diff === -1) card.classList.add('is-prev');
      else if (diff === 1) card.classList.add('is-next');
      else if (diff < -1) card.classList.add('is-far-prev');
      else card.classList.add('is-far-next');
    });

    if (shelfPrevBtn) shelfPrevBtn.classList.toggle('is-hidden', shelfIndex <= 0);
    if (shelfNextBtn) shelfNextBtn.classList.toggle('is-hidden', shelfIndex >= collections.length - 1);
  }

  function stepShelf(delta) {
    if (collections.length <= 1) return;
    const next = clamp(shelfIndex + delta, 0, collections.length - 1);
    if (next !== shelfIndex) {
      shelfIndex = next;
      updateShelfCarousel(true);
    }
  }

  if (shelfPrevBtn) shelfPrevBtn.addEventListener('click', () => stepShelf(-1));
  if (shelfNextBtn) shelfNextBtn.addEventListener('click', () => stepShelf(1));

  // Horizontal touch swipe on the Welcome Shelf to glide between volumes
  let shelfTouchX = 0;
  let shelfTouchY = 0;
  shelfStage.addEventListener(
    'touchstart',
    (e) => {
      if (isReaderMode || e.touches.length !== 1) return;
      shelfTouchX = e.touches[0].clientX;
      shelfTouchY = e.touches[0].clientY;
    },
    { passive: true }
  );
  shelfStage.addEventListener(
    'touchend',
    (e) => {
      if (isReaderMode || !e.changedTouches || e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - shelfTouchX;
      const dy = e.changedTouches[0].clientY - shelfTouchY;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        stepShelf(dx < 0 ? 1 : -1);
      }
    },
    { passive: true }
  );

  async function loadShelfCollections() {
    collections = await window.StanzaStore.getCollections();
    renderShelf();
  }

  function renderShelf() {
    shelfStage.innerHTML = '';
    shelfCards = [];
    // On the main menu, top-nav Gallery welcomes the user with all volumes horizontally
    navGalleryLink.href = 'gallery.html';
    const lastRead = window.StanzaStore.getLastRead();

    collections.forEach((col, idx) => {
      const card = document.createElement('article');
      card.className = 'album-card';
      const volNum = String(idx + 1).padStart(2, '0');

      const hasResume = lastRead && lastRead.collectionSlug === col.slug && lastRead.poemIdx > 0;
      const resumeHtml = hasResume
        ? `<button type="button" class="resume-reading-btn hover-target" data-resume="${col.slug}" data-resume-idx="${lastRead.poemIdx}">Continue at ${String(lastRead.poemIdx + 1).padStart(2, '0')} · ${escapeHtml(lastRead.poemTitle)} →</button>`
        : '';

      card.innerHTML = `
        <div class="slab-number" aria-hidden="true">${volNum}</div>
        <div class="folio-stage" data-slug="${col.slug}" role="button" tabindex="0" aria-label="Enter ${escapeHtml(col.title)}">
          <div class="folio-shadow" aria-hidden="true"></div>
          <div class="folio-book">
            <div class="folio-back" aria-hidden="true"></div>
            <div class="folio-edge-top" aria-hidden="true"></div>
            <div class="folio-edge-right" aria-hidden="true"></div>
            <div class="folio-edge-left" aria-hidden="true"></div>
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
                <div class="folio-bottom-meta">${col.author ? `By ${escapeHtml(col.author)} · ` : ''}${col.poemCount} ${col.poemCount === 1 ? 'Poem' : 'Poems'}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="album-details">
          <h3 class="album-title">${escapeHtml(col.title)}</h3>
          <div class="album-meta-row">
            ${col.author ? `<span>By ${escapeHtml(col.author)}</span><span class="album-meta-dot"></span>` : ''}
            <span>${col.poemCount} ${col.poemCount === 1 ? 'Poem' : 'Poems'}</span>
            <span class="album-meta-dot"></span>
            <span>${escapeHtml(col.year)}</span>
          </div>
          <div class="album-actions">
            <button type="button" class="btn-enter-exp hover-target" data-enter="${col.slug}">Enter Experience →</button>
            <a href="gallery.html?collection=${encodeURIComponent(col.slug)}" class="btn-open-gallery transition-link hover-target">Gallery Mode</a>
            <button type="button" class="btn-open-gallery hover-target" data-share-fb="${col.slug}" title="Share etched card on Facebook">Share on FB ↗</button>
          </div>
          ${resumeHtml}
        </div>
      `;

      const folioStage = card.querySelector('.folio-stage');
      const folioBook = card.querySelector('.folio-book');
      let rect = null;

      folioStage.addEventListener('mouseenter', () => {
        rect = folioStage.getBoundingClientRect();
        if (cursorApi) cursorApi.setInspect(idx === shelfIndex ? 'OPEN' : 'VIEW');
      });

      folioStage.addEventListener('mousemove', (e) => {
        if (idx !== shelfIndex) return;
        if (!rect) rect = folioStage.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        const ry = 22 + nx * 12;
        const rx = 3 - ny * 7;
        folioBook.style.transform = `rotateY(${ry.toFixed(1)}deg) rotateX(${rx.toFixed(1)}deg) translateY(-6px) translateZ(14px)`;
      });

      folioStage.addEventListener('mouseleave', () => {
        rect = null;
        folioBook.style.transform = '';
        if (cursorApi) cursorApi.setInspect('');
      });

      const triggerEnter = () => enterCollectionExperience(col.slug, false, 0);
      folioStage.addEventListener('click', () => {
        if (idx !== shelfIndex) {
          shelfIndex = idx;
          updateShelfCarousel(true);
          return;
        }
        triggerEnter();
      });
      folioStage.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (idx !== shelfIndex) {
            shelfIndex = idx;
            updateShelfCarousel(true);
          } else {
            triggerEnter();
          }
        }
      });
      card.querySelector('[data-enter]').addEventListener('click', triggerEnter);

      const resumeBtn = card.querySelector('[data-resume]');
      if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
          const idxNum = parseInt(resumeBtn.dataset.resumeIdx, 10) || 0;
          enterCollectionExperience(col.slug, false, idxNum);
        });
      }

      card.querySelector('[data-share-fb]').addEventListener('click', () => {
        const shareUrl = window.location.origin + window.location.pathname;
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(fbUrl, '_blank', 'noopener,noreferrer,width=640,height=520');
      });

      shelfCards.push(card);
      shelfStage.appendChild(card);
    });

    updateShelfCarousel(false);

    if (cursorApi) cursorApi.bindHoverTargets(shelfStage);
    bindTransitionLinks(shelfStage);
  }

  // ============================================
  // VIEW 2: SINGLE-COLUMN FOCUS-STANZA EXPERIENCE
  // ============================================
  async function enterCollectionExperience(slug, skipCurtain = false, initialPoemIdx = 0) {
    if (cursorApi) cursorApi.setInspect('');
    window.StanzaAudio?.playPaperRustle(0.055);

    const loadAndMount = async () => {
      activeCollection = await window.StanzaStore.getCollection(slug);
      if (!activeCollection) {
        showToast('Could not load collection');
        return;
      }
      mountReaderMode(activeCollection, initialPoemIdx);

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

  function setColophonVisible(visible) {
    inColophonMode = visible;
    placard.classList.toggle('placard-hidden', visible);
    canvasControls.classList.toggle('controls-hidden', visible);
    readerHud.classList.toggle('hud-hidden', visible);
    document.querySelectorAll('#colophon-section .contact-card').forEach((c) => c.classList.toggle('is-visible', visible));
    backToTopBtn.classList.toggle('is-visible', visible);
    colophonEyebrow.style.opacity = visible ? '1' : '0';
    colophonEyebrow.style.transform = visible ? 'translateX(0)' : 'translateX(48px)';
    if (visible) closeNotePopover();
  }

  function exitToShelf() {
    window.StanzaAudio?.playPaperRustle(0.05);
    closeNotePopover();
    transitionWithCurtain('Stanza.', 'Collection Shelf', async () => {
      isReaderMode = false;
      isFullPoemMode = false;
      mobileLocked = false;
      setColophonVisible(false);
      document.body.classList.remove('mode-reader', 'reading-full', 'mobile-locked-reader');
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      window.scrollTo(0, 0);
      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      url.searchParams.delete('collection');
      history.replaceState(null, '', url.toString());
      renderShelf();
    });
  }

  function syncMobileLockClass() {
    mobileLocked = isReaderMode && isMobileViewport();
    document.body.classList.toggle('mobile-locked-reader', mobileLocked);
  }

  function mountReaderMode(collection, initialPoemIdx = 0) {
    isReaderMode = true;
    isFullPoemMode = false;
    document.body.classList.add('mode-reader');
    document.body.classList.remove('reading-full');
    syncMobileLockClass();

    btnReadingMode.textContent = 'Full Poem';
    window.scrollTo(0, 0);

    targetScroll = 0;
    smoothScroll = 0;
    activeSceneIndex = clamp(initialPoemIdx, 0, Math.max(0, collection.poems.length - 1));
    displayedPlacardIdx = -1;
    setColophonVisible(false);
    lastRailIdx = -1;
    lastStanzaTag = '';
    lastHintText = '';
    lastScrollScale = -1;

    const galleryHref = `gallery.html?collection=${encodeURIComponent(collection.slug)}`;
    navGalleryLink.href = galleryHref;
    colophonGalleryLink.href = galleryHref;

    const totalPoems = collection.poems.length;
    const scrollContainer = document.getElementById('scroll-container');
    scrollContainer.style.height = `${Math.max(1200, (totalPoems + 1.4) * 340)}vh`;

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
      chapterStops.push(idx === 0 ? 0 : clamp(startP + poemBandSpan * 0.06, 0, 0.87));

      const railBtn = document.createElement('button');
      railBtn.className = `chapter-dot-btn hover-target${idx === activeSceneIndex ? ' active' : ''}`;
      railBtn.dataset.stop = String(chapterStops[idx]);
      railBtn.innerHTML = `
        <span class="chapter-indicator"></span>
        <span class="chapter-label">${poem.watermark} ${poem.title}</span>
      `;
      railBtn.addEventListener('click', () => jumpToPoem(idx));
      chapterRail.appendChild(railBtn);

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

      // Prevent wheel scroll inside Full Poem viewport from bubbling to window when still scrollable
      viewportEl.addEventListener(
        'wheel',
        (e) => {
          if (!isFullPoemMode) return;
          const atTop = viewportEl.scrollTop <= 0;
          const atBottom = viewportEl.scrollTop + viewportEl.clientHeight >= viewportEl.scrollHeight - 2;
          if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
            e.stopPropagation();
          }
        },
        { passive: true }
      );

      // Clicking a non-focused stanza focuses it smoothly
      stanzaEls.forEach((stanzaEl, sIdx) => {
        stanzaEl.addEventListener('click', (e) => {
          if (e.target.closest('.verse-line') && (stanzaEl.classList.contains('is-focused') || isFullPoemMode)) {
            return;
          }
          if (!isFullPoemMode) {
            goToStanza(idx, sIdx);
          }
        });
      });

      // Clicking any line underlines & bookmarks it in the margin (up to 4 lines per poem)
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
    colophonRailBtn.addEventListener('click', () => jumpToColophon());
    chapterRail.appendChild(colophonRailBtn);

    if (cursorApi) cursorApi.bindHoverTargets(chapterRail);

    resizeReader();

    if (mobileLocked) {
      renderMobileLockedScene(activeSceneIndex, 0, false);
    } else {
      if (activeSceneIndex > 0) {
        const stop = chapterStops[activeSceneIndex] || 0;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        window.scrollTo(0, max * stop);
        targetScroll = stop;
        smoothScroll = stop;
      }
      if (readerScenes[activeSceneIndex]) {
        updatePlacard(activeSceneIndex, true);
        centerFocusedStanza(readerScenes[activeSceneIndex], 0);
      }
      if (!rafId) rafId = requestAnimationFrame(animateReader);
    }
  }

  // ============================================
  // DETERMINISTIC NAVIGATION (Mobile Locked + Desktop Unified)
  // ============================================
  function persistProgress(idx) {
    if (!activeCollection || !readerScenes[idx]) return;
    window.StanzaStore.saveLastRead({
      collectionSlug: activeCollection.slug,
      poemIdx: idx,
      poemTitle: readerScenes[idx].poem.title
    });
  }

  function renderMobileLockedScene(poemIdx, stanzaIdx = 0, playSound = true) {
    inColophonMode = poemIdx >= readerScenes.length;
    if (!inColophonMode) {
      activeSceneIndex = clamp(poemIdx, 0, readerScenes.length - 1);
      persistProgress(activeSceneIndex);
    }

    if (playSound) window.StanzaAudio?.playPaperRustle(0.045);

    readerScenes.forEach((sc, i) => {
      const isCurrent = !inColophonMode && i === activeSceneIndex;
      sc.el.style.transition = 'opacity 0.5s var(--ease-expo), transform 0.6s var(--ease-expo)';
      sc.el.style.opacity = isCurrent ? '1' : '0';
      sc.el.style.transform = isCurrent
        ? 'translate3d(0, 0, 0) scale(1)'
        : i < activeSceneIndex
          ? 'translate3d(0, -28px, 0) scale(0.97)'
          : 'translate3d(0, 28px, 0) scale(0.97)';
      sc.el.classList.toggle('is-active', isCurrent);
    });

    setColophonVisible(inColophonMode);

    if (!inColophonMode) {
      const sc = readerScenes[activeSceneIndex];
      sc.viewportEl.scrollTop = 0;
      updatePlacard(activeSceneIndex, false);
      centerFocusedStanza(sc, stanzaIdx);
      updateStanzaMeter(sc);
      const totalProgress = (activeSceneIndex + (sc.focusedStanzaIdx + 1) / sc.stanzaEls.length) / readerScenes.length;
      scrollProgressLine.style.transform = `scaleX(${clamp(totalProgress, 0, 1).toFixed(3)})`;
    } else {
      closeNotePopover();
      scrollProgressLine.style.transform = 'scaleX(1)';
    }
  }

  function jumpToPoem(idx) {
    closeNotePopover();
    if (mobileLocked) {
      renderMobileLockedScene(clamp(idx, 0, readerScenes.length - 1), 0, true);
    } else {
      smoothScrollTo(chapterStops[clamp(idx, 0, readerScenes.length - 1)] || 0);
    }
  }

  function jumpToColophon() {
    closeNotePopover();
    if (mobileLocked) {
      renderMobileLockedScene(readerScenes.length, 0, true);
    } else {
      smoothScrollTo(1);
    }
  }

  function goToStanza(poemIdx, stanzaIdx) {
    const sc = readerScenes[poemIdx];
    if (!sc) return;
    if (mobileLocked) {
      centerFocusedStanza(sc, stanzaIdx);
      updateStanzaMeter(sc);
      const totalProgress = (activeSceneIndex + (sc.focusedStanzaIdx + 1) / sc.stanzaEls.length) / readerScenes.length;
      scrollProgressLine.style.transform = `scaleX(${clamp(totalProgress, 0, 1).toFixed(3)})`;
      return;
    }
    const poemBandSpan = 0.88 / Math.max(1, readerScenes.length);
    const count = sc.stanzaEls.length;
    const frac = count > 1 ? (stanzaIdx + 0.35) / count : 0.1;
    const targetP = sc.startP + poemBandSpan * clamp(frac, 0.04, 0.92);
    smoothScrollTo(targetP);
  }

  function stepStanza(delta) {
    if (inColophonMode) {
      if (delta < 0) jumpToPoem(readerScenes.length - 1);
      return;
    }
    const sc = readerScenes[activeSceneIndex];
    if (!sc) return;
    const nextIdx = sc.focusedStanzaIdx + delta;
    if (nextIdx >= 0 && nextIdx < sc.stanzaEls.length) {
      goToStanza(activeSceneIndex, nextIdx);
    } else if (delta > 0) {
      if (activeSceneIndex + 1 < readerScenes.length) jumpToPoem(activeSceneIndex + 1);
      else jumpToColophon();
    } else if (delta < 0 && activeSceneIndex > 0) {
      const prevIdx = activeSceneIndex - 1;
      if (mobileLocked) {
        renderMobileLockedScene(prevIdx, readerScenes[prevIdx].stanzaEls.length - 1, true);
      } else {
        jumpToPoem(prevIdx);
      }
    }
  }

  // Mobile Touch Swipe Controller (locked viewport, zero whole-screen swipe!)
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  poemStage.addEventListener(
    'touchstart',
    (e) => {
      if (!mobileLocked || e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = performance.now();
    },
    { passive: true }
  );

  poemStage.addEventListener(
    'touchend',
    (e) => {
      if (!mobileLocked || e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const dt = performance.now() - touchStartTime;
      if (dt > 650) return;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Horizontal swipe flips poem-to-poem cleanly in BOTH Focus and Full Poem modes
      if (absX > 52 && absX > absY * 1.35) {
        if (dx < 0) {
          if (activeSceneIndex + 1 < readerScenes.length) jumpToPoem(activeSceneIndex + 1);
          else jumpToColophon();
        } else if (activeSceneIndex > 0) {
          jumpToPoem(activeSceneIndex - 1);
        }
        return;
      }

      // Vertical swipe in Focus Stanza mode steps stanza-by-stanza smoothly
      // (In Full Poem mode, native touch scrolling inside .stanza-viewport handles vertical swipes!)
      if (!isFullPoemMode && absY > 36 && absY > absX * 1.2) {
        stepStanza(dy < 0 ? 1 : -1);
      }
    },
    { passive: true }
  );

  // ============================================
  // PLACARD, STANZA METER & MARGIN NOTES
  // ============================================
  function updateShareButtonLink(sc) {
    if (!sc || !activeCollection) return;
    const count = sc.underlinedSet.size;
    btnSharePoem.textContent = count > 0 ? `Share (${count}/4)` : 'Share Lines';
    const url = new URL('gallery.html', window.location.href);
    url.searchParams.set('collection', activeCollection.slug);
    url.searchParams.set('poem', sc.poem.slug);
    if (count > 0) {
      url.searchParams.set('pick', Array.from(sc.underlinedSet).sort((a, b) => a - b).join(','));
    }
    btnSharePoem.href = url.toString();
  }

  function updateStanzaMeter(sc) {
    if (!sc) return;
    const stanzaCount = sc.stanzaEls.length;
    const stanzaTag = `Stanza ${sc.focusedStanzaIdx + 1} / ${stanzaCount}`;
    if (stanzaTag !== lastStanzaTag) {
      lastStanzaTag = stanzaTag;
      revealPct.textContent = stanzaTag;
      if (mobileStanzaPct) mobileStanzaPct.textContent = stanzaTag;
      const fillPct = Math.round(((sc.focusedStanzaIdx + 1) / stanzaCount) * 100);
      revealBarFill.style.width = `${fillPct}%`;
    }
  }

  function refreshNoteButtonForScene(sc) {
    if (!sc) return;
    const note = window.StanzaStore.getPoemNote(sc.poemKey);
    const shouldShow = Boolean(note) || isOwner;
    btnPoemNote.style.display = shouldShow ? '' : 'none';
    noteBody.textContent = note || (isOwner ? 'No margin note written for this poem yet.' : '');
    if (noteInput) noteInput.value = note || '';
  }

  function closeNotePopover() {
    notePopover.classList.remove('is-open');
  }

  btnPoemNote.addEventListener('click', () => {
    const sc = readerScenes[activeSceneIndex];
    if (!sc) return;
    refreshNoteButtonForScene(sc);
    notePopover.classList.toggle('is-open');
  });

  noteClose.addEventListener('click', closeNotePopover);

  noteSave.addEventListener('click', () => {
    const sc = readerScenes[activeSceneIndex];
    if (!sc || !isOwner) return;
    window.StanzaStore.savePoemNote(sc.poemKey, noteInput.value);
    refreshNoteButtonForScene(sc);
    showToast('Margin Note Saved');
  });

  function centerFocusedStanza(sc, stanzaIdx) {
    if (!sc || isFullPoemMode) return;
    const clampedIdx = clamp(stanzaIdx, 0, sc.stanzaEls.length - 1);
    sc.focusedStanzaIdx = clampedIdx;
    sc.stanzaEls.forEach((el, i) => {
      el.classList.toggle('is-focused', i === clampedIdx);
    });

    const activeEl = sc.stanzaEls[clampedIdx];
    if (!activeEl) return;
    const viewportH = sc.viewportEl.clientHeight || viewH * 0.52;
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
    const wasLocked = mobileLocked;
    syncMobileLockClass();

    maxScroll = Math.max(1, document.documentElement.scrollHeight - viewH);
    tickerHalfWidth = tickerWrap.scrollWidth / 2 || 1000;

    if (mobileLocked && !wasLocked) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      renderMobileLockedScene(activeSceneIndex, readerScenes[activeSceneIndex]?.focusedStanzaIdx || 0, false);
    } else if (!mobileLocked && wasLocked) {
      readerScenes.forEach((sc) => { sc.el.style.transition = ''; });
      if (!rafId) rafId = requestAnimationFrame(animateReader);
    }

    if (readerScenes[activeSceneIndex]) {
      centerFocusedStanza(readerScenes[activeSceneIndex], readerScenes[activeSceneIndex].focusedStanzaIdx);
    }
  }

  // Toggle Focus Stanza vs Full Poem chapbook view
  btnReadingMode.addEventListener('click', () => {
    isFullPoemMode = !isFullPoemMode;
    document.body.classList.toggle('reading-full', isFullPoemMode);
    btnReadingMode.textContent = isFullPoemMode ? 'Focus' : 'Full Poem';
    window.StanzaAudio?.playPaperRustle(0.045);
    const sc = readerScenes[activeSceneIndex];
    if (sc) {
      if (isFullPoemMode) {
        sc.viewportEl.scrollTop = 0;
      } else {
        centerFocusedStanza(sc, sc.focusedStanzaIdx);
      }
    }
  });

  btnPrevChapter.addEventListener('click', () => {
    const cur = inColophonMode ? readerScenes.length : activeSceneIndex;
    jumpToPoem(Math.max(0, cur - 1));
  });

  btnNextChapter.addEventListener('click', () => {
    if (inColophonMode) return;
    if (activeSceneIndex + 1 < readerScenes.length) jumpToPoem(activeSceneIndex + 1);
    else jumpToColophon();
  });

  backToTopBtn.addEventListener('click', () => jumpToPoem(0));
  navBackShelf.addEventListener('click', exitToShelf);
  colophonShelfBtn.addEventListener('click', exitToShelf);
  brandLink.addEventListener('click', (e) => {
    if (isReaderMode) {
      e.preventDefault();
      exitToShelf();
    }
  });

  // ============================================
  // TABLE OF CONTENTS DRAWER
  // ============================================
  function openToc() {
    if (!activeCollection) return;
    tocCollectionTitle.textContent = activeCollection.title;
    tocList.innerHTML = '';

    readerScenes.forEach((sc, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `toc-item${!inColophonMode && idx === activeSceneIndex ? ' is-current' : ''}`;
      const marks = sc.underlinedSet.size;
      btn.innerHTML = `
        <span class="toc-item-left">
          <span class="toc-num">${sc.poem.watermark}</span>
          <span class="toc-title">${escapeHtml(sc.poem.title)}</span>
        </span>
        <span class="toc-marks">${marks > 0 ? `✦ ${marks}` : `${sc.stanzaEls.length} stanzas`}</span>
      `;
      btn.addEventListener('click', () => {
        closeToc();
        jumpToPoem(idx);
      });
      tocList.appendChild(btn);
    });

    const colBtn = document.createElement('button');
    colBtn.type = 'button';
    colBtn.className = `toc-item${inColophonMode ? ' is-current' : ''}`;
    colBtn.innerHTML = `
      <span class="toc-item-left">
        <span class="toc-num">${String(readerScenes.length + 1).padStart(2, '0')}</span>
        <span class="toc-title">Colophon &amp; Exhibition</span>
      </span>
      <span class="toc-marks">End</span>
    `;
    colBtn.addEventListener('click', () => {
      closeToc();
      jumpToColophon();
    });
    tocList.appendChild(colBtn);

    document.body.classList.add('modal-open');
    tocBackdrop.classList.add('is-open');
    window.StanzaAudio?.playPaperRustle(0.04);
  }

  function closeToc() {
    tocBackdrop.classList.remove('is-open');
    document.body.classList.remove('modal-open');
  }

  navToc.addEventListener('click', openToc);
  tocClose.addEventListener('click', closeToc);
  tocBackdrop.addEventListener('click', (e) => {
    if (e.target === tocBackdrop) closeToc();
  });

  // ============================================
  // DESKTOP CHOREOGRAPHED SCROLL LOOP
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
      refreshNoteButtonForScene(sc);
      placardTitle.classList.remove('switching');
      placardSubtitle.classList.remove('switching');
    };

    if (immediate) {
      apply();
    } else {
      placardTitle.classList.add('switching');
      placardSubtitle.classList.add('switching');
      setTimeout(apply, 180);
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
      closeNotePopover();
      persistProgress(activeSceneIndex);
      window.StanzaAudio?.playPaperRustle(0.048);
    }

    if (displayedPlacardIdx !== activeSceneIndex) {
      updatePlacard(activeSceneIndex, false);
    }

    const sc = readerScenes[activeSceneIndex];
    const localP = clamp((p - sc.startP) / poemBandSpan, 0, 0.999);
    const stanzaCount = sc.stanzaEls.length;
    const targetStanzaIdx = clamp(Math.floor(localP * stanzaCount), 0, stanzaCount - 1);

    if (targetStanzaIdx !== sc.focusedStanzaIdx) {
      centerFocusedStanza(sc, targetStanzaIdx);
    }
    updateStanzaMeter(sc);

    const activeRailIdx = nowColophon ? total : activeSceneIndex;
    if (activeRailIdx !== lastRailIdx) {
      lastRailIdx = activeRailIdx;
      chapterRail.querySelectorAll('.chapter-dot-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === activeRailIdx);
      });
    }

    if (nowColophon !== inColophonMode) {
      setColophonVisible(nowColophon);
    }

    const nextHint = inColophonMode
      ? `${activeCollection.title} · Complete`
      : 'Scroll or Space to Read · Click Any Line to Underline';
    if (nextHint !== lastHintText) {
      lastHintText = nextHint;
      hintEl.textContent = nextHint;
    }
  }

  function animateReader() {
    if (!isReaderMode || mobileLocked || document.hidden) {
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
          tx = -slideT * viewW * 0.22;
          scale *= 1 - slideT * 0.14;
          opacity *= 1 - slideT * 0.35;
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
      if (!isReaderMode || mobileLocked) return;
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
    if (e.shiftKey && e.altKey && (e.key === 'O' || e.key === 'o')) {
      isOwner = !isOwner;
      try {
        if (isOwner) localStorage.setItem(OWNER_KEY, '1');
        else localStorage.removeItem(OWNER_KEY);
      } catch {}
      document.body.classList.toggle('is-owner', isOwner);
      renderShelf();
      if (isReaderMode && readerScenes[activeSceneIndex]) {
        refreshNoteButtonForScene(readerScenes[activeSceneIndex]);
      }
      showToast(isOwner ? 'Owner Mode Enabled' : 'Owner Mode Disabled');
      return;
    }

    if (tocBackdrop.classList.contains('is-open')) {
      if (e.key === 'Escape') closeToc();
      return;
    }
    if (archiveModalBackdrop.classList.contains('is-open')) {
      if (e.key === 'Escape') closeArchiveModal();
      return;
    }
    if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) return;
    if (!isReaderMode) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepShelf(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepShelf(-1);
      }
      return;
    }

    if (e.key === ' ' || e.key === 'ArrowRight') {
      e.preventDefault();
      stepStanza(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepStanza(-1);
    } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      if (inColophonMode) return;
      if (activeSceneIndex + 1 < readerScenes.length) jumpToPoem(activeSceneIndex + 1);
      else jumpToColophon();
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      const cur = inColophonMode ? readerScenes.length : activeSceneIndex;
      jumpToPoem(Math.max(0, cur - 1));
    } else if (e.key === 'Escape' && notePopover.classList.contains('is-open')) {
      closeNotePopover();
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
    } else if (!document.hidden && isReaderMode && !mobileLocked && !rafId) {
      rafId = requestAnimationFrame(animateReader);
    }
  });

  bindTransitionLinks();

  // Initialize app
  (async function init() {
    detectOwnerMode();
    syncThemeButton();
    setTimeout(() => {
      if (!curtainOpened) openCurtain();
    }, 600);

    await loadShelfCollections();

    const params = new URLSearchParams(window.location.search);
    const colParam = params.get('collection');
    const modeParam = params.get('mode');

    if (colParam && modeParam === 'read') {
      await enterCollectionExperience(colParam, true, 0);
    }

    setTimeout(() => {
      if (!curtainOpened) openCurtain();
    }, 220);
  })();
})();
