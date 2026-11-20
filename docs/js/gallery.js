/**
 * Stanza. — Gallery Mode Controller
 * Accordion Exhibition Strips + Fullscreen Poem Reader + 4-Line Selector
 * + 5-Style Share Card Studio + Full-Stack /api/shares + Shared Showcase
 */
(function () {
  const MAX_SELECTED_LINES = 4;
  const DEFAULT_COLLECTION_SLUG = 'cut-on-the-life-of-a-weeping-man';

  const overlay = document.getElementById('intro-overlay');
  const introContent = document.getElementById('intro-content');
  const galleryWrapper = document.getElementById('gallery-wrapper');
  const navCollectionName = document.getElementById('nav-collection-name');
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
  const shareMusicStatus = document.getElementById('share-music-status');
  const shareMusicPreview = document.getElementById('share-music-preview');
  const btnCopyLink = document.getElementById('btn-copy-link');
  const btnDownloadCard = document.getElementById('btn-download-card');

  const cursorApi = window.StanzaCursor ? window.StanzaCursor.initCursor() : null;

  // State
  let collection = null;
  let poems = [];
  let currentPoemIdx = 0;
  let selectedLines = []; // Array of { idx, text } in order of poem appearance

  const shareState = {
    cardStyle: 'museum',
    showTitle: true,
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

  // ============================================
  // SPLIT-CURTAIN TRANSITIONS
  // ============================================
  function openCurtain() {
    overlay.classList.add('curtain-open');
    document.body.classList.add('gallery-ready');
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
        }, 700);
      });
    });
  }

  // ============================================
  // RENDER ACCORDION EXHIBITION STRIPS
  // ============================================
  function renderGalleryStrips() {
    galleryWrapper.innerHTML = '';
    navCollectionName.textContent = collection.title;
    backToExperience.href = `index.html?collection=${encodeURIComponent(collection.slug)}&mode=read`;

    poems.forEach((poem, idx) => {
      const strip = document.createElement('article');
      strip.className = 'gallery-strip';
      strip.dataset.index = String(idx);
      strip.style.transitionDelay = `0s, 0s, 0s, ${(0.04 + idx * 0.05).toFixed(2)}s`;

      const openingStanza = (poem.stanzas[0] || []).map((l) => escapeHtml(l)).join('<br>');

      strip.innerHTML = `
        <div class="strip-aura" style="background: ${poem.glow};"></div>
        <span class="strip-watermark">${poem.watermark}</span>
        <span class="strip-spine-title">${escapeHtml(poem.title)}</span>

        <div class="poem-preview-card">
          <span class="preview-quote-mark" aria-hidden="true">“</span>
          <p class="preview-stanza">${openingStanza}</p>
          <div class="preview-mood">${escapeHtml(poem.mood || 'Archival Verse')}</div>
        </div>

        <div class="card-info">
          <span class="card-index">${poem.indexLabel}</span>
          <h2 class="card-title">${escapeHtml(poem.title)}</h2>
          <p class="card-meta">${escapeHtml(poem.subtitle)}</p>
          <span class="card-cta">Click to Read &amp; Share Lines →</span>
        </div>
      `;

      // Radial hover reveal origin + 3D parallax tilt (Lumina signature)
      const aura = strip.querySelector('.strip-aura');
      const previewCard = strip.querySelector('.poem-preview-card');
      let cachedRect = null;
      let tiltRaf = null;
      let pendingX = 0;
      let pendingY = 0;

      strip.addEventListener('mouseenter', (e) => {
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
          if (!cachedRect) cachedRect = strip.getBoundingClientRect();
          pendingX = ((e.clientX - cachedRect.left) / cachedRect.width - 0.5) * 2;
          pendingY = ((e.clientY - cachedRect.top) / cachedRect.height - 0.5) * 2;
          if (!tiltRaf) {
            tiltRaf = requestAnimationFrame(() => {
              previewCard.style.transform = `perspective(900px) rotateY(${pendingX * 4.5}deg) rotateX(${-pendingY * 4.5}deg) translate3d(${pendingX * 8}px, ${pendingY * 6}px, 0)`;
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
        previewCard.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) translate3d(0, 0, 0)';
        if (cursorApi) cursorApi.setInspect('');
      });

      strip.addEventListener('click', () => openLightbox(idx));
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
    } else {
      if (selectedLines.length >= MAX_SELECTED_LINES) {
        showToast('Maximum 4 lines selected — deselect a line first');
        return;
      }
      selectedLines.push({ idx, text });
      selectedLines.sort((a, b) => a.idx - b.idx);
    }
    updateSelectionUI();
  }

  function loadLightboxPoem(idx, animateSwitch = false) {
    currentPoemIdx = (idx + poems.length) % poems.length;
    const poem = poems[currentPoemIdx];

    const apply = () => {
      selectedLines = [];
      lbIndex.textContent = poem.indexLabel;
      lbTitle.textContent = poem.title;
      lbSubtitle.textContent = `${poem.subtitle} · ${collection.title}`;

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
    updateSelectionUI();
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // ============================================
  // SHARE CARD STUDIO MODAL
  // ============================================
  function renderSelectedLineChips() {
    shareLinesCountEl.textContent = `${selectedLines.length} / ${MAX_SELECTED_LINES} lines`;
    shareSelectedLinesEl.innerHTML = '';

    selectedLines.forEach((item) => {
      const chip = document.createElement('div');
      chip.className = 'selected-line-chip';
      chip.innerHTML = `
        <span>“${escapeHtml(item.text)}”</span>
        <button type="button" class="chip-remove" title="Remove line" aria-label="Remove line">✕</button>
      `;
      chip.querySelector('.chip-remove').addEventListener('click', () => {
        if (selectedLines.length <= 1) {
          showToast('At least 1 line is needed for a share card');
          return;
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
      showTitle: shareState.showTitle,
      hasMusic: !!(shareState.music && !shareState.music.invalid)
    });
  }

  function openShareModal() {
    const poem = poems[currentPoemIdx];
    if (!poem) return;

    // If user hasn't clicked any lines yet, gracefully pre-select the first stanza (up to 4 lines)
    if (selectedLines.length === 0) {
      const firstStanza = (poem.stanzas[0] || []).slice(0, MAX_SELECTED_LINES);
      selectedLines = firstStanza.map((text, idx) => ({ idx, text }));
      updateSelectionUI();
    }

    renderSelectedLineChips();
    shareModal.classList.add('is-open');
    document.fonts.ready.then(refreshSharePreview);
    refreshSharePreview();
  }

  function closeShareModal() {
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

  shareTitleToggle.addEventListener('change', () => {
    shareState.showTitle = shareTitleToggle.checked;
    refreshSharePreview();
  });

  shareMusicInput.addEventListener('input', () => {
    const parsed = window.StanzaShare.parseMusicUrl(shareMusicInput.value);
    shareMusicStatus.classList.remove('valid', 'invalid');
    if (!parsed) {
      shareState.music = null;
      shareMusicStatus.textContent = 'Optional — plays as an ambient soundtrack when the shared link is opened';
      window.StanzaShare.mountMusicEmbed(shareMusicPreview, null);
    } else if (parsed.invalid) {
      shareState.music = null;
      shareMusicStatus.textContent = 'Paste a valid Spotify (track/album/playlist) or YouTube Music URL';
      shareMusicStatus.classList.add('invalid');
      window.StanzaShare.mountMusicEmbed(shareMusicPreview, null);
    } else {
      shareState.music = parsed;
      shareMusicStatus.textContent = `✓ Attached ${parsed.label} soundtrack`;
      shareMusicStatus.classList.add('valid');
      window.StanzaShare.mountMusicEmbed(shareMusicPreview, parsed);
    }
    refreshSharePreview();
  });

  // Persist share card via StanzaStore (Express /api/shares or static GitHub Pages URL)
  btnCopyLink.addEventListener('click', async () => {
    const poem = poems[currentPoemIdx];
    if (!poem || selectedLines.length === 0) return;

    btnCopyLink.textContent = 'Creating Link…';
    try {
      const fullUrl = await window.StanzaStore.createShareUrl({
        collectionSlug: collection.slug,
        poemSlug: poem.slug,
        lines: selectedLines.map((s) => s.text),
        cardStyle: shareState.cardStyle,
        showTitle: shareState.showTitle,
        musicCode: shareState.music && !shareState.music.invalid ? shareState.music.code : ''
      });

      try {
        await navigator.clipboard.writeText(fullUrl);
        btnCopyLink.textContent = 'Share Link Copied ✓';
        showToast('Share Link Copied to Clipboard');
      } catch {
        window.prompt('Copy your Stanza share link:', fullUrl);
        btnCopyLink.textContent = 'Link Ready ✓';
      }
    } catch {
      btnCopyLink.textContent = 'Copy Share Link';
      showToast('Could not create share link');
      return;
    }

    setTimeout(() => {
      btnCopyLink.textContent = 'Copy Share Link';
    }, 2400);
  });

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
      if (e.key === 'Escape') closeShareModal();
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
    const showcaseGlow = document.getElementById('showcase-glow');
    const showcaseExpLink = document.getElementById('showcase-experience-link');

    if (data.poem?.glow) {
      showcaseGlow.style.background = data.poem.glow;
    }
    if (data.collection?.slug) {
      showcaseExpLink.href = `index.html?collection=${encodeURIComponent(data.collection.slug)}&mode=read`;
    }

    showcase.classList.add('is-open');
    document.body.classList.add('modal-open');

    const parsedMusic = window.StanzaShare.parseMusicUrl(data.musicCode || '');
    await document.fonts.ready;
    window.StanzaShare.renderPoetryCard(showcaseCanvas, {
      collection: data.collection,
      poem: data.poem,
      lines: data.lines,
      cardStyle: data.cardStyle,
      showTitle: data.showTitle,
      hasMusic: !!(parsedMusic && !parsedMusic.invalid)
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

    const sharedCollectionSlug = await initSharedShowcaseIfPresent();
    const params = new URLSearchParams(window.location.search);
    const colSlug = sharedCollectionSlug || params.get('collection') || DEFAULT_COLLECTION_SLUG;
    const poemParam = params.get('poem');

    collection = await window.StanzaStore.getCollection(colSlug);
    poems = collection.poems || [];
    renderGalleryStrips();

    setTimeout(openCurtain, 260);

    // If navigated directly to a specific poem (e.g., from Experience Mode's "Share Lines" button)
    if (poemParam && !sharedCollectionSlug) {
      const targetIdx = poems.findIndex((p) => p.slug === poemParam);
      if (targetIdx !== -1) {
        setTimeout(() => openLightbox(targetIdx), 480);
      }
    }
  })();
})();
