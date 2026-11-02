(() => {
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let entryTransitionTimers = [];
  const clearEntryTransition = () => {
    entryTransitionTimers.forEach(timer => window.clearTimeout(timer));
    entryTransitionTimers = [];
    root.classList.remove('community-entry-transitioning');
    document.querySelectorAll('.community-entry-dimmer, .community-entry-portal').forEach(layer => layer.remove());
    document.querySelectorAll('.campaign-entry.is-compressing').forEach(link => link.classList.remove('is-compressing'));
  };
  window.addEventListener('pagehide', clearEntryTransition);
  window.addEventListener('pageshow', event => { if (event.persisted) clearEntryTransition(); });
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
      entryTransitionTimers.push(window.setTimeout(() => portal.classList.add('is-loading'), 560));
      entryTransitionTimers.push(window.setTimeout(() => portal.classList.add('is-settled'), 1250));
      entryTransitionTimers.push(window.setTimeout(() => {
        try { sessionStorage.setItem('ns2-community-entry', '1'); } catch (_) {}
        window.location.assign(destination.href);
      }, 2050));
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
  const compressTimers = new WeakMap();
  document.querySelectorAll('.campaign-entry').forEach(link => {
    link.addEventListener('pointermove', event => {
      const rect = link.getBoundingClientRect(); link.style.setProperty('--entry-x', `${event.clientX - rect.left}px`); link.style.setProperty('--entry-y', `${event.clientY - rect.top}px`);
      if (finePointer) { link.style.setProperty('--entry-mx', `${Math.max(-3, Math.min(3, (event.clientX - rect.left - rect.width / 2) * .035))}px`); link.style.setProperty('--entry-my', `${Math.max(-4, Math.min(2, (event.clientY - rect.top - rect.height / 2) * .045 - 2))}px`); }
    }, { passive: true });
    link.addEventListener('pointerleave', () => { link.style.setProperty('--entry-mx', '0px'); link.style.setProperty('--entry-my', '0px'); });
    link.addEventListener('click', () => {
      window.clearTimeout(compressTimers.get(link));
      link.classList.remove('is-compressing');
      void link.offsetWidth;
      link.classList.add('is-compressing');
      compressTimers.set(link, window.setTimeout(() => {
        link.classList.remove('is-compressing');
        compressTimers.delete(link);
      }, 580));
    });
  });

  if (document.body.classList.contains('community-campaign-page')) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animationsDisabled = document.documentElement.classList.contains('animations-off');
    const menuButton = document.querySelector('.menu-toggle');
    const primaryNav = document.querySelector('.primary-nav');
    if (menuButton && primaryNav) {
      const closeMobileNav = () => {
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Open navigation');
        primaryNav.classList.remove('is-open');
      };
      menuButton.addEventListener('click', () => {
        const isOpen = menuButton.getAttribute('aria-expanded') !== 'true';
        menuButton.setAttribute('aria-expanded', String(isOpen));
        menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
        primaryNav.classList.toggle('is-open', isOpen);
      });
      primaryNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobileNav));
      document.addEventListener('click', event => {
        if (menuButton.getAttribute('aria-expanded') === 'true'
          && !primaryNav.contains(event.target) && !menuButton.contains(event.target)) closeMobileNav();
      });
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
          closeMobileNav();
          menuButton.focus();
        }
      });
      window.matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMobileNav(); });
    }
    if (matchMedia('(hover: hover) and (pointer: fine)').matches && !prefersReducedMotion.matches && !animationsDisabled) {
      const hoverCards = [...document.querySelectorAll('.report-block, .nam-example, .report-template, .community-submit, .testing-steps > li')];
      hoverCards.forEach(card => {
        card.classList.add('community-hover-card');
        if (card.matches('.testing-steps > li')) card.classList.add('community-hover-card-static');
      });
      const updateCardGlow = event => {
        const activeCard = event.target instanceof Element ? event.target.closest('.community-hover-card') : null;
        const cardBounds = hoverCards.map(card => [card, card.getBoundingClientRect()]);
        cardBounds.forEach(([card, bounds]) => {
          const nearCard = event.clientX >= bounds.left - 180 && event.clientX <= bounds.right + 180
            && event.clientY >= bounds.top - 180 && event.clientY <= bounds.bottom + 180;
          card.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
          card.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
          card.style.setProperty('--glow-active', nearCard ? '1' : '0');
          if (card !== activeCard || !nearCard || !bounds.width || !bounds.height || card.classList.contains('community-hover-card-static')) {
            card.style.setProperty('--tilt-x', '0deg');
            card.style.setProperty('--tilt-y', '0deg');
            return;
          }
          const px = (event.clientX - bounds.left) / bounds.width;
          const py = (event.clientY - bounds.top) / bounds.height;
          card.style.setProperty('--tilt-x', `${((.5 - py) * 2.4).toFixed(2)}deg`);
          card.style.setProperty('--tilt-y', `${((px - .5) * 3.2).toFixed(2)}deg`);
        });
      };
      const clearCardGlow = () => hoverCards.forEach(card => {
          card.style.setProperty('--glow-active', '0');
          card.style.setProperty('--tilt-x', '0deg');
          card.style.setProperty('--tilt-y', '0deg');
      });
      window.addEventListener('pointermove', updateCardGlow, { passive: true });
      document.addEventListener('pointerleave', clearCardGlow, { passive: true });
    }
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

    const deviceLabel = document.querySelector('[data-screen-device]');
    if (deviceLabel && !prefersReducedMotion.matches) {
      const models = ['Air', 'Pro', 'mini', 'iMac'];
      let model = 0;
      window.setInterval(() => {
        deviceLabel.classList.add('is-changing');
        window.setTimeout(() => {
          model = (model + 1) % models.length;
          deviceLabel.textContent = models[model];
          deviceLabel.classList.remove('is-changing');
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

    const reportTabs = [...document.querySelectorAll('[data-report-tab]')];
    let activeReportPanel = reportTabs.length ? document.getElementById(reportTabs.find(tab => tab.getAttribute('aria-selected') === 'true')?.getAttribute('aria-controls')) : null;
    let reportSwitchTimer;
    const selectReportTab = tab => {
      const nextPanel = document.getElementById(tab.getAttribute('aria-controls'));
      if (!nextPanel || nextPanel === activeReportPanel) return;
      window.clearTimeout(reportSwitchTimer);
      const previousPanel = activeReportPanel;
      const panelStage = nextPanel.parentElement;
      const currentHeight = panelStage.getBoundingClientRect().height;
      panelStage.style.height = `${currentHeight}px`;
      reportTabs.forEach(item => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      const tabList = tab.closest('[role="tablist"]');
      if (tabList) tabList.style.setProperty('--selected-index', String(reportTabs.indexOf(tab)));
      document.querySelectorAll('[data-report-panel]').forEach(panel => {
        if (panel !== previousPanel && panel !== nextPanel) { panel.hidden = true; panel.classList.remove('is-entering', 'is-leaving'); }
      });
      if (previousPanel) {
        previousPanel.inert = true;
        previousPanel.setAttribute('aria-hidden', 'true');
        previousPanel.classList.remove('is-entering');
        previousPanel.classList.add('is-leaving');
      }
      nextPanel.hidden = false;
      nextPanel.inert = false;
      nextPanel.setAttribute('aria-hidden', 'false');
      nextPanel.classList.remove('is-leaving');
      nextPanel.classList.add('is-entering');
      void nextPanel.offsetWidth;
      const savedMeasureStyles = ['position', 'inset', 'width', 'height', 'align-self']
        .map(property => [property, nextPanel.style.getPropertyValue(property), nextPanel.style.getPropertyPriority(property)]);
      nextPanel.style.setProperty('position', 'absolute');
      nextPanel.style.setProperty('inset', '0 0 auto');
      nextPanel.style.setProperty('width', '100%');
      nextPanel.style.setProperty('height', 'auto');
      nextPanel.style.setProperty('align-self', 'start');
      const nextHeight = nextPanel.getBoundingClientRect().height;
      savedMeasureStyles.forEach(([property, value, priority]) => {
        if (value) nextPanel.style.setProperty(property, value, priority);
        else nextPanel.style.removeProperty(property);
      });
      requestAnimationFrame(() => {
        nextPanel.classList.remove('is-entering');
        panelStage.style.height = `${nextHeight}px`;
      });
      activeReportPanel = nextPanel;
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches || root.classList.contains('animations-off');
      reportSwitchTimer = window.setTimeout(() => {
        if (previousPanel && previousPanel !== activeReportPanel) {
          previousPanel.hidden = true;
          previousPanel.classList.remove('is-leaving');
        }
        panelStage.style.height = '';
      }, reducedMotion ? 0 : 380);
    };
    reportTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectReportTab(tab));
      tab.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? reportTabs.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : reportTabs.length - 1)) % reportTabs.length;
        selectReportTab(reportTabs[next]);
        reportTabs[next].focus();
      });
    });

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
        button.classList.add('is-copied');
        window.setTimeout(() => { button.textContent = original; button.classList.remove('is-copied'); }, 1600);
      } catch (_) {
        button.textContent = 'SELECT TEMPLATE TO COPY';
      }
    }));
  }
})();
