/**
 * Stanza. — Gallery Mode Controller
 * Accordion Exhibition Strips + Fullscreen Poem Reader + 4-Line Selector
 * + 5-Style Share Card Studio + Live Song Search + Line Highlight + Shared Showcase
 */
(function () {
  const MAX_SELECTED_LINES = 4;
  const DEFAULT_COLLECTION_SLUG = 'cut-on-the-life-of-a-weeping-man';

  const overlay = document.getElementById('intro-overlay');
  const introContent = document.getElementById('intro-content');
  const galleryVolumes = document.getElementById('gallery-volumes');
  const gridTransition = document.getElementById('gallery-grid-transition');
  const galleryWrapper = document.getElementById('gallery-wrapper');
  const navCollectionName = document.getElementById('nav-collection-name');
  const navHint = document.getElementById('nav-hint');
  const navVolumesBtn = document.getElementById('nav-volumes-btn');
  const navThemeBtn = document.getElementById('nav-theme');
  const backToExperience = document.getElementById('back-to-experience');
  const toastEl = document.getElementById('stanza-toast');

  // Lightbox elements
  const lightbox = document.getElementById('lightbox');
  const lbIndex = document.getElementById('lb-index');
  const lbTitle = document.getElementById('lb-title');
  const lbSubtitle = document.getElementById('lb-subtitle');
  const lbPoemStage = document.getElementById('lb-poem-stage');
  const lbStanzasGrid = document.getElementById('lb-stanzas-grid');
  const selectedCountEl = document.getElementById('selected-count');
  const btnClearLines = document.getElementById('btn-clear-lines');
  const lbShareBtn = document.getElementById('lb-share');

  // Share Studio elements
  const shareModal = document.getElementById('share-modal');
  const sharePreviewCanvas = document.getElementById('share-preview-canvas');
  const shareSelectedLinesEl = document.getElementById('share-selected-lines');
  const shareLinesCountEl = document.getElementById('share-lines-count');
  const shareTitleToggle = document.getElementById('share-title-toggle');
  const shareMusicInput = document.getElementById('share-music-input');
  const songResultsEl = document.getElementById('song-results');
  const attachedSongChip = document.getElementById('attached-song-chip');
  const attachedSongArt = document.getElementById('attached-song-art');
  const attachedSongTitle = document.getElementById('attached-song-title');
  const attachedSongArtist = document.getElementById('attached-song-artist');
  const attachedSongPlay = document.getElementById('attached-song-play');
  const attachedSongClear = document.getElementById('attached-song-clear');
  const shareMusicStatus = document.getElementById('share-music-status');
  const shareMusicPreview = document.getElementById('share-music-preview');
  const btnCopyLink = document.getElementById('btn-copy-link');
  const btnCopyQuote = document.getElementById('btn-copy-quote');
  const btnDownloadCard = document.getElementById('btn-download-card');

  const cursorApi = window.StanzaCursor ? window.StanzaCursor.initCursor() : null;

  // State
  let allCollections = [];
  let collection = null;
  let poems = [];
  let currentPoemIdx = 0;
  let selectedLines = []; // Array of { idx, text } in order of poem appearance
  let isTransitioningVolume = false;

  const shareState = {
    cardStyle: 'etched',
    format: 'story',
    showTitle: true,
    highlightIndex: -1,
    music: null
  };

  let toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2500);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getMusicCardLabel(music) {
    if (!music || music.invalid) return '';
    if (music.trackName) {
      return music.artistName ? `${music.trackName} — ${music.artistName}` : music.trackName;
    }
    return music.label || '';
  }

  // ============================================
  // NIGHT LAMP THEME TOGGLE
  // ============================================
  function syncThemeButton() {
    if (!navThemeBtn) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    navThemeBtn.textContent = isDark ? 'Paper' : 'Night';
    navThemeBtn.classList.toggle('is-active', isDark);
  }

  if (navThemeBtn) {
    syncThemeButton();
    navThemeBtn.addEventListener('click', () => {
      const next = window.StanzaStore?.toggleTheme?.() || 'light';
      syncThemeButton();
      showToast(next === 'dark' ? 'Night Lamp On' : 'Warm Paper Restored');
    });
  }

  // ============================================
  // SPLIT-CURTAIN TRANSITIONS
  // ============================================
  let hideCurtainTimer = null;
  function openCurtain() {
    clearTimeout(hideCurtainTimer);
    introContent.style.opacity = '';
    overlay.classList.remove('curtain-closing');
    overlay.classList.add('curtain-open');
    document.body.classList.add('gallery-ready');
    hideCurtainTimer = setTimeout(() => {
      if (overlay.classList.contains('curtain-open')) {
        overlay.classList.add('curtain-hidden');
      }
    }, 680);
  }

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      syncThemeButton();
      openCurtain();
    }
  });

  function bindTransitionLinks(root = document) {
    root.querySelectorAll('.transition-link').forEach((link) => {
      if (link.dataset.transitionBound) return;
      link.dataset.transitionBound = '1';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.href;
        clearTimeout(hideCurtainTimer);
        introContent.style.opacity = '0';
        overlay.classList.remove('curtain-hidden', 'curtain-open');
        void overlay.offsetWidth;
        overlay.classList.add('curtain-closing');
        setTimeout(() => {
          window.location.href = target;
        }, 560);
      });
    });
  }

  // ============================================
  // HORIZONTAL VOLUME CHOOSER & 90° DIVIDER UNFOLD
  // ============================================
  function showVolumeIndex(updateHistory = false) {
    if (isTransitioningVolume) return;
    if (cursorApi) cursorApi.setInspect('');
    document.body.classList.add('mode-volumes');
    galleryVolumes.classList.remove('is-leaving');
    galleryVolumes.innerHTML = '';

    navCollectionName.textContent = 'Anthology Volumes';
    if (navHint) navHint.textContent = 'Hover a volume · Click to unfold its poems';
    if (navVolumesBtn) navVolumesBtn.style.display = 'none';
    backToExperience.href = 'index.html';

    if (updateHistory) {
      const cleanUrl = new URL('gallery.html', window.location.href);
      history.replaceState(null, '', cleanUrl.toString());
    }

    const bandEls = [];
    allCollections.forEach((col, idx) => {
      const band = document.createElement('article');
      band.className = 'volume-band';
      band.innerHTML = `
        <div class="volume-band-aura"></div>
        <div class="volume-band-inner">
          <div class="volume-band-left">
            <span class="volume-band-kicker">${escapeHtml(col.volume)} · ${escapeHtml(col.year)}</span>
            <h2 class="volume-band-title">${escapeHtml(col.title)}</h2>
            ${col.epigraph ? `<p class="volume-band-epigraph">“${escapeHtml(col.epigraph)}”</p>` : ''}
          </div>
          <div class="volume-band-right">
            <span class="volume-band-meta">${col.author ? `By ${escapeHtml(col.author)} · ` : ''}${col.poemCount} ${col.poemCount === 1 ? 'Poem' : 'Poems'}</span>
            <span class="volume-band-cta">Unfold Poems →</span>
          </div>
        </div>
      `;

      const aura = band.querySelector('.volume-band-aura');
      band.addEventListener('mouseenter', (e) => {
        bandEls.forEach((el, i) => {
          el.style.setProperty('--band-flex', i === idx ? '1.75' : '0.76');
        });
        const r = band.getBoundingClientRect();
        aura.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
        aura.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
        if (cursorApi) cursorApi.setInspect('OPEN');
      });

      band.addEventListener(
        'mousemove',
        (e) => {
          const r = band.getBoundingClientRect();
          aura.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
          aura.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
        },
        { passive: true }
      );

      band.addEventListener('click', (e) => unfoldVolumeIntoPoems(col, e.clientX));
      bandEls.push(band);
      galleryVolumes.appendChild(band);
    });

    galleryVolumes.addEventListener('mouseleave', () => {
      bandEls.forEach((el) => el.style.setProperty('--band-flex', '1'));
      if (cursorApi) cursorApi.setInspect('');
    });
  }

  let lockedHoverIdx = -1;

  function isMobileGallery() {
    return window.matchMedia('(max-width: 820px), (orientation: portrait)').matches;
  }

  async function unfoldVolumeIntoPoems(selectedCol, clickClientX = -1) {
    if (isTransitioningVolume) return;
    isTransitioningVolume = true;
    if (cursorApi) cursorApi.setInspect('');
    window.StanzaAudio?.playPaperRustle(0.055);

    // Load full collection data
    collection = await window.StanzaStore.getCollection(selectedCol.slug);
    poems = collection.poems || [];
    const stripCount = Math.max(1, poems.length);

    const nextUrl = new URL('gallery.html', window.location.href);
    nextUrl.searchParams.set('collection', collection.slug);
    history.replaceState(null, '', nextUrl.toString());

    // Mobile: smooth editorial vertical glide + staggered card-rise (no desktop line-split)
    if (isMobileGallery()) {
      lockedHoverIdx = -1;
      galleryVolumes.classList.add('is-mobile-leaving');
      setTimeout(() => {
        renderGalleryStrips();
        galleryWrapper.classList.add('is-mobile-entering');
        document.body.classList.remove('mode-volumes');
        galleryVolumes.classList.remove('is-mobile-leaving');
        window.scrollTo(0, 0);
        void galleryWrapper.offsetWidth;
        requestAnimationFrame(() => {
          galleryWrapper.classList.remove('is-mobile-entering');
        });
        setTimeout(() => {
          isTransitioningVolume = false;
        }, 480);
      }, 310);
      return;
    }

    // Desktop: 90-degree rotating & spreading architectural divider lines
    const bands = Array.from(galleryVolumes.querySelectorAll('.volume-band'));
    const midY = window.innerHeight / 2;
    const dividerYs = [];
    for (let i = 0; i < bands.length - 1; i++) {
      dividerYs.push(bands[i].getBoundingClientRect().bottom - midY);
    }
    if (dividerYs.length === 0) dividerYs.push(0);

    const lineCount = Math.max(1, stripCount - 1);

    // Remember whichever strip lies directly under the user's click so it doesn't auto-open
    if (clickClientX >= 0 && window.innerWidth > 0) {
      lockedHoverIdx = Math.min(stripCount - 1, Math.max(0, Math.floor((clickClientX / window.innerWidth) * stripCount)));
    } else {
      lockedHoverIdx = -1;
    }

    gridTransition.innerHTML = '';
    const lineEls = [];
    for (let k = 0; k < lineCount; k++) {
      const startY = dividerYs[k % dividerYs.length];
      const line = document.createElement('div');
      line.className = 'grid-rot-line';
      line.style.transition = 'none';
      line.style.transform = `translate3d(0, ${startY.toFixed(1)}px, 0) rotate(0deg)`;
      gridTransition.appendChild(line);
      lineEls.push(line);
    }

    gridTransition.classList.add('is-active');
    galleryVolumes.classList.add('is-leaving');

    renderGalleryStrips();

    void gridTransition.offsetWidth;
    requestAnimationFrame(() => {
      lineEls.forEach((line) => {
        line.style.transition = 'transform 0.56s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.35s ease';
        line.style.transform = 'translate3d(0, 0, 0) rotate(90deg)';
      });
    });

    setTimeout(() => {
      const vw = window.innerWidth;
      lineEls.forEach((line, k) => {
        const targetX = ((k + 1) / stripCount - 0.5) * vw;
        line.style.transition = 'transform 0.62s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.4s ease';
        line.style.transform = `translate3d(${targetX.toFixed(1)}px, 0, 0) rotate(90deg)`;
      });
    }, 390);

    setTimeout(() => {
      document.body.classList.remove('mode-volumes');
      galleryVolumes.classList.remove('is-leaving');
    }, 560);

    setTimeout(() => {
      gridTransition.classList.remove('is-active');
      setTimeout(() => {
        gridTransition.innerHTML = '';
        isTransitioningVolume = false;
      }, 420);
    }, 960);
  }

  function foldPoemsBackToVolumes() {
    if (isTransitioningVolume) return;
    isTransitioningVolume = true;
    lockedHoverIdx = -1;
    if (cursorApi) cursorApi.setInspect('');
    window.StanzaAudio?.playPaperRustle(0.05);

    // Mobile: soft editorial fade & rise back to the Volume list
    if (isMobileGallery()) {
      galleryWrapper.classList.add('is-mobile-leaving');
      setTimeout(() => {
        galleryWrapper.classList.remove('is-mobile-leaving');
        isTransitioningVolume = false;
        showVolumeIndex(true);
        isTransitioningVolume = true;
        galleryVolumes.classList.add('is-mobile-entering');
        galleryVolumes.scrollTop = 0;
        void galleryVolumes.offsetWidth;
        requestAnimationFrame(() => {
          galleryVolumes.classList.remove('is-mobile-entering');
        });
        setTimeout(() => {
          isTransitioningVolume = false;
        }, 420);
      }, 280);
      return;
    }

    // Desktop: reverse 90-degree architectural divider fold
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const stripEls = Array.from(galleryWrapper.querySelectorAll('.gallery-strip'));
    const midX = vw / 2;
    const startXs = [];
    for (let i = 0; i < stripEls.length - 1; i++) {
      startXs.push(stripEls[i].getBoundingClientRect().right - midX);
    }
    if (startXs.length === 0) startXs.push(0);

    gridTransition.innerHTML = '';
    const lineEls = startXs.map((sx) => {
      const line = document.createElement('div');
      line.className = 'grid-rot-line';
      line.style.transition = 'none';
      line.style.transform = `translate3d(${sx.toFixed(1)}px, 0, 0) rotate(90deg)`;
      gridTransition.appendChild(line);
      return line;
    });

    gridTransition.classList.add('is-active');
    galleryWrapper.style.opacity = '0';

    void gridTransition.offsetWidth;
    requestAnimationFrame(() => {
      lineEls.forEach((line) => {
        line.style.transition = 'transform 0.46s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.35s ease';
        line.style.transform = 'translate3d(0, 0, 0) rotate(90deg)';
      });
    });

    setTimeout(() => {
      const volCount = Math.max(1, allCollections.length);
      const navOffset = 72;
      const availH = Math.max(200, vh - navOffset);
      const targetYs = [];
      for (let i = 0; i < volCount - 1; i++) {
        targetYs.push(navOffset + ((i + 1) / volCount) * availH - vh / 2);
      }
      if (targetYs.length === 0) targetYs.push(0);

      lineEls.forEach((line, k) => {
        const ty = targetYs[k % targetYs.length];
        line.style.transition = 'transform 0.56s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.35s ease';
        line.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0) rotate(0deg)`;
      });
    }, 340);

    setTimeout(() => {
      galleryWrapper.style.opacity = '';
      isTransitioningVolume = false;
      showVolumeIndex(true);
      isTransitioningVolume = true;
    }, 580);

    setTimeout(() => {
      gridTransition.classList.remove('is-active');
      setTimeout(() => {
        gridTransition.innerHTML = '';
        isTransitioningVolume = false;
      }, 420);
    }, 920);
  }

  if (navVolumesBtn) {
    navVolumesBtn.addEventListener('click', foldPoemsBackToVolumes);
  }

  // ============================================
  // RENDER ACCORDION EXHIBITION STRIPS
  // ============================================
  function renderGalleryStrips() {
    galleryWrapper.innerHTML = '';
    navCollectionName.textContent = collection.title;
    if (navHint) navHint.textContent = 'Hover to unveil · Click to read & share up to 4 lines';
    if (navVolumesBtn) navVolumesBtn.style.display = allCollections.length > 1 ? '' : 'none';
    backToExperience.href = `index.html?collection=${encodeURIComponent(collection.slug)}&mode=read`;

    const stripEls = [];

    function applyStripFocus(hoverIdx) {
      stripEls.forEach((el, i) => {
        const d = Math.abs(i - hoverIdx);
        let flexVal = 1;
        let opVal = 1;
        if (d === 0) {
          flexVal = 4.35;
          opVal = 1;
        } else if (d === 1) {
          flexVal = 0.96;
          opVal = 0.84;
        } else if (d === 2) {
          flexVal = 0.74;
          opVal = 0.68;
        } else if (d === 3) {
          flexVal = 0.56;
          opVal = 0.54;
        } else {
          flexVal = 0.42;
          opVal = 0.42;
        }
        el.style.setProperty('--strip-flex', String(flexVal));
        el.style.setProperty('--strip-opacity', String(opVal));
        el.classList.toggle('is-expanded', d === 0);
      });
    }

    function resetStripFocus() {
      stripEls.forEach((el) => {
        el.style.setProperty('--strip-flex', '1');
        el.style.setProperty('--strip-opacity', '1');
        el.classList.remove('is-expanded');
      });
    }

    galleryWrapper.addEventListener('mouseleave', () => {
      resetStripFocus();
      if (cursorApi) cursorApi.setInspect('');
    });

    poems.forEach((poem, idx) => {
      const strip = document.createElement('article');
      strip.className = 'gallery-strip';
      strip.dataset.index = String(idx);
      strip.style.setProperty('--strip-idx', String(idx));
      strip.style.transitionDelay = `0s, 0s, 0s, ${(0.04 + idx * 0.05).toFixed(2)}s`;

      const openingStanza = (poem.stanzas[0] || [])
        .map((l, lineIdx) => `<span class="preview-line" style="--li: ${lineIdx}">${escapeHtml(l)}</span>`)
        .join('');

      strip.innerHTML = `
        <div class="strip-aura"></div>
        <span class="strip-watermark">${poem.watermark}</span>
        <span class="strip-spine-title">${escapeHtml(poem.title)}</span>

        <div class="poem-preview-card">
          <div class="poem-preview-inner">
            <span class="preview-quote-mark" aria-hidden="true">“</span>
            <p class="preview-stanza">${openingStanza}</p>
          </div>
        </div>

        <div class="card-info">
          <span class="card-index">${poem.indexLabel}</span>
          <h2 class="card-title">${escapeHtml(poem.title)}</h2>
          <span class="card-cta">Click to Read &amp; Share Lines →</span>
        </div>
      `;

      const aura = strip.querySelector('.strip-aura');
      const previewInner = strip.querySelector('.poem-preview-inner');
      let cachedRect = null;
      let tiltRaf = null;
      let pendingX = 0;
      let pendingY = 0;

      strip.addEventListener('mouseenter', (e) => {
        if (isTransitioningVolume) return;
        if (lockedHoverIdx !== -1) {
          if (idx === lockedHoverIdx) return;
          lockedHoverIdx = -1;
        }
        applyStripFocus(idx);
        cachedRect = strip.getBoundingClientRect();
        const mx = ((e.clientX - cachedRect.left) / cachedRect.width) * 100;
        const my = ((e.clientY - cachedRect.top) / cachedRect.height) * 100;
        aura.style.setProperty('--mx', `${mx}%`);
        aura.style.setProperty('--my', `${my}%`);
        if (cursorApi) cursorApi.setInspect('READ');
      });

      strip.addEventListener(
        'mousemove',
        (e) => {
          if (!strip.classList.contains('is-expanded')) return;
          const rect = strip.getBoundingClientRect();
          pendingX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
          pendingY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
          if (!tiltRaf) {
            tiltRaf = requestAnimationFrame(() => {
              previewInner.style.transform = `perspective(900px) rotateY(${pendingX * 3.5}deg) rotateX(${-pendingY * 3.5}deg) translate3d(${pendingX * 6}px, ${pendingY * 4}px, 0)`;
              tiltRaf = null;
            });
          }
        },
        { passive: true }
      );

      strip.addEventListener('mouseleave', () => {
        cachedRect = null;
        if (tiltRaf) {
          cancelAnimationFrame(tiltRaf);
          tiltRaf = null;
        }
        previewInner.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) translate3d(0, 0, 0)';
      });

      strip.addEventListener('click', () => openLightbox(idx));
      stripEls.push(strip);
      galleryWrapper.appendChild(strip);
    });
  }

  // ============================================
  // LIGHTBOX POEM READER & 4-LINE SELECTION
  // ============================================
  function updateSelectionUI() {
    selectedCountEl.textContent = `${selectedLines.length} / ${MAX_SELECTED_LINES}`;
    lbShareBtn.textContent =
      selectedLines.length > 0 ? `Share Card (${selectedLines.length}/${MAX_SELECTED_LINES})` : 'Share Card';

    lbStanzasGrid.querySelectorAll('.selectable-line').forEach((row) => {
      const idx = parseInt(row.dataset.lineIdx, 10);
      const pos = selectedLines.findIndex((s) => s.idx === idx);
      row.classList.toggle('is-selected', pos !== -1);
      const badge = row.querySelector('.line-badge');
      badge.textContent = pos !== -1 ? `0${pos + 1}` : String(idx + 1).padStart(2, '0');
    });
  }

  function toggleLineSelection(idx, text) {
    const existingPos = selectedLines.findIndex((s) => s.idx === idx);
    if (existingPos !== -1) {
      selectedLines.splice(existingPos, 1);
      shareState.highlightIndex = -1;
    } else {
      if (selectedLines.length >= MAX_SELECTED_LINES) {
        showToast('Maximum 4 lines selected — deselect a line first');
        return;
      }
      selectedLines.push({ idx, text });
      selectedLines.sort((a, b) => a.idx - b.idx);
      shareState.highlightIndex = -1;
    }
    updateSelectionUI();
  }

  function loadLightboxPoem(idx, animateSwitch = false) {
    currentPoemIdx = (idx + poems.length) % poems.length;
    const poem = poems[currentPoemIdx];

    const apply = () => {
      selectedLines = [];
      shareState.highlightIndex = -1;
      lbIndex.textContent = poem.indexLabel;
      lbTitle.textContent = poem.title;
      lbSubtitle.textContent = collection.title;

      lbStanzasGrid.innerHTML = '';
      let globalLineIdx = 0;

      poem.stanzas.forEach((stanza) => {
        const stanzaEl = document.createElement('div');
        stanzaEl.className = 'lb-stanza';

        stanza.forEach((lineText) => {
          const lineIdx = globalLineIdx++;
          const row = document.createElement('div');
          row.className = 'selectable-line';
          row.dataset.lineIdx = String(lineIdx);
          row.innerHTML = `
            <span class="line-badge">${String(lineIdx + 1).padStart(2, '0')}</span>
            <span class="line-text">${escapeHtml(lineText)}</span>
          `;
          row.addEventListener('click', () => toggleLineSelection(lineIdx, lineText));
          stanzaEl.appendChild(row);
        });

        lbStanzasGrid.appendChild(stanzaEl);
      });

      lbPoemStage.scrollTop = 0;
      updateSelectionUI();
    };

    if (animateSwitch) {
      window.StanzaAudio?.playPaperRustle(0.05);
      lbPoemStage.classList.add('switching');
      setTimeout(() => {
        apply();
        lbPoemStage.classList.remove('switching');
      }, 220);
    } else {
      apply();
    }
  }

  function openLightbox(idx) {
    if (cursorApi) cursorApi.setInspect('');
    document.body.classList.add('modal-open');
    window.StanzaAudio?.playPaperRustle(0.05);
    loadLightboxPoem(idx, false);
    lightbox.classList.add('is-open');
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.classList.remove('modal-open');
  }

  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lb-prev').addEventListener('click', () => loadLightboxPoem(currentPoemIdx - 1, true));
  document.getElementById('lb-next').addEventListener('click', () => loadLightboxPoem(currentPoemIdx + 1, true));
  btnClearLines.addEventListener('click', () => {
    selectedLines = [];
    shareState.highlightIndex = -1;
    updateSelectionUI();
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Horizontal swipe inside Lightbox to flip poems on mobile
  let lbTouchStartX = 0;
  let lbTouchStartY = 0;
  lbPoemStage.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 1) return;
      lbTouchStartX = e.touches[0].clientX;
      lbTouchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );

  lbPoemStage.addEventListener(
    'touchend',
    (e) => {
      if (!lightbox.classList.contains('is-open') || shareModal.classList.contains('is-open')) return;
      if (!e.changedTouches || e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - lbTouchStartX;
      const dy = e.changedTouches[0].clientY - lbTouchStartY;
      if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) loadLightboxPoem(currentPoemIdx + 1, true);
        else loadLightboxPoem(currentPoemIdx - 1, true);
      }
    },
    { passive: true }
  );

  // ============================================
  // LIVE SONG SEARCH & AUDITION ENGINE
  // ============================================
  const auditionAudio = new Audio();
  auditionAudio.volume = 0.78;
  let auditionTrackId = null;
  let auditionBtnEl = null;
  let songSearchTimer = null;
  let songSearchSeq = 0;

  function stopAudition() {
    auditionAudio.pause();
    auditionAudio.removeAttribute('src');
    auditionTrackId = null;
    if (auditionBtnEl) {
      auditionBtnEl.textContent = '▶';
      auditionBtnEl.classList.remove('is-playing');
      auditionBtnEl = null;
    }
    if (attachedSongPlay) {
      attachedSongPlay.textContent = '▶';
      attachedSongPlay.classList.remove('is-playing');
    }
    songResultsEl?.querySelectorAll('.song-audition-btn.is-playing').forEach((b) => {
      b.textContent = '▶';
      b.classList.remove('is-playing');
    });
  }

  auditionAudio.addEventListener('ended', stopAudition);

  function toggleAudition(track, triggerBtn) {
    if (!track || !track.previewUrl) return;
    if (auditionTrackId === track.trackId && !auditionAudio.paused) {
      stopAudition();
      return;
    }
    stopAudition();
    auditionTrackId = track.trackId;
    auditionBtnEl = triggerBtn;
    auditionAudio.src = track.previewUrl;
    auditionAudio.play().then(
      () => {
        if (triggerBtn) {
          triggerBtn.textContent = '❚❚';
          triggerBtn.classList.add('is-playing');
        }
      },
      () => {
        stopAudition();
        showToast('Preview unavailable for this track');
      }
    );
  }

  function closeSongDropdown() {
    if (songResultsEl) songResultsEl.classList.remove('is-open');
  }

  function attachItunesTrack(track) {
    stopAudition();
    shareState.music = track;
    shareMusicInput.value = '';
    closeSongDropdown();
    window.StanzaShare.mountMusicEmbed(shareMusicPreview, null);

    if (attachedSongArt) {
      attachedSongArt.src = track.artwork || '';
      attachedSongArt.alt = track.trackName || '';
    }
    if (attachedSongTitle) attachedSongTitle.textContent = track.trackName || '';
    if (attachedSongArtist) attachedSongArtist.textContent = track.artistName || '';
    if (attachedSongChip) attachedSongChip.classList.add('is-visible');

    shareMusicStatus.classList.remove('invalid');
    shareMusicStatus.classList.add('valid');
    shareMusicStatus.textContent = `✓ Attached “${track.trackName}” — ${track.artistName}`;
    refreshSharePreview();
  }

  function clearAttachedSong() {
    stopAudition();
    shareState.music = null;
    if (attachedSongChip) attachedSongChip.classList.remove('is-visible');
    window.StanzaShare.mountMusicEmbed(shareMusicPreview, null);
    shareMusicStatus.classList.remove('valid', 'invalid');
    shareMusicStatus.textContent = 'Search by title/artist or paste a Spotify / YouTube Music link';
    refreshSharePreview();
  }

  function renderSongResults(tracks, queryText) {
    if (!songResultsEl) return;
    songResultsEl.innerHTML = '';
    if (!tracks || tracks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'song-result-row';
      empty.style.cursor = 'default';
      empty.innerHTML = `
        <div class="song-result-info">
          <strong>No matching songs for “${escapeHtml(queryText)}”</strong>
          <span>Try another title/artist or paste a Spotify / YouTube link</span>
        </div>
      `;
      songResultsEl.appendChild(empty);
      songResultsEl.classList.add('is-open');
      return;
    }

    tracks.forEach((track) => {
      const row = document.createElement('div');
      row.className = 'song-result-row';
      row.setAttribute('role', 'option');
      row.innerHTML = `
        <img src="${escapeHtml(track.artwork)}" alt="" width="36" height="36" loading="lazy">
        <div class="song-result-info">
          <strong>${escapeHtml(track.trackName)}</strong>
          <span>${escapeHtml(track.artistName)}</span>
        </div>
        <button type="button" class="song-audition-btn" title="Preview 30s clip" aria-label="Preview ${escapeHtml(track.trackName)}">▶</button>
      `;

      const auditionBtn = row.querySelector('.song-audition-btn');
      auditionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAudition(track, auditionBtn);
      });

      row.addEventListener('click', () => attachItunesTrack(track));
      songResultsEl.appendChild(row);
    });

    songResultsEl.classList.add('is-open');
  }

  if (attachedSongPlay) {
    attachedSongPlay.addEventListener('click', () => {
      if (shareState.music && shareState.music.provider === 'itunes') {
        toggleAudition(shareState.music, attachedSongPlay);
      }
    });
  }

  if (attachedSongClear) {
    attachedSongClear.addEventListener('click', () => {
      shareMusicInput.value = '';
      clearAttachedSong();
    });
  }

  document.addEventListener('click', (e) => {
    if (songResultsEl && songResultsEl.classList.contains('is-open')) {
      if (!e.target.closest('.song-search-wrap')) {
        closeSongDropdown();
      }
    }
  });

  // ============================================
  // SHARE CARD STUDIO MODAL
  // ============================================
  function renderSelectedLineChips() {
    shareLinesCountEl.textContent = `${selectedLines.length} / ${MAX_SELECTED_LINES} lines`;
    shareSelectedLinesEl.innerHTML = '';

    if (shareState.highlightIndex >= selectedLines.length) {
      shareState.highlightIndex = -1;
    }

    selectedLines.forEach((item, chipIdx) => {
      const isHighlighted = chipIdx === shareState.highlightIndex;
      const chip = document.createElement('div');
      chip.className = `selected-line-chip${isHighlighted ? ' is-highlighted' : ''}`;
      chip.title = isHighlighted ? 'Tap to remove bronze emphasis' : 'Tap to emphasize this line in bronze';
      chip.innerHTML = `
        <span>${isHighlighted ? '<span class="chip-star">✦</span>' : ''}“${escapeHtml(item.text)}”</span>
        <button type="button" class="chip-remove" title="Remove line" aria-label="Remove line">✕</button>
      `;

      chip.addEventListener('click', () => {
        shareState.highlightIndex = shareState.highlightIndex === chipIdx ? -1 : chipIdx;
        renderSelectedLineChips();
        refreshSharePreview();
      });

      chip.querySelector('.chip-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        if (selectedLines.length <= 1) {
          showToast('At least 1 line is needed for a share card');
          return;
        }
        if (shareState.highlightIndex === chipIdx) {
          shareState.highlightIndex = -1;
        } else if (shareState.highlightIndex > chipIdx) {
          shareState.highlightIndex -= 1;
        }
        selectedLines = selectedLines.filter((s) => s.idx !== item.idx);
        updateSelectionUI();
        renderSelectedLineChips();
        refreshSharePreview();
      });
      shareSelectedLinesEl.appendChild(chip);
    });
  }

  function refreshSharePreview() {
    const poem = poems[currentPoemIdx];
    if (!poem) return;
    window.StanzaShare.renderPoetryCard(sharePreviewCanvas, {
      collection,
      poem,
      lines: selectedLines.map((s) => s.text),
      cardStyle: shareState.cardStyle,
      format: shareState.format,
      showTitle: shareState.showTitle,
      hasMusic: !!(shareState.music && !shareState.music.invalid),
      musicLabel: getMusicCardLabel(shareState.music),
      highlightIndex: shareState.highlightIndex
    });
  }

  function openShareModal() {
    const poem = poems[currentPoemIdx];
    if (!poem) return;

    // If user hasn't clicked any lines yet, gracefully pre-select the first stanza (up to 4 lines)
    if (selectedLines.length === 0) {
      const firstStanza = (poem.stanzas[0] || []).slice(0, MAX_SELECTED_LINES);
      selectedLines = firstStanza.map((text, idx) => ({ idx, text }));
      shareState.highlightIndex = -1;
      updateSelectionUI();
    }

    renderSelectedLineChips();
    shareModal.classList.add('is-open');
    document.fonts.ready.then(refreshSharePreview);
    refreshSharePreview();
  }

  function closeShareModal() {
    stopAudition();
    closeSongDropdown();
    shareModal.classList.remove('is-open');
  }

  lbShareBtn.addEventListener('click', openShareModal);
  document.getElementById('share-close').addEventListener('click', closeShareModal);
  shareModal.addEventListener('click', (e) => {
    if (e.target === shareModal) closeShareModal();
  });

  document.querySelectorAll('#card-pills .opt-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      shareState.cardStyle = btn.dataset.card;
      document.querySelectorAll('#card-pills .opt-pill').forEach((b) => b.classList.toggle('active', b === btn));
      refreshSharePreview();
    });
  });

  document.querySelectorAll('#format-pills .opt-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      shareState.format = btn.dataset.format;
      document.querySelectorAll('#format-pills .opt-pill').forEach((b) => b.classList.toggle('active', b === btn));
      refreshSharePreview();
    });
  });

  shareTitleToggle.addEventListener('change', () => {
    shareState.showTitle = shareTitleToggle.checked;
    refreshSharePreview();
  });

  shareMusicInput.addEventListener('input', () => {
    clearTimeout(songSearchTimer);
    const val = shareMusicInput.value.trim();

    if (!val) {
      closeSongDropdown();
      if (!shareState.music || shareState.music.provider !== 'itunes') {
        clearAttachedSong();
      }
      return;
    }

    // Check if user pasted a direct Spotify or YouTube Music URL
    const parsedUrl = window.StanzaShare.parseMusicUrl(val);
    if (parsedUrl && parsedUrl.provider !== 'itunes') {
      stopAudition();
      closeSongDropdown();
      if (attachedSongChip) attachedSongChip.classList.remove('is-visible');
      shareState.music = parsedUrl;
      shareMusicStatus.classList.remove('invalid');
      shareMusicStatus.classList.add('valid');
      shareMusicStatus.textContent = `✓ Attached ${parsedUrl.label} soundtrack`;
      window.StanzaShare.mountMusicEmbed(shareMusicPreview, parsedUrl);
      refreshSharePreview();
      return;
    }

    // If it looks like an unsupported URL, warn cleanly instead of searching
    if (/^https?:\/\//i.test(val)) {
      closeSongDropdown();
      shareMusicStatus.classList.remove('valid');
      shareMusicStatus.classList.add('invalid');
      shareMusicStatus.textContent = 'Paste a Spotify or YouTube Music URL, or type a song title to search';
      return;
    }

    if (val.length < 2) {
      closeSongDropdown();
      return;
    }

    const seq = ++songSearchSeq;
    shareMusicStatus.classList.remove('valid', 'invalid');
    shareMusicStatus.textContent = 'Searching songs…';

    songSearchTimer = setTimeout(async () => {
      try {
        const tracks = await window.StanzaShare.searchSongs(val);
        if (seq !== songSearchSeq) return;
        renderSongResults(tracks, val);
        if (shareState.music && shareState.music.provider === 'itunes') {
          shareMusicStatus.classList.add('valid');
          shareMusicStatus.textContent = `✓ Attached “${shareState.music.trackName}” — ${shareState.music.artistName}`;
        } else {
          shareMusicStatus.textContent =
            tracks.length > 0
              ? 'Tap ▶ to preview, or click a song to attach it to your card'
              : 'No matches found — try another song or paste a Spotify/YouTube link';
        }
      } catch {
        if (seq !== songSearchSeq) return;
        closeSongDropdown();
        shareMusicStatus.classList.add('invalid');
        shareMusicStatus.textContent = 'Could not reach song search — you can still paste a Spotify or YouTube link';
      }
    }, 280);
  });

  async function buildCurrentShareLink() {
    const poem = poems[currentPoemIdx];
    return window.StanzaStore.createShareUrl({
      collectionSlug: collection.slug,
      poemSlug: poem.slug,
      lines: selectedLines.map((s) => s.text),
      cardStyle: shareState.cardStyle,
      showTitle: shareState.showTitle,
      musicCode: shareState.music && !shareState.music.invalid ? shareState.music.code : '',
      highlightIndex: shareState.highlightIndex
    });
  }

  // Share to Instagram / Facebook Story (Native File Share on mobile, 9:16 PNG + link on desktop)
  document.getElementById('btn-share-story').addEventListener('click', async () => {
    const poem = poems[currentPoemIdx];
    if (!poem || selectedLines.length === 0) return;

    const storyCanvas = document.createElement('canvas');
    window.StanzaShare.renderPoetryCard(storyCanvas, {
      collection,
      poem,
      lines: selectedLines.map((s) => s.text),
      cardStyle: shareState.cardStyle,
      format: 'story',
      showTitle: shareState.showTitle,
      hasMusic: !!(shareState.music && !shareState.music.invalid),
      musicLabel: getMusicCardLabel(shareState.music),
      highlightIndex: shareState.highlightIndex
    });

    const shareUrl = await buildCurrentShareLink();
    const filename = `stanza-${poem.slug}-${shareState.cardStyle}-story.png`;

    try {
      const blob = await new Promise((resolve) => storyCanvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${poem.title} — ${collection.title}`,
          text: `“${selectedLines.map((s) => s.text).join(' / ')}”`,
          url: shareUrl
        });
        showToast('Opened Story Share Sheet');
        return;
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }

    downloadCanvasPng(storyCanvas, filename);
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('9:16 Story Card Saved & Link Copied — Ready for IG / FB Story');
    } catch {
      showToast('9:16 Story Card Saved — Upload to IG / FB Story');
    }
  });

  // Share directly on Facebook with Poem-Specific Etched Card OG preview + quote
  document.getElementById('btn-share-fb').addEventListener('click', async () => {
    const poem = poems[currentPoemIdx];
    if (!poem || selectedLines.length === 0) return;
    const shareUrl = await buildCurrentShareLink();
    const byline = collection.author ? `, by ${collection.author}` : '';
    const quote = `“${selectedLines.map((s) => s.text).join(' / ')}” — ${poem.title} (${collection.title}${byline})`;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(quote)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer,width=640,height=540');
  });

  // Copy Share Link
  btnCopyLink.addEventListener('click', async () => {
    const poem = poems[currentPoemIdx];
    if (!poem || selectedLines.length === 0) return;

    btnCopyLink.textContent = 'Creating…';
    try {
      const fullUrl = await buildCurrentShareLink();
      try {
        await navigator.clipboard.writeText(fullUrl);
        btnCopyLink.textContent = 'Copied ✓';
        showToast('Share Link Copied to Clipboard');
      } catch {
        window.prompt('Copy your Stanza share link:', fullUrl);
        btnCopyLink.textContent = 'Ready ✓';
      }
    } catch {
      btnCopyLink.textContent = 'Copy Link';
      showToast('Could not create share link');
      return;
    }

    setTimeout(() => {
      btnCopyLink.textContent = 'Copy Link';
    }, 2200);
  });

  // 1-Tap Copy Formatted Quote + Share Link
  if (btnCopyQuote) {
    btnCopyQuote.addEventListener('click', async () => {
      const poem = poems[currentPoemIdx];
      if (!poem || selectedLines.length === 0) return;

      try {
        const shareUrl = await buildCurrentShareLink();
        const quotedLines = selectedLines.map((s) => s.text).join('\n');
        const byline = collection.author ? `, by ${collection.author}` : '';
        const formatted = `“${quotedLines}”\n— ${poem.title} (${collection.title}${byline})\n${shareUrl}`;
        try {
          await navigator.clipboard.writeText(formatted);
          btnCopyQuote.textContent = 'Copied ✓';
          showToast('Quote & Link Copied');
        } catch {
          window.prompt('Copy this formatted verse:', formatted);
          btnCopyQuote.textContent = 'Ready ✓';
        }
      } catch {
        showToast('Could not copy quote');
        return;
      }

      setTimeout(() => {
        btnCopyQuote.textContent = 'Copy Quote';
      }, 2200);
    });
  }

  function downloadCanvasPng(canvasEl, filename) {
    const a = document.createElement('a');
    a.download = filename;
    a.href = canvasEl.toDataURL('image/png');
    a.click();
  }

  btnDownloadCard.addEventListener('click', () => {
    const poem = poems[currentPoemIdx];
    downloadCanvasPng(sharePreviewCanvas, `stanza-${poem.slug}-${shareState.cardStyle}.png`);
    showToast('Poetry Card PNG Downloaded');
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (shareModal.classList.contains('is-open')) {
      if (e.key === 'Escape') {
        if (songResultsEl && songResultsEl.classList.contains('is-open')) {
          closeSongDropdown();
        } else {
          closeShareModal();
        }
      }
      return;
    }
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') loadLightboxPoem(currentPoemIdx - 1, true);
    if (e.key === 'ArrowRight') loadLightboxPoem(currentPoemIdx + 1, true);
  });

  // ============================================
  // SHARED LINK SHOWCASE VIEW (/share/:id or ?share=1)
  // ============================================
  async function initSharedShowcaseIfPresent() {
    const data = await window.StanzaStore.resolveShareFromLocation();
    if (!data) return false;

    const showcase = document.getElementById('shared-showcase');
    const showcaseCanvas = document.getElementById('showcase-canvas');
    const showcaseExpLink = document.getElementById('showcase-experience-link');

    if (data.collection?.slug) {
      showcaseExpLink.href = `index.html?collection=${encodeURIComponent(data.collection.slug)}&mode=read`;
    }

    showcase.classList.add('is-open');
    document.body.classList.add('modal-open');

    let parsedMusic = window.StanzaShare.parseMusicUrl(data.musicCode || '');
    if (parsedMusic && parsedMusic.provider === 'itunes' && parsedMusic.trackId) {
      const resolved = await window.StanzaShare.lookupSong(parsedMusic.trackId);
      if (resolved) parsedMusic = resolved;
    }

    await document.fonts.ready;
    window.StanzaShare.renderPoetryCard(showcaseCanvas, {
      collection: data.collection,
      poem: data.poem,
      lines: data.lines,
      cardStyle: data.cardStyle,
      showTitle: data.showTitle,
      hasMusic: !!(parsedMusic && !parsedMusic.invalid),
      musicLabel: getMusicCardLabel(parsedMusic),
      highlightIndex: typeof data.highlightIndex === 'number' ? data.highlightIndex : -1
    });

    const stopAudio = window.StanzaShare.setupShowcaseAudio(parsedMusic);

    document.getElementById('showcase-explore').addEventListener('click', () => {
      stopAudio();
      showcase.classList.remove('is-open');
      document.body.classList.remove('modal-open');
      const poemIdx = poems.findIndex((p) => p.slug === data.poemSlug);
      const cleanUrl = new URL('gallery.html', window.location.href);
      cleanUrl.searchParams.set('collection', data.collectionSlug);
      history.replaceState(null, '', cleanUrl.toString());
      if (poemIdx !== -1) openLightbox(poemIdx);
    });

    document.getElementById('showcase-download').addEventListener('click', () => {
      downloadCanvasPng(showcaseCanvas, `stanza-${data.poemSlug}-${data.cardStyle}.png`);
    });

    return data.collectionSlug;
  }

  // ============================================
  // BOOTSTRAP
  // ============================================
  (async function init() {
    bindTransitionLinks();
    syncThemeButton();

    allCollections = await window.StanzaStore.getCollections();
    const sharedCollectionSlug = await initSharedShowcaseIfPresent();
    const params = new URLSearchParams(window.location.search);
    const requestedSlug = sharedCollectionSlug || params.get('collection');
    const poemParam = params.get('poem');
    const pickParam = params.get('pick');

    if (requestedSlug || poemParam) {
      const colSlug = requestedSlug || DEFAULT_COLLECTION_SLUG;
      collection = await window.StanzaStore.getCollection(colSlug);
      poems = collection.poems || [];
      document.body.classList.remove('mode-volumes');
      renderGalleryStrips();
    } else {
      showVolumeIndex(false);
    }

    setTimeout(openCurtain, 240);

    // If navigated directly to a specific poem (e.g., from Experience Mode's "Share Lines" button)
    if (poemParam && !sharedCollectionSlug) {
      const targetIdx = poems.findIndex((p) => p.slug === poemParam);
      if (targetIdx !== -1) {
        setTimeout(() => {
          openLightbox(targetIdx);
          if (pickParam) {
            const wanted = pickParam
              .split(',')
              .map((n) => parseInt(n, 10))
              .filter((n) => !Number.isNaN(n))
              .slice(0, MAX_SELECTED_LINES);
            const allLines = poems[targetIdx].stanzas.flat();
            selectedLines = wanted
              .filter((i) => allLines[i])
              .map((idx) => ({ idx, text: allLines[idx] }));
            updateSelectionUI();
          }
        }, 460);
      }
    }
  })();
})();
