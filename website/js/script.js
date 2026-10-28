(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const readSessionPreference = key => {
    try { return sessionStorage.getItem(key) === '1'; } catch (_) { return false; }
  };
  root.classList.toggle('animations-off', readSessionPreference('ns2nam-animations-off'));
  root.classList.toggle('high-contrast', readSessionPreference('ns2nam-high-contrast'));

  const navActions = document.querySelector('.nav-actions');
  if (navActions) {
    const displayOptions = document.createElement('div');
    displayOptions.className = 'display-options';
    displayOptions.innerHTML = '<button class="display-options-toggle" type="button" aria-label="Open display options" aria-expanded="false" aria-controls="display-options-panel" title="Display options"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="18" r="2"/></svg></button><section class="display-options-panel" id="display-options-panel" aria-label="Display options" hidden><h2>Display options</h2><button class="display-option" type="button" role="switch" data-preference="animations-off" aria-checked="false"><span class="display-option-copy"><b>Turn off animations</b><small>Reduce motion and visual effects for smoother performance.</small></span><span class="display-switch" aria-hidden="true"></span></button><button class="display-option" type="button" role="switch" data-preference="high-contrast" aria-checked="false"><span class="display-option-copy"><b>High contrast</b><small>Strengthen text and panel contrast for visibility.</small></span><span class="display-switch" aria-hidden="true"></span></button></section>';
    navActions.append(displayOptions);
    const trigger = displayOptions.querySelector('.display-options-toggle');
    const panel = displayOptions.querySelector('.display-options-panel');
    let closeTimer;
    const setOpen = open => {
      window.clearTimeout(closeTimer);
      if (open) {
        panel.hidden = false;
        panel.classList.remove('is-closing');
        requestAnimationFrame(() => {
          if (trigger.getAttribute('aria-expanded') === 'true') panel.classList.add('is-open');
        });
      } else {
        panel.classList.remove('is-open');
        if (root.classList.contains('animations-off') || reduceMotion.matches) {
          panel.classList.remove('is-closing');
          panel.hidden = true;
        } else {
          panel.classList.add('is-closing');
          closeTimer = window.setTimeout(() => {
            panel.hidden = true;
            panel.classList.remove('is-closing');
          }, 440);
        }
      }
      trigger.setAttribute('aria-expanded', String(open));
      trigger.setAttribute('aria-label', open ? 'Close display options' : 'Open display options');
    };
    const syncOptions = () => {
      displayOptions.querySelectorAll('[data-preference]').forEach(option => {
        option.setAttribute('aria-checked', String(root.classList.contains(option.dataset.preference)));
      });
    };
    syncOptions();
    trigger.addEventListener('click', () => setOpen(trigger.getAttribute('aria-expanded') !== 'true'));
    displayOptions.querySelectorAll('[data-preference]').forEach(option => {
      option.addEventListener('click', () => {
        const preference = option.dataset.preference;
        const enabled = !root.classList.contains(preference);
        root.classList.toggle(preference, enabled);
        try { sessionStorage.setItem(`ns2nam-${preference}`, enabled ? '1' : '0'); } catch (_) {}
        syncOptions();
        if (preference === 'animations-off') {
          if (enabled) {
            document.querySelectorAll('.glow-card').forEach(card => {
              card.style.removeProperty('--pointer-x');
              card.style.removeProperty('--pointer-y');
              card.style.removeProperty('--glow-active');
              card.style.removeProperty('--tilt-x');
              card.style.removeProperty('--tilt-y');
            });
          }
          document.dispatchEvent(new CustomEvent('site:motionchange', { detail: { animationsOff: enabled } }));
        }
      });
    });
    document.addEventListener('pointerdown', event => {
      if (!displayOptions.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !panel.hidden) {
        setOpen(false);
        trigger.focus();
      }
    });
  }

  // A lightweight cursor accent for mouse and trackpad users.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion.matches && !root.classList.contains('animations-off')) {
    const cursor = document.createElement('div');
    cursor.className = 'cursor-aura';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span class="cursor-aura-ring"></span><span class="cursor-aura-dot"></span>';
    document.body.appendChild(cursor);
    window.addEventListener('pointermove', event => {
      cursor.style.setProperty('--cursor-x', `${event.clientX}px`);
      cursor.style.setProperty('--cursor-y', `${event.clientY}px`);
      cursor.classList.add('is-visible');
      cursor.classList.toggle('is-over-link', Boolean(event.target.closest('a, button, summary, input')));
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
    document.addEventListener('pointerenter', () => cursor.classList.add('is-visible'));
  }

  // Let the BMC popup auto-open only on the first page of a tab session.
  const supportSeenKey = 'ns2nam-bmc-auto-opened-v2';
  let supportWasShown = false;
  try { supportWasShown = sessionStorage.getItem(supportSeenKey) === '1'; } catch (_) {}
  const supportLink = document.createElement('a');
  supportLink.className = 'support-fallback';
  supportLink.href = 'https://www.buymeacoffee.com/deeptanusen';
  supportLink.target = '_blank';
  supportLink.rel = 'noopener noreferrer';
  supportLink.setAttribute('aria-label', 'Support NS2/Nam for macOS on Buy Me a Coffee');
  supportLink.title = 'Support this project (optional)';
  supportLink.innerHTML = '<span class="support-coffee-icon" aria-hidden="true">☕</span><span class="support-label">Support</span>';
  document.body.appendChild(supportLink);

  if (!supportWasShown) {
    const supportWidget = document.createElement('script');
    supportWidget.dataset.name = 'BMC-Widget';
    supportWidget.dataset.cfasync = 'false';
    supportWidget.dataset.id = 'deeptanusen';
    supportWidget.dataset.description = 'Support this project';
    supportWidget.dataset.message = 'Thanks for using NS2/Nam! Support is optional and appreciated.';
    supportWidget.dataset.color = '#70e4dc';
    supportWidget.dataset.position = 'Right';
    supportWidget.dataset.x_margin = '18';
    supportWidget.dataset.y_margin = '18';
    supportWidget.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
    supportWidget.addEventListener('load', () => {
      try { sessionStorage.setItem(supportSeenKey, '1'); } catch (_) {}
    }, { once: true });
    document.body.appendChild(supportWidget);
  }

  // Persist the selected palette without requiring any server-side state.
  const themeButton = document.querySelector('.theme-toggle');
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('ns2nam-theme'); } catch (_) {}
  if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;
  if (themeButton) {
    themeButton.innerHTML = '<svg class="theme-glyph" viewBox="0 0 40 40" aria-hidden="true"><g class="theme-rays"><path d="M20 2v5M20 33v5M2 20h5M33 20h5M7.3 7.3l3.5 3.5m18.4 18.4 3.5 3.5m0-25.4-3.5 3.5m-18.4 18.4-3.5 3.5"/></g><circle class="theme-sun" cx="20" cy="20" r="7"/><path class="theme-moon" d="M27.8 7.1A14.2 14.2 0 1 0 32.9 27.8 12 12 0 0 1 27.8 7.1Z"/><path class="torch-handle" d="m20 24-3 13h6l-3-13Z"/><path class="torch-flame" d="M20 3c-4 5 2 8-3 13-4 4-5 8-2 12 2 3 8 4 11 0 4-5 1-10-2-13-1-2-2-4-1-7-2 2-3 4-3 6-3-3 1-7 0-11Z"/></svg><span class="theme-smoke" aria-hidden="true"><i></i><i></i><i></i></span>';
    const syncThemeLabel = () => {
      const target = root.dataset.theme === 'light' ? 'dark' : 'light';
      themeButton.setAttribute('aria-label', `Switch to ${target} theme`);
      themeButton.title = `Switch to ${target} theme`;
    };
    syncThemeLabel();
    themeButton.addEventListener('click', () => {
      if (themeButton.disabled) return;
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      const applyTheme = () => {
        root.dataset.theme = next;
        const themeColor = document.querySelector('meta[name="theme-color"]');
        if (themeColor) themeColor.content = next === 'light' ? '#f4f8f9' : '#081018';
        try { localStorage.setItem('ns2nam-theme', next); } catch (_) {}
        syncThemeLabel();
        if (next === 'dark' && !reduceMotion.matches && !root.classList.contains('animations-off')) {
          const smoke = themeButton.querySelector('.theme-smoke');
          smoke.classList.add('is-rising');
          window.setTimeout(() => smoke.classList.remove('is-rising'), 1000);
        }
      };

      if (reduceMotion.matches || root.classList.contains('animations-off')) {
        applyTheme();
        return;
      }

      const bounds = themeButton.getBoundingClientRect();
      root.style.setProperty('--theme-origin-x', `${bounds.left + bounds.width / 2}px`);
      root.style.setProperty('--theme-origin-y', `${bounds.top + bounds.height / 2}px`);
      themeButton.disabled = true;
      const runTorch = (direction, done) => {
        root.classList.add('theme-torching');
        root.classList.toggle('theme-torch-reversing', direction === 'dark');
        const torchWash = document.createElement('div');
        torchWash.className = `torch-wash torch-to-${direction}`;
        torchWash.setAttribute('aria-hidden', 'true');
        document.body.appendChild(torchWash);
        window.setTimeout(() => {
          torchWash.remove();
          root.classList.remove('theme-torching', 'theme-torch-reversing');
          done();
        }, 720);
      };
      const runThemeReveal = done => {
        const finishReveal = () => {
          done();
        };
        if (document.startViewTransition) {
          const transition = document.startViewTransition({
            update: applyTheme,
            types: [`theme-${next}`],
          });
          transition.finished.then(finishReveal, finishReveal);
        } else {
          applyTheme();
          finishReveal();
        }
      };

      runTorch(next, () => runThemeReveal(() => { themeButton.disabled = false; }));
    });
  }

  // Compact mobile navigation.
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');
  if (menuButton && nav) {
    const closeMenu = () => {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
      nav.classList.remove('is-open');
    };
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      nav.classList.toggle('is-open', open);
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('click', event => {
      if (menuButton.getAttribute('aria-expanded') === 'true' &&
          !nav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  }

  // Scroll progress, restrained reveal motion, and current year.
  const meter = document.querySelector('.scroll-meter span');
  const tocEntries = [...document.querySelectorAll('.toc a[href^="#"]')].map(link => ({
    link,
    section: document.getElementById(link.hash.slice(1))
  })).filter(entry => entry.section);
  let previousActiveTocEntry = null;
  const updateToc = () => {
    if (!tocEntries.length) return;
    const activationLine = Math.min(220, window.innerHeight * .32);
    let active = tocEntries[0];
    tocEntries.forEach(entry => {
      if (entry.section.getBoundingClientRect().top <= activationLine) active = entry;
    });
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      active = tocEntries[tocEntries.length - 1];
    }
    tocEntries.forEach(entry => {
      const isActive = entry === active;
      entry.link.classList.toggle('is-active', isActive);
      if (isActive) entry.link.setAttribute('aria-current', 'location');
      else entry.link.removeAttribute('aria-current');
    });
    if (active !== previousActiveTocEntry && window.matchMedia('(max-width: 760px)').matches) {
      const rail = active.link.closest('.toc-links');
      if (rail) {
        const targetLeft = active.link.offsetLeft - rail.offsetLeft - (rail.clientWidth - active.link.clientWidth) / 2;
        rail.scrollTo({ left: targetLeft, behavior: reduceMotion.matches || root.classList.contains('animations-off') ? 'auto' : 'smooth' });
      }
    }
    previousActiveTocEntry = active;
  };
  let scrollQueued = false;
  const updateScroll = () => {
    if (meter) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      meter.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    }
    updateToc();
    scrollQueued = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  updateScroll();
  window.addEventListener('resize', updateToc, { passive: true });
  window.addEventListener('hashchange', updateToc);
  document.querySelectorAll('[data-year]').forEach(node => { node.textContent = new Date().getFullYear(); });

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches && !root.classList.contains('animations-off')) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  // Keep the card glow moving with the pointer across each card group.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion.matches && !root.classList.contains('animations-off')) {
    const glowGroups = [
      ['.feature-grid', '.feature-card'],
      ['.compat-ready-grid', '.compat-device-card, .compat-app-card'],
      ['.requirements-grid', '.requirement-card'],
      ['.credits-grid', '.credit-card'],
      ['.compat-stack', '.compat-layer'],
      ['.faq-list', '.faq-item'],
    ];
    glowGroups.forEach(([groupSelector, cardSelector]) => {
      document.querySelectorAll(groupSelector).forEach(grid => {
        const cards = [...grid.querySelectorAll(cardSelector)];
        cards.forEach(card => card.classList.add('glow-card'));
        window.addEventListener('pointermove', event => {
          if (root.classList.contains('animations-off')) return;
          const gridBounds = grid.getBoundingClientRect();
          const trackingMargin = 180;
          const nearGrid = event.clientX >= gridBounds.left - trackingMargin
            && event.clientX <= gridBounds.right + trackingMargin
            && event.clientY >= gridBounds.top - trackingMargin
            && event.clientY <= gridBounds.bottom + trackingMargin;
          cards.forEach(card => {
            const bounds = card.getBoundingClientRect();
            card.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
            card.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
            card.style.setProperty('--glow-active', nearGrid ? '1' : '0');
            card.style.removeProperty('--tilt-x');
            card.style.removeProperty('--tilt-y');
          });
          const card = event.target.closest(cardSelector);
          if (nearGrid && card && grid.contains(card)) {
            const bounds = card.getBoundingClientRect();
            const px = (event.clientX - bounds.left) / bounds.width;
            const py = (event.clientY - bounds.top) / bounds.height;
            if (card.matches('.feature-card, .compat-device-card')) {
              card.style.setProperty('--tilt-x', `${((.5 - py) * 3).toFixed(2)}deg`);
              card.style.setProperty('--tilt-y', `${((px - .5) * 4).toFixed(2)}deg`);
            }
          }
        });
      });
    });
  }

  // Copy terminal snippets with a small non-blocking confirmation.
  const toast = document.querySelector('.toast');
  let toastTimer;
  const announceCopy = button => {
    if (toast) {
      toast.textContent = 'Copied to clipboard';
      toast.classList.add('is-visible');
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 1500);
    }
    if (button) {
      button.classList.add('is-copied');
      button.textContent = 'COPIED';
      window.setTimeout(() => { button.classList.remove('is-copied'); button.textContent = 'COPY'; }, 1300);
    }
  };
  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const value = button.getAttribute('data-copy') || '';
      try {
        if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
        else {
          const field = document.createElement('textarea');
          field.value = value;
          field.setAttribute('readonly', '');
          field.style.position = 'fixed';
          field.style.opacity = '0';
          document.body.appendChild(field);
          field.select();
          document.execCommand('copy');
          field.remove();
        }
        announceCopy(button);
      } catch (_) {
        if (toast) {
          toast.textContent = 'Copy unavailable — select the command instead';
          toast.classList.add('is-visible');
          window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
        }
      }
    });
  });

  // Keep enough identical ticker segments on screen for a gap-free marquee loop.
  const tickerTrack = document.querySelector('.ticker-track');
  if (tickerTrack) {
    const tickerTemplate = tickerTrack.querySelector('.ticker-group');
    if (tickerTemplate) {
      const fillTicker = () => {
        tickerTrack.querySelectorAll('[data-generated-ticker]').forEach(group => group.remove());
        let groupCount = tickerTrack.querySelectorAll('.ticker-group').length;
        while (tickerTrack.scrollWidth < window.innerWidth * 2 || groupCount % 2 !== 0) {
          const group = tickerTemplate.cloneNode(true);
          group.setAttribute('aria-hidden', 'true');
          group.dataset.generatedTicker = 'true';
          tickerTrack.appendChild(group);
          groupCount += 1;
        }
      };
      fillTicker();
      window.addEventListener('resize', fillTicker, { passive: true });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fillTicker);
    }
  }


  if (reduceMotion.matches) document.querySelectorAll('svg').forEach(svg => {
    if (typeof svg.pauseAnimations === 'function') svg.pauseAnimations();
  });
})();
