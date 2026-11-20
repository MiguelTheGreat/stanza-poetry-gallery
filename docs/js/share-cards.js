/**
 * Stanza. — High-Resolution Poetry Share Card Renderer & Soundtrack Controller
 * Supports 5 editorial card styles: Museum, Noir, Broadsheet, Atmosphere, Keepsake
 * Supports Spotify & YouTube / YouTube Music soundtrack links
 */
(function () {
  function wrapTextLines(ctx, text, maxWidth) {
    const words = String(text || '').split(/\s+/);
    const out = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        out.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) out.push(current);
    return out;
  }

  function drawSubtleGrain(ctx, w, h, alpha = 0.03) {
    ctx.save();
    ctx.fillStyle = `rgba(26, 25, 23, ${alpha})`;
    for (let i = 0; i < 1800; i++) {
      const x = ((i * 7919) % w);
      const y = ((i * 6271) % h);
      ctx.fillRect(x, y, 1.5, 1.5);
    }
    ctx.restore();
  }

  function renderPoetryCard(targetCanvas, {
    collection,
    poem,
    lines,
    cardStyle = 'museum',
    showTitle = true,
    hasMusic = false
  }) {
    const cw = 1080;
    const ch = 1350;
    targetCanvas.width = cw;
    targetCanvas.height = ch;
    const g = targetCanvas.getContext('2d');

    const safeLines = (Array.isArray(lines) && lines.length > 0 ? lines : ['Select up to 4 lines from this poem']).slice(0, 4);
    const colTitle = (collection?.title || 'Cut on the Life of a Weeping Man').toUpperCase();
    const volLabel = collection?.volume || 'VOL. 01';
    const poemTitle = (poem?.title || 'Untitled').toUpperCase();
    const poemIndex = poem?.indexLabel || '01 / 08';
    const poemSubtitle = poem?.subtitle || '';
    const accent = poem?.accentHex || '#a67c52';
    const rgb = poem?.watercolorRgb || '166, 124, 82';

    // Theme tokens per card style
    let bg = '#f5f2e9';
    let fg = '#1a1917';
    let muted = '#6b655c';
    let border = 'rgba(26, 25, 23, 0.14)';

    if (cardStyle === 'noir') {
      bg = '#151412';
      fg = '#f5f2e9';
      muted = 'rgba(245, 242, 233, 0.58)';
      border = 'rgba(245, 242, 233, 0.14)';
    } else if (cardStyle === 'broadsheet') {
      bg = '#faf8f2';
      fg = '#181715';
      muted = '#726c62';
      border = 'rgba(26, 25, 23, 0.16)';
    } else if (cardStyle === 'atmosphere') {
      bg = '#171513';
      fg = '#f8f4ec';
      muted = 'rgba(248, 244, 236, 0.66)';
      border = 'rgba(248, 244, 236, 0.16)';
    } else if (cardStyle === 'keepsake') {
      bg = '#fcfbf8';
      fg = '#1a1917';
      muted = '#767067';
      border = 'rgba(26, 25, 23, 0.10)';
    }

    // Base background fill
    g.fillStyle = bg;
    g.fillRect(0, 0, cw, ch);

    // Style-specific atmospheric & architectural layers
    if (cardStyle === 'museum') {
      // Soft radial warmth
      const wash = g.createRadialGradient(cw * 0.5, ch * 0.44, 40, cw * 0.5, ch * 0.44, 620);
      wash.addColorStop(0, `rgba(${rgb}, 0.10)`);
      wash.addColorStop(1, 'rgba(245, 242, 233, 0)');
      g.fillStyle = wash;
      g.fillRect(0, 0, cw, ch);

      // Double museum hairline frame
      g.strokeStyle = border;
      g.lineWidth = 1.5;
      g.strokeRect(42, 42, cw - 84, ch - 84);
      g.strokeStyle = 'rgba(26, 25, 23, 0.06)';
      g.lineWidth = 1;
      g.strokeRect(56, 56, cw - 112, ch - 112);

      drawSubtleGrain(g, cw, ch, 0.025);
    } else if (cardStyle === 'noir') {
      const wash = g.createRadialGradient(cw * 0.5, ch * 0.42, 30, cw * 0.5, ch * 0.42, 620);
      wash.addColorStop(0, `rgba(${rgb}, 0.22)`);
      wash.addColorStop(0.6, `rgba(${rgb}, 0.06)`);
      wash.addColorStop(1, 'rgba(21, 20, 18, 0)');
      g.fillStyle = wash;
      g.fillRect(0, 0, cw, ch);

      g.strokeStyle = border;
      g.lineWidth = 1.5;
      g.strokeRect(44, 44, cw - 88, ch - 88);
    } else if (cardStyle === 'broadsheet') {
      // Horizontal archival folio rules
      g.strokeStyle = border;
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(84, 132);
      g.lineTo(cw - 84, 132);
      g.moveTo(84, 140);
      g.lineTo(cw - 84, 140);
      g.moveTo(84, ch - 196);
      g.lineTo(cw - 84, ch - 196);
      g.stroke();

      // Left margin red/bronze rule
      g.strokeStyle = `rgba(${rgb}, 0.35)`;
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(156, 195);
      g.lineTo(156, ch - 250);
      g.stroke();

      drawSubtleGrain(g, cw, ch, 0.022);
    } else if (cardStyle === 'atmosphere') {
      // Rich layered chromatic wash
      const grad1 = g.createRadialGradient(cw * 0.28, ch * 0.30, 40, cw * 0.28, ch * 0.30, 740);
      grad1.addColorStop(0, `rgba(${rgb}, 0.55)`);
      grad1.addColorStop(0.55, `rgba(${rgb}, 0.16)`);
      grad1.addColorStop(1, 'rgba(23, 21, 19, 0)');
      g.fillStyle = grad1;
      g.fillRect(0, 0, cw, ch);

      const grad2 = g.createRadialGradient(cw * 0.78, ch * 0.76, 30, cw * 0.78, ch * 0.76, 620);
      grad2.addColorStop(0, 'rgba(166, 124, 82, 0.32)');
      grad2.addColorStop(1, 'rgba(23, 21, 19, 0)');
      g.fillStyle = grad2;
      g.fillRect(0, 0, cw, ch);

      // Vignette
      const vig = g.createRadialGradient(cw * 0.5, ch * 0.5, cw * 0.28, cw * 0.5, ch * 0.5, cw * 0.85);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(10, 9, 8, 0.52)');
      g.fillStyle = vig;
      g.fillRect(0, 0, cw, ch);

      g.strokeStyle = 'rgba(248, 244, 236, 0.15)';
      g.lineWidth = 1;
      g.strokeRect(48, 48, cw - 96, ch - 96);
    } else if (cardStyle === 'keepsake') {
      // Polaroid / Keepsake inner matte window
      const matX = 76;
      const matY = 76;
      const matW = cw - 152;
      const matH = ch - 310;

      g.fillStyle = '#1b1916';
      g.fillRect(matX, matY, matW, matH);

      const matGlow = g.createRadialGradient(cw * 0.5, matY + matH * 0.45, 30, cw * 0.5, matY + matH * 0.45, 560);
      matGlow.addColorStop(0, `rgba(${rgb}, 0.30)`);
      matGlow.addColorStop(1, 'rgba(27, 25, 22, 0)');
      g.fillStyle = matGlow;
      g.fillRect(matX, matY, matW, matH);

      g.strokeStyle = 'rgba(245, 242, 233, 0.12)';
      g.lineWidth = 1;
      g.strokeRect(matX + 20, matY + 20, matW - 40, matH - 40);
    }

    // Header bar
    const isKeepsake = cardStyle === 'keepsake';
    const headerY = isKeepsake ? 138 : 104;
    const padX = cardStyle === 'broadsheet' ? 84 : (isKeepsake ? 124 : 96);

    g.fillStyle = isKeepsake ? 'rgba(245, 242, 233, 0.58)' : muted;
    g.font = '700 15px "Syncopate", sans-serif';
    g.textAlign = 'left';
    g.fillText(`STANZA.  ·  ${volLabel}`, padX, headerY);

    g.textAlign = 'right';
    g.fillStyle = isKeepsake ? '#d8b489' : accent;
    g.fillText(poemIndex, cw - padX, headerY);

    // Subtle quote ornament
    const verseColor = isKeepsake ? '#f5f2e9' : fg;
    const verseFontSize = safeLines.length <= 2 ? 56 : safeLines.length === 3 ? 49 : 44;
    const verseLineHeight = Math.round(verseFontSize * 1.48);

    g.font = `italic 400 ${verseFontSize}px "Cormorant Garamond", Georgia, serif`;
    const maxTextW = cardStyle === 'broadsheet' ? cw - 290 : (isKeepsake ? cw - 280 : cw - 220);

    // Pre-wrap all selected lines so we can vertically center cleanly
    const wrappedEntries = safeLines.map((line, idx) => ({
      num: String(idx + 1).padStart(2, '0'),
      wrapped: wrapTextLines(g, line, maxTextW)
    }));

    const stanzaGap = 18;
    let totalTextHeight = 0;
    wrappedEntries.forEach((entry, i) => {
      totalTextHeight += entry.wrapped.length * verseLineHeight;
      if (i < wrappedEntries.length - 1) totalTextHeight += stanzaGap;
    });

    const stageTop = isKeepsake ? 190 : 190;
    const stageBottom = isKeepsake ? ch - 260 : (showTitle ? ch - 260 : ch - 130);
    let cursorY = stageTop + Math.max(40, (stageBottom - stageTop - totalTextHeight) / 2) + verseFontSize * 0.7;

    // Opening quotation mark glyph
    if (cardStyle !== 'broadsheet') {
      g.save();
      g.font = 'italic 400 124px "Cormorant Garamond", Georgia, serif';
      g.fillStyle = isKeepsake ? 'rgba(216, 180, 137, 0.25)' : `rgba(${rgb}, 0.28)`;
      g.textAlign = 'left';
      g.fillText('“', padX - 8, cursorY - 56);
      g.restore();
    }

    // Draw each selected line
    wrappedEntries.forEach((entry) => {
      if (cardStyle === 'broadsheet') {
        g.save();
        g.font = '600 14px "Syncopate", sans-serif';
        g.fillStyle = `rgba(${rgb}, 0.72)`;
        g.textAlign = 'right';
        g.fillText(entry.num, 136, cursorY - 6);
        g.restore();
      }

      g.font = `italic 400 ${verseFontSize}px "Cormorant Garamond", Georgia, serif`;
      g.fillStyle = verseColor;
      g.textAlign = 'left';
      const drawX = cardStyle === 'broadsheet' ? 192 : padX;

      entry.wrapped.forEach((subline) => {
        g.fillText(subline, drawX, cursorY);
        cursorY += verseLineHeight;
      });
      cursorY += stanzaGap;
    });

    // Footer title & collection attribution
    if (showTitle) {
      if (isKeepsake) {
        g.textAlign = 'center';
        g.fillStyle = '#1a1917';
        g.font = 'italic 600 40px "Cormorant Garamond", Georgia, serif';
        g.fillText(poem?.title || 'Untitled', cw / 2, ch - 138);

        g.fillStyle = '#767067';
        g.font = '400 14px "Syncopate", sans-serif';
        g.fillText(colTitle, cw / 2, ch - 92);

        if (hasMusic) {
          g.fillStyle = accent;
          g.font = '600 12px "Syncopate", sans-serif';
          g.fillText('♪  WITH SOUNDTRACK', cw / 2, ch - 54);
        }
      } else {
        const footerY = ch - 132;

        // Short bronze accent bar above title
        g.fillStyle = accent;
        g.fillRect(padX, footerY - 46, 54, 2);

        g.textAlign = 'left';
        g.fillStyle = fg;
        g.font = '700 24px "Syncopate", sans-serif';
        g.fillText(poemTitle.length > 32 ? poemTitle.slice(0, 31) + '…' : poemTitle, padX, footerY);

        g.fillStyle = muted;
        g.font = 'italic 26px "Cormorant Garamond", Georgia, serif';
        g.fillText(collection?.title || 'Cut on the Life of a Weeping Man', padX, footerY + 38);

        g.textAlign = 'right';
        g.fillStyle = accent;
        g.font = '700 13px "Syncopate", sans-serif';
        g.fillText(hasMusic ? '♪ SOUNDTRACK ATTACHED' : 'SELECTED VERSE', cw - padX, footerY - 2);

        if (poemSubtitle) {
          g.fillStyle = muted;
          g.font = '400 15px "Inter", sans-serif';
          g.fillText(poem?.mood || 'Archival Edition', cw - padX, footerY + 30);
        }
      }
    }
  }

  // ============================================
  // SPOTIFY & YOUTUBE MUSIC URL PARSER
  // ============================================
  function parseMusicUrl(raw) {
    const val = (raw || '').trim();
    if (!val) return null;

    const spCode = val.match(/^sp:(track|album|playlist):([A-Za-z0-9]+)$/);
    if (spCode) {
      return {
        provider: 'spotify',
        code: val,
        spotifyUri: `spotify:${spCode[1]}:${spCode[2]}`,
        label: `Spotify ${spCode[1]}`,
        embedUrl: `https://open.spotify.com/embed/${spCode[1]}/${spCode[2]}?utm_source=generator&theme=0`,
        height: spCode[1] === 'track' ? 80 : 152
      };
    }

    const ytCode = val.match(/^yt:([A-Za-z0-9_-]{11})$/);
    if (ytCode) {
      return {
        provider: 'youtube',
        code: val,
        youtubeId: ytCode[1],
        label: 'YouTube Music',
        embedUrl: `https://www.youtube.com/embed/${ytCode[1]}?rel=0`,
        height: 152
      };
    }

    const spUrl = val.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist)\/([A-Za-z0-9]+)/i);
    if (spUrl) {
      const kind = spUrl[1].toLowerCase();
      const id = spUrl[2];
      return {
        provider: 'spotify',
        code: `sp:${kind}:${id}`,
        spotifyUri: `spotify:${kind}:${id}`,
        label: `Spotify ${kind}`,
        embedUrl: `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`,
        height: kind === 'track' ? 80 : 152
      };
    }

    const ytUrl =
      val.match(/(?:music\.youtube\.com|youtube\.com|youtu\.be)\/(?:watch\?v=|shorts\/|embed\/)?([A-Za-z0-9_-]{11})/i) ||
      val.match(/[?&]v=([A-Za-z0-9_-]{11})/);
    if (ytUrl) {
      const id = ytUrl[1];
      return {
        provider: 'youtube',
        code: `yt:${id}`,
        youtubeId: id,
        label: 'YouTube Music',
        embedUrl: `https://www.youtube.com/embed/${id}?rel=0`,
        height: 152
      };
    }

    return { invalid: true };
  }

  function mountMusicEmbed(container, parsed) {
    container.innerHTML = '';
    if (!parsed || parsed.invalid) {
      container.classList.remove('has-track');
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.src = parsed.embedUrl;
    iframe.width = '100%';
    iframe.height = String(parsed.height);
    iframe.frameBorder = '0';
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    iframe.loading = 'lazy';
    iframe.style.display = 'block';
    iframe.style.borderRadius = '8px';
    container.appendChild(iframe);
    container.classList.add('has-track');
  }

  function setupShowcaseAudio(parsed) {
    const host = document.getElementById('showcase-audio-host');
    const btn = document.getElementById('showcase-audio-btn');
    const icon = document.getElementById('showcase-audio-icon');
    const label = document.getElementById('showcase-audio-label');

    if (!parsed || parsed.invalid || !host || !btn) {
      if (btn) btn.classList.remove('is-visible', 'is-playing', 'is-waiting');
      if (host) host.innerHTML = '';
      return () => {};
    }

    btn.classList.add('is-visible', 'is-waiting');
    let isPlaying = false;
    let isReady = false;
    let userPaused = false;
    let pendingPlay = true;
    let playFn = null;
    let pauseFn = null;

    function setUiPlaying(playing) {
      isPlaying = playing;
      btn.classList.toggle('is-playing', playing);
      btn.classList.toggle('is-waiting', !playing && !userPaused);
      icon.textContent = playing ? '❚❚' : '▶';
      label.textContent = playing ? 'Pause Music' : (userPaused ? 'Play Music' : 'Tap for Music');
    }
    setUiPlaying(false);

    function tryStartPlayback() {
      if (userPaused || isPlaying) return;
      pendingPlay = true;
      if (isReady && playFn) playFn();
    }

    const onAnyGesture = (e) => {
      if (e.target && e.target.closest && e.target.closest('#showcase-audio-btn, #showcase-explore, #showcase-download, a')) {
        return;
      }
      if (!isPlaying && !userPaused) {
        tryStartPlayback();
      }
    };
    ['pointerdown', 'touchend', 'click', 'keydown'].forEach((evt) => {
      window.addEventListener(evt, onAnyGesture, { passive: true });
    });

    if (parsed.provider === 'youtube' && parsed.youtubeId) {
      const slot = document.createElement('div');
      slot.id = 'yt-bg-player-' + Date.now();
      host.innerHTML = '';
      host.appendChild(slot);

      let ytPlayer = null;
      const mountYt = () => {
        ytPlayer = new window.YT.Player(slot.id, {
          width: '320',
          height: '200',
          videoId: parsed.youtubeId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            playsinline: 1,
            rel: 0,
            loop: 1,
            playlist: parsed.youtubeId
          },
          events: {
            onReady: (ev) => {
              isReady = true;
              try {
                ev.target.unMute();
                ev.target.setVolume(85);
                if (pendingPlay && !userPaused) ev.target.playVideo();
              } catch {}
            },
            onStateChange: (ev) => {
              if (ev.data === 1) {
                pendingPlay = false;
                setUiPlaying(true);
              } else if (ev.data === 2 || ev.data === 0) {
                setUiPlaying(false);
              }
            }
          }
        });
      };

      if (window.YT && window.YT.Player) {
        mountYt();
      } else {
        const prevReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (typeof prevReady === 'function') prevReady();
          mountYt();
        };
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const s = document.createElement('script');
          s.src = 'https://www.youtube.com/iframe_api';
          s.async = true;
          document.head.appendChild(s);
        }
      }

      playFn = () => {
        if (!ytPlayer) return;
        try {
          ytPlayer.unMute();
          ytPlayer.setVolume(85);
          ytPlayer.playVideo();
        } catch {}
      };
      pauseFn = () => {
        if (ytPlayer) {
          try { ytPlayer.pauseVideo(); } catch {}
        }
      };
    } else if (parsed.provider === 'spotify' && parsed.spotifyUri) {
      const target = document.createElement('div');
      host.innerHTML = '';
      host.appendChild(target);

      let spController = null;
      const initSpotify = (IFrameAPI) => {
        IFrameAPI.createController(target, { uri: parsed.spotifyUri, width: 300, height: 80 }, (controller) => {
          spController = controller;
          controller.addListener('ready', () => {
            isReady = true;
            if (pendingPlay && !userPaused) {
              try { controller.play(); } catch {}
            }
          });
          controller.addListener('playback_update', (ev) => {
            if (ev && ev.data) {
              const playing = !ev.data.isPaused;
              if (playing) pendingPlay = false;
              setUiPlaying(playing);
            }
          });
        });
      };

      if (window.__spotifyIframeAPI) {
        initSpotify(window.__spotifyIframeAPI);
      } else {
        window.onSpotifyIframeApiReady = (IFrameAPI) => {
          window.__spotifyIframeAPI = IFrameAPI;
          initSpotify(IFrameAPI);
        };
        if (!document.querySelector('script[src*="open.spotify.com/embed/iframe-api"]')) {
          const s = document.createElement('script');
          s.src = 'https://open.spotify.com/embed/iframe-api/v1';
          s.async = true;
          document.head.appendChild(s);
        }
      }

      playFn = () => {
        if (spController) {
          try { spController.play(); } catch {}
        }
      };
      pauseFn = () => {
        if (spController) {
          try { spController.pause(); } catch {}
        }
      };
    }

    const onBtnClick = (e) => {
      e.stopPropagation();
      if (isPlaying) {
        userPaused = true;
        pendingPlay = false;
        if (pauseFn) pauseFn();
        setUiPlaying(false);
      } else {
        userPaused = false;
        pendingPlay = true;
        if (playFn) playFn();
      }
    };
    btn.addEventListener('click', onBtnClick);

    return () => {
      ['pointerdown', 'touchend', 'click', 'keydown'].forEach((evt) => {
        window.removeEventListener(evt, onAnyGesture);
      });
      btn.removeEventListener('click', onBtnClick);
      host.innerHTML = '';
      btn.classList.remove('is-visible', 'is-playing', 'is-waiting');
    };
  }

  window.StanzaShare = {
    renderPoetryCard,
    parseMusicUrl,
    mountMusicEmbed,
    setupShowcaseAudio
  };
})();
