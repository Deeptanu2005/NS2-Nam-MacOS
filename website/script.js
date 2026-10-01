(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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
    themeButton.addEventListener('click', () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      root.dataset.theme = next;
      try { localStorage.setItem('ns2nam-theme', next); } catch (_) {}
      themeButton.setAttribute('aria-label', `Switch to ${next === 'light' ? 'dark' : 'light'} theme`);
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
        rail.scrollTo({ left: targetLeft, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
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
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
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

  // Move the card's soft network glow with the pointer on precise-input devices.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion.matches) {
    document.querySelectorAll('.feature-card, .compat-device-card, .compat-app-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const bounds = card.getBoundingClientRect();
        card.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
        card.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
        const px = (event.clientX - bounds.left) / bounds.width;
        const py = (event.clientY - bounds.top) / bounds.height;
        card.style.setProperty('--tilt-x', `${((.5 - py) * 3).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${((px - .5) * 4).toFixed(2)}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--pointer-x');
        card.style.removeProperty('--pointer-y');
        card.style.removeProperty('--tilt-x');
        card.style.removeProperty('--tilt-y');
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

  // Client-side FAQ filtering keeps the page static and indexable.
  const faqSearch = document.querySelector('#faq-search');
  const faqItems = [...document.querySelectorAll('.faq-item')];
  if (faqItems.length) {
    faqItems.forEach(item => {
      const summary = item.querySelector('summary');
      const answer = item.querySelector('.faq-answer');
      if (!summary || !answer) return;
      const inner = document.createElement('div');
      inner.className = 'faq-answer-inner';
      while (answer.firstChild) inner.appendChild(answer.firstChild);
      answer.appendChild(inner);
      if (item.open) item.classList.add('is-expanded');
      summary.setAttribute('aria-expanded', String(item.open));
      summary.addEventListener('click', event => {
        event.preventDefault();
        const opening = summary.getAttribute('aria-expanded') !== 'true';
        const transitionId = (item._faqTransitionId || 0) + 1;
        item._faqTransitionId = transitionId;
        summary.setAttribute('aria-expanded', String(opening));
        if (item._faqCloseTimer) window.clearTimeout(item._faqCloseTimer);
        if (opening) {
          item.open = true;
          answer.getBoundingClientRect();
          requestAnimationFrame(() => {
            if (item._faqTransitionId === transitionId) item.classList.add('is-expanded');
          });
          return;
        }
        item.classList.remove('is-expanded');
        const finishClose = () => {
          if (item._faqTransitionId === transitionId) item.open = false;
        };
        const onTransitionEnd = transitionEvent => {
          if (transitionEvent.target !== answer || transitionEvent.propertyName !== 'grid-template-rows') return;
          answer.removeEventListener('transitionend', onTransitionEnd);
          window.clearTimeout(item._faqCloseTimer);
          finishClose();
        };
        answer.addEventListener('transitionend', onTransitionEnd);
        item._faqCloseTimer = window.setTimeout(() => {
          answer.removeEventListener('transitionend', onTransitionEnd);
          finishClose();
        }, reduceMotion.matches ? 0 : 520);
      });
    });
  }

  if (faqSearch && faqItems.length) {
    const count = document.querySelector('[data-faq-count]');
    const empty = document.querySelector('.faq-empty');
    faqSearch.addEventListener('input', () => {
      const query = faqSearch.value.trim().toLowerCase();
      let visible = 0;
      faqItems.forEach(item => {
        const match = !query || `${item.textContent} ${item.dataset.keywords || ''}`.toLowerCase().includes(query);
        item.hidden = !match;
        if (match) visible += 1;
      });
      if (count) count.textContent = String(visible).padStart(2, '0');
      if (empty) empty.hidden = visible !== 0;
    });
  }

  // Quiet particle field in the landing-page hero; paused for reduced motion.
  const canvas = document.querySelector('.network-canvas');
  if (canvas && !reduceMotion.matches) {
    const context = canvas.getContext('2d');
    if (context) {
      let width = 0, height = 0, particles = [], frame = 0, running = true;
      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        width = rect.width; height = rect.height;
        canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.min(50, Math.max(20, Math.floor(width / 23)));
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * width, y: Math.random() * height,
          vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .15,
          r: Math.random() * 1.4 + .4
        }));
      };
      const draw = () => {
        if (!running) return;
        context.clearRect(0, 0, width, height);
        const light = root.dataset.theme === 'light';
        const point = light ? '37, 110, 128' : '125, 207, 223';
        for (let i = 0; i < particles.length; i += 1) {
          const p = particles[i];
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
          context.beginPath(); context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          context.fillStyle = `rgba(${point}, .58)`; context.fill();
          for (let j = i + 1; j < particles.length; j += 1) {
            const q = particles[j];
            const dx = p.x - q.x, dy = p.y - q.y, distance = Math.hypot(dx, dy);
            if (distance < 115) {
              context.beginPath(); context.moveTo(p.x, p.y); context.lineTo(q.x, q.y);
              context.strokeStyle = `rgba(${point}, ${(1 - distance / 115) * .13})`;
              context.lineWidth = .6; context.stroke();
            }
          }
        }
        frame = requestAnimationFrame(draw);
      };
      resize(); draw();
      window.addEventListener('resize', resize, { passive: true });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) { running = false; cancelAnimationFrame(frame); }
        else if (!running) { running = true; draw(); }
      });
    }
  }

  if (reduceMotion.matches) document.querySelectorAll('svg').forEach(svg => {
    if (typeof svg.pauseAnimations === 'function') svg.pauseAnimations();
  });
})();
