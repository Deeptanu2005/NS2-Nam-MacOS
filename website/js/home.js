(() => {
  window.__ns2HomeCleanup?.();
  window.__ns2HomePanCleanup?.();
  window.__ns2HomeCleanup = null;
  window.__ns2HomePanCleanup = null;
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Let the topology be inspected by dragging it and zooming with the wheel.
  // Pan and zoom live only in memory, so a page reload restores the default view.
  const stage = document.querySelector('.visual-stage');
  const topology = stage?.querySelector('.route-overlay');
  if (stage && topology) {
    const controller = new AbortController();
    const visual = stage.closest('.hero-visual');
    const zoomButton = visual.querySelector('[data-window-action="zoom"]');
    let windowMode = 'normal';
    let windowAnimation = null;
    const playWindowSound = kind => window.ns2namPlayUiSound?.(kind);
    const motionEnabled = () => !reduceMotion.matches && !root.classList.contains('animations-off');
    const clearAnimatedTransform = () => {
      windowAnimation?.cancel();
      windowAnimation = null;
      visual.style.removeProperty('transform');
      visual.style.removeProperty('transform-origin');
    };
    const animateWindowRect = (from, to, duration, onFinish) => {
      if (!motionEnabled()) { onFinish?.(); return; }
      const dx = from.left - to.left, dy = from.top - to.top;
      const sx = from.width / to.width, sy = from.height / to.height;
      visual.style.transformOrigin = 'top left';
      windowAnimation = visual.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transform: 'translate(0, 0) scale(1, 1)' },
      ], { duration, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
      windowAnimation.onfinish = () => {
        clearAnimatedTransform();
        onFinish?.();
      };
    };
    const updateWindowControls = () => {
      const zoomed = windowMode === 'maximized';
      zoomButton.setAttribute('aria-label', zoomed ? 'Restore network preview' : 'Zoom network preview');
      zoomButton.title = zoomed ? 'Restore' : 'Zoom';
      zoomButton.setAttribute('aria-pressed', String(zoomed));
    };
    const clearWindowMode = () => {
      clearAnimatedTransform();
      visual.classList.remove('is-maximized');
      root.classList.remove('has-maximized-preview', 'is-restoring-preview');
    };
    const restoreWindow = () => {
      if (windowMode !== 'maximized') return;
      playWindowSound('window-restore');
      const from = visual.getBoundingClientRect();
      clearAnimatedTransform();
      root.classList.add('is-restoring-preview');
      visual.classList.remove('is-maximized');
      const to = visual.getBoundingClientRect();
      windowMode = 'normal';
      updateWindowControls();
      animateWindowRect(from, to, 210, () => root.classList.remove('has-maximized-preview', 'is-restoring-preview'));
    };
    const toggleZoom = () => {
      if (windowMode === 'maximized') return restoreWindow();
      playWindowSound('window-open');
      clearWindowMode();
      const from = visual.getBoundingClientRect();
      visual.classList.add('is-maximized');
      root.classList.add('has-maximized-preview');
      const to = visual.getBoundingClientRect();
      windowMode = 'maximized';
      updateWindowControls();
      zoomButton.focus();
      animateWindowRect(from, to, 240);
    };
    const windowMotionChanged = event => {
      const disabled = event.detail?.animationsOff ?? root.classList.contains('animations-off');
      if (disabled) {
        clearWindowMode();
        windowMode = 'normal';
        updateWindowControls();
        cancelGesture();
        stage.inert = true;
        zoomButton.disabled = true;
        if (zoomButton.matches(':focus')) zoomButton.blur();
        topology.querySelectorAll('.draggable-node').forEach(node => {
          node.setAttribute('tabindex', '-1');
          node.setAttribute('aria-disabled', 'true');
        });
        topology.pauseAnimations?.();
      } else {
        stage.inert = false;
        zoomButton.disabled = false;
        topology.querySelectorAll('.draggable-node').forEach(node => {
          node.setAttribute('tabindex', '0');
          node.removeAttribute('aria-disabled');
        });
        topology.unpauseAnimations?.();
      }
    };
    document.addEventListener('site:motionchange', windowMotionChanged, { signal: controller.signal });
    zoomButton.addEventListener('click', toggleZoom, { signal: controller.signal });
    document.addEventListener('pointerdown', event => {
      if (windowMode === 'maximized' && !visual.contains(event.target)) restoreWindow();
    }, { signal: controller.signal });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && windowMode === 'maximized') restoreWindow();
    }, { signal: controller.signal });

    let panX = 0, panY = 0, zoom = 1;
    let gesturePointer = null, gestureMode = null, lastX = 0, lastY = 0;
    let lastZoomSoundAt = 0;
    let activeNode = null, nodeStart = null, nodeStartPoint = null;
    const nodePositions = {
      sender: { x: 145, y: 185 },
      'receiver-1': { x: 385, y: 67 },
      'receiver-2': { x: 450, y: 185 },
      'receiver-3': { x: 385, y: 304 },
    };
    const svgPoint = event => {
      const point = topology.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      return point.matrixTransform(topology.getScreenCTM().inverse());
    };
    const renderConnections = () => {
      const sender = nodePositions.sender;
      topology.querySelectorAll('[data-node]').forEach(node => {
        const position = nodePositions[node.dataset.node];
        node.setAttribute('transform', `translate(${position.x} ${position.y})`);
      });
      Object.keys(nodePositions).filter(id => id !== 'sender').forEach(id => {
        const receiver = nodePositions[id];
        const dx = receiver.x - sender.x, dy = receiver.y - sender.y;
        const length = Math.hypot(dx, dy) || 1;
        const ux = dx / length, uy = dy / length;
        const path = `M${sender.x + ux * 31} ${sender.y + uy * 31} L${receiver.x - ux * 29} ${receiver.y - uy * 29}`;
        const route = topology.querySelector(`[data-route="${id}"]`);
        const motion = topology.querySelector(`[data-motion="${id}"]`);
        route?.setAttribute('d', path);
        motion?.setAttribute('path', path);
      });
    };
    const renderView = () => {
      stage.style.setProperty('--pan-x', `${panX}px`);
      stage.style.setProperty('--pan-y', `${panY}px`);
      stage.style.setProperty('--zoom', zoom);
      stage.style.setProperty('--grid-size', `${28 * zoom}px`);
    };
    const cancelGesture = () => {
      if (gesturePointer !== null && stage.hasPointerCapture(gesturePointer)) stage.releasePointerCapture(gesturePointer);
      gesturePointer = null;
      gestureMode = null;
      activeNode = null;
      stage.classList.remove('is-panning', 'is-node-dragging');
    };
    const syncWindowMotion = () => {
      const disabled = root.classList.contains('animations-off');
      windowMotionChanged({ detail: { animationsOff: disabled } });
    };
    syncWindowMotion();
    stage.addEventListener('pointerdown', event => {
      if (root.classList.contains('animations-off')) return;
      if (event.button !== 0 || gesturePointer !== null) return;
      event.preventDefault();
      gesturePointer = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      activeNode = event.target.closest?.('.draggable-node') || null;
      if (activeNode && topology.contains(activeNode)) {
        gestureMode = 'node';
        playWindowSound('node-grab');
        nodeStart = { ...nodePositions[activeNode.dataset.node] };
        nodeStartPoint = svgPoint(event);
        stage.classList.add('is-node-dragging');
      } else {
        gestureMode = 'pan';
        playWindowSound('pan-start');
        stage.classList.add('is-panning');
      }
      stage.setPointerCapture(event.pointerId);
    }, { signal: controller.signal });
    stage.addEventListener('pointermove', event => {
      if (root.classList.contains('animations-off')) return;
      if (event.pointerId !== gesturePointer) return;
      if (gestureMode === 'node' && activeNode) {
        const point = svgPoint(event);
        const id = activeNode.dataset.node;
        nodePositions[id] = {
          x: nodeStart.x + point.x - nodeStartPoint.x,
          y: nodeStart.y + point.y - nodeStartPoint.y,
        };
        renderConnections();
      } else {
        panX += event.clientX - lastX;
        panY += event.clientY - lastY;
        lastX = event.clientX;
        lastY = event.clientY;
        renderView();
      }
    }, { signal: controller.signal });
    const endPan = event => {
      if (event.pointerId !== gesturePointer) return;
      playWindowSound(gestureMode === 'node' ? 'node-drop' : 'pan-end');
      gesturePointer = null;
      gestureMode = null;
      activeNode = null;
      stage.classList.remove('is-panning');
      stage.classList.remove('is-node-dragging');
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    };
    stage.addEventListener('pointerup', endPan, { signal: controller.signal });
    stage.addEventListener('pointercancel', endPan, { signal: controller.signal });
    topology.addEventListener('keydown', event => {
      if (root.classList.contains('animations-off')) return;
      const node = event.target.closest?.('.draggable-node');
      if (!node || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const position = nodePositions[node.dataset.node];
      const step = event.shiftKey ? 15 : 5;
      playWindowSound('node-move');
      if (event.key === 'ArrowUp') position.y -= step;
      if (event.key === 'ArrowDown') position.y += step;
      if (event.key === 'ArrowLeft') position.x -= step;
      if (event.key === 'ArrowRight') position.x += step;
      renderConnections();
    }, { signal: controller.signal });
    stage.addEventListener('wheel', event => {
      if (root.classList.contains('animations-off')) return;
      event.preventDefault();
      const rect = stage.getBoundingClientRect();
      const anchorX = event.clientX - rect.left - rect.width / 2;
      const anchorY = event.clientY - rect.top - rect.height / 2;
      const nextZoom = Math.max(.65, Math.min(2.5, zoom * Math.exp(-event.deltaY * .001)));
      const now = performance.now();
      if (nextZoom !== zoom && now - lastZoomSoundAt > 140) {
        playWindowSound(nextZoom > zoom ? 'view-zoom-in' : 'view-zoom-out');
        lastZoomSoundAt = now;
      }
      const ratio = nextZoom / zoom;
      panX = anchorX - (anchorX - panX) * ratio;
      panY = anchorY - (anchorY - panY) * ratio;
      zoom = nextZoom;
      renderView();
    }, { passive: false, signal: controller.signal });
    window.__ns2HomePanCleanup = () => controller.abort();
  }

  // Quiet particle field in the landing-page hero; paused for reduced motion.
  const canvas = document.querySelector('.network-canvas');
  if (canvas) {
    const context = canvas.getContext('2d');
    if (context) {
      const controller = new AbortController();
      let width = 0, height = 0, particles = [], frame = 0, running = false;
      const motionAllowed = () => !reduceMotion.matches && !root.classList.contains('animations-off');
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
      const colorToRgb = color => {
        const hex = color.trim().match(/^#([\da-f]{6})$/i)?.[1];
        if (!hex) return '125, 207, 223';
        return [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16)).join(', ');
      };
      const draw = () => {
        if (!running) return;
        context.clearRect(0, 0, width, height);
        const point = colorToRgb(getComputedStyle(root).getPropertyValue('--cyan'));
        const link = colorToRgb(getComputedStyle(root).getPropertyValue('--blue'));
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
              context.strokeStyle = `rgba(${link}, ${(1 - distance / 115) * .13})`;
              context.lineWidth = .6; context.stroke();
            }
          }
        }
        frame = requestAnimationFrame(draw);
      };
      const start = () => {
        if (!running && motionAllowed()) { running = true; draw(); }
      };
      const stop = () => {
        if (running) { running = false; cancelAnimationFrame(frame); }
      };
      resize(); start();
      window.addEventListener('resize', resize, { passive: true, signal: controller.signal });
      document.addEventListener('site:motionchange', () => motionAllowed() ? start() : stop(), { signal: controller.signal });
      reduceMotion.addEventListener('change', () => motionAllowed() ? start() : stop(), { signal: controller.signal });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else start();
      }, { signal: controller.signal });
      window.__ns2HomeCleanup = () => { stop(); controller.abort(); };
    }
  }
})();
