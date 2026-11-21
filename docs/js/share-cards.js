/**
 * Stanza. — High-Resolution Poetry Share Card Renderer & Song Search / Soundtrack Engine
 * - 5 editorial card styles: Etched, Museum, Noir, Broadsheet, Keepsake
 * - 9:16 IG/FB Story & 4:5 Editorial Post formats
 * - Optional bronze line emphasis (highlightIndex)
 * - Live Song Search via iTunes Search API (30s native audio previews) + Spotify / YouTube Music URL support
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
      const x = (i * 7919) % w;
      const y = (i * 6271) % h;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
    ctx.restore();
  }

  function renderPoetryCard(targetCanvas, {
    collection,
    poem,
    lines,
    cardStyle = 'etched',
    format = 'post',
    showTitle = true,
    hasMusic = false,
    musicLabel = '',
    highlightIndex = -1
  }) {
    const cw = 1080;
    const ch = format === 'story' ? 1920 : 1350;
    targetCanvas.width = cw;
    targetCanvas.height = ch;
    const g = targetCanvas.getContext('2d');

    const safeLines = (Array.isArray(lines) && lines.length > 0 ? lines : ['Select up to 4 lines from this poem']).slice(0, 4);
    const colTitle = (collection?.title || 'Cut on the Life of a Weeping Man').toUpperCase();
    const volLabel = collection?.volume || 'VOL. 01';
    const poemTitle = (poem?.title || 'Untitled').toUpperCase();
    const poemIndex = poem?.indexLabel || '01 / 08';
    const accent = '#a67c52';
    const brightAccent = '#d8b489';

    let bg = '#f5f2e9';
    let fg = '#1a1917';
    let muted = '#6b655c';
    let border = 'rgba(26, 25, 23, 0.14)';

    if (cardStyle === 'etched') {
      bg = '#f3efe5';
      fg = '#191816';
      muted = '#676158';
      border = 'rgba(26, 25, 23, 0.22)';
    } else if (cardStyle === 'noir') {
      bg = '#151412';
      fg = '#f5f2e9';
      muted = 'rgba(245, 242, 233, 0.58)';
      border = 'rgba(245, 242, 233, 0.14)';
    } else if (cardStyle === 'broadsheet') {
      bg = '#faf8f2';
      fg = '#181715';
      muted = '#726c62';
      border = 'rgba(26, 25, 23, 0.16)';
    } else if (cardStyle === 'keepsake') {
      bg = '#fcfbf8';
      fg = '#1a1917';
      muted = '#767067';
      border = 'rgba(26, 25, 23, 0.10)';
    }

    g.fillStyle = bg;
    g.fillRect(0, 0, cw, ch);

    const storySafeTop = format === 'story' ? 140 : 0;
    const storySafeBottom = format === 'story' ? 150 : 0;

    if (cardStyle === 'etched') {
      g.save();
      g.strokeStyle = 'rgba(26, 25, 23, 0.045)';
      g.lineWidth = 1;
      for (let y = 0; y < ch; y += 6) {
        if (y < 52 + storySafeTop || y > ch - 52 - storySafeBottom) {
          g.beginPath();
          g.moveTo(0, y);
          g.lineTo(cw, y);
          g.stroke();
        }
      }
      for (let x = 0; x < cw; x += 7) {
        if (x < 52 || x > cw - 52) {
          g.beginPath();
          g.moveTo(x, 0);
          g.lineTo(x, ch);
          g.stroke();
        }
      }
      g.restore();

      const px = 52;
      const py = 52 + storySafeTop;
      const pw = cw - 104;
      const ph = ch - 104 - storySafeTop - storySafeBottom;

      g.fillStyle = '#f8f5ed';
      g.fillRect(px, py, pw, ph);

      g.strokeStyle = 'rgba(130, 120, 104, 0.45)';
      g.lineWidth = 2;
      g.strokeRect(px, py, pw, ph);

      g.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      g.lineWidth = 1.5;
      g.strokeRect(px + 2, py + 2, pw - 4, ph - 4);

      g.strokeStyle = 'rgba(26, 25, 23, 0.72)';
      g.lineWidth = 1.2;
      g.strokeRect(px + 22, py + 22, pw - 44, ph - 44);

      g.strokeStyle = 'rgba(166, 124, 82, 0.72)';
      g.lineWidth = 1;
      g.strokeRect(px + 30, py + 30, pw - 60, ph - 60);

      const corners = [
        [px + 22, py + 22],
        [px + pw - 22, py + 22],
        [px + 22, py + ph - 22],
        [px + pw - 22, py + ph - 22]
      ];
      g.strokeStyle = '#191816';
      g.lineWidth = 1.2;
      corners.forEach(([cx, cy]) => {
        g.beginPath();
        g.moveTo(cx - 12, cy);
        g.lineTo(cx + 12, cy);
        g.moveTo(cx, cy - 12);
        g.lineTo(cx, cy + 12);
        g.stroke();
      });

      g.strokeStyle = 'rgba(166, 124, 82, 0.78)';
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(cw / 2, py + 54);
      g.lineTo(cw / 2, py + 104);
      g.stroke();

      drawSubtleGrain(g, cw, ch, 0.028);
    } else if (cardStyle === 'museum') {
      g.strokeStyle = border;
      g.lineWidth = 1.5;
      g.strokeRect(42, 42 + storySafeTop, cw - 84, ch - 84 - storySafeTop - storySafeBottom);
      g.strokeStyle = 'rgba(26, 25, 23, 0.06)';
      g.lineWidth = 1;
      g.strokeRect(56, 56 + storySafeTop, cw - 112, ch - 112 - storySafeTop - storySafeBottom);
      drawSubtleGrain(g, cw, ch, 0.025);
    } else if (cardStyle === 'noir') {
      g.strokeStyle = border;
      g.lineWidth = 1.5;
      g.strokeRect(44, 44 + storySafeTop, cw - 88, ch - 88 - storySafeTop - storySafeBottom);
    } else if (cardStyle === 'broadsheet') {
      g.strokeStyle = border;
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(84, 132 + storySafeTop);
      g.lineTo(cw - 84, 132 + storySafeTop);
      g.moveTo(84, 140 + storySafeTop);
      g.lineTo(cw - 84, 140 + storySafeTop);
      g.moveTo(84, ch - 196 - storySafeBottom);
      g.lineTo(cw - 84, ch - 196 - storySafeBottom);
      g.stroke();

      g.strokeStyle = 'rgba(166, 124, 82, 0.35)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(156, 195 + storySafeTop);
      g.lineTo(156, ch - 250 - storySafeBottom);
      g.stroke();

      drawSubtleGrain(g, cw, ch, 0.022);
    } else if (cardStyle === 'keepsake') {
      const matX = 76;
      const matY = 76 + storySafeTop;
      const matW = cw - 152;
      const matH = ch - 310 - storySafeTop - storySafeBottom;

      g.fillStyle = '#1b1916';
      g.fillRect(matX, matY, matW, matH);

      g.strokeStyle = 'rgba(245, 242, 233, 0.12)';
      g.lineWidth = 1;
      g.strokeRect(matX + 20, matY + 20, matW - 40, matH - 40);
    }

    const isKeepsake = cardStyle === 'keepsake';
    const isDarkCard = cardStyle === 'noir' || isKeepsake;
    const headerY = (isKeepsake ? 138 : cardStyle === 'etched' ? 128 : 104) + storySafeTop;
    const padX = cardStyle === 'broadsheet' ? 84 : (isKeepsake ? 124 : cardStyle === 'etched' ? 118 : 96);

    g.fillStyle = isKeepsake ? 'rgba(245, 242, 233, 0.58)' : muted;
    g.font = '700 15px "Syncopate", sans-serif';
    g.textAlign = 'left';
    g.fillText(`STANZA.  ·  ${volLabel}`, padX, headerY);

    g.textAlign = 'right';
    g.fillStyle = isDarkCard ? brightAccent : accent;
    g.fillText(poemIndex, cw - padX, headerY);

    const verseColor = isKeepsake ? '#f5f2e9' : fg;
    const highlightColor = isDarkCard ? '#e4be92' : '#8b5e34';
    const verseFontSize = safeLines.length <= 2 ? 56 : safeLines.length === 3 ? 49 : 44;
    const verseLineHeight = Math.round(verseFontSize * 1.48);

    g.font = `italic 400 ${verseFontSize}px "Cormorant Garamond", Georgia, serif`;
    const maxTextW = cardStyle === 'broadsheet' ? cw - 290 : (isKeepsake || cardStyle === 'etched' ? cw - 260 : cw - 220);

    const wrappedEntries = safeLines.map((line, idx) => ({
      idx,
      num: String(idx + 1).padStart(2, '0'),
      wrapped: wrapTextLines(g, line, maxTextW)
    }));

    const stanzaGap = 18;
    let totalTextHeight = 0;
    wrappedEntries.forEach((entry, i) => {
      totalTextHeight += entry.wrapped.length * verseLineHeight;
      if (i < wrappedEntries.length - 1) totalTextHeight += stanzaGap;
    });

    const stageTop = 190 + storySafeTop;
    const stageBottom = (isKeepsake ? ch - 260 : (showTitle ? ch - 260 : ch - 130)) - storySafeBottom;
    let cursorY = stageTop + Math.max(40, (stageBottom - stageTop - totalTextHeight) / 2) + verseFontSize * 0.7;

    if (cardStyle !== 'broadsheet') {
      g.save();
      g.font = 'italic 400 124px "Cormorant Garamond", Georgia, serif';
      g.fillStyle = isDarkCard ? 'rgba(216, 180, 137, 0.25)' : 'rgba(166, 124, 82, 0.28)';
      g.textAlign = 'left';
      g.fillText('“', padX - 8, cursorY - 56);
      g.restore();
    }

    wrappedEntries.forEach((entry) => {
      const isEmphasized = entry.idx === highlightIndex;

      if (cardStyle === 'broadsheet') {
        g.save();
        g.font = '600 14px "Syncopate", sans-serif';
        g.fillStyle = isEmphasized ? highlightColor : 'rgba(166, 124, 82, 0.75)';
        g.textAlign = 'right';
        g.fillText(isEmphasized ? '✦' : entry.num, 136, cursorY - 6);
        g.restore();
      } else if (isEmphasized) {
        g.save();
        g.font = '400 22px Georgia, serif';
        g.fillStyle = highlightColor;
        g.textAlign = 'right';
        g.fillText('✦', padX - 18, cursorY - 8);
        g.restore();
      }

      g.font = `italic ${isEmphasized ? '600' : '400'} ${verseFontSize}px "Cormorant Garamond", Georgia, serif`;
      g.fillStyle = isEmphasized ? highlightColor : verseColor;
      g.textAlign = 'left';
      const drawX = cardStyle === 'broadsheet' ? 192 : padX;

      entry.wrapped.forEach((subline) => {
        g.fillText(subline, drawX, cursorY);
        cursorY += verseLineHeight;
      });
      cursorY += stanzaGap;
    });

    if (showTitle) {
      const shortMusic = musicLabel ? (musicLabel.length > 26 ? musicLabel.slice(0, 25) + '…' : musicLabel) : '';
      const authorLabel = collection?.author ? ` — ${collection.author}` : '';
      const colWithAuthor = `${collection?.title || 'Cut on the Life of a Weeping Man'}${authorLabel}`;
      if (isKeepsake) {
        g.textAlign = 'center';
        g.fillStyle = '#1a1917';
        g.font = 'italic 600 40px "Cormorant Garamond", Georgia, serif';
        g.fillText(poem?.title || 'Untitled', cw / 2, ch - 138 - storySafeBottom);

        g.fillStyle = '#767067';
        g.font = '400 13px "Syncopate", sans-serif';
        g.fillText(`${colTitle}${collection?.author ? `  ·  ${collection.author.toUpperCase()}` : ''}`, cw / 2, ch - 92 - storySafeBottom);

        if (hasMusic) {
          g.fillStyle = accent;
          g.font = '600 12px "Syncopate", sans-serif';
          g.fillText(shortMusic ? `♪  ${shortMusic.toUpperCase()}` : '♪  WITH SOUNDTRACK', cw / 2, ch - 54 - storySafeBottom);
        }
      } else {
        const footerY = ch - 132 - storySafeBottom;

        g.fillStyle = isDarkCard ? brightAccent : accent;
        g.fillRect(padX, footerY - 46, 54, 2);

        g.textAlign = 'left';
        g.fillStyle = fg;
        g.font = '700 24px "Syncopate", sans-serif';
        g.fillText(poemTitle.length > 28 ? poemTitle.slice(0, 27) + '…' : poemTitle, padX, footerY);

        g.fillStyle = muted;
        g.font = 'italic 26px "Cormorant Garamond", Georgia, serif';
        g.fillText(colWithAuthor, padX, footerY + 38);

        g.textAlign = 'right';
        g.fillStyle = isDarkCard ? brightAccent : accent;
        g.font = '700 13px "Syncopate", sans-serif';
        g.fillText(hasMusic ? '♪ SOUNDTRACK' : 'SELECTED VERSE', cw - padX, footerY - 2);

        if (hasMusic && shortMusic) {
          g.fillStyle = muted;
          g.font = 'italic 20px "Cormorant Garamond", Georgia, serif';
          g.fillText(shortMusic, cw - padX, footerY + 32);
        }
      }
    }
  }

  // ============================================
  // LIVE SONG SEARCH (iTunes Search API — CORS-enabled, zero API key)
  // ============================================
  async function searchSongs(query) {
    const q = (query || '').trim();
    if (q.length < 2) return [];
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=6`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || [])
      .filter((r) => r.trackId && r.previewUrl)
      .map((r) => ({
        provider: 'itunes',
        code: `it:${r.trackId}`,
        trackId: String(r.trackId),
        trackName: r.trackName,
        artistName: r.artistName,
        artwork: r.artworkUrl100 || r.artworkUrl60 || '',
        previewUrl: r.previewUrl,
        label: `${r.trackName} — ${r.artistName}`
      }));
  }

  async function lookupSong(trackId) {
    try {
      const res = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(trackId)}`);
      if (!res.ok) return null;
      const data = await res.json();
      const r = (data.results || [])[0];
      if (!r || !r.previewUrl) return null;
      return {
        provider: 'itunes',
        code: `it:${r.trackId}`,
        trackId: String(r.trackId),
        trackName: r.trackName,
        artistName: r.artistName,
        artwork: r.artworkUrl100 || r.artworkUrl60 || '',
        previewUrl: r.previewUrl,
        label: `${r.trackName} — ${r.artistName}`
      };
    } catch {
      return null;
    }
  }

  // ============================================
  // SOUNDTRACK PARSER (iTunes Track ID, Spotify URL, YouTube Music URL)
  // ============================================
  function parseMusicUrl(raw) {
    const val = (raw || '').trim();
    if (!val) return null;

    const itCode = val.match(/^it:(\d+)$/);
    if (itCode) {
      return {
        provider: 'itunes',
        code: val,
        trackId: itCode[1],
        label: 'Soundtrack'
      };
    }

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

    return null;
  }

  function mountMusicEmbed(container, parsed) {
    container.innerHTML = '';
    if (!parsed || parsed.invalid || parsed.provider === 'itunes') {
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
    let trackTitle = parsed.trackName ? `${parsed.trackName} — ${parsed.artistName}` : '';

    function setUiPlaying(playing) {
      isPlaying = playing;
      btn.classList.toggle('is-playing', playing);
      btn.classList.toggle('is-waiting', !playing && !userPaused);
      icon.textContent = playing ? '❚❚' : '▶';
      if (trackTitle) {
        const short = trackTitle.length > 28 ? trackTitle.slice(0, 27) + '…' : trackTitle;
        label.textContent = playing ? short : (userPaused ? short : `Play · ${short}`);
      } else {
        label.textContent = playing ? 'Pause Music' : (userPaused ? 'Play Music' : 'Tap for Music');
      }
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
      if (!isPlaying && !userPaused) tryStartPlayback();
    };
    ['pointerdown', 'touchend', 'click', 'keydown'].forEach((evt) => {
      window.addEventListener(evt, onAnyGesture, { passive: true });
    });

    if (parsed.provider === 'itunes' && parsed.trackId) {
      let audioEl = null;
      (async () => {
        const track = parsed.previewUrl ? parsed : await lookupSong(parsed.trackId);
        if (!track || !track.previewUrl) {
          btn.classList.remove('is-visible');
          return;
        }
        trackTitle = `${track.trackName} — ${track.artistName}`;
        audioEl = new Audio(track.previewUrl);
        audioEl.loop = true;
        audioEl.volume = 0.8;
        audioEl.addEventListener('play', () => {
          pendingPlay = false;
          setUiPlaying(true);
        });
        audioEl.addEventListener('pause', () => setUiPlaying(false));
        isReady = true;
        setUiPlaying(false);

        playFn = () => {
          audioEl.play().catch(() => {});
        };
        pauseFn = () => {
          audioEl.pause();
        };

        if (pendingPlay && !userPaused) {
          audioEl.play().catch(() => {});
        }
      })();

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
        if (audioEl) {
          audioEl.pause();
          audioEl.src = '';
        }
        btn.classList.remove('is-visible', 'is-playing', 'is-waiting');
      };
    }

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
    searchSongs,
    lookupSong,
    parseMusicUrl,
    mountMusicEmbed,
    setupShowcaseAudio
  };
})();
