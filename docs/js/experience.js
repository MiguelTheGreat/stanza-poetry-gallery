/**
 * Stanza. — Experience Mode Engine
 * 1) Collection Shelf (Apple Top 100 Albums / Vinyl Folio Showcase)
 * 2) Scroll-Driven Interactive Ink-Reveal Poetry Reader (Lumina-inspired)
 */
(function () {
  const STORAGE_KEY = 'stanza_ink_state_v1';

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
  const ambientGlowA = document.getElementById('ambient-glow-a');
  const ambientGlowB = document.getElementById('ambient-glow-b');
  const scrollProgressLine = document.getElementById('scroll-progress-line');
  const shelfStage = document.getElementById('vinyl-shelf-stage');
  const shelfCountNote = document.getElementById('shelf-count-note');
  const navBackShelf = document.getElementById('nav-back-shelf');
  const navGalleryLink = document.getElementById('nav-gallery-link');
  const navAddVolume = document.getElementById('nav-add-volume');
  const brandLink = document.getElementById('brand-link');

  const inkCanvas = document.getElementById('inkCanvas');
  const inkCtx = inkCanvas.getContext('2d');
  const poemStage = document.getElementById('poem-stage');
  const chapterRail = document.getElementById('chapter-rail');
  const placard = document.getElementById('artwork-placard');
  const placardIndex = document.getElementById('placard-index');
  const placardTitle = document.getElementById('placard-title');
  const placardSubtitle = document.getElementById('placard-subtitle');
  const revealBarFill = document.getElementById('reveal-bar-fill');
  const revealPct = document.getElementById('reveal-pct');
  const canvasControls = document.getElementById('canvas-controls');
  const btnBloom = document.getElementById('btn-bloom');
  const btnReset = document.getElementById('btn-reset');
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
  let collections = [];
  let activeCollection = null;
  let readerScenes = [];
  let chapterStops = [];
  let isReaderMode = false;
  let rafId = null;

  let viewW = window.innerWidth;
  let viewH = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
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
  let lastRevealPct = -1;
  let lastHintText = '';
  let lastScrollScale = -1;

  const pointer = {
    x: viewW / 2,
    y: viewH / 2,
    normX: 0,
    normY: 0,
    smoothNormX: 0,
    smoothNormY: 0
  };

  const particles = [];

  // ============================================
  // UTILITIES & PERSISTENCE
  // ============================================
  let toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2400);
  }

  function loadInkStorage() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveInkStorage(map) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {}
  }

  // Ambient lighting cross-fade
  let activeGlowSlot = 0;
  let currentGlowStr = '';
  function setAmbientGlow(gradient) {
    if (!gradient || gradient === currentGlowStr) return;
    currentGlowStr = gradient;
    const nextEl = activeGlowSlot === 0 ? ambientGlowB : ambientGlowA;
    const prevEl = activeGlowSlot === 0 ? ambientGlowA : ambientGlowB;
    nextEl.style.background = gradient;
    nextEl.classList.add('is-active');
    prevEl.classList.remove('is-active');
    activeGlowSlot = 1 - activeGlowSlot;
  }

  // Split-curtain transitions
  let curtainOpened = false;
  function openCurtain() {
    curtainOpened = true;
    overlay.classList.remove('curtain-closing');
    overlay.classList.add('curtain-open');
    document.body.classList.add('app-ready');
  }

  function transitionWithCurtain(title, subtitle, onMidpoint) {
    if (title) introText.textContent = title;
    if (subtitle) introSubtext.textContent = subtitle;
    introContent.style.opacity = '1';
    overlay.classList.remove('curtain-open');
    overlay.classList.add('curtain-closing');
    setTimeout(async () => {
      await onMidpoint();
      setTimeout(() => {
        overlay.classList.remove('curtain-closing');
        overlay.classList.add('curtain-open');
      }, 220);
    }, 680);
  }

  function bindTransitionLinks(root = document) {
    root.querySelectorAll('.transition-link').forEach((link) => {
      if (link.dataset.transitionBound) return;
      link.dataset.transitionBound = '1';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.href;
        introContent.style.opacity = '0';
        overlay.classList.remove('curtain-open');
        overlay.classList.add('curtain-closing');
        setTimeout(() => {
          window.location.href = target;
        }, 720);
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
        ? '1 Collected Volume · Select a sleeve to enter its lived-in experience'
        : `${collections.length} Collected Volumes · Select a sleeve to enter its lived-in experience`;
    shelfCountNote.textContent = countText;

    if (collections[0]?.ambientGlow) {
      setAmbientGlow(collections[0].ambientGlow);
    }

    collections.forEach((col) => {
      const card = document.createElement('article');
      card.className = 'album-card';

      const coverHtml = col.coverImage
        ? `<img src="${col.coverImage}" alt="${col.title} cover art" decoding="async">`
        : `<div class="sleeve-typo-cover">
             <span class="sleeve-typo-vol">${col.volume}</span>
             <h3 class="sleeve-typo-title">${col.title}</h3>
             <span class="sleeve-typo-foot">${col.poemCount} Poems · ${col.year}</span>
           </div>`;

      card.innerHTML = `
        <div class="sleeve-wrapper" data-slug="${col.slug}" role="button" tabindex="0" aria-label="Enter ${col.title}">
          <div class="vinyl-disc" aria-hidden="true"></div>
          <div class="sleeve-cover">
            <span class="sleeve-badge">${col.volume}</span>
            ${coverHtml}
          </div>
        </div>
        <div class="album-details">
          <div class="album-meta-row">
            <span>${col.volume}</span>
            <span class="album-meta-dot"></span>
            <span>${col.poemCount} ${col.poemCount === 1 ? 'Poem' : 'Poems'}</span>
            <span class="album-meta-dot"></span>
            <span>${col.year}</span>
          </div>
          <h3 class="album-title">${col.title}</h3>
          <p class="album-subtitle">${col.subtitle}</p>
          ${col.epigraph ? `<blockquote class="album-epigraph">“${col.epigraph}”</blockquote>` : ''}
          <div class="album-actions">
            <button type="button" class="btn-enter-exp hover-target" data-enter="${col.slug}">Enter Experience →</button>
            <a href="gallery.html?collection=${encodeURIComponent(col.slug)}" class="btn-open-gallery transition-link hover-target">Gallery Mode</a>
          </div>
        </div>
      `;

      // 3D Tilt & ambient lighting shift on sleeve hover
      const sleeveWrapper = card.querySelector('.sleeve-wrapper');
      const sleeveCover = card.querySelector('.sleeve-cover');
      let rect = null;

      sleeveWrapper.addEventListener('mouseenter', () => {
        rect = sleeveWrapper.getBoundingClientRect();
        if (col.ambientGlow) setAmbientGlow(col.ambientGlow);
        if (cursorApi) cursorApi.setInspect('ENTER');
      });

      sleeveWrapper.addEventListener('mousemove', (e) => {
        if (!rect) rect = sleeveWrapper.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        sleeveCover.style.transform = `perspective(1000px) rotateY(${nx * 7}deg) rotateX(${-ny * 7}deg) translateZ(6px)`;
      });

      sleeveWrapper.addEventListener('mouseleave', () => {
        rect = null;
        sleeveCover.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0)';
        if (cursorApi) cursorApi.setInspect('');
      });

      const triggerEnter = () => enterCollectionExperience(col.slug);
      sleeveWrapper.addEventListener('click', triggerEnter);
      sleeveWrapper.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerEnter();
        }
      });
      card.querySelector('[data-enter]').addEventListener('click', triggerEnter);

      shelfStage.appendChild(card);
    });

    // Future / Archive New Volume ghost sleeve
    const addCard = document.createElement('div');
    addCard.className = 'add-volume-card';
    addCard.innerHTML = `
      <button type="button" class="add-sleeve-box hover-target" id="shelf-add-sleeve">
        <span class="add-plus">+</span>
        <span class="add-sleeve-label">Archive<br>Next Volume</span>
      </button>
      <p class="add-sleeve-note">Press a future poem collection onto the shelf</p>
    `;
    addCard.querySelector('#shelf-add-sleeve').addEventListener('click', openArchiveModal);
    shelfStage.appendChild(addCard);

    if (cursorApi) cursorApi.bindHoverTargets(shelfStage);
    bindTransitionLinks(shelfStage);
  }

  // ============================================
  // VIEW 2: IMMERSIVE EXPERIENCE MODE (SCROLL + INK REVEAL)
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
      document.body.classList.remove('mode-reader', 'cursor-painting');
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      window.scrollTo(0, 0);
      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      url.searchParams.delete('collection');
      history.replaceState(null, '', url.toString());
      if (collections[0]?.ambientGlow) setAmbientGlow(collections[0].ambientGlow);
    });
  }

  function mountReaderMode(collection) {
    isReaderMode = true;
    document.body.classList.add('mode-reader');
    window.scrollTo(0, 0);
    targetScroll = 0;
    smoothScroll = 0;
    activeSceneIndex = 0;
    displayedPlacardIdx = -1;
    inColophonMode = false;
    lastRailIdx = -1;
    lastRevealPct = -1;
    lastHintText = '';
    lastScrollScale = -1;

    const galleryHref = `gallery.html?collection=${encodeURIComponent(collection.slug)}`;
    navGalleryLink.href = galleryHref;
    colophonGalleryLink.href = galleryHref;

    // Build Scroll Height proportionally to number of poems + Colophon
    const totalPoems = collection.poems.length;
    const scrollContainer = document.getElementById('scroll-container');
    scrollContainer.style.height = `${Math.max(900, (totalPoems + 1.5) * 260)}vh`;

    // Build Marquee Ticker
    const tickerChunk = `${collection.title.toUpperCase()} • ${collection.poems.map((p) => p.title.toUpperCase()).join(' • ')} • `;
    tickerWrap.innerHTML = Array(4)
      .fill(`<span class="ticker-item">${tickerChunk}</span>`)
      .join('');

    // Build Chapter Rail & Poem Scenes
    poemStage.innerHTML = '';
    chapterRail.innerHTML = '';
    const savedMap = loadInkStorage();
    readerScenes = [];
    chapterStops = [];

    // Compute evenly spaced scroll windows for each poem + final colophon
    const poemBandSpan = 0.88 / Math.max(1, totalPoems);

    collection.poems.forEach((poem, idx) => {
      const startP = idx === 0 ? 0 : idx * poemBandSpan;
      const centerP = idx === 0 ? 0 : startP + poemBandSpan * 0.42;
      const endP = (idx + 1) * poemBandSpan;
      chapterStops.push(idx === 0 ? 0 : clamp(centerP, 0, 0.87));

      // Rail button
      const railBtn = document.createElement('button');
      railBtn.className = `chapter-dot-btn hover-target${idx === 0 ? ' active' : ''}`;
      railBtn.dataset.stop = String(chapterStops[idx]);
      railBtn.innerHTML = `
        <span class="chapter-indicator"></span>
        <span class="chapter-label">${poem.watermark} ${poem.title}</span>
      `;
      railBtn.addEventListener('click', () => smoothScrollTo(parseFloat(railBtn.dataset.stop)));
      chapterRail.appendChild(railBtn);

      // Build open-book two-column spread
      const sceneEl = document.createElement('article');
      sceneEl.className = 'poem-scene';
      sceneEl.dataset.index = String(idx);

      const splitIdx = Math.ceil(poem.stanzas.length / 2);
      const leftStanzas = poem.stanzas.slice(0, splitIdx);
      const rightStanzas = poem.stanzas.slice(splitIdx);

      const poemKey = `${collection.slug}:${poem.slug}`;
      const savedEntry = savedMap[poemKey] || { revealed: [], bloom: false };
      const revealedSet = new Set(savedEntry.revealed || []);

      let lineCounter = 0;
      const renderCol = (stanzas) =>
        stanzas
          .map((stanza) => {
            const linesHtml = stanza
              .map((lineText) => {
                const lIdx = lineCounter++;
                const isInked = savedEntry.bloom || revealedSet.has(lIdx);
                return `<div class="ink-line${isInked ? ' is-inked' : ''}" data-line-idx="${lIdx}">${escapeHtml(lineText)}</div>`;
              })
              .join('');
            return `<div class="stanza-block">${linesHtml}</div>`;
          })
          .join('');

      sceneEl.innerHTML = `
        <header class="poem-scene-header">
          <div class="poem-scene-num">${poem.indexLabel} · ${collection.volume}</div>
          <h2 class="poem-scene-title">${escapeHtml(poem.title)}</h2>
        </header>
        <div class="poem-spread">
          <div class="poem-col">${renderCol(leftStanzas)}</div>
          <div class="poem-col">${renderCol(rightStanzas)}</div>
        </div>
      `;

      poemStage.appendChild(sceneEl);

      // Offscreen watercolor canvas per scene
      const washCanvas = document.createElement('canvas');
      const washCtx = washCanvas.getContext('2d');
      const lineEls = Array.from(sceneEl.querySelectorAll('.ink-line'));

      readerScenes.push({
        poem,
        poemKey,
        el: sceneEl,
        lineEls,
        revealedSet,
        bloomDone: !!savedEntry.bloom,
        washCanvas,
        washCtx,
        startP,
        endP,
        idx
      });
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
      setAmbientGlow(readerScenes[0].poem.glow);
      updatePlacard(0, true);
    }

    if (!rafId) {
      rafId = requestAnimationFrame(animateReader);
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function smoothScrollTo(fraction) {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: max * fraction, behavior: 'smooth' });
  }

  function resizeReader() {
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    maxScroll = Math.max(1, document.documentElement.scrollHeight - viewH);
    tickerHalfWidth = tickerWrap.scrollWidth / 2 || 1000;

    inkCanvas.width = Math.round(viewW * dpr);
    inkCanvas.height = Math.round(viewH * dpr);
    inkCanvas.style.width = `${viewW}px`;
    inkCanvas.style.height = `${viewH}px`;
    inkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    readerScenes.forEach((sc) => {
      if (sc.washCanvas.width !== viewW || sc.washCanvas.height !== viewH) {
        sc.washCanvas.width = viewW;
        sc.washCanvas.height = viewH;
      }
    });
  }

  // ============================================
  // INK BRUSH REVEAL & WATERCOLOR BLOOM
  // ============================================
  function spawnParticle(x, y, warm = true) {
    if (particles.length > 52) return;
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 1.15,
      vy: -0.35 - Math.random() * 0.95,
      size: 1.2 + Math.random() * 2.3,
      alpha: 0.42 + Math.random() * 0.35,
      life: 0,
      maxLife: 34 + Math.random() * 28,
      warm
    });
  }

  function dabWatercolor(scene, x, y, radius = 84, alpha = 0.045) {
    const wCtx = scene.washCtx;
    const rgb = scene.poem.watercolorRgb || '166, 124, 82';
    const grad = wCtx.createRadialGradient(x, y, radius * 0.12, x, y, radius);
    grad.addColorStop(0, `rgba(${rgb}, ${alpha})`);
    grad.addColorStop(0.55, `rgba(${rgb}, ${alpha * 0.45})`);
    grad.addColorStop(1, `rgba(${rgb}, 0)`);
    wCtx.fillStyle = grad;
    wCtx.beginPath();
    wCtx.arc(x, y, radius, 0, Math.PI * 2);
    wCtx.fill();
  }

  let saveInkTimer = null;
  function scheduleSaveInk() {
    clearTimeout(saveInkTimer);
    saveInkTimer = setTimeout(() => {
      const map = loadInkStorage();
      readerScenes.forEach((sc) => {
        if (sc.bloomDone || sc.revealedSet.size > 0) {
          map[sc.poemKey] = {
            bloom: sc.bloomDone,
            revealed: Array.from(sc.revealedSet)
          };
        } else {
          delete map[sc.poemKey];
        }
      });
      saveInkStorage(map);
    }, 300);
  }

  function getRevealPercent(scene) {
    if (!scene || scene.lineEls.length === 0) return 0;
    if (scene.bloomDone) return 100;
    return Math.round((scene.revealedSet.size / scene.lineEls.length) * 100);
  }

  function handleBrushReveal(clientX, clientY) {
    pointer.x = clientX;
    pointer.y = clientY;
    pointer.normX = (clientX / viewW - 0.5) * 2;
    pointer.normY = (clientY / viewH - 0.5) * 2;

    if (!isReaderMode || inColophonMode || !readerScenes[activeSceneIndex]) return;

    const scene = readerScenes[activeSceneIndex];
    const brushRadius = 92;
    let newlyInked = false;

    for (let i = 0; i < scene.lineEls.length; i++) {
      const el = scene.lineEls[i];
      if (scene.revealedSet.has(i)) continue;
      const rect = el.getBoundingClientRect();
      const nearestX = clamp(clientX, rect.left, rect.right);
      const nearestY = clamp(clientY, rect.top, rect.bottom);
      const dist = Math.hypot(clientX - nearestX, clientY - nearestY);
      if (dist <= brushRadius) {
        scene.revealedSet.add(i);
        el.classList.add('is-inked');
        newlyInked = true;
      }
    }

    // Soft ambient watercolor dab near the poem area
    if (clientY > 80 && clientY < viewH - 100) {
      dabWatercolor(scene, clientX, clientY, 74, newlyInked ? 0.055 : 0.022);
      if (newlyInked || Math.random() < 0.22) {
        spawnParticle(clientX, clientY, Math.random() > 0.45);
      }
      document.body.classList.add('cursor-painting');
    } else {
      document.body.classList.remove('cursor-painting');
    }

    if (newlyInked) {
      if (scene.revealedSet.size >= scene.lineEls.length) {
        scene.bloomDone = true;
      }
      scheduleSaveInk();
    }
  }

  // Bloom Reveal & Reset Ink controls
  btnBloom.addEventListener('click', () => {
    const scene = readerScenes[activeSceneIndex];
    if (!scene) return;
    window.StanzaAudio?.playPaperRustle(0.05);
    scene.bloomDone = true;
    dabWatercolor(scene, viewW * 0.5, viewH * 0.48, Math.min(viewW, viewH) * 0.42, 0.09);

    scene.lineEls.forEach((el, i) => {
      scene.revealedSet.add(i);
      setTimeout(() => {
        el.classList.add('is-inked');
        if (i % 3 === 0) {
          const r = el.getBoundingClientRect();
          spawnParticle(r.left + r.width * Math.random(), r.top + r.height * 0.5, true);
        }
      }, i * 32);
    });
    scheduleSaveInk();
  });

  btnReset.addEventListener('click', () => {
    const scene = readerScenes[activeSceneIndex];
    if (!scene) return;
    window.StanzaAudio?.playPaperRustle(0.045);
    scene.bloomDone = false;
    scene.revealedSet.clear();
    scene.washCtx.clearRect(0, 0, scene.washCanvas.width, scene.washCanvas.height);
    scene.lineEls.forEach((el) => el.classList.remove('is-inked'));
    scheduleSaveInk();
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
      placardSubtitle.textContent = sc.poem.subtitle;
      btnSharePoem.href = `gallery.html?collection=${encodeURIComponent(activeCollection.slug)}&poem=${encodeURIComponent(sc.poem.slug)}`;
      placardTitle.classList.remove('switching');
      placardSubtitle.classList.remove('switching');
    };

    if (immediate) {
      apply();
    } else {
      placardTitle.classList.add('switching');
      placardSubtitle.classList.add('switching');
      setTimeout(apply, 220);
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
      setAmbientGlow(readerScenes[activeSceneIndex].poem.glow);
      window.StanzaAudio?.playPaperRustle(0.048);
    }

    if (displayedPlacardIdx !== activeSceneIndex) {
      updatePlacard(activeSceneIndex, false);
    }

    const activeRailIdx = nowColophon ? total : activeSceneIndex;
    if (activeRailIdx !== lastRailIdx) {
      lastRailIdx = activeRailIdx;
      chapterRail.querySelectorAll('.chapter-dot-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === activeRailIdx);
      });
    }

    const pct = getRevealPercent(readerScenes[activeSceneIndex]);
    if (pct !== lastRevealPct) {
      lastRevealPct = pct;
      revealBarFill.style.width = `${pct}%`;
      revealPct.textContent = `${pct}% Illuminated`;
    }

    if (nowColophon !== inColophonMode) {
      inColophonMode = nowColophon;
      placard.classList.toggle('placard-hidden', inColophonMode);
      canvasControls.classList.toggle('controls-hidden', inColophonMode);
      document.querySelectorAll('#colophon-section .contact-card').forEach((c) => c.classList.toggle('is-visible', inColophonMode));
      backToTopBtn.classList.toggle('is-visible', inColophonMode);
      colophonEyebrow.style.opacity = inColophonMode ? '1' : '0';
      colophonEyebrow.style.transform = inColophonMode ? 'translateX(0)' : 'translateX(48px)';
      if (inColophonMode) document.body.classList.remove('cursor-painting');
    }

    const nextHint = inColophonMode
      ? `${activeCollection.title} · Complete`
      : `Glide Brush to Illuminate · ${readerScenes[activeSceneIndex].poem.title}`;
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

    // Top scroll progress line
    const roundedScroll = Math.round(smoothScroll * 1000) / 1000;
    if (roundedScroll !== lastScrollScale) {
      lastScrollScale = roundedScroll;
      scrollProgressLine.style.transform = `scaleX(${roundedScroll})`;
    }

    // Velocity-reactive marquee ticker
    tickerOffset -= 0.65 + scrollVelocity * 2.3;
    if (tickerOffset <= -tickerHalfWidth) tickerOffset += tickerHalfWidth;
    if (tickerOffset > 0) tickerOffset -= tickerHalfWidth;
    tickerWrap.style.transform = `translate3d(${tickerOffset}px, 0, 0)`;

    updateReaderUI(smoothScroll);

    // Clear watercolor canvas & composite active scene washes + particles
    inkCtx.clearRect(0, 0, viewW, viewH);

    const total = readerScenes.length;
    const band = 0.88 / Math.max(1, total);

    readerScenes.forEach((sc, i) => {
      let opacity = 0;
      let scale = 1;
      let tx = 0;
      let ty = 0;
      let rot = 0;

      const sStart = i * band;
      const sEnd = (i + 1) * band;
      const fadeInSpan = band * 0.28;
      const fadeOutSpan = band * 0.28;

      if (i === 0) {
        const outT = clamp((smoothScroll - (sEnd - fadeOutSpan)) / fadeOutSpan, 0, 1);
        const eOut = easeInOutCubic(outT);
        opacity = 1 - eOut;
        scale = 1 - eOut * 0.09;
        ty = -eOut * 44;
        rot = -eOut * 0.8;
      } else if (i === total - 1) {
        const inT = clamp((smoothScroll - (sStart - fadeInSpan * 0.45)) / fadeInSpan, 0, 1);
        const eIn = easeOutQuart(inT);
        opacity = easeOutCubic(inT);
        scale = lerp(1.08, 1.0, eIn);
        ty = (1 - eIn) * 34;

        // Glide left for Colophon Finale
        if (smoothScroll > 0.88) {
          const slideT = easeInOutCubic(clamp((smoothScroll - 0.88) / 0.11, 0, 1));
          tx = viewW < 960 ? 0 : -slideT * viewW * 0.22;
          scale *= 1 - slideT * 0.18;
          opacity *= viewW < 960 ? 1 - slideT * 0.85 : 1 - slideT * 0.35;
        }
      } else {
        const inT = clamp((smoothScroll - (sStart - fadeInSpan * 0.45)) / fadeInSpan, 0, 1);
        const outT = clamp((smoothScroll - (sEnd - fadeOutSpan)) / fadeOutSpan, 0, 1);
        const eIn = easeOutQuart(inT);
        const eOut = easeInOutCubic(outT);
        opacity = easeOutCubic(inT) * (1 - eOut);
        scale = lerp(i % 2 === 1 ? 1.07 : 0.94, 1.0, eIn) * (1 - eOut * 0.08);
        tx = (1 - eIn) * (i % 2 === 1 ? 36 : -36) - eOut * (i % 2 === 1 ? 24 : -24);
        ty = (1 - eIn) * 28 - eOut * 38;
        rot = (1 - eIn) * (i % 2 === 1 ? 0.7 : -0.7);
      }

      // Gentle 3D mouse parallax
      const pStrength = 10 * opacity;
      tx += pointer.smoothNormX * pStrength;
      ty += pointer.smoothNormY * (pStrength * 0.6);

      if (opacity > 0.01) {
        sc.el.style.opacity = opacity.toFixed(3);
        sc.el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${scale.toFixed(4)}) rotate(${rot.toFixed(2)}deg)`;
        sc.el.classList.toggle('is-active', opacity > 0.55 && !inColophonMode);

        // Draw this scene's painted watercolor wash
        inkCtx.save();
        inkCtx.globalAlpha = opacity;
        inkCtx.drawImage(sc.washCanvas, 0, 0);
        inkCtx.restore();
      } else {
        sc.el.style.opacity = '0';
        sc.el.classList.remove('is-active');
      }
    });

    // Draw floating ink / bronze dust particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life++;
      const prog = pt.life / pt.maxLife;
      if (prog >= 1) {
        particles.splice(i, 1);
        continue;
      }
      inkCtx.globalAlpha = pt.alpha * (1 - prog);
      inkCtx.fillStyle = pt.warm ? '#a67c52' : '#2a2825';
      inkCtx.beginPath();
      inkCtx.arc(pt.x, pt.y, pt.size * (1 - prog * 0.4), 0, Math.PI * 2);
      inkCtx.fill();
    }
    inkCtx.globalAlpha = 1;

    rafId = requestAnimationFrame(animateReader);
  }

  // ============================================
  // ARCHIVE NEW VOLUME MODAL (POST /api/collections)
  // ============================================
  function openArchiveModal() {
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
    (e) => handleBrushReveal(e.clientX, e.clientY),
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length > 0 && !e.target.closest('button, a, nav')) {
        handleBrushReveal(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { passive: true }
  );

  window.addEventListener('keydown', (e) => {
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
    await loadShelfCollections();

    const params = new URLSearchParams(window.location.search);
    const colParam = params.get('collection');
    const modeParam = params.get('mode');

    if (colParam && modeParam === 'read') {
      await enterCollectionExperience(colParam, true);
    }

    setTimeout(() => {
      if (!curtainOpened) openCurtain();
    }, 950);
  })();
})();
