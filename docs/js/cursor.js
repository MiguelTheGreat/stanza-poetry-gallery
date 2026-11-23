/**
 * Dual-ring magnetic custom cursor + click ripples
 */
(function () {
  function initCursor() {
    const ring = document.getElementById('cursor-ring');
    const dot = document.getElementById('cursor-dot');
    const label = document.getElementById('cursor-label');
    if (!ring || !dot) return null;

    const state = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      rx: window.innerWidth / 2,
      ry: window.innerHeight / 2,
      raf: null
    };

    function tick() {
      const dx = state.x - state.rx;
      const dy = state.y - state.ry;
      state.rx += dx * 0.18;
      state.ry += dy * 0.18;
      dot.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${state.rx}px, ${state.ry}px, 0) translate(-50%, -50%)`;

      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        state.raf = requestAnimationFrame(tick);
      } else {
        state.raf = null;
      }
    }

    window.addEventListener(
      'mousemove',
      (e) => {
        state.x = e.clientX;
        state.y = e.clientY;
        if (!state.raf && !document.hidden) {
          state.raf = requestAnimationFrame(tick);
        }
      },
      { passive: true }
    );

    window.addEventListener('mousedown', (e) => {
      if (document.body.classList.contains('modal-open')) return;
      const ripple = document.createElement('div');
      ripple.className = 'cursor-ripple';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 750);
    });

    document.addEventListener('mouseleave', () => document.body.classList.add('cursor-hidden'));
    document.addEventListener('mouseenter', () => document.body.classList.remove('cursor-hidden'));

    function bindHoverTargets(root = document) {
      root.querySelectorAll('.hover-target').forEach((el) => {
        if (el.dataset.cursorBound) return;
        el.dataset.cursorBound = '1';
        el.addEventListener('mouseenter', () => {
          document.body.classList.remove('cursor-inspect');
          document.body.classList.add('cursor-hover');
          if (label) label.textContent = '';
        });
        el.addEventListener('mouseleave', () => {
          document.body.classList.remove('cursor-hover');
        });
      });
    }

    bindHoverTargets();

    return {
      bindHoverTargets,
      setInspect(text) {
        if (text) {
          document.body.classList.add('cursor-inspect');
          if (label) label.textContent = text;
        } else {
          document.body.classList.remove('cursor-inspect');
          if (label) label.textContent = '';
        }
      }
    };
  }

  // Delegated Liquid Glass specular sheen tracking (--gx, --gy)
  const LIQUID_GLASS_SELECTOR =
    '.ctrl-btn, .shelf-nav-arrow, .btn-enter-exp, .btn-open-gallery, .lb-btn, .action-primary, .action-secondary, #showcase-audio-btn, #back-to-top';

  function updateLiquidSheen(e) {
    const target = e.target && e.target.closest ? e.target.closest(LIQUID_GLASS_SELECTOR) : null;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const gx = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1);
    const gy = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1);
    target.style.setProperty('--gx', `${gx}%`);
    target.style.setProperty('--gy', `${gy}%`);
  }

  document.addEventListener('pointermove', updateLiquidSheen, { passive: true });
  document.addEventListener('pointerdown', updateLiquidSheen, { passive: true });

  window.StanzaCursor = { initCursor };
})();
