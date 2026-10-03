(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
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

    // Open a directly linked question after its animated answer wrappers exist.
    const linkedItem = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (linkedItem?.matches('.faq-item')) {
      const summary = linkedItem.querySelector('summary');
      const answer = linkedItem.querySelector('.faq-answer');
      if (summary && answer) {
        linkedItem.open = true;
        linkedItem.classList.add('is-expanded');
        summary.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(() => linkedItem.scrollIntoView({ block: 'start' }));
      }
    }
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

})();
