(() => {
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.campaign-entry-home, .campaign-entry-installation').forEach(link => {
    link.addEventListener('click', event => {
      if (root.classList.contains('community-entry-transitioning')) {
        event.preventDefault();
        return;
      }
      if (event.defaultPrevented || (typeof event.button === 'number' && event.button !== 0)
        || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
        || link.target || link.hasAttribute('download')
        || reduceMotion.matches || root.classList.contains('animations-off')) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin
        || !destination.pathname.replace(/\/$/, '').endsWith('/community-testing')) return;

      const bounds = link.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      event.preventDefault();
      root.classList.add('community-entry-transitioning');

      const dimmer = document.createElement('div');
      dimmer.className = 'community-entry-dimmer';
      dimmer.setAttribute('aria-hidden', 'true');
      const portal = document.createElement('div');
      portal.className = 'campaign-entry community-entry-portal';
      portal.innerHTML = link.innerHTML;
      const loader = document.createElement('span');
      loader.className = 'entry-loader';
      loader.setAttribute('aria-hidden', 'true');
      loader.innerHTML = '<span class="entry-loader-orbit"><i></i><i></i><i></i></span><span class="entry-loader-copy"><b>Preparing the test lab</b><i>NS-2 · NAM · APPLE SILICON</i></span>';
      portal.append(loader);
      portal.setAttribute('aria-hidden', 'true');
      portal.style.setProperty('--portal-x', `${bounds.left}px`);
      portal.style.setProperty('--portal-y', `${bounds.top}px`);
      portal.style.setProperty('--portal-width', `${bounds.width}px`);
      portal.style.setProperty('--portal-height', `${bounds.height}px`);
      document.body.append(dimmer, portal);

      requestAnimationFrame(() => {
        dimmer.classList.add('is-active');
        requestAnimationFrame(() => portal.classList.add('is-expanded'));
      });
      window.setTimeout(() => portal.classList.add('is-loading'), 560);
      window.setTimeout(() => portal.classList.add('is-settled'), 1250);
      window.setTimeout(() => {
        try { sessionStorage.setItem('ns2-community-entry', '1'); } catch (_) {}
        window.location.assign(destination.href);
      }, 2050);
    });
  });

  const introLoader = document.querySelector('.community-intro-loader');
  if (introLoader) {
    const fromEntryButton = document.documentElement.classList.contains('community-from-entry');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dismissIntro = () => {
      introLoader.classList.add('is-leaving');
      window.setTimeout(() => {
        document.documentElement.classList.remove('community-intro-active', 'community-from-entry');
        introLoader.remove();
        if (fromEntryButton) document.documentElement.classList.remove('community-intro-delay');
        else window.setTimeout(() => document.documentElement.classList.remove('community-intro-delay'), 1260);
      }, 500);
    };
    window.setTimeout(dismissIntro, reduceMotion ? 0 : (fromEntryButton ? 100 : 850));
  }
  document.querySelectorAll('.campaign-entry').forEach(link => {
    link.addEventListener('pointermove', event => {
      const rect = link.getBoundingClientRect(); link.style.setProperty('--entry-x', `${event.clientX - rect.left}px`); link.style.setProperty('--entry-y', `${event.clientY - rect.top}px`);
      if (finePointer) { link.style.setProperty('--entry-mx', `${Math.max(-3, Math.min(3, (event.clientX - rect.left - rect.width / 2) * .035))}px`); link.style.setProperty('--entry-my', `${Math.max(-4, Math.min(2, (event.clientY - rect.top - rect.height / 2) * .045 - 2))}px`); }
    }, { passive: true });
    link.addEventListener('pointerleave', () => { link.style.setProperty('--entry-mx', '0px'); link.style.setProperty('--entry-my', '0px'); });
    link.addEventListener('click', () => { link.classList.add('is-compressing'); setTimeout(() => link.classList.remove('is-compressing'), 580); });
  });

  if (document.body.classList.contains('community-campaign-page')) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animationsDisabled = document.documentElement.classList.contains('animations-off');
    if (matchMedia('(hover: hover) and (pointer: fine)').matches && !prefersReducedMotion.matches && !document.documentElement.classList.contains('animations-off')) {
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

    if ('IntersectionObserver' in window && !prefersReducedMotion.matches && !animationsDisabled) {
      const revealTargets = document.querySelectorAll('.community-page .community-section-heading, .community-page .testing-steps > li, .community-page .screenshot-section > *, .community-page .report-grid > *, .community-page .community-submit > *, .site-footer');
      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: .12, rootMargin: '0px 0px -44px 0px' });
      revealTargets.forEach(target => {
        const siblings = [...target.parentElement.children];
        target.style.setProperty('--community-reveal-delay', `${Math.min(siblings.indexOf(target), 4) * 75}ms`);
        target.classList.add('community-scroll-reveal');
        revealObserver.observe(target);
      });
    }

    const processorLabel = document.querySelector('[data-screen-processor]');
    if (processorLabel && !prefersReducedMotion.matches) {
      const generations = ['M1', 'M2', 'M3', 'M4', 'M4+'];
      let generation = 0;
      window.setInterval(() => {
        processorLabel.classList.add('is-changing');
        window.setTimeout(() => {
          generation = (generation + 1) % generations.length;
          processorLabel.textContent = generations[generation];
          processorLabel.classList.remove('is-changing');
        }, 220);
      }, 1550);
    }

    const header = document.querySelector('.site-header');
    let returnTimer;
    const updateFloatingNav = () => {
      if (!header) return;
      const floating = header.classList.contains('is-floating');
      const shouldFloat = floating ? window.scrollY > 96 : window.scrollY > 160;
      if (floating === shouldFloat) return;
      window.clearTimeout(returnTimer);
      header.classList.remove('is-unfloating');
      header.classList.toggle('is-floating', shouldFloat);
      if (!shouldFloat) {
        header.classList.add('is-unfloating');
        returnTimer = window.setTimeout(() => header.classList.remove('is-unfloating'), 650);
      }
    };
    updateFloatingNav();
    window.addEventListener('scroll', updateFloatingNav, { passive: true });
    window.addEventListener('resize', updateFloatingNav, { passive: true });

    document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
      const original = button.textContent;
      try {
        if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(button.dataset.copy);
        else {
          const field = document.createElement('textarea');
          field.value = button.dataset.copy;
          field.setAttribute('readonly', '');
          field.style.cssText = 'position:fixed;left:-9999px;top:0';
          document.body.append(field);
          field.select();
          const copied = document.execCommand('copy');
          field.remove();
          if (!copied) throw new Error('Copy failed');
        }
        button.textContent = 'COPIED';
        window.setTimeout(() => { button.textContent = original; }, 1600);
      } catch (_) {
        button.textContent = 'SELECT TEMPLATE TO COPY';
      }
    }));
  }
})();
