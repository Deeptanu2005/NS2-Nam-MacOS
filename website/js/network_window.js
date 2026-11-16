(() => {
  window.__ns2NetworkWindowCleanup?.();
  window.__ns2NetworkWindowCleanup = null;
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
    const resetButton = visual.querySelector('[data-window-action="reset"]');
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
        if (resetButton) resetButton.disabled = true;
        if (zoomButton.matches(':focus')) zoomButton.blur();
        if (resetButton?.matches(':focus')) resetButton.blur();
        topology.querySelectorAll('.draggable-node').forEach(node => {
          node.setAttribute('tabindex', '-1');
          node.setAttribute('aria-disabled', 'true');
        });
        topology.pauseAnimations?.();
      } else {
        stage.inert = false;
        zoomButton.disabled = false;
        if (resetButton) resetButton.disabled = false;
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

    const defaultPanX = 0, defaultPanY = -10, defaultZoom = 1.08;
    let panX = defaultPanX, panY = defaultPanY, zoom = defaultZoom;
    let gesturePointer = null, gestureMode = null, lastX = 0, lastY = 0;
    let lastZoomSoundAt = 0;
    let activeNode = null, nodeStart = null, nodeStartPoint = null;
    const defaultNodePositions = {
      sender: { x: 145, y: 185 },
      'receiver-1': { x: 385, y: 93 },
      'receiver-2': { x: 450, y: 185 },
      'receiver-3': { x: 385, y: 276 },
    };
    const nodePositions = {
      sender: { x: 145, y: 185 },
      'receiver-1': { x: 385, y: 93 },
      'receiver-2': { x: 450, y: 185 },
      'receiver-3': { x: 385, y: 276 },
    };
    let resetAnimationId = null;
    const stopResetAnimation = () => {
      if (resetAnimationId !== null) {
        cancelAnimationFrame(resetAnimationId);
        resetAnimationId = null;
      }
    };
    const svgPoint = event => {
      const point = topology.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const ctm = topology.getScreenCTM();
      return ctm ? point.matrixTransform(ctm.inverse()) : { x: point.x, y: point.y };
    };
    const findNodeAtPoint = event => {
      const direct = event.target?.closest?.('.draggable-node');
      if (direct && topology.contains(direct)) return direct;
      const pt = svgPoint(event);
      let bestNode = null;
      let bestDist = Infinity;
      for (const [id, pos] of Object.entries(nodePositions)) {
        const dx = pt.x - pos.x;
        const dy = pt.y - pos.y;
        const dist = Math.hypot(dx, dy);
        const radius = id === 'sender' ? 36 : 34;
        const inCircle = dist <= radius;
        const inLabel = id === 'sender'
          ? Math.abs(dx) <= 38 && dy >= 0 && dy <= 72
          : Math.abs(dx) <= 38 && dy >= -58 && dy <= 0;
        if (inCircle || inLabel) {
          if (dist < bestDist) {
            bestDist = dist;
            bestNode = topology.querySelector(`[data-node="${id}"]`);
          }
        }
      }
      return bestNode;
    };
    const updateNetworkGlow = () => {
      const positions = Object.values(nodePositions);
      const x = (Math.min(...positions.map(point => point.x)) + Math.max(...positions.map(point => point.x))) / 2;
      const y = (Math.min(...positions.map(point => point.y)) + Math.max(...positions.map(point => point.y))) / 2;
      const viewBox = topology.viewBox.baseVal;
      const topologyWidth = topology.getBoundingClientRect().width;
      const svgWidth = (topologyWidth && zoom)
        ? (topologyWidth / zoom)
        : Math.min(stage.clientWidth * .96, 620);
      const viewScale = svgWidth / viewBox.width * zoom;
      const centerX = viewBox.x + viewBox.width / 2;
      const centerY = viewBox.y + viewBox.height / 2;
      const glowX = stage.clientWidth / 2 + (x - centerX) * viewScale + panX;
      const glowY = stage.clientHeight / 2 + (y - centerY) * viewScale + panY;
      stage.style.setProperty('--network-glow-x', `${glowX}px`);
      stage.style.setProperty('--network-glow-y', `${glowY}px`);
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
      updateNetworkGlow();
    };
    const renderView = () => {
      stage.style.setProperty('--pan-x', `${panX}px`);
      stage.style.setProperty('--pan-y', `${panY}px`);
      stage.style.setProperty('--zoom', zoom);
      stage.style.setProperty('--grid-size', `${28 * zoom}px`);
      updateNetworkGlow();
    };
    const glowResizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(updateNetworkGlow)
      : null;
    if (glowResizeObserver) glowResizeObserver.observe(stage);
    else window.addEventListener('resize', updateNetworkGlow, { passive: true, signal: controller.signal });
    updateNetworkGlow();
    const resetNetworkPositions = () => {
      if (root.classList.contains('animations-off')) return;
      if (gesturePointer !== null && stage.hasPointerCapture(gesturePointer)) {
        try { stage.releasePointerCapture(gesturePointer); } catch (_) {}
      }
      gesturePointer = null;
      gestureMode = null;
      activeNode = null;
      stage.classList.remove('is-panning', 'is-node-dragging');
      playWindowSound('window-restore');

      if (resetAnimationId !== null || !motionEnabled()) {
        stopResetAnimation();
        panX = defaultPanX;
        panY = defaultPanY;
        zoom = defaultZoom;
        for (const [id, pos] of Object.entries(defaultNodePositions)) {
          nodePositions[id] = { ...pos };
        }
        renderConnections();
        renderView();
        return;
      }

      stopResetAnimation();
      const startPositions = {};
      for (const [id, pos] of Object.entries(nodePositions)) {
        startPositions[id] = { ...pos };
      }
      const startPanX = panX, startPanY = panY, startZoom = zoom;
      let startTime = null;
      const duration = 280;
      const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

      const step = now => {
        if (startTime === null) startTime = now;
        const elapsed = Math.max(0, now - startTime);
        const progress = Math.min(1, elapsed / duration);
        const eased = easeOutCubic(progress);

        for (const [id, target] of Object.entries(defaultNodePositions)) {
          const start = startPositions[id];
          nodePositions[id] = {
            x: start.x + (target.x - start.x) * eased,
            y: start.y + (target.y - start.y) * eased,
          };
        }
        panX = startPanX + (defaultPanX - startPanX) * eased;
        panY = startPanY + (defaultPanY - startPanY) * eased;
        zoom = startZoom + (defaultZoom - startZoom) * eased;

        renderConnections();
        renderView();

        if (progress < 1) {
          resetAnimationId = requestAnimationFrame(step);
        } else {
          resetAnimationId = null;
          for (const [id, target] of Object.entries(defaultNodePositions)) {
            nodePositions[id] = { ...target };
          }
          panX = defaultPanX;
          panY = defaultPanY;
          zoom = defaultZoom;
          renderConnections();
          renderView();
        }
      };
      resetAnimationId = requestAnimationFrame(step);
    };
    resetButton?.addEventListener('click', resetNetworkPositions, { signal: controller.signal });
    const cancelGesture = () => {
      stopResetAnimation();
      if (gesturePointer !== null && stage.hasPointerCapture(gesturePointer)) {
        try { stage.releasePointerCapture(gesturePointer); } catch (_) {}
      }
      gesturePointer = null;
      gestureMode = null;
      activeNode = null;
      stage.classList.remove('is-panning', 'is-node-dragging');
    };
    const syncWindowMotion = () => {
      const disabled = root.classList.contains('animations-off');
      windowMotionChanged({ detail: { animationsOff: disabled } });
    };
    renderConnections();
    renderView();
    syncWindowMotion();
    stage.addEventListener('pointerdown', event => {
      if (root.classList.contains('animations-off')) return;
      if (event.button !== 0 || gesturePointer !== null) return;
      stopResetAnimation();
      event.preventDefault();
      gesturePointer = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      activeNode = findNodeAtPoint(event);
      if (activeNode && topology.contains(activeNode)) {
        gestureMode = 'node';
        activeNode.focus?.();
        playWindowSound('node-grab');
        nodeStart = { ...nodePositions[activeNode.dataset.node] };
        nodeStartPoint = svgPoint(event);
        stage.classList.add('is-node-dragging');
      } else {
        gestureMode = 'pan';
        playWindowSound('pan-start');
        stage.classList.add('is-panning');
      }
      try { stage.setPointerCapture(event.pointerId); } catch (_) {}
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
      } else if (gestureMode === 'pan') {
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
      if (stage.hasPointerCapture(event.pointerId)) {
        try { stage.releasePointerCapture(event.pointerId); } catch (_) {}
      }
    };
    stage.addEventListener('pointerup', endPan, { signal: controller.signal });
    stage.addEventListener('pointercancel', endPan, { signal: controller.signal });
    topology.addEventListener('keydown', event => {
      if (root.classList.contains('animations-off')) return;
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        resetNetworkPositions();
        return;
      }
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
      stopResetAnimation();
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
    window.__ns2NetworkWindowCleanup = () => {
      stopResetAnimation();
      controller.abort();
      glowResizeObserver?.disconnect();
    };
  }
})();
